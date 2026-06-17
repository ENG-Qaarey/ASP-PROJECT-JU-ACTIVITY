using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.models;
using backend.models.Enums;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtService _jwt;

        public UsersController(AppDbContext db, JwtService jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll([FromQuery] string? role, [FromQuery] string? email)
        {
            var query = _db.Users.AsQueryable();
            if (!string.IsNullOrEmpty(role))
                query = query.Where(u => u.Role.ToString().ToLower() == role.ToLower());
            if (!string.IsNullOrEmpty(email))
                query = query.Where(u => u.Email.Contains(email));

            var users = await query.OrderBy(u => u.Name).ToListAsync();
            return Ok(users.Select(MapUser));
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = GetUserId();
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            return Ok(MapUser(user));
        }

        [HttpPatch("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateUserRequest request)
        {
            var userId = GetUserId();
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            if (!string.IsNullOrEmpty(request.Name)) user.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email.ToLower();
            if (!string.IsNullOrEmpty(request.Department)) user.Department = request.Department;
            if (!string.IsNullOrEmpty(request.StudentId)) user.StudentId = request.StudentId;
            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapUser(user));
        }

        [HttpPost("me/avatar")]
        public async Task<IActionResult> UploadMyAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Success = false, Message = "No file provided" });

            var userId = GetUserId();
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(uploadsDir);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{userId}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            user.AvatarUrl = $"/uploads/avatars/{fileName}";
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(MapUser(user));
        }

        [HttpPatch("me/password")]
        public async Task<IActionResult> UpdateMyPassword([FromBody] UpdatePasswordRequest request)
        {
            var userId = GetUserId();
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                return BadRequest(new { Success = false, Message = "Current password is incorrect" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordVersion++;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _jwt.RevokeAllUserRefreshTokensAsync(userId);

            return Ok(new { Success = true, Message = "Password updated" });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetById(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid user ID" });

            var user = await _db.Users.FindAsync(guid);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            return Ok(MapUser(user));
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
                return BadRequest(new { Success = false, Message = "Email already exists" });

            var role = request.Role?.ToLower() switch
            {
                "coordinator" => UserRole.Coordinator,
                "admin" => UserRole.Admin,
                _ => UserRole.Student
            };

            var user = new User
            {
                Name = request.Name,
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = role,
                Department = request.Department
            };

            if (role == UserRole.Admin)
            {
                user.AdminProfile = new AdminProfile();
            }
            else if (role == UserRole.Coordinator)
            {
                user.CoordinatorProfile = new CoordinatorProfile
                {
                    Department = request.Department
                };
            }

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(MapUser(user));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid user ID" });

            var user = await _db.Users.FindAsync(guid);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            if (!string.IsNullOrEmpty(request.Name)) user.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email.ToLower();
            if (!string.IsNullOrEmpty(request.Department)) user.Department = request.Department;
            if (!string.IsNullOrEmpty(request.StudentId)) user.StudentId = request.StudentId;
            if (!string.IsNullOrEmpty(request.Role))
                user.Role = request.Role.ToLower() switch
                {
                    "coordinator" => UserRole.Coordinator,
                    "admin" => UserRole.Admin,
                    _ => UserRole.Student
                };
            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapUser(user));
        }

        [HttpPatch("{id}/password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdatePassword(string id, [FromBody] UpdatePasswordRequest request)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid user ID" });

            var user = await _db.Users.FindAsync(guid);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordVersion++;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _jwt.RevokeAllUserRefreshTokensAsync(guid);

            return Ok(new { Success = true, Message = "Password updated" });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ToggleStatus(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid user ID" });

            var user = await _db.Users.FindAsync(guid);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            user.Status = user.Status == "inactive" ? "active" : "inactive";
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(MapUser(user));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { Success = false, Message = "Invalid user ID" });

            var user = await _db.Users.FindAsync(guid);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return Ok(new { Success = true });
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        }

        private static object MapUser(User user)
        {
            return new
            {
                id = user.Id.ToString(),
                name = user.Name,
                email = user.Email,
                role = user.Role.ToString().ToLower(),
                studentId = user.StudentId,
                avatar = user.AvatarUrl,
                department = user.Department,
                joinedAt = user.CreatedAt.ToString("o"),
                status = user.Status ?? "active"
            };
        }
    }
}
