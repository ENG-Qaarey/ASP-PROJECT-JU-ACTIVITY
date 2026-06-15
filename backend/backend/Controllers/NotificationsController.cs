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
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationsController(AppDbContext db, IHubContext<NotificationHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? recipientId,
            [FromQuery] bool? read,
            [FromQuery] string? type)
        {
            var query = _db.Notifications.AsQueryable();

            if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var rid))
                query = query.Where(n => n.RecipientId == rid);
            if (read.HasValue)
                query = query.Where(n => n.IsRead == read.Value);
            if (!string.IsNullOrEmpty(type))
                query = query.Where(n => n.Type.ToString().ToLower() == type.ToLower());

            var notifications = await query.OrderByDescending(n => n.CreatedAt).ToListAsync();
            return Ok(notifications.Select(MapNotification));
        }

        [HttpGet("unread/count")]
        public async Task<IActionResult> GetUnreadCount([FromQuery] string? recipientId)
        {
            var query = _db.Notifications.Where(n => !n.IsRead);
            if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var rid))
                query = query.Where(n => n.RecipientId == rid);

            var count = await query.CountAsync();
            return Ok(count);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid notification ID" });

            var notification = await _db.Notifications.FindAsync(guid);
            if (notification == null)
                return NotFound(new { Success = false, Message = "Notification not found" });

            return Ok(MapNotification(notification));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateNotificationRequest request)
        {
            if (!Guid.TryParse(request.RecipientId, out var recipientId))
                return BadRequest(new { Success = false, Message = "Invalid recipient ID" });

            var notification = new Notification
            {
                RecipientId = recipientId,
                Title = request.Title,
                Message = request.Message,
                Type = request.Type?.ToLower() switch
                {
                    "rejection" => NotificationType.Rejection,
                    "announcement" => NotificationType.Announcement,
                    "reminder" => NotificationType.Reminder,
                    "waitlist" => NotificationType.Waitlist,
                    _ => NotificationType.Approval
                },
                SenderRole = request.SenderRole
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            await _hub.Clients.Group($"user-{recipientId}").SendAsync("NotificationReceived", MapNotification(notification));

            return Ok(MapNotification(notification));
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid notification ID" });

            var notification = await _db.Notifications.FindAsync(guid);
            if (notification == null)
                return NotFound(new { Success = false, Message = "Notification not found" });

            notification.IsRead = true;
            await _db.SaveChangesAsync();

            await _hub.Clients.Group($"user-{notification.RecipientId}").SendAsync("NotificationRead", new { id = notification.Id.ToString(), recipientId = notification.RecipientId.ToString() });

            return Ok(MapNotification(notification));
        }

        [HttpPut("read/all")]
        public async Task<IActionResult> MarkAllAsRead([FromQuery] string? recipientId)
        {
            var query = _db.Notifications.Where(n => !n.IsRead);
            Guid rid = Guid.Empty;
            if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out rid))
                query = query.Where(n => n.RecipientId == rid);

            await query.ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

            if (rid != Guid.Empty)
            {
                await _hub.Clients.Group($"user-{rid}").SendAsync("AllNotificationsRead", new { recipientId });
            }

            return Ok(new { Success = true });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid notification ID" });

            var notification = await _db.Notifications.FindAsync(guid);
            if (notification == null)
                return NotFound(new { Success = false, Message = "Notification not found" });

            _db.Notifications.Remove(notification);
            await _db.SaveChangesAsync();

            return Ok(new { Success = true });
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
    }
}
