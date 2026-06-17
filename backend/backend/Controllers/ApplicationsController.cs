using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Hubs;
using backend.models;
using backend.models.Enums;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/applications")]
    [Authorize]
    public class ApplicationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;

        public ApplicationsController(AppDbContext db, IHubContext<NotificationHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? studentId,
            [FromQuery] string? activityId)
        {
            var query = _db.Applications
                .Include(a => a.Student)
                .Include(a => a.Activity)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status.ToString().ToLower() == status.ToLower());
            if (!string.IsNullOrEmpty(studentId) && Guid.TryParse(studentId, out var sid))
                query = query.Where(a => a.StudentId == sid);
            if (!string.IsNullOrEmpty(activityId) && Guid.TryParse(activityId, out var aid))
                query = query.Where(a => a.ActivityId == aid);

            var applications = await query.OrderByDescending(a => a.AppliedAt).ToListAsync();
            return Ok(applications.Select(MapApplication));
        }

        [HttpGet("attendance/approved")]
        public async Task<IActionResult> GetApprovedForAttendance([FromQuery] string activityId)
        {
            if (!Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var applications = await _db.Applications
                .Include(a => a.Student)
                .Where(a => a.ActivityId == aid && a.Status == ApplicationStatus.Approved)
                .ToListAsync();

            return Ok(applications.Select(MapApplication));
        }

        [HttpGet("stats/{activityId}")]
        public async Task<IActionResult> GetStats(string activityId)
        {
            if (!Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var apps = await _db.Applications.Where(a => a.ActivityId == aid).ToListAsync();
            return Ok(new
            {
                pending = apps.Count(a => a.Status == ApplicationStatus.Pending),
                approved = apps.Count(a => a.Status == ApplicationStatus.Approved),
                rejected = apps.Count(a => a.Status == ApplicationStatus.Rejected),
                waitlisted = apps.Count(a => a.Status == ApplicationStatus.Waitlisted),
                total = apps.Count
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid application ID" });

            var application = await _db.Applications
                .Include(a => a.Student)
                .Include(a => a.Activity)
                .FirstOrDefaultAsync(a => a.Id == guid);

            if (application == null)
                return NotFound(new { Success = false, Message = "Application not found" });

            return Ok(MapApplication(application));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateApplicationRequest request)
        {
            if (!Guid.TryParse(request.ActivityId, out var activityId))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var studentId = GetUserId();

            if (await _db.Applications.AnyAsync(a => a.StudentId == studentId && a.ActivityId == activityId))
                return BadRequest(new { Success = false, Message = "Already applied to this activity" });

            var activity = await _db.Activities.FindAsync(activityId);
            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            var student = await _db.Users.FindAsync(studentId);

            var isFull = activity.Enrolled >= activity.Capacity;

            var application = new Application
            {
                StudentId = studentId,
                StudentName = student?.Name,
                ActivityId = activityId,
                ActivityTitle = activity.Title,
                Status = isFull ? ApplicationStatus.Waitlisted : ApplicationStatus.Pending
            };

            _db.Applications.Add(application);

            if (!isFull)
            {
                activity.Enrolled++;
            }

            await _db.SaveChangesAsync();

            var statusText = isFull ? "waitlisted" : "pending";

            var studentNotif = new Notification
            {
                RecipientId = studentId,
                Title = "Application Submitted",
                Message = $"You have applied to \"{activity.Title}\". Status: {statusText}.",
                Type = isFull ? NotificationType.Waitlist : NotificationType.Approval,
                SenderRole = "student"
            };
            _db.Notifications.Add(studentNotif);

            Notification? coordNotif = null;
            if (activity.CoordinatorId != Guid.Empty)
            {
                coordNotif = new Notification
                {
                    RecipientId = activity.CoordinatorId,
                    Title = "New Application",
                    Message = $"{student?.Name ?? "A student"} has applied to \"{activity.Title}\".",
                    Type = NotificationType.Announcement,
                    SenderRole = "student"
                };
                _db.Notifications.Add(coordNotif);
            }

            await _db.SaveChangesAsync();

            await _hub.Clients.Group($"user-{studentId}").SendAsync("NotificationReceived", MapNotification(studentNotif));
            if (coordNotif != null)
            {
                await _hub.Clients.Group($"user-{activity.CoordinatorId}").SendAsync("NotificationReceived", MapNotification(coordNotif));
            }
            await _hub.Clients.All.SendAsync("ApplicationUpdated", MapApplication(application));
            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(MapApplication(application));
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin,coordinator")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateApplicationStatusRequest request)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid application ID" });

            var application = await _db.Applications.Include(a => a.Activity).FirstOrDefaultAsync(a => a.Id == guid);
            if (application == null)
                return NotFound(new { Success = false, Message = "Application not found" });

            var newStatus = request.Status.ToLower() switch
            {
                "approved" => ApplicationStatus.Approved,
                "rejected" => ApplicationStatus.Rejected,
                "waitlisted" => ApplicationStatus.Waitlisted,
                _ => ApplicationStatus.Pending
            };

            if (application.Status != ApplicationStatus.Approved && newStatus == ApplicationStatus.Approved)
            {
                application.Activity!.Enrolled++;
            }
            else if (application.Status == ApplicationStatus.Approved && newStatus != ApplicationStatus.Approved)
            {
                application.Activity!.Enrolled--;
            }

            application.Status = newStatus;
            if (request.Notes != null) application.Notes = request.Notes;

            await _db.SaveChangesAsync();

            var statusDisplay = newStatus.ToString().ToLower();
            var notifType = newStatus switch
            {
                ApplicationStatus.Approved => NotificationType.Approval,
                ApplicationStatus.Rejected => NotificationType.Rejection,
                ApplicationStatus.Waitlisted => NotificationType.Waitlist,
                _ => NotificationType.Reminder
            };

            var notif = new Notification
            {
                RecipientId = application.StudentId,
                Title = $"Application {statusDisplay}",
                Message = $"Your application for \"{application.Activity?.Title ?? application.ActivityTitle}\" has been {statusDisplay}.",
                Type = notifType,
                SenderRole = "coordinator"
            };
            _db.Notifications.Add(notif);

            await _db.SaveChangesAsync();

            await _hub.Clients.Group($"user-{application.StudentId}").SendAsync("NotificationReceived", MapNotification(notif));
            await _hub.Clients.All.SendAsync("ApplicationUpdated", MapApplication(application));
            if (application.Activity != null)
            {
                await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(application.Activity));
            }

            return Ok(MapApplication(application));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid application ID" });

            var application = await _db.Applications.Include(a => a.Activity).FirstOrDefaultAsync(a => a.Id == guid);
            if (application == null)
                return NotFound(new { Success = false, Message = "Application not found" });

            var currentUserId = GetUserId();
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value?.ToLower();
            if (userRole != "admin" && userRole != "coordinator" && application.StudentId != currentUserId)
            {
                return Forbid();
            }

            if (application.Status == ApplicationStatus.Approved && application.Activity != null)
            {
                application.Activity.Enrolled--;
            }

            _db.Applications.Remove(application);
            await _db.SaveChangesAsync();

            return Ok(new { Success = true });
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        }

        private static object MapApplication(Application a)
        {
            return new
            {
                id = a.Id.ToString(),
                studentId = a.StudentId.ToString(),
                studentName = a.StudentName ?? a.Student?.Name,
                studentEmail = a.Student?.Email,
                studentDepartment = a.Student?.Department,
                studentAvatar = a.Student?.AvatarUrl,
                activityId = a.ActivityId.ToString(),
                activityTitle = a.ActivityTitle ?? a.Activity?.Title,
                status = a.Status.ToString().ToLower(),
                appliedAt = a.AppliedAt.ToString("o"),
                notes = a.Notes,
                isAdmin = a.IsAdmin
            };
        }

        private static object MapNotification(Notification n)
        {
            return new
            {
                id = n.Id.ToString(),
                recipientId = n.RecipientId.ToString(),
                title = n.Title,
                message = n.Message,
                type = n.Type.ToString().ToLower(),
                read = n.IsRead,
                createdAt = n.CreatedAt.ToString("o"),
                senderRole = n.SenderRole
            };
        }

        private static object MapActivity(Activity a)
        {
            return new
            {
                id = a.Id.ToString(),
                title = a.Title,
                description = a.Description,
                date = a.Date.ToString("yyyy-MM-dd"),
                time = a.Time,
                location = a.Location,
                capacity = a.Capacity,
                enrolled = a.Enrolled,
                coordinatorId = a.CoordinatorId.ToString(),
                coordinatorName = a.CoordinatorName ?? a.Coordinator?.Name,
                status = a.Status.ToString().ToLower(),
                category = a.Category,
                imageUrl = a.ImageUrl,
                latitude = a.Latitude,
                longitude = a.Longitude,
                radius = a.Radius,
                qrCodeSecret = a.QrCodeSecret,
                createdAt = a.CreatedAt.ToString("o"),
                updatedAt = a.UpdatedAt.ToString("o")
            };
        }
    }
}
