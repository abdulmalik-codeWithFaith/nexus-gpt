"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Link2,
  Check,
  Sparkles,
  Send,
  ChevronDown,
  ChevronRight,
  FileText,
  Mail,
  ArrowLeft,
} from "lucide-react";

type Participant = {
  id: string;
  name: string;
  initials: string;
  isSelf?: boolean;
  micOn: boolean;
  camOn: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
};

const FILES: Record<string, string> = {
  "server.ts": `export async function handler(req: Request) {
  const data = await db.query(req.id);
  return Response.json(data);
}`,
  "utils.ts": `export function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}`,
};

function useElapsedTime() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function MeetingWorkspace() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <MeetingWorkspaceInner />
    </Suspense>
  );
}

function MeetingWorkspaceInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const meetingName = searchParams.get("name") || "Untitled session";
  const hostName = searchParams.get("host") || "You";
  const summaryEmail = searchParams.get("email");

  const elapsed = useElapsedTime();
  const [copied, setCopied] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [ended, setEnded] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: hostName, initials: initialsOf(hostName), isSelf: true, micOn: true, camOn: true },
    { id: "2", name: "Maya Jain", initials: "MJ", micOn: true, camOn: false },
    { id: "3", name: "Arjun K.", initials: "AK", micOn: false, camOn: true },
  ]);

  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, micOn, camOn } : p))
    );
  }, [micOn, camOn]);

  const [activeFile, setActiveFile] = useState("server.ts");
  const [code, setCode] = useState<Record<string, string>>(FILES);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "user",
      text: "Can you check if this route validates the request?",
    },
    {
      id: "m2",
      role: "ai",
      text: "It doesn't currently — server.ts calls db.query with req.id directly. Want me to add a schema check before the query runs?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [decisionsOpen, setDecisionsOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleCopyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSend() {
    if (!draft.trim()) return;
    const text = draft.trim();
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: "This is a UI preview, so I can't reason about your code yet — but this is exactly where Nexus AI would answer inline.",
        },
      ]);
    }, 500);
  }

  if (ended) {
    return (
      <MeetingSummary
        meetingName={meetingName}
        elapsed={elapsed}
        summaryEmail={summaryEmail}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-line bg-surface shrink-0">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-2 w-2 rounded-full bg-danger animate-pulse shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {meetingName}
            </span>
            <span className="text-xs font-mono text-muted shrink-0 hidden md:inline">
              {params.id}
            </span>
            <span className="text-xs font-mono text-muted shrink-0">
              {elapsed}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  title={p.name}
                  className="h-7 w-7 rounded-full bg-violet/20 border-2 border-surface flex items-center justify-center text-[10px] font-mono text-violet"
                >
                  {p.initials}
                </div>
              ))}
            </div>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-2 rounded-lg text-foreground hover:bg-surface-hover transition-colors"
            >
              {copied ? <Check size={13} className="text-teal" /> : <Link2 size={13} />}
              {copied ? "Copied" : "Invite"}
            </button>
            <button
              onClick={() => setEnded(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-danger/15 border border-danger/30 text-danger px-3 py-2 rounded-lg hover:bg-danger/25 transition-colors"
            >
              <PhoneOff size={13} />
              End
            </button>
          </div>
        </div>

        {/* Video strip */}
        <div className="grid grid-cols-3 gap-px bg-line border-t border-line">
          {participants.map((p) => (
            <div
              key={p.id}
              className="bg-surface-2 aspect-[16/7] sm:aspect-[16/5] flex items-center justify-center relative"
            >
              {p.camOn ? (
                <div className="h-10 w-10 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-xs font-mono text-violet">
                  {p.initials}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted">
                  <VideoOff size={16} />
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 text-[10px] text-muted font-mono">
                {p.name}
              </span>
              <span className="absolute bottom-1.5 right-2">
                {p.micOn ? (
                  <Mic size={11} className="text-muted" />
                ) : (
                  <MicOff size={11} className="text-danger" />
                )}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Main: code + AI sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Code editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-line">
          <div className="flex items-center gap-1 border-b border-line bg-surface px-3 shrink-0">
            {Object.keys(FILES).map((file) => (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`px-3 py-2.5 text-xs font-mono border-b-2 transition-colors ${
                  activeFile === file
                    ? "text-foreground border-teal"
                    : "text-muted border-transparent hover:text-foreground"
                }`}
              >
                {file}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 flex bg-background">
            <LineNumbers text={code[activeFile]} />
            <textarea
              spellCheck={false}
              value={code[activeFile]}
              onChange={(e) =>
                setCode((c) => ({ ...c, [activeFile]: e.target.value }))
              }
              className="flex-1 resize-none bg-transparent outline-none p-3 font-mono text-[13px] leading-relaxed text-foreground"
            />
          </div>
        </div>

        {/* AI sidebar */}
        <aside className="w-[340px] shrink-0 flex flex-col bg-surface">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-line shrink-0">
            <Sparkles size={15} className="text-violet" />
            <span className="text-sm font-medium text-foreground">Nexus AI</span>
          </div>

          {/* Decisions log */}
          <div className="border-b border-line shrink-0">
            <button
              onClick={() => setDecisionsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-muted hover:text-foreground transition-colors"
            >
              <span>tracked decisions</span>
              {decisionsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {decisionsOpen && (
              <ul className="px-4 pb-3 flex flex-col gap-2">
                <li className="text-xs text-muted leading-relaxed flex gap-2">
                  <span className="text-teal">·</span>
                  Use Postgres for the sessions table
                </li>
                <li className="text-xs text-muted leading-relaxed flex gap-2">
                  <span className="text-teal">·</span>
                  Ship the auth middleware before screen share
                </li>
              </ul>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[90%] ${
                  m.role === "ai"
                    ? "bg-background border border-line text-foreground self-start"
                    : "bg-teal/15 border border-teal/25 text-foreground self-end"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-line shrink-0">
            <div className="flex items-center gap-2 border border-line bg-surface-2 rounded-lg px-2.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Nexus AI anything..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted/70 py-2.5"
              />
              <button
                onClick={handleSend}
                className="text-teal hover:text-teal/80 transition-colors p-1"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom control bar */}
      <div className="border-t border-line bg-surface flex items-center justify-center gap-3 py-3 shrink-0">
        <ControlButton
          active={micOn}
          onClick={() => setMicOn((v) => !v)}
          onIcon={<Mic size={17} />}
          offIcon={<MicOff size={17} />}
        />
        <ControlButton
          active={camOn}
          onClick={() => setCamOn((v) => !v)}
          onIcon={<Video size={17} />}
          offIcon={<VideoOff size={17} />}
        />
        <button
          onClick={() => setSharingScreen((v) => !v)}
          className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${
            sharingScreen
              ? "bg-teal/20 border-teal/40 text-teal"
              : "bg-surface-2 border-line text-muted hover:text-foreground"
          }`}
          aria-label="Toggle screen share"
        >
          <ScreenShare size={17} />
        </button>
        <button
          onClick={() => setEnded(true)}
          className="h-10 px-5 rounded-full flex items-center gap-2 bg-danger/90 text-white hover:bg-danger transition-colors text-sm font-medium"
        >
          <PhoneOff size={16} />
          Leave
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  onIcon,
  offIcon,
}: {
  active: boolean;
  onClick: () => void;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${
        active
          ? "bg-surface-2 border-line text-foreground"
          : "bg-danger/15 border-danger/30 text-danger"
      }`}
    >
      {active ? onIcon : offIcon}
    </button>
  );
}

function LineNumbers({ text }: { text: string }) {
  const lines = text.split("\n").length;
  return (
    <div className="select-none text-right pr-3 pl-3 pt-3 font-mono text-[13px] leading-relaxed text-muted/50 border-r border-line">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "Y";
}

function MeetingSummary({
  meetingName,
  elapsed,
  summaryEmail,
}: {
  meetingName: string;
  elapsed: string;
  summaryEmail: string | null;
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <h1 className="font-mono text-2xl text-foreground">
          Meeting ended
        </h1>
        <p className="text-sm text-muted mt-2">
          {meetingName} · lasted {elapsed}
        </p>

        {summaryEmail && (
          <div className="mt-5 flex items-center gap-2 text-sm text-teal bg-teal/10 border border-teal/25 rounded-lg px-3.5 py-2.5">
            <Mail size={15} />
            Summary sent to {summaryEmail}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-mono text-muted mb-3">key decisions</h2>
          <ul className="flex flex-col gap-2 mb-5">
            <li className="text-sm text-foreground flex gap-2">
              <span className="text-teal">·</span>
              Use Postgres for the sessions table
            </li>
            <li className="text-sm text-foreground flex gap-2">
              <span className="text-teal">·</span>
              Ship the auth middleware before screen share
            </li>
          </ul>

          <h2 className="text-xs font-mono text-muted mb-3">action items</h2>
          <ul className="flex flex-col gap-2">
            <li className="text-sm text-foreground flex gap-2">
              <span className="text-amber">·</span>
              Add request validation to server.ts — Maya
            </li>
            <li className="text-sm text-foreground flex gap-2">
              <span className="text-amber">·</span>
              Write migration for sessions table — Arjun
            </li>
          </ul>

          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="mt-5 flex items-center gap-2 text-xs font-mono text-muted hover:text-foreground transition-colors"
          >
            <FileText size={13} />
            {showTranscript ? "Hide transcript" : "Show full transcript"}
          </button>
          {showTranscript && (
            <p className="mt-3 text-xs text-muted leading-relaxed font-mono bg-background border border-line rounded-lg p-3">
              [00:02:14] Maya: should we use Postgres or just keep it in Redis
              for now?
              <br />
              [00:02:31] Arjun: Postgres — we'll want the query flexibility
              later.
              <br />
              [00:03:02] Nexus AI: noted — logging that as a decision.
            </p>
          )}
        </div>

        <Link
          href="/create"
          className="mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-teal text-[#05201c] py-3.5 rounded-lg hover:bg-teal/90 transition-colors"
        >
          Start another meeting
        </Link>
      </div>
    </div>
  );
}