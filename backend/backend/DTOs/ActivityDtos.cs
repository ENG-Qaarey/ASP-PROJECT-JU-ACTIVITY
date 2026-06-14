namespace backend.DTOs
{
    public class CreateActivityRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        public string? Location { get; set; }
        public int Capacity { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? ImageUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? Radius { get; set; }
    }

    public class UpdateActivityRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
        public string? Time { get; set; }
        public string? Location { get; set; }
        public int? Capacity { get; set; }
        public string? Category { get; set; }
        public string? Status { get; set; }
        public string? ImageUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? Radius { get; set; }
    }
}
