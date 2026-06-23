using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CreateActivityRequest
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [StringLength(10000, ErrorMessage = "Description cannot exceed 10000 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Time is required")]
        [StringLength(20, ErrorMessage = "Time cannot exceed 20 characters")]
        public string Time { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
        public string? Location { get; set; }

        [Required(ErrorMessage = "Capacity is required")]
        [Range(1, 10000, ErrorMessage = "Capacity must be between 1 and 10000")]
        public int Capacity { get; set; }

        [Required(ErrorMessage = "Category is required")]
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; } = string.Empty;

        public string? Status { get; set; }
        public string? ImageUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? Radius { get; set; }
        public Guid? CoordinatorId { get; set; }
    }

    public class UpdateActivityRequest
    {
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string? Title { get; set; }

        [StringLength(10000, ErrorMessage = "Description cannot exceed 10000 characters")]
        public string? Description { get; set; }

        public DateTime? Date { get; set; }

        [StringLength(20, ErrorMessage = "Time cannot exceed 20 characters")]
        public string? Time { get; set; }

        [StringLength(500, ErrorMessage = "Location cannot exceed 500 characters")]
        public string? Location { get; set; }

        [Range(1, 10000, ErrorMessage = "Capacity must be between 1 and 10000")]
        public int? Capacity { get; set; }

        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string? Category { get; set; }

        public string? Status { get; set; }
        public string? ImageUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? Radius { get; set; }
    }
}
