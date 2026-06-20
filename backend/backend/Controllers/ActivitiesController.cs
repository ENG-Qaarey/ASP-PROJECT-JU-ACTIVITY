using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Hubs;
using backend.Models;
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

        public ActivitiesController(AppDbContext db, IHubContext<NotificationHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? category,
            [FromQuery] string? coordinatorId)
        {
            var query = _db.Activities
                .Include(a => a.Coordinator)
                .AsQueryable();

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
                .FirstOrDefaultAsync(a => a.Id == guid);

            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            return Ok(MapActivity(activity));
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
                Status = request.Status?.ToLower() switch
                {
                    "ongoing" => ActivityStatus.Ongoing,
                    "completed" => ActivityStatus.Completed,
                    _ => ActivityStatus.Upcoming
                },
                ImageUrl = request.ImageUrl,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Radius = request.Radius
            };

            _db.Activities.Add(activity);
            await _db.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(MapActivity(activity));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,coordinator")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateActivityRequest request)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities.FindAsync(guid);
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
            if (!string.IsNullOrEmpty(request.Status))
                activity.Status = request.Status.ToLower() switch
                {
                    "upcoming" => ActivityStatus.Upcoming,
                    "ongoing" => ActivityStatus.Ongoing,
                    "completed" => ActivityStatus.Completed,
                    _ => activity.Status
                };
            if (request.ImageUrl != null) activity.ImageUrl = request.ImageUrl;
            activity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ActivityUpdated", MapActivity(activity));

            return Ok(MapActivity(activity));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,coordinator")]
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
                createdAt = a.CreatedAt.ToString("o"),
                updatedAt = a.UpdatedAt.ToString("o")
            };
        }
    }
}
