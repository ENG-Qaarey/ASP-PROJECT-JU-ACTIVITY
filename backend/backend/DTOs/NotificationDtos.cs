namespace backend.DTOs
{
    public class CreateNotificationRequest
    {
        public string RecipientId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string? SenderRole { get; set; }
    }
}
