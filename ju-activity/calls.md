# Voice & Video Calls — Implementation Plan

## Architecture

**P2P WebRTC via SignalR signaling** using `simple-peer` library.
No media server — direct browser-to-browser with STUN for NAT traversal.

## Components

### Backend — `NotificationHub.cs`

| Method | Direction | Purpose |
|--------|-----------|---------|
| `JoinCall(activityId)` | Client→Hub | Join call signaling group `call-{activityId}` |
| `LeaveCall(activityId)` | Client→Hub | Leave call group |
| `Signal(activityId, type, data)` | Client→Hub | Relay signaling to group (offer/answer/ice/end-call) |
| `CallSignalReceived(type, data, fromUserId)` | Hub→Client | Receive signal from peer |
| `CallEnded(activityId)` | Hub→Client | Peer ended the call |

### Frontend — New Files

| File | Purpose |
|------|---------|
| `CallContext.tsx` | Manages call state, peer connections, streams |
| `IncomingCallDialog.tsx` | Modal to accept/decline incoming calls |
| `CallOverlay.tsx` | Full-screen active call UI (video PIP, controls) |

### Frontend — Modified Files

| File | Change |
|------|--------|
| `ChatRoomView.tsx` | Register SignalR call handlers, wire CallContext |
| `ChatHeader.tsx` | Wire Phone/Video buttons to start call |

### Constants

| File | Addition |
|------|---------|
| `media.ts` | `RTC_CONFIG` with Google STUN server |
| `types/chat.ts` | `CallStatus` type |

## Call Flow

1. **User A clicks Phone/Video** → `startCall(activityId, video)`
   - Creates `simple-peer` instance (initiator)
   - Joins `call-{activityId}` SignalR group
   - Sends `offer` via `Signal(activityId, "offer", ...)`

2. **User B receives `CallSignalReceived`** → shows `IncomingCallDialog`
   - User B accepts → creates peer, joins call group, sends `answer`
   - ICE candidates exchanged both ways

3. **Call active** → `CallOverlay` appears for both
   - Remote video (large) + local video (PIP)
   - Controls: mute, video toggle, end call, speaker

4. **Either party hangs up** → `endCall()` → sends `end-call` signal → both cleanup










I have an existing real-time chat application.

Tech Stack:
- Frontend: React
- Backend: ASP.NET Core Web API
- Real-time messaging: SignalR
- Authentication: JWT
- Database: postgres
- Current chat system is already working with SignalR.

I want to add a complete real-time Voice and Video Calling system using WebRTC.

Requirements:

1. Use SignalR ONLY for signaling.
2. Use WebRTC for audio and video streaming.
3. Do NOT use Socket.IO.
4. Use Google's STUN server for development.
5. Make the code clean, modular, scalable, and production-ready.
6. Explain every step with comments.

=================================================
BACKEND (ASP.NET CORE)
=================================================

Create a CallHub that includes:

- CallUser
- AcceptCall
- RejectCall
- SendOffer
- SendAnswer
- SendIceCandidate
- EndCall
- UserConnected
- UserDisconnected

Use SignalR Groups or UserId mapping so messages go only to the intended user.

Implement:

- JWT authentication
- Online user tracking
- ConnectionId management
- Error handling
- Logging
- Dependency Injection

=================================================
FRONTEND (REACT)
=================================================

Create:

services/
    signalRService.js
    webRtcService.js

components/
    IncomingCallModal.jsx
    CallWindow.jsx
    LocalVideo.jsx
    RemoteVideo.jsx
    CallControls.jsx

hooks/
    useCall.js

pages/
    ChatPage.jsx

=================================================
WEBRTC
=================================================

Implement:

- RTCPeerConnection
- getUserMedia()
- createOffer()
- createAnswer()
- setLocalDescription()
- setRemoteDescription()
- ICE Candidate exchange
- Remote stream
- Local stream

Configuration:

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

=================================================
CALL FLOW
=================================================

User A clicks Call

↓

SignalR sends IncomingCall

↓

User B receives popup

Accept
Reject

↓

If accepted

Create Offer

↓

Send SDP Offer

↓

Receive Offer

↓

Create Answer

↓

Send SDP Answer

↓

Exchange ICE Candidates

↓

Peer Connection Established

↓

Voice & Video Start

=================================================
CALL FEATURES
=================================================

Implement:

✓ Voice Call

✓ Video Call

✓ Mute Microphone

✓ Unmute

✓ Camera On

✓ Camera Off

✓ End Call

✓ Incoming Call Screen

✓ Outgoing Call Screen

✓ Reject Call

✓ Call Timer

✓ Call Status

Ringing

Connecting

Connected

Disconnected

Ended

=================================================
UI
=================================================

Modern UI

Responsive

Clean Design

Show:

Caller Avatar

Caller Name

Call Duration

Microphone Button

Camera Button

Speaker Button

End Call Button

Loading Animation

Incoming Call Animation

=================================================
CODE QUALITY
=================================================

Use:

- SOLID principles
- Separation of concerns
- Reusable services
- React hooks
- Proper cleanup of PeerConnection
- Proper cleanup of Media Streams
- Good folder structure
- Error handling
- Comments explaining every function

=================================================
OUTPUT
=================================================

Generate the project step by step.

Do not skip any files.

Generate complete source code for every file.

After each step, explain what the code does before moving to the next step.