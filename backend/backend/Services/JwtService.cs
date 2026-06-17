using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.models;

namespace backend.Services
{
    public class JwtService
    {
        private readonly IConfiguration _config;
        private readonly AppDbContext _db;

        public JwtService(IConfiguration config, AppDbContext db)
        {
            _config = config;
            _db = db;
        }

        public string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role.ToString().ToLower()),
                new Claim("passwordVersion", user.PasswordVersion.ToString())
            };

            var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "15");

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        public async Task<RefreshToken?> ValidateRefreshTokenAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null || !refreshToken.IsActive)
                return null;

            return refreshToken;
        }

        public async Task RevokeRefreshTokenAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
            if (refreshToken != null)
            {
                refreshToken.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public string GetConfig(string key)
        {
            return _config[key] ?? string.Empty;
        }

        public async Task RevokeAllUserRefreshTokensAsync(Guid userId)
        {
            var activeTokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }
    }
}
