using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class MarkAttendanceRequest
    {
        [Required(ErrorMessage = "Activity ID is required")]
        public string ActivityId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Student ID is required")]
        public string StudentId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Application ID is required")]
        public string ApplicationId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = "Present";
    }

    public class BatchAttendanceRequest
    {
        [Required(ErrorMessage = "Activity ID is required")]
        public string ActivityId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Attendance data is required")]
        [MinLength(1, ErrorMessage = "At least one attendance record is required")]
        public List<BatchAttendanceItem> AttendanceData { get; set; } = new();

        [Required(ErrorMessage = "MarkedBy is required")]
        public string MarkedBy { get; set; } = string.Empty;
    }

    public class BatchAttendanceItem
    {
        [Required(ErrorMessage = "Student ID is required")]
        public string StudentId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Student name is required")]
        public string StudentName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Application ID is required")]
        public string ApplicationId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = string.Empty;
    }

    public class ScanQrRequest
    {
        [Required(ErrorMessage = "Activity ID is required")]
        public string ActivityId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Token is required")]
        public string Token { get; set; } = string.Empty;

        public LocationInfo? Location { get; set; }
    }

    public class LocationInfo
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }
}
