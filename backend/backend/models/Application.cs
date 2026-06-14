using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.models.Enums;

namespace backend.models
{
    public class Application
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid StudentId { get; set; }

        [ForeignKey(nameof(StudentId))]
        public User? Student { get; set; }

        [MaxLength(100)]
        public string? StudentName { get; set; }

        public Guid ActivityId { get; set; }

        [ForeignKey(nameof(ActivityId))]
        public Activity? Activity { get; set; }

        [MaxLength(200)]
        public string? ActivityTitle { get; set; }

        public DateOnly AppliedAt { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        [Required]
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public bool IsAdmin { get; set; } = false;
    }
}
