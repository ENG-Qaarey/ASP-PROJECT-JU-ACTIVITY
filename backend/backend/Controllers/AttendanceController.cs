using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Models;
using backend.Models.Enums;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/attendance")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AttendanceController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? activityId,
            [FromQuery] string? studentId,
            [FromQuery] string? status)
        {
            var query = _db.Attendances
                .Include(a => a.Student)
                .Include(a => a.Activity)
                .AsQueryable();

            if (!string.IsNullOrEmpty(activityId) && Guid.TryParse(activityId, out var aid))
                query = query.Where(a => a.ActivityId == aid);
            if (!string.IsNullOrEmpty(studentId) && Guid.TryParse(studentId, out var sid))
                query = query.Where(a => a.StudentId == sid);
            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status.ToString().ToLower() == status.ToLower());

            var records = await query.OrderByDescending(a => a.MarkedAt).ToListAsync();
            return Ok(records.Select(MapAttendance));
        }

        [HttpGet("stats/{activityId}")]
        public async Task<IActionResult> GetStats(string activityId)
        {
            if (!Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var records = await _db.Attendances.Where(a => a.ActivityId == aid).ToListAsync();
            return Ok(new
            {
                present = records.Count(a => a.Status == AttendanceStatus.Present),
                absent = records.Count(a => a.Status == AttendanceStatus.Absent),
                total = records.Count
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid attendance ID" });

            var record = await _db.Attendances
                .Include(a => a.Student)
                .Include(a => a.Activity)
                .FirstOrDefaultAsync(a => a.Id == guid);

            if (record == null)
                return NotFound(new { Success = false, Message = "Attendance not found" });

            return Ok(MapAttendance(record));
        }

        [HttpPost]
        [Authorize(Roles = "admin,coordinator")]
        public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceRequest request)
        {
            if (!Guid.TryParse(request.ActivityId, out var activityId)
                || !Guid.TryParse(request.StudentId, out var studentId)
                || !Guid.TryParse(request.ApplicationId, out var applicationId))
                return BadRequest(new { Success = false, Message = "Invalid IDs" });

            var markedById = GetUserId();

            var student = await _db.Users.FindAsync(studentId);

            var attendance = new Attendance
            {
                ActivityId = activityId,
                StudentId = studentId,
                StudentName = student?.Name,
                ApplicationId = applicationId,
                MarkedById = markedById,
                Status = request.Status.ToLower() == "absent" ? AttendanceStatus.Absent : AttendanceStatus.Present
            };

            _db.Attendances.Add(attendance);
            await _db.SaveChangesAsync();

            return Ok(MapAttendance(attendance));
        }

        [HttpPost("batch")]
        [Authorize(Roles = "admin,coordinator")]
        public async Task<IActionResult> BatchMarkAttendance([FromBody] BatchAttendanceRequest request)
        {
            if (!Guid.TryParse(request.ActivityId, out var activityId)
                || !Guid.TryParse(request.MarkedBy, out var markedById))
                return BadRequest(new { Success = false, Message = "Invalid IDs" });

            var records = new List<Attendance>();

            foreach (var item in request.AttendanceData)
            {
                if (!Guid.TryParse(item.StudentId, out var studentId)
                    || !Guid.TryParse(item.ApplicationId, out var appId))
                    continue;

                var attendance = new Attendance
                {
                    ActivityId = activityId,
                    StudentId = studentId,
                    StudentName = item.StudentName,
                    ApplicationId = appId,
                    MarkedById = markedById,
                    Status = item.Status.ToLower() == "absent" ? AttendanceStatus.Absent : AttendanceStatus.Present
                };

                records.Add(attendance);
            }

            _db.Attendances.AddRange(records);
            await _db.SaveChangesAsync();

            return Ok(records.Select(MapAttendance));
        }

        [HttpGet("qr/generate/{activityId}")]
        [Authorize(Roles = "admin,coordinator")]
        public async Task<IActionResult> GenerateQr(string activityId)
        {
            if (!Guid.TryParse(activityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities.FindAsync(aid);
            if (activity == null)
                return NotFound(new { Success = false, Message = "Activity not found" });

            var secret = Guid.NewGuid().ToString("N");
            activity.QrCodeSecret = secret;
            await _db.SaveChangesAsync();

            return Ok(new { token = secret });
        }

        [HttpPost("qr/scan")]
        public async Task<IActionResult> ScanQr([FromBody] ScanQrRequest request)
        {
            if (!Guid.TryParse(request.ActivityId, out var aid))
                return BadRequest(new { Success = false, Message = "Invalid activity ID" });

            var activity = await _db.Activities.FindAsync(aid);
            if (activity == null || activity.QrCodeSecret != request.Token)
                return BadRequest(new { Success = false, Message = "Invalid or expired QR code" });

            return Ok(new { Success = true, Message = "QR code valid" });
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        }

        private static object MapAttendance(Attendance a)
        {
            return new
            {
                id = a.Id.ToString(),
                activityId = a.ActivityId.ToString(),
                activityTitle = a.Activity?.Title,
                studentId = a.StudentId.ToString(),
                studentName = a.StudentName ?? a.Student?.Name,
                applicationId = a.ApplicationId.ToString(),
                markedById = a.MarkedById.ToString(),
                status = a.Status.ToString().ToLower(),
                markedAt = a.MarkedAt.ToString("o")
            };
        }
    }
}
