using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Enums;

namespace backend.Models
{
    public class Activity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(10000)]
        public string? Description { get; set; }

        public DateOnly Date { get; set; }

        [MaxLength(20)]
        public string Time { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Location { get; set; }

        public int Capacity { get; set; }

        public int Enrolled { get; set; } = 0;

        public Guid CoordinatorId { get; set; }

        [ForeignKey(nameof(CoordinatorId))]
        public User? Coordinator { get; set; }

        [MaxLength(100)]
        public string? CoordinatorName { get; set; }

        [Required]
        public ActivityStatus Status { get; set; } = ActivityStatus.Upcoming;

        [MaxLength(100)]
        public string? Category { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        [MaxLength(500)]
        public string? QrCodeSecret { get; set; }

        public double? Radius { get; set; } = 100;

        public bool IsDraft { get; set; } = true;

        [MaxLength(2000)]
        public string? RecurrencePattern { get; set; }

        public Guid? ParentActivityId { get; set; }

        [ForeignKey(nameof(ParentActivityId))]
        public Activity? ParentActivity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
        public ICollection<ActivityRequirement> Requirements { get; set; } = new List<ActivityRequirement>();
        public ICollection<ActivityQuestion> Questions { get; set; } = new List<ActivityQuestion>();
        public ICollection<Activity> ChildActivities { get; set; } = new List<Activity>();
    }
}
