using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.models.Enums;

namespace backend.models
{
    public class Attendance
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ActivityId { get; set; }

        [ForeignKey(nameof(ActivityId))]
        public Activity? Activity { get; set; }

        public Guid StudentId { get; set; }

        [ForeignKey(nameof(StudentId))]
        public User? Student { get; set; }

        [MaxLength(100)]
        public string? StudentName { get; set; }

        public Guid ApplicationId { get; set; }

        [ForeignKey(nameof(ApplicationId))]
        public Application? Application { get; set; }

        public Guid MarkedById { get; set; }

        [ForeignKey(nameof(MarkedById))]
        public User? MarkedBy { get; set; }

        [Required]
        public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;

        public DateOnly MarkedAt { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    }
}
