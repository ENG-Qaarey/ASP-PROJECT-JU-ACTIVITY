using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/audit-logs")]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AuditLogsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? q,
            [FromQuery] string? action,
            [FromQuery] string? actorId,
            [FromQuery] string? targetId,
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] int? skip,
            [FromQuery] int? take)
        {
            var query = _db.AuditLogs
                .Include(l => l.Actor)
                .AsQueryable();

            if (!string.IsNullOrEmpty(q))
                query = query.Where(l =>
                    l.Action.Contains(q) ||
                    (l.Message != null && l.Message.Contains(q)));

            if (!string.IsNullOrEmpty(action))
                query = query.Where(l => l.Action == action);

            if (!string.IsNullOrEmpty(actorId) && Guid.TryParse(actorId, out var aid))
                query = query.Where(l => l.ActorId == aid);

            if (!string.IsNullOrEmpty(targetId))
                query = query.Where(l => l.EntityId == targetId);

            if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.CreatedAt >= fromDate);

            if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.CreatedAt <= toDate);

            var total = await query.CountAsync();

            if (skip.HasValue) query = query.Skip(skip.Value);
            if (take.HasValue) query = query.Take(take.Value);

            var logs = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

            return Ok(new
            {
                data = logs.Select(MapLog),
                total
            });
        }

        private static object MapLog(AuditLog log)
        {
            return new
            {
                id = log.Id.ToString(),
                action = log.Action,
                actorId = log.ActorId?.ToString(),
                actorName = log.Actor?.Name,
                targetId = log.TargetId?.ToString(),
                entity = log.Entity,
                entityId = log.EntityId,
                message = log.Message,
                createdAt = log.CreatedAt.ToString("o")
            };
        }
    }
}
