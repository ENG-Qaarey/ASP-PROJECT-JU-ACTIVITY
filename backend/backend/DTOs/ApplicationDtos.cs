namespace backend.DTOs
{
    public class CreateApplicationRequest
    {
        public string ActivityId { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class UpdateApplicationStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}
