using System.Collections.Concurrent;

namespace backend.Services
{
    public class ReadStatusTracker
    {
        private readonly ConcurrentDictionary<(Guid UserId, Guid ActivityId), DateTime> _readStatuses = new();

        public void MarkAsRead(Guid userId, Guid activityId)
        {
            _readStatuses[(userId, activityId)] = DateTime.UtcNow;
        }

        public DateTime? GetLastRead(Guid userId, Guid activityId)
        {
            return _readStatuses.TryGetValue((userId, activityId), out var lastRead) ? lastRead : null;
        }

        public Dictionary<Guid, DateTime> GetAllForUser(Guid userId)
        {
            return _readStatuses
                .Where(kv => kv.Key.UserId == userId)
                .ToDictionary(kv => kv.Key.ActivityId, kv => kv.Value);
        }
    }
}
