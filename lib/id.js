const WORDS = [
  "byte",
  "kernel",
  "vector",
  "cache",
  "loop",
  "stack",
  "thread",
  "shell",
  "proxy",
  "socket",
  "index",
  "buffer",
  "syntax",
  "runtime",
  "commit",
];

function randomSegment(length: number): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Generates a short, shareable meeting code, e.g. "vector-4f2k" */
export function generateMeetingId(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${word}-${randomSegment(4)}`;
}

/** Pulls a meeting code out of a pasted link or raw code */
export function parseMeetingInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const meetingIndex = parts.indexOf("meeting");
    if (meetingIndex !== -1 && parts[meetingIndex + 1]) {
      return parts[meetingIndex + 1];
    }
    if (parts.length > 0) return parts[parts.length - 1];
    return null;
  } catch {
    // Not a URL — treat as a raw code, e.g. "vector-4f2k"
    return trimmed.replace(/\s+/g, "-").toLowerCase();
  }
}