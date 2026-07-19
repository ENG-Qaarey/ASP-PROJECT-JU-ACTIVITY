import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { API, STORAGE_KEYS } from "@/constants/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IncomingCallData {
  fromUserId: string;
  callerName: string;
  callerAvatar: string | null;
  isVideo: boolean;
  activityId: string;
}

export interface CallAcceptedData {
  userId: string;
  name: string;
  avatar: string | null;
  activityId: string;
}

export interface CallRejectedData {
  userId: string;
  activityId: string;
}

export interface OfferData {
  fromUserId: string;
  sdp: string;
  activityId: string;
}

export interface AnswerData {
  fromUserId: string;
  sdp: string;
  activityId: string;
}

export interface IceCandidateData {
  fromUserId: string;
  candidate: string;
  activityId: string;
}

export interface UserConnectedData {
  userId: string;
  name: string;
  avatar: string | null;
  role: string;
}

export interface UserDisconnectedData {
  userId: string;
}

export type SignalRCallEvent =
  | "IncomingCall"
  | "CallAccepted"
  | "CallRejected"
  | "OfferReceived"
  | "AnswerReceived"
  | "IceCandidateReceived"
  | "CallEnded"
  | "UserConnected"
  | "UserDisconnected"
  | "CallUserOffline";

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Manages the SignalR connection to the CallHub for WebRTC signaling.
 *
 * Responsibilities:
 * - Connect/disconnect to the call hub
 * - Send call signaling messages (offer, answer, ICE)
 * - Receive and dispatch incoming call events
 * - Handle connection lifecycle and reconnection
 */
export class SignalRCallService {
  private connection: HubConnection | null = null;
  private handlers = new Map<SignalRCallEvent, Set<(...args: unknown[]) => void>>();
  private _connectionId: string | null = null;

  get connectionId(): string | null {
    return this._connectionId;
  }

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  /**
   * Build and start the SignalR connection to the call hub.
   * The JWT token is passed via query string (required for WebSockets).
   */
  async connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) throw new Error("No auth token available");

    this.connection = new HubConnectionBuilder()
      .withUrl(API.CALL_HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delay = Math.min(
            1000 * Math.pow(2, retryContext.previousRetryCount),
            10000
          );
          return delay;
        },
      })
      .configureLogging(LogLevel.Warning)
      .build();

    // ── Register all event handlers ──

    this.connection.on("IncomingCall", (data: IncomingCallData) => {
      this.dispatch("IncomingCall", data);
    });

    this.connection.on("CallAccepted", (data: CallAcceptedData) => {
      this.dispatch("CallAccepted", data);
    });

    this.connection.on("CallRejected", (data: CallRejectedData) => {
      this.dispatch("CallRejected", data);
    });

    this.connection.on("OfferReceived", (data: OfferData) => {
      this.dispatch("OfferReceived", data);
    });

    this.connection.on("AnswerReceived", (data: AnswerData) => {
      this.dispatch("AnswerReceived", data);
    });

    this.connection.on("IceCandidateReceived", (data: IceCandidateData) => {
      this.dispatch("IceCandidateReceived", data);
    });

    this.connection.on("CallEnded", (data: { activityId: string; endedBy: string }) => {
      this.dispatch("CallEnded", data);
    });

    this.connection.on("UserConnected", (data: UserConnectedData) => {
      this.dispatch("UserConnected", data);
    });

    this.connection.on("UserDisconnected", (data: UserDisconnectedData) => {
      this.dispatch("UserDisconnected", data);
    });

    this.connection.on("CallUserOffline", (data: { targetUserId: string }) => {
      this.dispatch("CallUserOffline", data);
    });

    // ── Reconnection handlers ──

    this.connection.onreconnecting(() => {
      console.log("CallHub SignalR reconnecting...");
    });

    this.connection.onreconnected(async () => {
      this._connectionId = this.connection?.connectionId ?? null;
      console.log("CallHub SignalR reconnected");
    });

    this.connection.onclose(() => {
      this._connectionId = null;
      console.log("CallHub SignalR connection closed");
    });

    try {
      await this.connection.start();
      this._connectionId = this.connection.connectionId ?? null;
      console.log("CallHub SignalR connected");
    } catch (err) {
      console.error("Failed to connect to CallHub:", err);
      throw err;
    }
  }

  /**
   * Gracefully disconnect from the call hub.
   */
  async disconnect(): Promise<void> {
    if (!this.connection) return;
    try {
      await this.connection.stop();
    } catch {
      // Ignore errors during disconnect
    }
    this.connection = null;
    this._connectionId = null;
  }

  // ─── Send methods ──────────────────────────────────────────────────────────

  async callUser(targetUserId: string, activityId: string, isVideo: boolean): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("CallUser", targetUserId, activityId, isVideo);
  }

  async acceptCall(targetUserId: string, activityId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("AcceptCall", targetUserId, activityId);
  }

  async rejectCall(targetUserId: string, activityId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("RejectCall", targetUserId, activityId);
  }

  async sendOffer(targetUserId: string, sdp: string, activityId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("SendOffer", targetUserId, sdp, activityId);
  }

  async sendAnswer(targetUserId: string, sdp: string, activityId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("SendAnswer", targetUserId, sdp, activityId);
  }

  async sendIceCandidate(targetUserId: string, candidate: string, activityId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("SendIceCandidate", targetUserId, candidate, activityId);
  }

  async endCall(activityId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke("EndCall", activityId);
  }

  // ─── Event subscription ────────────────────────────────────────────────────

  on(event: SignalRCallEvent, handler: (...args: unknown[]) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  off(event: SignalRCallEvent, handler: (...args: unknown[]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async ensureConnected(): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      await this.connect();
    }
  }

  private dispatch(event: SignalRCallEvent, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in handler for ${event}:`, err);
      }
    });
  }
}
