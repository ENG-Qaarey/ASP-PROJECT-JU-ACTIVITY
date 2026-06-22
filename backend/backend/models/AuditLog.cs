using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(100)]
        public string Action { get; set; } = string.Empty;

        public Guid? ActorId { get; set; }

        [ForeignKey(nameof(ActorId))]
        public User? Actor { get; set; }

        [MaxLength(255)]
        public string? ActorName { get; set; }

        [MaxLength(255)]
        public string? ActorEmail { get; set; }

        [MaxLength(50)]
        public string? ActorRole { get; set; }

        public Guid? TargetId { get; set; }

        [MaxLength(50)]
        public string? Entity { get; set; }

        [MaxLength(100)]
        public string? EntityId { get; set; }

        [MaxLength(1000)]
        public string? Message { get; set; }

        public string? BeforeData { get; set; }
        public string? AfterData { get; set; }

        [MaxLength(500)]
        public string? IpAddress { get; set; }

        [MaxLength(500)]
        public string? UserAgent { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; } = "success";

        [MaxLength(1000)]
        public string? ErrorDetails { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
