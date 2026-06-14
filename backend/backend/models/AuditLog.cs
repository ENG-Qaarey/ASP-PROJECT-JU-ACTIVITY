using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.models
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

        public Guid? TargetId { get; set; }

        [MaxLength(50)]
        public string? Entity { get; set; }

        [MaxLength(100)]
        public string? EntityId { get; set; }

        [MaxLength(1000)]
        public string? Message { get; set; }

        public string? Metadata { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
