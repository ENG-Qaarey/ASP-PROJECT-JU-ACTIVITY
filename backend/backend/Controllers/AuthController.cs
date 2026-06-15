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

            var token = _jwt.GenerateToken(user);
            return Ok(new AuthResponse
            {
                Success = true,
                User = MapUser(user),
                Token = token
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
                return BadRequest(new { Success = false, Message = "Email already registered" });

            var code = new Random().Next(100000, 999999).ToString();

            var user = new User
            {
                Name = request.Name,
                Email = request.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = UserRole.Student,
                StudentId = request.StudentId,
                Department = request.Department,
                EmailVerificationCodeHash = BCrypt.Net.BCrypt.HashPassword(code),
                EmailVerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            _ = _email.SendVerificationCodeAsync(user.Email, code);

            return Ok(new AuthResponse
            {
                Success = true,
                User = MapUser(user),
                Token = _jwt.GenerateToken(user),
                Email = user.Email
            });
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

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null)
                return NotFound(new { Success = false, Message = "User not found" });

            if (user.EmailVerified)
                return BadRequest(new { Success = false, Message = "Email already verified" });

            if (user.EmailVerificationCodeHash == null || !BCrypt.Net.BCrypt.Verify(request.Code, user.EmailVerificationCodeHash))
                return BadRequest(new { Success = false, Message = "Invalid verification code" });

            if (user.EmailVerificationCodeExpiresAt < DateTime.UtcNow)
                return BadRequest(new { Success = false, Message = "Verification code expired. Request a new one." });

            user.EmailVerified = true;
            user.EmailVerificationCodeHash = null;
            user.EmailVerificationCodeExpiresAt = null;
            await _db.SaveChangesAsync();

            var token = _jwt.GenerateToken(user);
            return Ok(new AuthResponse { Success = true, User = MapUser(user), Token = token });
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null)
                return Ok(new { Success = true, Message = "If the email exists, a verification code has been sent" });

            if (user.EmailVerified)
                return BadRequest(new { Success = false, Message = "Email already verified" });

            var code = new Random().Next(100000, 999999).ToString();
            user.EmailVerificationCodeHash = BCrypt.Net.BCrypt.HashPassword(code);
            user.EmailVerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(10);
            await _db.SaveChangesAsync();

            _ = _email.SendVerificationCodeAsync(user.Email, code);

            return Ok(new { Success = true, Message = "Verification code sent" });
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

            if (!string.IsNullOrEmpty(request.Code) && user.ResetPasswordCodeHash != null)
            {
                if (!BCrypt.Net.BCrypt.Verify(request.Code, user.ResetPasswordCodeHash))
                    return BadRequest(new { Success = false, Message = "Invalid reset code" });

                if (user.ResetPasswordCodeExpiresAt < DateTime.UtcNow)
                    return BadRequest(new { Success = false, Message = "Reset code expired" });

                user.ResetPasswordCodeHash = null;
                user.ResetPasswordCodeExpiresAt = null;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordVersion++;
            await _db.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Password reset successfully" });
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
