using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
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

        public ApplicationsController(AppDbContext db)
        {
            _db = db;
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

            return Ok(MapApplication(application));
        }

        [HttpPut("{id}/status")]
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
    }
}
