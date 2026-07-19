import { useRef, useState, useCallback, useEffect } from "react";
import { SignalRCallService } from "@/services/signalRService";
import { WebRTCService } from "@/services/webRtcService";
import type {
  IncomingCallData,
  CallAcceptedData,
  OfferData,
  AnswerData,
  IceCandidateData,
} from "@/services/signalRService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus = "idle" | "ringing" | "connecting" | "connected" | "ended";

export interface CallUser {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface UseCallReturn {
  status: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteUser: CallUser | null;
  incomingCall: IncomingCallData | null;
  callError: string | null;

  /** Initiate a call to another user */
  startCall: (targetUserId: string, activityId: string, video: boolean) => Promise<void>;

  /** Answer an incoming call */
  answerCall: (activityId: string) => Promise<void>;

  /** Reject an incoming call */
  rejectCall: (activityId: string) => Promise<void>;

  /** End the active call */
  endCall: (activityId: string) => void;

  /** Toggle microphone mute */
  toggleMute: () => void;

  /** Toggle camera on/off */
  toggleVideo: () => void;

  /** Dismiss incoming call notification without rejecting */
  dismissIncoming: () => void;

  /** Reset call state back to idle */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Complete call management hook.
 *
 * Integrates SignalR (signaling) with WebRTC (media) to provide
 * a full voice/video calling workflow:
 *
 * 1. Connect to CallHub via SignalR
 * 2. Send/receive call offers, answers, and ICE candidates
 * 3. Create and manage RTCPeerConnection
 * 4. Expose call controls (mute, video, end)
 * 5. Proper cleanup on unmount
 */
export function useCall(): UseCallReturn {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUser, setRemoteUser] = useState<CallUser | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const signalR = useRef<SignalRCallService>(new SignalRCallService());
  const webRTC = useRef<WebRTCService>(new WebRTCService());
  const currentCallActivityRef = useRef<string | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const isVideoCallRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule a reset to idle after a brief delay so the user sees
  // the "ended" state (and any error message) before the UI re-enables.
  const scheduleIdleReset = useCallback((message: string | null = null) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setCallError(message);
    idleTimerRef.current = setTimeout(() => {
      setStatus("idle");
      setCallError(null);
    }, 2000);
  }, []);

  // ─── Stream state sync ────────────────────────────────────────────────────

  const syncStreams = useCallback(() => {
    setLocalStream(webRTC.current.getLocalStream());
    setRemoteStream(webRTC.current.getRemoteStream());
    setIsMuted(webRTC.current.isMuted);
    setIsVideoOff(webRTC.current.isVideoOff);
  }, []);

  // ─── ICE candidate handler ────────────────────────────────────────────────

  const handleIceCandidate = useCallback(
    async (candidate: string) => {
      const targetId = remoteUserIdRef.current;
      const activityId = currentCallActivityRef.current;
      if (!targetId || !activityId) return;
      try {
        await signalR.current.sendIceCandidate(targetId, candidate, activityId);
      } catch (err) {
        console.error("Failed to send ICE candidate:", err);
      }
    },
    []
  );

  // ─── Connection state handler ─────────────────────────────────────────────

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState) => {
      if (state === "connected") {
        setStatus("connected");
      } else if (state === "disconnected" || state === "failed") {
        setStatus("ended");
        scheduleIdleReset("Call connection lost");
      }
    },
    [scheduleIdleReset]
  );

  // ─── WebRTC error handler ─────────────────────────────────────────────────

  const handleWebRTCError = useCallback((_error: Error) => {
    setStatus("ended");
    scheduleIdleReset("Call error occurred");
  }, [scheduleIdleReset]);

  // ─── Remote stream handler ────────────────────────────────────────────────

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    setRemoteStream(stream);
  }, []);

  // ─── Setup signaling event listeners ──────────────────────────────────────

  const setupSignalRListeners = useCallback(() => {
    const s = signalR.current;

    s.on("IncomingCall", (data: unknown) => {
      const d = data as IncomingCallData;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setIncomingCall(d);
      setRemoteUser({ userId: d.fromUserId, name: d.callerName, avatar: d.callerAvatar });
      isVideoCallRef.current = d.isVideo;
      currentCallActivityRef.current = d.activityId;
      remoteUserIdRef.current = d.fromUserId;
      setCallError(null);
      setStatus("ringing");
    });

    s.on("CallAccepted", async (data: unknown) => {
      const d = data as CallAcceptedData;
      setRemoteUser({ userId: d.userId, name: d.name, avatar: d.avatar });
      remoteUserIdRef.current = d.userId;
      setStatus("connecting");

      try {
        await webRTC.current.startLocalStream(isVideoCallRef.current);
        syncStreams();

        webRTC.current.createPeerConnection({
          onRemoteStream: handleRemoteStream,
          onIceCandidate: handleIceCandidate,
          onConnectionStateChange: handleConnectionStateChange,
          onError: handleWebRTCError,
        });

        const offer = await webRTC.current.createOffer();
        await signalR.current.sendOffer(d.userId, offer, currentCallActivityRef.current!);
      } catch (err) {
        console.error("Failed to create offer:", err);
        setStatus("ended");
        scheduleIdleReset("Failed to establish connection");
      }
    });

    s.on("CallRejected", () => {
      setStatus("ended");
      scheduleIdleReset("Call was declined");
    });

    s.on("OfferReceived", async (data: unknown) => {
      const d = data as OfferData;
      setStatus("connecting");

      try {
        await webRTC.current.startLocalStream(isVideoCallRef.current);
        syncStreams();

        webRTC.current.createPeerConnection({
          onRemoteStream: handleRemoteStream,
          onIceCandidate: handleIceCandidate,
          onConnectionStateChange: handleConnectionStateChange,
          onError: handleWebRTCError,
        });

        await webRTC.current.setRemoteDescription(d.sdp);
        const answer = await webRTC.current.createAnswer();
        await signalR.current.sendAnswer(d.fromUserId, answer, d.activityId);
      } catch (err) {
        console.error("Failed to handle offer:", err);
        setStatus("ended");
        scheduleIdleReset("Failed to accept call");
      }
    });

    s.on("AnswerReceived", async (data: unknown) => {
      const d = data as AnswerData;
      try {
        await webRTC.current.setRemoteDescription(d.sdp);
      } catch (err) {
        console.error("Failed to set remote description:", err);
      }
    });

    s.on("IceCandidateReceived", async (data: unknown) => {
      const d = data as IceCandidateData;
      await webRTC.current.addIceCandidate(d.candidate);
    });

    s.on("CallEnded", () => {
      setStatus("ended");
      scheduleIdleReset("Call ended");
    });

    s.on("CallUserOffline", () => {
      setStatus("ended");
      scheduleIdleReset("User is offline");
    });
  }, [
    syncStreams,
    handleIceCandidate,
    handleConnectionStateChange,
    handleWebRTCError,
    handleRemoteStream,
    scheduleIdleReset,
  ]);

  // ─── Connect SignalR and setup listeners on mount ─────────────────────────

  useEffect(() => {
    const s = signalR.current;

    s.connect().catch((err) => {
      console.error("Failed to connect to CallHub:", err);
      setCallError("Call service unavailable");
      scheduleIdleReset("Call service unavailable");
    });

    setupSignalRListeners();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      cleanupCall();
      s.disconnect();
    };
  }, [setupSignalRListeners, scheduleIdleReset]);

  // ─── Public API ────────────────────────────────────────────────────────────

  const startCall = useCallback(
    async (targetUserId: string, activityId: string, video: boolean) => {
      isVideoCallRef.current = video;
      currentCallActivityRef.current = activityId;
      remoteUserIdRef.current = targetUserId;
      setCallError(null);

      try {
        await webRTC.current.startLocalStream(video);
        syncStreams();
      } catch (err) {
        console.warn("Could not start local stream, proceeding anyway:", err);
      }

      setStatus("ringing");
      try {
        await signalR.current.callUser(targetUserId, activityId, video);
      } catch (err) {
        console.error("Failed to initiate call:", err);
        setStatus("ended");
        scheduleIdleReset("Could not reach call service");
      }
    },
    [syncStreams, scheduleIdleReset]
  );

  const answerCall = useCallback(
    async (activityId: string) => {
      if (!incomingCall) return;
      const d = incomingCall;

      currentCallActivityRef.current = activityId;
      remoteUserIdRef.current = d.fromUserId;
      isVideoCallRef.current = d.isVideo;
      setIncomingCall(null);

      try {
        await webRTC.current.startLocalStream(d.isVideo);
        syncStreams();
      } catch (err) {
        console.error("Failed to start local stream:", err);
        setStatus("ended");
        return;
      }

      setStatus("connecting");

      webRTC.current.createPeerConnection({
        onRemoteStream: handleRemoteStream,
        onIceCandidate: handleIceCandidate,
        onConnectionStateChange: handleConnectionStateChange,
        onError: handleWebRTCError,
      });

      try {
        await signalR.current.acceptCall(d.fromUserId, activityId);
      } catch (err) {
        console.error("Failed to accept call:", err);
        setStatus("ended");
        scheduleIdleReset("Failed to accept call");
      }
    },
    [incomingCall, syncStreams, handleIceCandidate, handleConnectionStateChange, handleWebRTCError, handleRemoteStream, scheduleIdleReset]
  );

  const rejectCall = useCallback(
    async (activityId: string) => {
      if (!incomingCall) return;
      try {
        await signalR.current.rejectCall(incomingCall.fromUserId, activityId);
      } catch {
        // Best-effort
      }
      setIncomingCall(null);
      setStatus("idle");
      setCallError(null);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      cleanupCall();
    },
    [incomingCall]
  );

  const endCall = useCallback(
    (activityId: string) => {
      signalR.current.endCall(activityId).catch(() => {});
      setStatus("ended");
      scheduleIdleReset("Call ended");
    },
    [scheduleIdleReset]
  );

  const toggleMute = useCallback(() => {
    webRTC.current.toggleMute();
    setIsMuted(webRTC.current.isMuted);
  }, []);

  const toggleVideo = useCallback(() => {
    webRTC.current.toggleVideo();
    setIsVideoOff(webRTC.current.isVideoOff);
  }, []);

  const dismissIncoming = useCallback(() => {
    setIncomingCall(null);
    if (status === "ringing") setStatus("idle");
  }, [status]);

  const reset = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setStatus("idle");
    setRemoteUser(null);
    setIncomingCall(null);
    setCallError(null);
    cleanupCall();
  }, []);

  // ─── Cleanup helper ───────────────────────────────────────────────────────

  const cleanupCall = useCallback(() => {
    webRTC.current.cleanup();
    currentCallActivityRef.current = null;
    remoteUserIdRef.current = null;
    syncStreams();
  }, [syncStreams]);

  // Cleanup idle timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return {
    status,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    remoteUser,
    incomingCall,
    callError,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    dismissIncoming,
    reset,
  };
}
