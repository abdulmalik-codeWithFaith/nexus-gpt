"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Link2 } from "lucide-react";
import { parseMeetingInput } from "@/lib/id";

export default function JoinMeetingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setValue("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleJoin() {
    const id = parseMeetingInput(value);
    if (!id) {
      setError("Paste a meeting link or code to continue.");
      return;
    }
    router.push(`/meeting/${id}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-medium text-foreground">Join a meeting</h2>
            <p className="text-sm text-muted mt-1">
              Paste the link someone shared with you, or type the room code.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-foreground transition-colors -mt-1 -mr-1 p-1 rounded-md hover:bg-surface-hover"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative">
          <Link2
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            placeholder="nexusgpt.dev/meeting/vector-4f2k"
            className="w-full rounded-lg border border-line bg-surface-2 py-3 pl-10 pr-3 text-sm font-mono text-foreground placeholder:text-muted/70 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/20 transition-colors"
          />
        </div>
        {error && <p className="text-sm text-danger mt-2">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground px-4 py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-[#05201c] px-4 py-2.5 rounded-lg hover:bg-teal/90 transition-colors"
          >
            Join meeting
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}