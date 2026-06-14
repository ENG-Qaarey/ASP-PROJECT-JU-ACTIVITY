namespace backend.DTOs
{
    public class MarkAttendanceRequest
    {
        public string ActivityId { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string ApplicationId { get; set; } = string.Empty;
        public string Status { get; set; } = "Present";
    }

    public class BatchAttendanceRequest
    {
        public string ActivityId { get; set; } = string.Empty;
        public List<BatchAttendanceItem> AttendanceData { get; set; } = new();
        public string MarkedBy { get; set; } = string.Empty;
    }

    public class BatchAttendanceItem
    {
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string ApplicationId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class ScanQrRequest
    {
        public string ActivityId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public LocationInfo? Location { get; set; }
    }

    public class LocationInfo
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }
}
