using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CreateApplicationRequest
    {
        [Required(ErrorMessage = "Activity ID is required")]
        public string ActivityId { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }

    public class UpdateApplicationStatusRequest
    {
        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }
}
