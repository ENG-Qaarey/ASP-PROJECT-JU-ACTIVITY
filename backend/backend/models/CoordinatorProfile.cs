using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class CoordinatorProfile
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [MaxLength(100)]
        public string? Department { get; set; }

        [MaxLength(100)]
        public string? Specialization { get; set; }

        public int MaxActivities { get; set; } = 10;

        [MaxLength(50)]
        public string ApprovalLevel { get; set; } = "standard";
    }
}
