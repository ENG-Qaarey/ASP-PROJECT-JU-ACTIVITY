using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.models
{
    public class AdminProfile
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public string? Permissions { get; set; }

        [MaxLength(50)]
        public string AccessLevel { get; set; } = "full";

        public DateTime? LastLogin { get; set; }
    }
}
