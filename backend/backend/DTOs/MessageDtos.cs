using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class SendMessageRequest
    {
        [Required(ErrorMessage = "Activity ID is required")]
        public string ActivityId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Content is required")]
        [StringLength(5000, ErrorMessage = "Content cannot exceed 5000 characters")]
        public string Content { get; set; } = string.Empty;

        public string? Type { get; set; }
        public string? Metadata { get; set; }
        public string? ParentId { get; set; }
    }

    public class EditMessageRequest
    {
        [Required(ErrorMessage = "Content is required")]
        [StringLength(5000, ErrorMessage = "Content cannot exceed 5000 characters")]
        public string Content { get; set; } = string.Empty;
    }

    public class ToggleReactionRequest
    {
        [Required(ErrorMessage = "Emoji is required")]
        [StringLength(50, ErrorMessage = "Emoji cannot exceed 50 characters")]
        public string Emoji { get; set; } = string.Empty;
    }

    public class MarkReadRequest
    {
        [Required(ErrorMessage = "Activity ID is required")]
        public string ActivityId { get; set; } = string.Empty;
    }
}

public class ReactionEntry
{
    public string Emoji { get; set; } = string.Empty;
    public List<string> Users { get; set; } = new();
}
