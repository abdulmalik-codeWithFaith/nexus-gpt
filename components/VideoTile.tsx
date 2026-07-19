"use client";

import { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";

export function VideoTile({
  stream,
  muted = false,
  label,
  initials,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  initials: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.srcObject = stream;

    if (stream) {
      const audioTracks = stream.getAudioTracks();
      console.log(
        `[nexus-video] ${label}: attaching stream with ${audioTracks.length} audio track(s)`,
        audioTracks.map((t) => ({ enabled: t.enabled, muted: t.muted, readyState: t.readyState }))
      );

      el.play()
        .then(() => console.log(`[nexus-video] ${label}: playback started (muted=${muted})`))
        .catch((err) => console.error(`[nexus-video] ${label}: play() blocked ->`, err));
    }
  }, [stream, label, muted]);

  const hasVideo = !!stream && stream.getVideoTracks().length > 0;

  return (
    <div className="relative h-full w-full bg-surface-2 flex items-center justify-center overflow-hidden">
      {hasVideo ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
      ) : stream ? (
        <div className="h-10 w-10 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-xs font-mono text-violet">
          {initials}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-muted">
          <VideoOff size={16} />
        </div>
      )}
      <span className="absolute bottom-1.5 left-2 text-[10px] text-white/90 font-mono bg-black/40 px-1.5 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
}