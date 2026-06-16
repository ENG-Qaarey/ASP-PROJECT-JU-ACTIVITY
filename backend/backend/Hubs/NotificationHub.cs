using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
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
    }
}
