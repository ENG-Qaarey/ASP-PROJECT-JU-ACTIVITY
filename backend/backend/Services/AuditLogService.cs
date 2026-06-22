using System.Security.Claims;
using System.Text.Json;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class AuditLogService
    {
        private readonly AppDbContext _db;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditLogService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
        {
            _db = db;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(
            string action,
            string? entity = null,
            string? entityId = null,
            string? message = null,
            object? beforeData = null,
            object? afterData = null,
            string? status = "success",
            string? errorDetails = null,
            Guid? actorId = null,
            string? actorName = null,
            string? actorEmail = null,
            string? actorRole = null)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

            if (httpContext != null && httpContext.User.Identity?.IsAuthenticated == true && actorId == null)
            {
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier);
                var nameClaim = httpContext.User.FindFirst(ClaimTypes.Name);
                var emailClaim = httpContext.User.FindFirst(ClaimTypes.Email);
                var roleClaim = httpContext.User.FindFirst(ClaimTypes.Role);

                if (Guid.TryParse(userIdClaim?.Value, out var parsedId))
                {
                    actorId = parsedId;
                }
                actorName ??= nameClaim?.Value;
                actorEmail ??= emailClaim?.Value;
                actorRole ??= roleClaim?.Value;
            }

            var auditLog = new AuditLog
            {
                Action = action,
                ActorId = actorId,
                ActorName = actorName,
                ActorEmail = actorEmail,
                ActorRole = actorRole,
                Entity = entity,
                EntityId = entityId,
                Message = message,
                BeforeData = beforeData != null ? JsonSerializer.Serialize(beforeData) : null,
                AfterData = afterData != null ? JsonSerializer.Serialize(afterData) : null,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Status = status ?? "success",
                ErrorDetails = errorDetails
            };

            _db.AuditLogs.Add(auditLog);
            await _db.SaveChangesAsync();
        }
    }
}