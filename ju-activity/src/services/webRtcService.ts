import { RTC_CONFIG } from "@/constants/media";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: string) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onError: (error: Error) => void;
}

export interface MediaTracks {
  audio: boolean;
  video: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Manages a WebRTC peer connection and local/remote media streams.
 *
 * Responsibilities:
 * - Acquire local media (getUserMedia)
 * - Create and configure RTCPeerConnection
 * - Generate SDP offers/answers
 * - Handle ICE candidate exchange
 * - Track mute/unmute and camera on/off state
 * - Properly clean up all resources
 */
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks | null = null;
  private _isMuted = false;
  private _isVideoOff = false;

  get isMuted(): boolean {
    return this._isMuted;
  }

  get isVideoOff(): boolean {
    return this._isVideoOff;
  }

  get hasLocalStream(): boolean {
    return this.localStream !== null;
  }

  get hasRemoteStream(): boolean {
    return this.remoteStream !== null;
  }

  /**
   * Request access to the user's microphone and optionally camera.
   * Stores the stream for later use.
   */
  async startLocalStream(video: boolean): Promise<MediaStream> {
    // Stop any existing local stream first
    this.stopLocalStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        } : false,
      });

      this.localStream = stream;
      return stream;
    } catch (err) {
      const message = err instanceof DOMException
        ? err.name === "NotAllowedError"
          ? "Camera/microphone access denied"
          : err.name === "NotFoundError"
            ? "No camera/microphone found"
            : `Media error: ${err.message}`
        : "Failed to access media devices";
      throw new Error(message);
    }
  }

  /**
   * Stop all tracks in the local media stream.
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }

  /**
   * Create a new RTCPeerConnection and attach local tracks.
   * Sets up ICE candidate and connection state handlers.
   */
  createPeerConnection(callbacks: WebRTCCallbacks): RTCPeerConnection {
    // Clean up any existing connection
    this.closePeerConnection();

    this.callbacks = callbacks;

    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Attach local tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // When the remote peer adds a track, expose the stream
    pc.ontrack = (event: RTCTrackEvent) => {
      const [stream] = event.streams;
      if (stream) {
        this.remoteStream = stream;
        callbacks.onRemoteStream(stream);
      }
    };

    // Collect ICE candidates and send them via the signaling channel
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        callbacks.onIceCandidate(JSON.stringify(event.candidate));
      }
    };

    // Monitor connection state changes
    pc.onconnectionstatechange = () => {
      callbacks.onConnectionStateChange(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed"
      ) {
        callbacks.onError(new Error(`ICE connection ${pc.iceConnectionState}`));
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  /**
   * Generate an SDP offer (caller side).
   * Returns the serialized SDP string to send over the signaling channel.
   */
  async createOffer(): Promise<string> {
    const pc = this.getPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return JSON.stringify(offer);
  }

  /**
   * Generate an SDP answer (callee side).
   * Call setRemoteDescription first with the received offer.
   * Returns the serialized SDP string.
   */
  async createAnswer(): Promise<string> {
    const pc = this.getPeerConnection();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return JSON.stringify(answer);
  }

  /**
   * Set the remote peer's SDP (offer or answer).
   */
  async setRemoteDescription(sdpJson: string): Promise<void> {
    const pc = this.getPeerConnection();
    const desc = JSON.parse(sdpJson) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(new RTCSessionDescription(desc));
  }

  /**
   * Add a received ICE candidate to the peer connection.
   */
  async addIceCandidate(candidateJson: string): Promise<void> {
    const pc = this.peerConnection;
    if (!pc || !candidateJson) return;
    try {
      const candidate = JSON.parse(candidateJson) as RTCIceCandidateInit;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      // Ignore invalid candidate errors (common during negotiation)
      console.warn("Failed to add ICE candidate:", err);
    }
  }

  /**
   * Toggle microphone mute state.
   * Returns the new muted state.
   */
  toggleMute(): boolean {
    this._isMuted = !this._isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this._isMuted;
      });
    }
    return this._isMuted;
  }

  /**
   * Toggle camera on/off state.
   * Returns the new video-off state.
   */
  toggleVideo(): boolean {
    this._isVideoOff = !this._isVideoOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !this._isVideoOff;
      });
    }
    return this._isVideoOff;
  }

  /**
   * Get the current local stream (for self-view).
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get the current remote stream (for remote video display).
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Completely tear down the peer connection and media streams.
   */
  cleanup(): void {
    this.closePeerConnection();
    this.stopLocalStream();
    this.remoteStream = null;
    this.callbacks = null;
    this._isMuted = false;
    this._isVideoOff = false;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private getPeerConnection(): RTCPeerConnection {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not created. Call createPeerConnection first.");
    }
    return this.peerConnection;
  }

  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
