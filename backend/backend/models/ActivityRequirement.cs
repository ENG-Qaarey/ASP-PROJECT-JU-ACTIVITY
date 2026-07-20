using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Enums;

namespace backend.Models
{
    public class ActivityRequirement
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ActivityId { get; set; }

        [ForeignKey(nameof(ActivityId))]
        public Activity? Activity { get; set; }

        [Required]
        public RequirementType Type { get; set; }

        [Required, MaxLength(200)]
        public string Label { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Value { get; set; }

        public bool IsRequired { get; set; } = true;
    }
}
