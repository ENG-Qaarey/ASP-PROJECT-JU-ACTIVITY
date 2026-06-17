using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using backend.Services;

namespace backend.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ReadStatusTracker _readStatus;

        public NotificationHub(ReadStatusTracker readStatus)
        {
            _readStatus = readStatus;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            }
            await base.OnConnectedAsync();
        }

        public async Task JoinActivity(string activityId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"activity-{activityId}");
        }

        public async Task LeaveActivity(string activityId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"activity-{activityId}");
        }

        public async Task UserTyping(string activityId)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Clients.OthersInGroup($"activity-{activityId}").SendAsync("UserTyping", new
                {
                    activityId,
                    userId
                });
            }
        }

        public async Task UserStoppedTyping(string activityId)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Clients.OthersInGroup($"activity-{activityId}").SendAsync("UserStoppedTyping", new
                {
                    activityId,
                    userId
                });
            }
        }

        public async Task MarkAsRead(string activityId)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var uid) && Guid.TryParse(activityId, out var aid))
            {
                _readStatus.MarkAsRead(uid, aid);
                await Clients.Group($"activity-{activityId}").SendAsync("ReadReceipt", new
                {
                    userId,
                    activityId
                });
            }
        }
    }
}
