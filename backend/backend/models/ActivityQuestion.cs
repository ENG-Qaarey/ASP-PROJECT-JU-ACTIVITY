using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Enums;

namespace backend.Models
{
    public class ActivityQuestion
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ActivityId { get; set; }

        [ForeignKey(nameof(ActivityId))]
        public Activity? Activity { get; set; }

        [Required, MaxLength(500)]
        public string QuestionText { get; set; } = string.Empty;

        [Required]
        public QuestionType QuestionType { get; set; }

        [MaxLength(2000)]
        public string? Options { get; set; }

        public bool IsRequired { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;
    }
}
