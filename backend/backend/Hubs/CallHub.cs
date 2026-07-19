using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs
{
    /// <summary>
    /// Track a connected user's metadata for call routing.
    /// </summary>
    public class CallUserInfo
    {
        public string UserId { get; init; } = "";
        public string Name { get; init; } = "";
        public string? Avatar { get; init; }
        public string Role { get; init; } = "";
    }

    /// <summary>
    /// Dedicated SignalR Hub for WebRTC call signaling.
    /// Routes messages to specific users via connection-ID lookup.
    /// </summary>
    [Authorize]
    public class CallHub : Hub
    {
        private readonly ILogger<CallHub> _logger;

        /// <summary>
        /// userId → set of connectionIds (supports multiple tabs).
        /// </summary>
        private static readonly ConcurrentDictionary<string, HashSet<string>> UserConnections = new();

        /// <summary>
        /// connectionId → user metadata (for display in call UI).
        /// </summary>
        private static readonly ConcurrentDictionary<string, CallUserInfo> ConnectionUserMap = new();

        /// <summary>
        /// activityId → set of userIds currently in a call.
        /// </summary>
        private static readonly ConcurrentDictionary<string, HashSet<string>> ActiveCalls = new();

        public CallHub(ILogger<CallHub> logger)
        {
            _logger = logger;
        }

        // ─────────────────────────────── Connection lifecycle ───────────────────────────────

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            var name = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown";
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
            var avatar = Context.User?.FindFirst("avatar")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                Context.Abort();
                return;
            }

            // Track in the connection → user reverse map
            ConnectionUserMap[Context.ConnectionId] = new CallUserInfo
            {
                UserId = userId,
                Name = name,
                Avatar = avatar,
                Role = role
            };

            // Track in the user → connections forward map
            UserConnections.AddOrUpdate(userId,
                _ => new HashSet<string> { Context.ConnectionId },
                (_, set) =>
                {
                    lock (set) { set.Add(Context.ConnectionId); }
                    return set;
                });

            // Join a personal notification group (for direct messages)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

            // Notify other users that this user is now online
            await Clients.Others.SendAsync("UserConnected", new
            {
                userId,
                name,
                avatar,
                role
            });

            _logger.LogInformation("CallHub connected: user={UserId}, connection={ConnectionId}", userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;

            if (userId != null)
            {
                // Remove from connection → user map
                ConnectionUserMap.TryRemove(Context.ConnectionId, out _);

                // Remove from user → connections map
                bool wentOffline = false;
                if (UserConnections.TryGetValue(userId, out var connections))
                {
                    lock (connections)
                    {
                        connections.Remove(Context.ConnectionId);
                        if (connections.Count == 0)
                        {
                            UserConnections.TryRemove(userId, out _);
                            wentOffline = true;
                        }
                    }
                }

                // Only notify that user went fully offline (no tabs left)
                if (wentOffline)
                {
                    await Clients.Others.SendAsync("UserDisconnected", new { userId });
                }

                // Clean up any active call memberships for this connection
                foreach (var kvp in ActiveCalls)
                {
                    lock (kvp.Value)
                    {
                        if (kvp.Value.Remove(userId) && kvp.Value.Count == 0)
                        {
                            ActiveCalls.TryRemove(kvp.Key, out _);
                        }
                    }
                }

                _logger.LogInformation("CallHub disconnected: userId={UserId}, connection={ConnectionId}", userId, Context.ConnectionId);
            }

            if (exception != null)
            {
                _logger.LogWarning(exception, "CallHub disconnection with error: userId={UserId}", userId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ─────────────────────────────── Call lifecycle ───────────────────────────────

        /// <summary>
        /// User A wants to call User B. The server looks up B's connection
        /// and delivers an IncomingCall event with A's info.
        /// </summary>
        public async Task CallUser(string targetUserId, string activityId, bool isVideo)
        {
            var callerId = Context.UserIdentifier;
            if (callerId == null) return;

            ConnectionUserMap.TryGetValue(Context.ConnectionId, out var callerInfo);

            // Find all active connections for the target user
            if (!UserConnections.TryGetValue(targetUserId, out var targetConnections))
            {
                // Target user is not online
                await Clients.Caller.SendAsync("CallUserOffline", new { targetUserId });
                return;
            }

            // Notify the target user on ALL their connections
            List<string> connections;
            lock (targetConnections)
            {
                connections = targetConnections.ToList();
            }

            foreach (var connId in connections)
            {
                await Clients.Client(connId).SendAsync("IncomingCall", new
                {
                    fromUserId = callerId,
                    callerName = callerInfo?.Name ?? "Unknown",
                    callerAvatar = callerInfo?.Avatar,
                    isVideo,
                    activityId
                });
            }

            _logger.LogInformation("CallUser: caller={CallerId} → target={TargetUserId}, activity={ActivityId}, video={IsVideo}",
                callerId, targetUserId, activityId, isVideo);
        }

        /// <summary>
        /// Callee accepts the call — notifies the caller.
        /// </summary>
        public async Task AcceptCall(string targetUserId, string activityId)
        {
            var accepterId = Context.UserIdentifier;
            if (accepterId == null) return;

            ConnectionUserMap.TryGetValue(Context.ConnectionId, out var accepterInfo);

            // Notify the caller
            await NotifyUser(targetUserId, "CallAccepted", new
            {
                userId = accepterId,
                name = accepterInfo?.Name ?? "Unknown",
                avatar = accepterInfo?.Avatar,
                activityId
            });

            // Track active call participants
            ActiveCalls.AddOrUpdate(activityId,
                _ => new HashSet<string> { accepterId },
                (_, set) =>
                {
                    lock (set) { set.Add(accepterId); }
                    return set;
                });

            _logger.LogInformation("AcceptCall: {AccepterId} accepted call from {TargetUserId} for activity {ActivityId}",
                accepterId, targetUserId, activityId);
        }

        /// <summary>
        /// Callee rejects the call — notifies the caller.
        /// </summary>
        public async Task RejectCall(string targetUserId, string activityId)
        {
            var rejecterId = Context.UserIdentifier;
            if (rejecterId == null) return;

            await NotifyUser(targetUserId, "CallRejected", new
            {
                userId = rejecterId,
                activityId
            });

            _logger.LogInformation("RejectCall: {RejecterId} rejected call from {TargetUserId}", rejecterId, targetUserId);
        }

        /// <summary>
        /// Relay SDP offer from caller to callee.
        /// </summary>
        public async Task SendOffer(string targetUserId, string sdp, string activityId)
        {
            var senderId = Context.UserIdentifier;
            if (senderId == null) return;

            await NotifyUser(targetUserId, "OfferReceived", new
            {
                fromUserId = senderId,
                sdp,
                activityId
            });
        }

        /// <summary>
        /// Relay SDP answer from callee to caller.
        /// </summary>
        public async Task SendAnswer(string targetUserId, string sdp, string activityId)
        {
            var senderId = Context.UserIdentifier;
            if (senderId == null) return;

            await NotifyUser(targetUserId, "AnswerReceived", new
            {
                fromUserId = senderId,
                sdp,
                activityId
            });
        }

        /// <summary>
        /// Relay ICE candidate between peers.
        /// </summary>
        public async Task SendIceCandidate(string targetUserId, string candidate, string activityId)
        {
            var senderId = Context.UserIdentifier;
            if (senderId == null) return;

            await NotifyUser(targetUserId, "IceCandidateReceived", new
            {
                fromUserId = senderId,
                candidate,
                activityId
            });
        }

        /// <summary>
        /// End the call — notify all participants in the activity.
        /// </summary>
        public async Task EndCall(string activityId)
        {
            var userId = Context.UserIdentifier;
            if (userId == null) return;

            // Gather all participants in this call
            var participants = new List<string>();
            if (ActiveCalls.TryGetValue(activityId, out var callParticipants))
            {
                lock (callParticipants)
                {
                    participants = callParticipants.ToList();
                    ActiveCalls.TryRemove(activityId, out _);
                }
            }

            // Notify all participants (including ourselves, for tab sync)
            foreach (var pid in participants)
            {
                await NotifyUser(pid, "CallEnded", new { activityId, endedBy = userId });
            }

            _logger.LogInformation("EndCall: {UserId} ended call for activity {ActivityId}", userId, activityId);
        }

        // ─────────────────────────────── Helpers ───────────────────────────────

        /// <summary>
        /// Send a message to all active connections of a specific user.
        /// </summary>
        private async Task NotifyUser(string userId, string method, object arg)
        {
            if (!UserConnections.TryGetValue(userId, out var connections)) return;

            List<string> targets;
            lock (connections)
            {
                targets = connections.ToList();
            }

            foreach (var connId in targets)
            {
                try
                {
                    await Clients.Client(connId).SendAsync(method, arg);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send {Method} to connection {ConnId}", method, connId);
                }
            }
        }
    }
}
