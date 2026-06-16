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
    [Route("api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;

        public MessagesController(AppDbContext db, IHubContext<NotificationHub> hub)
        {
            _db = db;
            _hub = hub;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? activityId,
            [FromQuery] int offset = 0,
            [FromQuery] int limit = 50)
        {
            if (string.IsNullOrEmpty(activityId) || !Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var userId = GetUserId();
            var allowed = await CanAccessActivityChat(aid, userId);
            if (!allowed)
                return Forbid();

            var total = await _db.Messages
                .CountAsync(m => m.ActivityId == aid && !m.IsDeleted);

            var messages = await _db.Messages
                .Include(m => m.Sender)
                .Include(m => m.Parent)
                .Where(m => m.ActivityId == aid && !m.IsDeleted)
                .OrderByDescending(m => m.CreatedAt)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            return Ok(new
            {
                messages = messages.OrderBy(m => m.CreatedAt).Select(MapMessage),
                total,
                offset,
                limit
            });
        }

        [HttpPost]
        public async Task<IActionResult> Send([FromBody] SendMessageRequest request)
        {
            if (string.IsNullOrEmpty(request.ActivityId) || !Guid.TryParse(request.ActivityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { Success = false, Message = "Message content is required" });

            var userId = GetUserId();
            var allowed = await CanAccessActivityChat(aid, userId);
            if (!allowed)
                return Forbid();

            var msgType = (request.Type?.ToLower()) switch
            {
                "image" => MessageType.Image,
                "video" => MessageType.Video,
                "audio" => MessageType.Audio,
                "file" => MessageType.File,
                _ => MessageType.Text
            };

            Guid? parentId = null;
            if (!string.IsNullOrEmpty(request.ParentId) && Guid.TryParse(request.ParentId, out var pid))
                parentId = pid;

            var message = new Message
            {
                ActivityId = aid,
                SenderId = userId,
                Content = request.Content.Trim(),
                Type = msgType,
                Metadata = request.Metadata,
                ParentId = parentId
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            // Reload with includes for mapping
            await _db.Entry(message).Reference(m => m.Sender).LoadAsync();
            if (message.ParentId != null)
                await _db.Entry(message).Reference(m => m.Parent).LoadAsync();

            var mapped = MapMessage(message);
            await _hub.Clients.Group($"activity-{aid}").SendAsync("ReceiveMessage", mapped);

            return Ok(mapped);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(string id, [FromBody] EditMessageRequest request)
        {
            if (!Guid.TryParse(id, out var msgId))
                return BadRequest(new { Success = false, Message = "Invalid message ID" });

            var userId = GetUserId();
            var message = await _db.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == msgId && !m.IsDeleted);

            if (message == null)
                return NotFound(new { Success = false, Message = "Message not found" });

            if (message.SenderId != userId)
                return Forbid();

            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { Success = false, Message = "Content is required" });

            message.Content = request.Content.Trim();
            message.EditedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            var mapped = MapMessage(message);
            if (message.ActivityId != null)
            {
                await _hub.Clients.Group($"activity-{message.ActivityId}").SendAsync("MessageEdited", mapped);
            }

            return Ok(mapped);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!Guid.TryParse(id, out var msgId))
                return BadRequest(new { Success = false, Message = "Invalid message ID" });

            var userId = GetUserId();
            var message = await _db.Messages.FindAsync(msgId);

            if (message == null || message.IsDeleted)
                return NotFound(new { Success = false, Message = "Message not found" });

            if (message.SenderId != userId)
                return Forbid();

            message.IsDeleted = true;
            await _db.SaveChangesAsync();

            if (message.ActivityId != null)
            {
                await _hub.Clients.Group($"activity-{message.ActivityId}").SendAsync("MessageDeleted", new
                {
                    id = message.Id.ToString(),
                    activityId = message.ActivityId.ToString()
                });
            }

            return Ok(new { Success = true });
        }

        [HttpPost("{id}/react")]
        public async Task<IActionResult> ToggleReaction(string id, [FromBody] ToggleReactionRequest request)
        {
            if (!Guid.TryParse(id, out var msgId))
                return BadRequest(new { Success = false, Message = "Invalid message ID" });

            var userId = GetUserId();
            var message = await _db.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == msgId && !m.IsDeleted);

            if (message == null)
                return NotFound(new { Success = false, Message = "Message not found" });

            var reactions = string.IsNullOrEmpty(message.Reactions)
                ? new List<ReactionEntry>()
                : System.Text.Json.JsonSerializer.Deserialize<List<ReactionEntry>>(message.Reactions) ?? new();

            var existing = reactions.FirstOrDefault(r => r.Emoji == request.Emoji);
            if (existing != null)
            {
                if (existing.Users.Contains(userId.ToString()))
                    existing.Users.Remove(userId.ToString());
                else
                    existing.Users.Add(userId.ToString());

                if (existing.Users.Count == 0)
                    reactions.Remove(existing);
            }
            else
            {
                reactions.Add(new ReactionEntry
                {
                    Emoji = request.Emoji,
                    Users = new List<string> { userId.ToString() }
                });
            }

            message.Reactions = System.Text.Json.JsonSerializer.Serialize(reactions);
            await _db.SaveChangesAsync();

            var mapped = MapMessage(message);
            if (message.ActivityId != null)
            {
                await _hub.Clients.Group($"activity-{message.ActivityId}").SendAsync("MessageReacted", mapped);
            }

            return Ok(mapped);
        }

        [HttpGet("members")]
        public async Task<IActionResult> GetMembers([FromQuery] string? activityId)
        {
            if (string.IsNullOrEmpty(activityId) || !Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var userId = GetUserId();
            var allowed = await CanAccessActivityChat(aid, userId);
            if (!allowed)
                return Forbid();

            var activity = await _db.Activities
                .Include(a => a.Coordinator)
                .FirstOrDefaultAsync(a => a.Id == aid);

            if (activity == null)
                return NotFound();

            var studentIds = await _db.Applications
                .Where(a => a.ActivityId == aid && a.Status == ApplicationStatus.Approved)
                .Select(a => a.StudentId)
                .ToListAsync();

            var students = await _db.Users
                .Where(u => studentIds.Contains(u.Id))
                .Select(u => new
                {
                    id = u.Id.ToString(),
                    name = u.Name,
                    email = u.Email,
                    avatar = u.AvatarUrl,
                    role = "student"
                })
                .ToListAsync();

            var admins = await _db.Users
                .Where(u => u.Role == UserRole.Admin)
                .Select(u => new
                {
                    id = u.Id.ToString(),
                    name = u.Name,
                    email = u.Email,
                    avatar = u.AvatarUrl,
                    role = "admin"
                })
                .ToListAsync();

            var coordinator = activity.Coordinator;
            var members = new List<object>();
            var addedIds = new HashSet<string>();

            if (coordinator != null && addedIds.Add(coordinator.Id.ToString()))
            {
                members.Add(new
                {
                    id = coordinator.Id.ToString(),
                    name = coordinator.Name,
                    email = coordinator.Email,
                    avatar = coordinator.AvatarUrl,
                    role = "coordinator"
                });
            }

            foreach (var admin in admins)
            {
                if (addedIds.Add(admin.id))
                {
                    members.Add(admin);
                }
            }

            foreach (var student in students)
            {
                if (addedIds.Add(student.id))
                {
                    members.Add(student);
                }
            }

            return Ok(members);
        }

        [HttpPost("read")]
        public async Task<IActionResult> MarkAsRead([FromBody] MarkReadRequest request)
        {
            if (string.IsNullOrEmpty(request.ActivityId) || !Guid.TryParse(request.ActivityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activityExists = await _db.Activities.AnyAsync(a => a.Id == aid);
            if (!activityExists)
                return NotFound(new { Success = false, Message = "Activity not found" });

            var userId = GetUserId();
            var existing = await _db.ActivityReadStatuses
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ActivityId == aid);

            if (existing != null)
            {
                existing.LastReadAt = DateTime.UtcNow;
            }
            else
            {
                _db.ActivityReadStatuses.Add(new ActivityReadStatus
                {
                    UserId = userId,
                    ActivityId = aid,
                    LastReadAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            return Ok(new { Success = true });
        }

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadCounts()
        {
            var userId = GetUserId();
            var readStatuses = await _db.ActivityReadStatuses
                .Where(r => r.UserId == userId)
                .ToDictionaryAsync(r => r.ActivityId, r => r.LastReadAt);

            var counts = new Dictionary<string, int>();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return Ok(counts);

            IQueryable<Activity> activityQuery;

            if (user.Role == UserRole.Admin)
            {
                activityQuery = _db.Activities;
            }
            else if (user.Role == UserRole.Coordinator)
            {
                activityQuery = _db.Activities.Where(a => a.CoordinatorId == userId);
            }
            else
            {
                var myActivityIds = await _db.Applications
                    .Where(a => a.StudentId == userId && (a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Pending))
                    .Select(a => a.ActivityId)
                    .ToListAsync();
                activityQuery = _db.Activities.Where(a => myActivityIds.Contains(a.Id));
            }

            var activities = await activityQuery.ToListAsync();

            foreach (var activity in activities)
            {
                readStatuses.TryGetValue(activity.Id, out var lastRead);
                var count = await _db.Messages
                    .CountAsync(m => m.ActivityId == activity.Id && !m.IsDeleted &&
                        (lastRead == default || m.CreatedAt > lastRead));

                if (count > 0)
                    counts[activity.Id.ToString()] = count;
            }

            return Ok(counts);
        }

        [HttpGet("preview")]
        public async Task<IActionResult> GetLastMessages()
        {
            var userId = GetUserId();
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return Ok(new Dictionary<string, object>());

            IQueryable<Activity> activityQuery;

            if (user.Role == UserRole.Admin)
            {
                activityQuery = _db.Activities;
            }
            else if (user.Role == UserRole.Coordinator)
            {
                activityQuery = _db.Activities.Where(a => a.CoordinatorId == userId);
            }
            else
            {
                var myActivityIds = await _db.Applications
                    .Where(a => a.StudentId == userId && (a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Pending))
                    .Select(a => a.ActivityId)
                    .ToListAsync();
                activityQuery = _db.Activities.Where(a => myActivityIds.Contains(a.Id));
            }

            var activityIds = await activityQuery.Select(a => a.Id).ToListAsync();

            var lastMessages = await _db.Messages
                .Where(m => activityIds.Contains(m.ActivityId!.Value) && !m.IsDeleted)
                .GroupBy(m => m.ActivityId)
                .Select(g => g.OrderByDescending(m => m.CreatedAt).First())
                .ToListAsync();

            var result = new Dictionary<string, object>();
            foreach (var msg in lastMessages)
            {
                if (msg.ActivityId != null)
                {
                    result[msg.ActivityId.ToString()!] = new
                    {
                        content = msg.Type == MessageType.Text ? msg.Content : $"[{msg.Type.ToString().ToLower()}]",
                        senderName = msg.Sender?.Name ?? "Unknown",
                        createdAt = msg.CreatedAt.ToString("o")
                    };
                }
            }

            return Ok(result);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string activityId)
        {
            if (string.IsNullOrEmpty(activityId) || !Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            if (file == null || file.Length == 0)
                return BadRequest(new { Success = false, Message = "No file uploaded" });

            var userId = GetUserId();
            var allowed = await CanAccessActivityChat(aid, userId);
            if (!allowed) return Forbid();

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "chat", activityId);
            Directory.CreateDirectory(uploadsDir);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/chat/{activityId}/{fileName}";

            return Ok(new
            {
                url,
                fileName = file.FileName,
                size = file.Length,
                contentType = file.ContentType
            });
        }

        private async Task<bool> CanAccessActivityChat(Guid activityId, Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return false;
            if (user.Role == UserRole.Admin) return true;

            var activity = await _db.Activities.FindAsync(activityId);
            if (activity == null) return false;
            if (activity.CoordinatorId == userId) return true;

            var canChat = await _db.Applications
                .AnyAsync(a => a.ActivityId == activityId && a.StudentId == userId &&
                    (a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Pending));

            return canChat;
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        }

        private object MapMessage(Message m)
        {
            object? parentContent = null;
            if (m.Parent != null)
            {
                parentContent = new
                {
                    id = m.Parent.Id.ToString(),
                    content = m.Parent.Type == MessageType.Text
                        ? m.Parent.Content
                        : $"[{m.Parent.Type.ToString().ToLower()}]",
                    senderName = m.Parent.Sender?.Name
                };
            }

            return new
            {
                id = m.Id.ToString(),
                activityId = m.ActivityId?.ToString(),
                senderId = m.SenderId.ToString(),
                senderName = m.Sender?.Name,
                senderAvatar = m.Sender?.AvatarUrl,
                content = m.Content,
                type = m.Type.ToString().ToLower(),
                metadata = m.Metadata,
                createdAt = m.CreatedAt.ToString("o"),
                editedAt = m.EditedAt?.ToString("o"),
                reactions = m.Reactions,
                parentId = m.ParentId?.ToString(),
                parent = parentContent,
                isDeleted = m.IsDeleted
            };
        }
    }
}
