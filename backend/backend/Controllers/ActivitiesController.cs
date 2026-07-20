using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Hubs;
using backend.Models;
using backend.Data;
using backend.Models.Enums;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/activities")]
    [Authorize]
    public class ActivitiesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly IWebHostEnvironment _env;

        public ActivitiesController(AppDbContext db, IHubContext<NotificationHub> hub, IWebHostEnvironment env)
        {
            _db = db;
            _hub = hub;
            _env = env;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? category,
            [FromQuery] string? coordinatorId,
            [FromQuery] bool? isDraft)
        {
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value?.ToLower();

            var query = _db.Activities
                .Include(a => a.Coordinator)
                .Include(a => a.Requirements)
                .Include(a => a.Questions)
                .AsQueryable();

            if (userRole != "admin")
            {
                query = query.Where(a => !a.IsDraft);
            }
            else if (isDraft.HasValue)
            {
                query = query.Where(a => a.IsDraft == isDraft.Value);
            }

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status.ToString().ToLower() == status.ToLower());
            if (!string.IsNullOrEmpty(category))
                query = query.Where(a => a.Category != null && a.Category.ToLower() == category.ToLower());
            if (!string.IsNullOrEmpty(coordinatorId) && Guid.TryParse(coordinatorId, out var cid))
                query = query.Where(a => a.CoordinatorId == cid);

            var activities = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
            return Ok(activities.Select(MapActivity));
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities
                .Include(a => a.Coordinator)
                .Include(a => a.Requirements)
                .Include(a => a.Questions.OrderBy(q => q.DisplayOrder))
                .FirstOrDefaultAsync(a => a.Id == guid);

            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            return Ok(MapActivity(activity));
        }

        [HttpGet("drafts")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDrafts()
        {
            var activities = await _db.Activities
                .Include(a => a.Coordinator)
                .Include(a => a.Requirements)
                .Include(a => a.Questions)
                .Where(a => a.IsDraft)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(activities.Select(MapActivity));
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateActivityRequest request)
        {
            var adminId = GetUserId();
            var coordinatorId = request.CoordinatorId ?? adminId;

            var coordinator = await _db.Users.FindAsync(coordinatorId);

            var activity = new Activity
            {
                Title = request.Title,
                Description = request.Description,
                Date = DateOnly.FromDateTime(request.Date),
                Time = request.Time,
                Location = request.Location,
                Capacity = request.Capacity,
                CoordinatorId = coordinatorId,
                CoordinatorName = coordinator?.Name ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value,
                Category = request.Category,
                Status = request.IsDraft ? ActivityStatus.Draft : (request.Status?.ToLower() switch
                {
                    "ongoing" => ActivityStatus.Ongoing,
                    "completed" => ActivityStatus.Completed,
                    _ => ActivityStatus.Upcoming
                }),
                IsDraft = request.IsDraft,
                RecurrencePattern = request.RecurrencePattern,
                ImageUrl = string.IsNullOrEmpty(request.ImageUrl)
                    ? (request.Category?.ToLower() switch
                      {
                          "workshop" => "/uploads/activities/workshop.svg",
                          "seminar" => "/uploads/activities/seminar.svg",
                          "training" => "/uploads/activities/training.svg",
                          "extracurricular" => "/uploads/activities/extracurricular.svg",
                          _ => "/uploads/activities/default.svg"
                      })
                    : request.ImageUrl,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Radius = request.Radius
            };

            _db.Activities.Add(activity);
            await _db.SaveChangesAsync();

            if (request.Requirements?.Count > 0)
            {
                foreach (var req in request.Requirements)
                {
                    var requirement = new ActivityRequirement
                    {
                        ActivityId = activity.Id,
                        Type = req.Type.ToLower() switch
                        {
                            "department" => RequirementType.Department,
                            "yearlevel" => RequirementType.YearLevel,
                            "gpamin" => RequirementType.GpaMin,
                            _ => RequirementType.CustomText
                        },
                        Label = req.Label,
                        Value = req.Value,
                        IsRequired = req.IsRequired
                    };
                    _db.ActivityRequirements.Add(requirement);
                }
                await _db.SaveChangesAsync();
            }

            if (request.Questions?.Count > 0)
            {
                int order = 0;
                foreach (var q in request.Questions)
                {
                    var question = new ActivityQuestion
                    {
                        ActivityId = activity.Id,
                        QuestionText = q.QuestionText,
                        QuestionType = q.QuestionType.ToLower() switch
                        {
                            "yesno" => QuestionType.YesNo,
                            "multiplechoice" => QuestionType.MultipleChoice,
                            _ => QuestionType.FreeText
                        },
                        Options = q.Options,
                        IsRequired = q.IsRequired,
                        DisplayOrder = order++
                    };
                    _db.ActivityQuestions.Add(question);
                }
                await _db.SaveChangesAsync();
            }

            if (!string.IsNullOrEmpty(request.RecurrencePattern) && !request.IsDraft)
            {
                await CreateRecurringActivities(activity, request);
            }

            await _db.SaveChangesAsync();
            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(MapActivity(activity));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateActivityRequest request)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities
                .Include(a => a.Requirements)
                .Include(a => a.Questions)
                .FirstOrDefaultAsync(a => a.Id == guid);

            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            if (!string.IsNullOrEmpty(request.Title)) activity.Title = request.Title;
            if (request.Description != null) activity.Description = request.Description;
            if (request.Date.HasValue) activity.Date = DateOnly.FromDateTime(request.Date.Value);
            if (request.Time != null) activity.Time = request.Time;
            if (request.Location != null) activity.Location = request.Location;
            if (request.Capacity.HasValue) activity.Capacity = request.Capacity.Value;
            if (request.Category != null) activity.Category = request.Category;
            if (request.Latitude.HasValue) activity.Latitude = request.Latitude;
            if (request.Longitude.HasValue) activity.Longitude = request.Longitude;
            if (request.Radius.HasValue) activity.Radius = request.Radius;
            if (request.ImageUrl != null) activity.ImageUrl = request.ImageUrl;
            if (request.RecurrencePattern != null) activity.RecurrencePattern = request.RecurrencePattern;

            if (request.IsDraft.HasValue)
            {
                activity.IsDraft = request.IsDraft.Value;
                if (!request.IsDraft.Value && activity.Status == ActivityStatus.Draft)
                {
                    activity.Status = ActivityStatus.Upcoming;
                }
            }

            if (!string.IsNullOrEmpty(request.Status))
                activity.Status = request.Status.ToLower() switch
                {
                    "upcoming" => ActivityStatus.Upcoming,
                    "ongoing" => ActivityStatus.Ongoing,
                    "completed" => ActivityStatus.Completed,
                    _ => activity.Status
                };

            if (request.Requirements != null)
            {
                _db.ActivityRequirements.RemoveRange(activity.Requirements);
                foreach (var req in request.Requirements)
                {
                    var requirement = new ActivityRequirement
                    {
                        ActivityId = activity.Id,
                        Type = req.Type.ToLower() switch
                        {
                            "department" => RequirementType.Department,
                            "yearlevel" => RequirementType.YearLevel,
                            "gpamin" => RequirementType.GpaMin,
                            _ => RequirementType.CustomText
                        },
                        Label = req.Label,
                        Value = req.Value,
                        IsRequired = req.IsRequired
                    };
                    _db.ActivityRequirements.Add(requirement);
                }
            }

            if (request.Questions != null)
            {
                _db.ActivityQuestions.RemoveRange(activity.Questions);
                int order = 0;
                foreach (var q in request.Questions)
                {
                    var question = new ActivityQuestion
                    {
                        ActivityId = activity.Id,
                        QuestionText = q.QuestionText,
                        QuestionType = q.QuestionType.ToLower() switch
                        {
                            "yesno" => QuestionType.YesNo,
                            "multiplechoice" => QuestionType.MultipleChoice,
                            _ => QuestionType.FreeText
                        },
                        Options = q.Options,
                        IsRequired = q.IsRequired,
                        DisplayOrder = order++
                    };
                    _db.ActivityQuestions.Add(question);
                }
            }

            activity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(MapActivity(activity));
        }

        [HttpPost("{id}/publish")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Publish(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities
                .Include(a => a.Requirements)
                .Include(a => a.Questions)
                .FirstOrDefaultAsync(a => a.Id == guid);

            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            if (!activity.IsDraft)
                return BadRequest(new { Success = false, Message = "Activity is already published" });

            activity.IsDraft = false;
            activity.Status = ActivityStatus.Upcoming;
            activity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            if (!string.IsNullOrEmpty(activity.RecurrencePattern))
            {
                await CreateRecurringActivities(activity, null);
                await _db.SaveChangesAsync();
            }

            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(MapActivity(activity));
        }

        [HttpPost("{id}/image")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UploadImage(string id, IFormFile file)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities.FindAsync(guid);
            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            if (file == null || file.Length == 0)
                return BadRequest(new { Success = false, Message = "No file uploaded" });

            var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "activities");
            Directory.CreateDirectory(uploadsDir);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{guid}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/activities/{fileName}";
            activity.ImageUrl = imageUrl;
            activity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(new { imageUrl });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities.FindAsync(guid);
            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            _db.Activities.Remove(activity);
            await _db.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ActivityDeleted", new { id = guid.ToString() });

            return Ok(new { Success = true });
        }

        private async Task CreateRecurringActivities(Activity parent, CreateActivityRequest? request)
        {
            if (string.IsNullOrEmpty(parent.RecurrencePattern)) return;

            var pattern = System.Text.Json.JsonSerializer.Deserialize<RecurrencePatternData>(parent.RecurrencePattern);
            if (pattern == null || string.IsNullOrEmpty(pattern.Type) || string.IsNullOrEmpty(pattern.EndDate)) return;

            if (!DateOnly.TryParse(pattern.EndDate, out var endDate)) return;

            var currentDate = parent.Date.AddDays(7);
            while (currentDate <= endDate)
            {
                var shouldCreate = pattern.Type switch
                {
                    "weekly" => pattern.DaysOfWeek != null && pattern.DaysOfWeek.Contains(currentDate.DayOfWeek.ToString()),
                    "biweekly" => pattern.DaysOfWeek != null && pattern.DaysOfWeek.Contains(currentDate.DayOfWeek.ToString()) &&
                                  ((currentDate.DayNumber - parent.Date.DayNumber) % 14 == 0),
                    "monthly" => currentDate.Day == parent.Date.Day,
                    _ => false
                };

                if (shouldCreate)
                {
                    var child = new Activity
                    {
                        Title = parent.Title,
                        Description = parent.Description,
                        Date = currentDate,
                        Time = parent.Time,
                        Location = parent.Location,
                        Capacity = parent.Capacity,
                        CoordinatorId = parent.CoordinatorId,
                        CoordinatorName = parent.CoordinatorName,
                        Category = parent.Category,
                        Status = ActivityStatus.Upcoming,
                        IsDraft = false,
                        ImageUrl = parent.ImageUrl,
                        Latitude = parent.Latitude,
                        Longitude = parent.Longitude,
                        Radius = parent.Radius,
                        ParentActivityId = parent.Id
                    };
                    _db.Activities.Add(child);
                }

                currentDate = currentDate.AddDays(pattern.Type == "biweekly" ? 14 : 7);
            }
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
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
                isDraft = a.IsDraft,
                recurrencePattern = a.RecurrencePattern,
                parentActivityId = a.ParentActivityId?.ToString(),
                requirements = a.Requirements?.Select(r => new
                {
                    id = r.Id.ToString(),
                    type = r.Type.ToString().ToLower(),
                    label = r.Label,
                    value = r.Value,
                    isRequired = r.IsRequired
                }),
                questions = a.Questions?.OrderBy(q => q.DisplayOrder).Select(q => new
                {
                    id = q.Id.ToString(),
                    questionText = q.QuestionText,
                    questionType = q.QuestionType.ToString().ToLower(),
                    options = q.Options,
                    isRequired = q.IsRequired,
                    displayOrder = q.DisplayOrder
                }),
                createdAt = a.CreatedAt.ToString("o"),
                updatedAt = a.UpdatedAt.ToString("o")
            };
        }

        private class RecurrencePatternData
        {
            public string? Type { get; set; }
            public List<string>? DaysOfWeek { get; set; }
            public string? EndDate { get; set; }
            public int? Interval { get; set; }
        }
    }
}
