import { createContext, ReactNode, useContext } from "react";
import { useCall as useCallHook, CallStatus } from "@/hooks/useCall";
import type { CallUser, IncomingCallData } from "@/hooks/useCall";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallContextType {
  status: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteUser: CallUser | null;
  incomingCall: IncomingCallData | null;
  callError: string | null;

  /** Initiate a call to another user in an activity room */
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

const CallContext = createContext<CallContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Provides call state and controls to the entire component tree.
 * Uses the useCall hook internally which manages:
 * - SignalR connection to CallHub for signaling
 * - WebRTC peer connection for media
 * - Call lifecycle (ringing → connecting → connected → ended)
 * - Media state (mute, camera)
 */
export function CallProvider({ children }: { children: ReactNode }) {
  const call = useCallHook();

  return (
    <CallContext.Provider value={call}>
      {children}
    </CallContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access call state and controls from any child component.
 * Must be used within a CallProvider.
 */
export function useCall(): CallContextType {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
