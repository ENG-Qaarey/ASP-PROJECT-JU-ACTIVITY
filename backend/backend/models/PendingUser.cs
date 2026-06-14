using System.ComponentModel.DataAnnotations;

namespace backend.models
{
    public class PendingUser
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Role { get; set; } = "student";

        [MaxLength(50)]
        public string? StudentId { get; set; }

        [MaxLength(100)]
        public string? Department { get; set; }

        [MaxLength(500)]
        public string? AvatarUrl { get; set; }

        [MaxLength(500)]
        public string VerificationCodeHash { get; set; } = string.Empty;

        public DateTime VerificationCodeExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
