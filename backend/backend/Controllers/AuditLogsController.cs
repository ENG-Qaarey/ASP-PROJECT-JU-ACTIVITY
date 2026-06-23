using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using backend.Models;
using backend.Data;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/audit-logs")]
    [Authorize(Roles = "admin")]
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
            [FromQuery] string? status,
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] int? skip,
            [FromQuery] int? take)
        {
            var query = _db.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(q))
                query = query.Where(l =>
                    l.Action.Contains(q) ||
                    (l.Message != null && l.Message.Contains(q)) ||
                    (l.ActorName != null && l.ActorName.Contains(q)) ||
                    (l.ActorEmail != null && l.ActorEmail.Contains(q)));

            if (!string.IsNullOrEmpty(action))
                query = query.Where(l => l.Action == action);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(l => l.Status == status);

            if (!string.IsNullOrEmpty(actorId) && Guid.TryParse(actorId, out var aid))
                query = query.Where(l => l.ActorId == aid);

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

        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] string? q,
            [FromQuery] string? action,
            [FromQuery] string? actorId,
            [FromQuery] string? status,
            [FromQuery] string? from,
            [FromQuery] string? to)
        {
            var query = _db.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(q))
                query = query.Where(l =>
                    l.Action.Contains(q) ||
                    (l.Message != null && l.Message.Contains(q)) ||
                    (l.ActorName != null && l.ActorName.Contains(q)) ||
                    (l.ActorEmail != null && l.ActorEmail.Contains(q)));

            if (!string.IsNullOrEmpty(action))
                query = query.Where(l => l.Action == action);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(l => l.Status == status);

            if (!string.IsNullOrEmpty(actorId) && Guid.TryParse(actorId, out var aid))
                query = query.Where(l => l.ActorId == aid);

            if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.CreatedAt >= fromDate);

            if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.CreatedAt <= toDate);

            var logs = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();

            var csvBuilder = new StringBuilder();
            csvBuilder.AppendLine("Id,Action,ActorName,ActorEmail,ActorRole,Entity,EntityId,Message,Status,ErrorDetails,IpAddress,UserAgent,CreatedAt");
            foreach (var log in logs)
            {
                csvBuilder.AppendLine(
                    $"{EscapeCsv(log.Id.ToString())}," +
                    $"{EscapeCsv(log.Action)}," +
                    $"{EscapeCsv(log.ActorName)}," +
                    $"{EscapeCsv(log.ActorEmail)}," +
                    $"{EscapeCsv(log.ActorRole)}," +
                    $"{EscapeCsv(log.Entity)}," +
                    $"{EscapeCsv(log.EntityId)}," +
                    $"{EscapeCsv(log.Message)}," +
                    $"{EscapeCsv(log.Status)}," +
                    $"{EscapeCsv(log.ErrorDetails)}," +
                    $"{EscapeCsv(log.IpAddress)}," +
                    $"{EscapeCsv(log.UserAgent)}," +
                    $"{EscapeCsv(log.CreatedAt.ToString("o"))}");
            }

            return File(Encoding.UTF8.GetBytes(csvBuilder.ToString()), "text/csv", $"audit-logs-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }

        [HttpGet("export/json")]
        public async Task<IActionResult> ExportJson(
            [FromQuery] string? q,
            [FromQuery] string? action,
            [FromQuery] string? actorId,
            [FromQuery] string? status,
            [FromQuery] string? from,
            [FromQuery] string? to)
        {
            var query = _db.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(q))
                query = query.Where(l =>
                    l.Action.Contains(q) ||
                    (l.Message != null && l.Message.Contains(q)) ||
                    (l.ActorName != null && l.ActorName.Contains(q)) ||
                    (l.ActorEmail != null && l.ActorEmail.Contains(q)));

            if (!string.IsNullOrEmpty(action))
                query = query.Where(l => l.Action == action);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(l => l.Status == status);

            if (!string.IsNullOrEmpty(actorId) && Guid.TryParse(actorId, out var aid))
                query = query.Where(l => l.ActorId == aid);

            if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.CreatedAt >= fromDate);

            if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.CreatedAt <= toDate);

            var logs = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
            var mappedLogs = logs.Select(MapLog).ToList();
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var json = JsonSerializer.Serialize(mappedLogs, new JsonSerializerOptions { WriteIndented = true });
            return File(Encoding.UTF8.GetBytes(json), "application/json", "audit-logs-" + timestamp + ".json");
        }

        private static string EscapeCsv(string? value)
        {
            if (value == null) return "";
            if (value.Contains(",") || value.Contains("\"") || value.Contains("\n") || value.Contains("\r"))
            {
                return "\"" + value.Replace("\"", "\"\"") + "\"";
            }
            return value;
        }

        private static object MapLog(AuditLog log)
        {
            return new
            {
                id = log.Id.ToString(),
                action = log.Action,
                actorId = log.ActorId?.ToString(),
                actorName = log.ActorName,
                actorEmail = log.ActorEmail,
                actorRole = log.ActorRole,
                entity = log.Entity,
                entityId = log.EntityId,
                message = log.Message,
                beforeData = log.BeforeData,
                afterData = log.AfterData,
                status = log.Status,
                errorDetails = log.ErrorDetails,
                ipAddress = log.IpAddress,
                userAgent = log.UserAgent,
                createdAt = log.CreatedAt.ToString("o")
            };
        }
    }
}
