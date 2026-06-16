namespace backend.DTOs
{
    public class SendMessageRequest
    {
        public string ActivityId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string? Metadata { get; set; }
        public string? ParentId { get; set; }
    }

    public class EditMessageRequest
    {
        public string Content { get; set; } = string.Empty;
    }

    public class ToggleReactionRequest
    {
        public string Emoji { get; set; } = string.Empty;
    }

    public class MarkReadRequest
    {
        public string ActivityId { get; set; } = string.Empty;
    }
}

public class ReactionEntry
{
    public string Emoji { get; set; } = string.Empty;
    public List<string> Users { get; set; } = new();
}
