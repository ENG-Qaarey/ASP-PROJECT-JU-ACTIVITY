using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.models
{
    public class ActivityReadStatus
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public Guid ActivityId { get; set; }

        [ForeignKey(nameof(ActivityId))]
        public Activity? Activity { get; set; }

        public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
    }
}
