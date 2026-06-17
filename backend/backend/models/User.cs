using System.ComponentModel.DataAnnotations;
using backend.models.Enums;

namespace backend.models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public int PasswordVersion { get; set; } = 0;

        [Required]
        public UserRole Role { get; set; } = UserRole.Student;

        [MaxLength(50)]
        public string? StudentId { get; set; }

        [MaxLength(100)]
        public string? Department { get; set; }

        [MaxLength(500)]
        public string? AvatarUrl { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; } = "active";

        [MaxLength(500)]
        public string? ResetPasswordCodeHash { get; set; }

        public DateTime? ResetPasswordCodeExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public AdminProfile? AdminProfile { get; set; }
        public CoordinatorProfile? CoordinatorProfile { get; set; }
        public ICollection<Activity> CoordinatedActivities { get; set; } = new List<Activity>();
        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<Attendance> AttendanceRecords { get; set; } = new List<Attendance>();
        public ICollection<Attendance> MarkedAttendances { get; set; } = new List<Attendance>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public ICollection<AuditLog> AuditLogsAsActor { get; set; } = new List<AuditLog>();
    }
}
