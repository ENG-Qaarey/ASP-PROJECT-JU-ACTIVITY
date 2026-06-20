using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Models;
using backend.Models.Enums;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtService _jwt;
        private readonly EmailService _email;

        public AuthController(AppDbContext db, JwtService jwt, EmailService email)
        {
            _db = db;
            _jwt = jwt;
            _email = email;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { Success = false, Message = "Invalid email or password" });

            if (user.Status == "inactive")
                return Unauthorized(new { Success = false, Message = "Account is deactivated" });

            return await GenerateAuthResponse(user);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var email = request.Email.ToLower().Trim();

            if (await _db.Users.AnyAsync(u => u.Email == email))
                return BadRequest(new { Success = false, Message = "Email already registered" });

            if (!string.IsNullOrWhiteSpace(request.StudentId) &&
                await _db.Users.AnyAsync(u => u.StudentId == request.StudentId))
                return BadRequest(new { Success = false, Message = "Student ID already registered" });

            var user = new User
            {
                Name = request.Name.Trim(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = UserRole.Student,
                StudentId = request.StudentId?.Trim(),
                Department = request.Department?.Trim()
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return await GenerateAuthResponse(user);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            return Ok(new { Success = true, User = MapUser(user) });
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInRequest request)
        {
            return Ok(new { Success = false, Message = "Google sign-in not configured yet" });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null)
                return Ok(new { Success = true, Message = "If the email exists, a reset link has been sent" });

            var code = new Random().Next(100000, 999999).ToString();
            user.ResetPasswordCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
            user.ResetPasswordCodeExpiresAt = DateTime.UtcNow.AddHours(1);
            await _db.SaveChangesAsync();

            var resetLink = $"http://localhost:5173/reset-password?email={Uri.EscapeDataString(user.Email)}&code={code}";
            _ = _email.SendPasswordResetAsync(user.Email, resetLink);

            return Ok(new { Success = true, Message = "If the email exists, a reset link has been sent" });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordVersion++;
            await _db.SaveChangesAsync();

            await _jwt.RevokeAllUserRefreshTokensAsync(user.Id);

            return Ok(new { Success = true, Message = "Password reset successfully" });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            var refreshToken = await _jwt.ValidateRefreshTokenAsync(request.RefreshToken);
            if (refreshToken == null)
                return Unauthorized(new { Success = false, Message = "Invalid or expired refresh token" });

            var user = refreshToken.User;

            if (user.Status == "inactive")
                return Unauthorized(new { Success = false, Message = "Account is deactivated" });

            refreshToken.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return await GenerateAuthResponse(user);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            await _jwt.RevokeRefreshTokenAsync(request.RefreshToken);
            return Ok(new { Success = true, Message = "Logged out successfully" });
        }

        [Authorize]
        [HttpPost("logout-all")]
        public async Task<IActionResult> LogoutAll()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _jwt.RevokeAllUserRefreshTokensAsync(userId);
            return Ok(new { Success = true, Message = "Logged out from all devices" });
        }

        private async Task<IActionResult> GenerateAuthResponse(User user)
        {
            var accessToken = _jwt.GenerateToken(user);
            var refreshTokenValue = _jwt.GenerateRefreshToken();

            var refreshTokenExpiryDays = int.Parse(_jwt.GetConfig("Jwt:RefreshTokenExpireDays") ?? "30");

            var refreshToken = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshTokenValue,
                ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenExpiryDays)
            };

            _db.RefreshTokens.Add(refreshToken);
            await _db.SaveChangesAsync();

            return Ok(new AuthResponse
            {
                Success = true,
                User = MapUser(user),
                Token = accessToken,
                RefreshToken = refreshTokenValue
            });
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
