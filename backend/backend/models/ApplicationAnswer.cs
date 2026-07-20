using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ApplicationAnswer
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ApplicationId { get; set; }

        [ForeignKey(nameof(ApplicationId))]
        public Application? Application { get; set; }

        public Guid ActivityQuestionId { get; set; }

        [ForeignKey(nameof(ActivityQuestionId))]
        public ActivityQuestion? ActivityQuestion { get; set; }

        [MaxLength(2000)]
        public string? Answer { get; set; }
    }
}
