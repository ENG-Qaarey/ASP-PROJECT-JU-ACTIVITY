using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CreateNotificationRequest
    {
        [Required(ErrorMessage = "Recipient ID is required")]
        public string RecipientId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message is required")]
        [StringLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
        public string Message { get; set; } = string.Empty;

        public string? Type { get; set; }
        public string? SenderRole { get; set; }
    }
}
