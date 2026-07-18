"use client";

import { sendSignal, pollSignals, type SignalKind } from "./webrtc-signal";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const POLL_MS = 1500;

type RemoteStreamHandler = (participantId: string, stream: MediaStream | null) => void;

interface MeshOptions {
  roomId: string;
  selfId: string;
  onRemoteStream: RemoteStreamHandler;
}

/**
 * Manages a mesh of RTCPeerConnections — one per other participant in the
 * room. Works for small groups (mesh doesn't scale much past ~6-8 people
 * since every browser uploads its stream N-1 times; fine for a dev-team
 * pairing session).
 */
export class MeshCall {
  private roomId: string;
  private selfId: string;
  private onRemoteStream: RemoteStreamHandler;
  private peers = new Map<string, RTCPeerConnection>();
  private seenSignals = new Set<string>();
  private pollHandle: number | null = null;
  private cameraTrack: MediaStreamTrack | null = null;

  public localStream: MediaStream | null = null;

  constructor(opts: MeshOptions) {
    this.roomId = opts.roomId;
    this.selfId = opts.selfId;
    this.onRemoteStream = opts.onRemoteStream;
  }

  /** Grabs mic/camera and starts listening for signals. Call once on mount. */
  async start(constraints: MediaStreamConstraints = { audio: true, video: true }) {
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.cameraTrack = this.localStream.getVideoTracks()[0] ?? null;
    this.beginPolling();
    return this.localStream;
  }

  /**
   * Ensures a connection exists to `remoteId`. Only the participant whose id
   * sorts lower initiates the offer — otherwise both sides would send offers
   * simultaneously ("glare").
   */
  async connectTo(remoteId: string) {
    if (remoteId === this.selfId || this.peers.has(remoteId)) return;

    const pc = this.createPeerConnection(remoteId);
    this.peers.set(remoteId, pc);

    if (this.selfId < remoteId) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(this.roomId, {
        from: this.selfId,
        to: remoteId,
        kind: "offer",
        data: JSON.stringify(offer),
      });
    }
  }

  private createPeerConnection(remoteId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream!);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal(this.roomId, {
          from: this.selfId,
          to: remoteId,
          kind: "ice-candidate",
          data: JSON.stringify(event.candidate),
        });
      }
    };

    pc.ontrack = (event) => {
      this.onRemoteStream(remoteId, event.streams[0] ?? null);
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        this.onRemoteStream(remoteId, null);
      }
    };

    return pc;
  }

  private beginPolling() {
    const tick = async () => {
      try {
        const signals = await pollSignals(this.roomId, this.selfId, this.seenSignals);
        for (const signal of signals) {
          await this.handleSignal(signal.from, signal.kind, signal.data);
        }
      } catch {
        // transient network hiccup — next tick retries
      }
    };
    void tick();
    this.pollHandle = window.setInterval(tick, POLL_MS);
  }

  private async handleSignal(remoteId: string, kind: SignalKind, data: string) {
    let pc = this.peers.get(remoteId);
    if (!pc && kind !== "leave") {
      pc = this.createPeerConnection(remoteId);
      this.peers.set(remoteId, pc);
    }
    if (!pc) return;

    if (kind === "offer") {
      await pc.setRemoteDescription(JSON.parse(data) as RTCSessionDescriptionInit);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(this.roomId, {
        from: this.selfId,
        to: remoteId,
        kind: "answer",
        data: JSON.stringify(answer),
      });
    } else if (kind === "answer") {
      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(JSON.parse(data) as RTCSessionDescriptionInit);
      }
    } else if (kind === "ice-candidate") {
      try {
        await pc.addIceCandidate(JSON.parse(data) as RTCIceCandidateInit);
      } catch {
        // candidate can arrive slightly before the remote description; safe to drop
      }
    } else if (kind === "leave") {
      pc.close();
      this.peers.delete(remoteId);
      this.onRemoteStream(remoteId, null);
    }
  }

  setMicEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  setCamEnabled(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  /** Swaps the outgoing video track on every peer connection to a screen-share track. */
  async shareScreen(): Promise<MediaStream> {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    this.peers.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      void sender?.replaceTrack(screenTrack);
    });

    screenTrack.onended = () => {
      void this.stopScreenShare();
    };

    return screenStream;
  }

  async stopScreenShare() {
    if (!this.cameraTrack) return;
    this.peers.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      void sender?.replaceTrack(this.cameraTrack!);
    });
  }

  /** Tears everything down — call on unmount / leaving the meeting. */
  leave() {
    this.peers.forEach((pc, remoteId) => {
      void sendSignal(this.roomId, { from: this.selfId, to: remoteId, kind: "leave", data: "" });
      pc.close();
    });
    this.peers.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    if (this.pollHandle !== null) window.clearInterval(this.pollHandle);
  }
}