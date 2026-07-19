"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MeshCall } from "./webrtc";

/**
 * React hook wrapping MeshCall. Pass every current participant id
 * (excluding no one — self is filtered internally) and it keeps
 * connections in sync as people join.
 */
export function useMeshCall(
  roomId: string,
  selfId: string,
  participantIds: string[],
  onCodeMessage?: (fromId: string, data: string) => void
) {
  const callRef = useRef<MeshCall | null>(null);
  const onCodeMessageRef = useRef(onCodeMessage);
  onCodeMessageRef.current = onCodeMessage;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [micOn, setMicOnState] = useState(true);
  const [camOn, setCamOnState] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !selfId) return;

    let cancelled = false;
    const call = new MeshCall({
      roomId,
      selfId,
      onRemoteStream: (id, stream) => {
        setRemoteStreams((prev) => {
          const next = { ...prev };
          if (stream) next[id] = stream;
          else delete next[id];
          return next;
        });
      },
      onCodeMessage: (id, data) => onCodeMessageRef.current?.(id, data),
    });
    callRef.current = call;

    call
      .start()
      .then((stream) => {
        if (!cancelled) setLocalStream(stream);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMediaError(
            err instanceof Error ? err.message : "Couldn't access camera or microphone."
          );
        }
      });

    return () => {
      cancelled = true;
      call.leave();
      callRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, selfId]);

  /** Call explicitly when the user ends the meeting, so the call tears down
   * even though the component itself stays mounted (to show the summary). */
  const leaveCall = useCallback(() => {
    callRef.current?.leave();
    callRef.current = null;
  }, []);

  useEffect(() => {
    participantIds
      .filter((id) => id !== selfId)
      .forEach((id) => void callRef.current?.connectTo(id));
  }, [participantIds, selfId]);

  const toggleMic = useCallback(() => {
    setMicOnState((prev) => {
      const next = !prev;
      callRef.current?.setMicEnabled(next);
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    setCamOnState((prev) => {
      const next = !prev;
      callRef.current?.setCamEnabled(next);
      return next;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!sharingScreen) {
      try {
        await callRef.current?.shareScreen();
        setSharingScreen(true);
      } catch {
        // user cancelled the share picker — no-op
      }
    } else {
      await callRef.current?.stopScreenShare();
      setSharingScreen(false);
    }
  }, [sharingScreen]);

  const broadcastCode = useCallback((data: string) => {
    callRef.current?.broadcastCode(data);
  }, []);

  return {
    localStream,
    remoteStreams,
    micOn,
    camOn,
    sharingScreen,
    mediaError,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    leaveCall,
    broadcastCode,
  };
}