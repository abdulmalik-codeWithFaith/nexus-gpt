"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
  Wand2,
  Clipboard,
} from "lucide-react";
import {
  addActionItem,
  addDecision,
  addMessage,
  finishRoom,
  getRoom,
  joinParticipant,
  saveRoom,
  subscribeRoom,
  updateFiles,
  updateRoom,
} from "@/lib/room-store";
import { useMeshCall } from "@/lib/use-mesh-call";
import { VideoTile } from "@/components/VideoTile";
import type { AiPatch, ChatMessage, MeetingSummary, NexusRoom } from "@/lib/types";

function useElapsedTime(startedAt?: number, endedAt?: number | null) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const effectiveNow = now || startedAt || 0;
  const seconds = Math.max(0, Math.floor(((endedAt ?? effectiveNow) - (startedAt ?? effectiveNow)) / 1000));
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
  const displayName = searchParams.get("name") || "Guest";
  const [room, setRoom] = useState<NexusRoom | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState("server.ts");
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(true);
  const [patch, setPatch] = useState<AiPatch | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const elapsed = useElapsedTime(room?.createdAt, room?.endedAt);

  const participantIds = useMemo(() => room?.participants.map((p) => p.id) ?? [], [room?.participants]);

  const {
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
  } = useMeshCall(params.id, selfId ?? "", participantIds);

  const participants = useMemo(
    () =>
      room?.participants.map((p) =>
        p.id === selfId ? { ...p, micOn, camOn } : p
      ) ?? [],
    [room?.participants, selfId, micOn, camOn]
  );

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      const existing = await getRoom(params.id);
      if (!existing) {
        if (!ignore) setNotFound(true);
        return;
      }
      const joined = joinParticipant(existing, displayName);
      await saveRoom(joined);
      if (!ignore) {
        setRoom(joined);
        // Find the participant entry that represents this browser so the
        // mesh call and video tiles know which stream is "self".
        const mine = joined.participants.find((p) => p.name === displayName);
        setSelfId(mine?.id ?? null);
      }
    }
    void bootstrap();
    return () => {
      ignore = true;
    };
  }, [params.id, displayName]);

  useEffect(() => subscribeRoom(params.id, setRoom), [params.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.messages]);

  async function persist(next: NexusRoom) {
    setRoom(next);
    await saveRoom(next);
  }

  function handleCopyLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function extractArtifacts(text: string) {
    if (!room) return;
    const res = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = (await res.json()) as { decisions: string[]; actionItems: { text: string; owner?: string }[] };
    await updateRoom(params.id, (latest) => {
      let next = latest;
      for (const decision of data.decisions) next = addDecision(next, decision);
      for (const item of data.actionItems) next = addActionItem(next, item.text, item.owner);
      return next;
    });
  }

  async function handleSend() {
    if (!room || !draft.trim() || thinking) return;
    const text = draft.trim();
    setDraft("");
    const withUser = addMessage(room, { role: "user", text, author: displayName });
    await persist(withUser);
    void extractArtifacts(text);
    setThinking(true);
    const activeCode = withUser.files[activeFile] ?? "";
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: withUser.name,
        activeFile,
        code: activeCode,
        question: text,
        decisions: withUser.decisions,
        messages: withUser.messages.slice(-8),
      }),
    });
    const data = (await res.json()) as { text: string };
    await updateRoom(params.id, (latest) => addMessage(latest, { role: "ai", text: data.text }));
    setThinking(false);
  }

  async function generatePatch() {
    if (!room) return;
    const code = room.files[activeFile] ?? "";
    const patched = code.includes("req.id")
      ? code.replace(
          "export async function handler(req: Request) {\n  const data = await db.query(req.id);",
          "export async function handler(req: Request) {\n  const id = new URL(req.url).searchParams.get(\"id\");\n  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {\n    return Response.json({ error: \"Invalid request id\" }, { status: 400 });\n  }\n\n  const data = await db.query(id);"
        )
      : `${code}\n\n// Nexus AI note: add validation and tests before production.`;
    setPatch({
      file: activeFile,
      summary: `Add request-id validation before the database query in ${activeFile}.`,
      newContent: patched,
    });
  }

  async function applyPatch() {
    if (!room || !patch) return;
    const next = updateFiles(room, { ...room.files, [patch.file]: patch.newContent });
    await persist(addMessage(next, { role: "ai", text: `Applied patch: ${patch.summary}` }));
    setPatch(null);
  }

  async function endMeeting() {
    if (!room) return;
    leaveCall();
    setThinking(true);
    const res = await fetch("/api/ai/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(room),
    });
    const summary = (await res.json()) as MeetingSummary;
    await persist(finishRoom(room, summary));
    setThinking(false);
  }

  if (notFound) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-mono text-2xl text-foreground">Room not found</h1>
          <p className="text-muted mt-3">Create a new meeting or check the invite link.</p>
          <Link href="/create" className="mt-6 inline-flex bg-teal text-[#05201c] px-5 py-3 rounded-lg text-sm font-medium">
            Create meeting
          </Link>
        </div>
      </div>
    );
  }

  if (!room) return <div className="flex-1 flex items-center justify-center text-muted">Loading Nexus room...</div>;

  if (room.endedAt && room.summary) {
    return <MeetingSummaryView room={room} elapsed={elapsed} />;
  }

  const activeCode = room.files[activeFile] ?? "";

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="border-b border-line bg-surface shrink-0">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-2 w-2 rounded-full bg-danger animate-pulse shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">{room.name}</span>
            <span className="text-xs font-mono text-muted shrink-0 hidden md:inline">{room.id}</span>
            <span className="text-xs font-mono text-muted shrink-0">{elapsed}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              {participants.map((p) => (
                <div key={p.id} title={p.name} className="h-7 w-7 rounded-full bg-violet/20 border-2 border-surface flex items-center justify-center text-[10px] font-mono text-violet">
                  {p.initials}
                </div>
              ))}
            </div>
            <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-2 rounded-lg text-foreground hover:bg-surface-hover transition-colors">
              {copied ? <Check size={13} className="text-teal" /> : <Link2 size={13} />}
              {copied ? "Copied" : "Invite"}
            </button>
            <button onClick={() => void endMeeting()} className="inline-flex items-center gap-1.5 text-xs font-medium bg-danger/15 border border-danger/30 text-danger px-3 py-2 rounded-lg hover:bg-danger/25 transition-colors">
              <PhoneOff size={13} /> End
            </button>
          </div>
        </div>
        {mediaError && (
          <div className="bg-danger/10 border-t border-danger/30 text-danger text-xs px-4 py-2 text-center">
            {mediaError} Check your browser&apos;s camera/microphone permissions and reload.
          </div>
        )}
        <div className="grid grid-cols-3 gap-px bg-line border-t border-line">
          {participants.map((p) => (
            <div key={p.id} className="bg-surface-2 aspect-[16/7] sm:aspect-[16/5] relative">
              <VideoTile
                stream={p.id === selfId ? localStream : remoteStreams[p.id] ?? null}
                muted={p.id === selfId}
                label={p.name}
                initials={p.initials}
              />
              <span className="absolute bottom-1.5 right-2 z-10">{p.micOn ? <Mic size={11} className="text-white/80" /> : <MicOff size={11} className="text-danger" />}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 border-r border-line">
          <div className="flex items-center justify-between border-b border-line bg-surface px-3 shrink-0">
            <div className="flex items-center gap-1">
              {Object.keys(room.files).map((file) => (
                <button key={file} onClick={() => setActiveFile(file)} className={`px-3 py-2.5 text-xs font-mono border-b-2 transition-colors ${activeFile === file ? "text-foreground border-teal" : "text-muted border-transparent hover:text-foreground"}`}>
                  {file}
                </button>
              ))}
            </div>
            <button onClick={() => void generatePatch()} className="inline-flex items-center gap-1.5 text-xs text-teal border border-teal/30 rounded-md px-2.5 py-1.5 hover:bg-teal/10">
              <Wand2 size={13} /> Suggest patch
            </button>
          </div>
          {patch && (
            <div className="border-b border-teal/30 bg-teal/10 px-4 py-3 text-sm flex items-center justify-between gap-4">
              <span className="text-foreground">{patch.summary}</span>
              <div className="flex gap-2">
                <button onClick={() => setPatch(null)} className="text-muted hover:text-foreground">Reject</button>
                <button onClick={() => void applyPatch()} className="bg-teal text-[#05201c] rounded-md px-3 py-1.5 text-xs font-medium">Apply</button>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 flex bg-background">
            <LineNumbers text={activeCode} />
            <textarea spellCheck={false} value={activeCode} onChange={(e) => void persist(updateFiles(room, { ...room.files, [activeFile]: e.target.value }))} className="flex-1 resize-none bg-transparent outline-none p-3 font-mono text-[13px] leading-relaxed text-foreground" />
          </div>
        </div>

        <aside className="w-[360px] shrink-0 flex flex-col bg-surface">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-line shrink-0">
            <Sparkles size={15} className="text-violet" />
            <span className="text-sm font-medium text-foreground">Nexus AI</span>
          </div>
          <div className="border-b border-line shrink-0">
            <button onClick={() => setDecisionsOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-muted hover:text-foreground transition-colors">
              <span>tracked decisions & action items</span>
              {decisionsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {decisionsOpen && (
              <div className="px-4 pb-3 flex flex-col gap-2">
                {room.decisions.map((d) => <Artifact key={d.id} tone="text-teal" text={d.text} />)}
                {room.actionItems.map((a) => <Artifact key={a.id} tone="text-amber" text={`${a.text}${a.owner ? ` — ${a.owner}` : ""}`} />)}
                {room.decisions.length + room.actionItems.length === 0 && <p className="text-xs text-muted">Mention "decision:" or "todo:" in chat and Nexus AI will track it.</p>}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {room.messages.map((m: ChatMessage) => (
              <div key={m.id} className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[90%] ${m.role === "ai" ? "bg-background border border-line text-foreground self-start" : "bg-teal/15 border border-teal/25 text-foreground self-end"}`}>
                {m.author && <div className="text-[10px] font-mono text-muted mb-1">{m.author}</div>}
                {m.text}
              </div>
            ))}
            {thinking && <div className="text-xs text-muted font-mono">Nexus AI is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-line shrink-0">
            <div className="flex items-center gap-2 border border-line bg-surface-2 rounded-lg px-2.5">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void handleSend()} placeholder="Ask Nexus AI anything..." className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted/70 py-2.5" />
              <button onClick={() => void handleSend()} className="text-teal hover:text-teal/80 transition-colors p-1" aria-label="Send"><Send size={15} /></button>
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-line bg-surface flex items-center justify-center gap-3 py-3 shrink-0">
        <ControlButton active={micOn} onClick={toggleMic} onIcon={<Mic size={17} />} offIcon={<MicOff size={17} />} />
        <ControlButton active={camOn} onClick={toggleCam} onIcon={<Video size={17} />} offIcon={<VideoOff size={17} />} />
        <button onClick={() => void toggleScreenShare()} className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${sharingScreen ? "bg-teal/20 border-teal/40 text-teal" : "bg-surface-2 border-line text-muted hover:text-foreground"}`} aria-label="Toggle screen share"><ScreenShare size={17} /></button>
        <button onClick={() => void endMeeting()} className="h-10 px-5 rounded-full flex items-center gap-2 bg-danger/90 text-white hover:bg-danger transition-colors text-sm font-medium"><PhoneOff size={16} /> Leave</button>
      </div>
    </div>
  );
}

function Artifact({ tone, text }: { tone: string; text: string }) {
  return <div className="text-xs text-muted leading-relaxed flex gap-2"><span className={tone}>·</span><span>{text}</span></div>;
}

function ControlButton({ active, onClick, onIcon, offIcon }: { active: boolean; onClick: () => void; onIcon: React.ReactNode; offIcon: React.ReactNode }) {
  return <button onClick={onClick} className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${active ? "bg-surface-2 border-line text-foreground" : "bg-danger/15 border-danger/30 text-danger"}`}>{active ? onIcon : offIcon}</button>;
}

function LineNumbers({ text }: { text: string }) {
  const lines = text.split("\n").length;
  return <div className="select-none text-right pr-3 pl-3 pt-3 font-mono text-[13px] leading-relaxed text-muted/50 border-r border-line">{Array.from({ length: lines }).map((_, i) => <div key={i}>{i + 1}</div>)}</div>;
}

function MeetingSummaryView({ room, elapsed }: { room: NexusRoom; elapsed: string }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const markdown = `# ${room.name}\n\n${room.summary?.overview}\n\n## Decisions\n${room.summary?.decisions.map((d) => `- ${d}`).join("\n")}`;
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"><ArrowLeft size={15} />Back to home</Link>
        <h1 className="font-mono text-2xl text-foreground">Meeting ended</h1>
        <p className="text-sm text-muted mt-2">{room.name} · lasted {elapsed}</p>
        {room.summaryEmail && <div className="mt-5 flex items-center gap-2 text-sm text-teal bg-teal/10 border border-teal/25 rounded-lg px-3.5 py-2.5"><Mail size={15} />Summary ready for {room.summaryEmail}</div>}
        <div className="mt-6 rounded-xl border border-line bg-surface p-5 space-y-5">
          <Section title="overview" items={[room.summary?.overview ?? "No overview generated."]} plain />
          <Section title="key decisions" items={room.summary?.decisions ?? []} />
          <Section title="action items" items={room.summary?.actionItems ?? []} tone="text-amber" />
          <Section title="code changes" items={room.summary?.codeChanges ?? []} />
          <Section title="open questions" items={room.summary?.openQuestions ?? []} tone="text-violet" />
          <Section title="next steps" items={room.summary?.nextSteps ?? []} />
          <button onClick={() => navigator.clipboard?.writeText(markdown)} className="inline-flex items-center gap-2 text-xs font-mono text-teal hover:text-teal/80 transition-colors"><Clipboard size={13} />Copy summary markdown</button>
          <button onClick={() => setShowTranscript((v) => !v)} className="ml-4 inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-foreground transition-colors"><FileText size={13} />{showTranscript ? "Hide transcript" : "Show chat transcript"}</button>
          {showTranscript && <div className="text-xs text-muted leading-relaxed font-mono bg-background border border-line rounded-lg p-3 max-h-52 overflow-y-auto">{room.messages.map((m) => <p key={m.id}>[{new Date(m.createdAt).toLocaleTimeString()}] {m.author ?? m.role}: {m.text}</p>)}</div>}
        </div>
        <Link href="/create" className="mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-teal text-[#05201c] py-3.5 rounded-lg hover:bg-teal/90 transition-colors">Start another meeting</Link>
      </div>
    </div>
  );
}

function Section({ title, items, tone = "text-teal", plain = false }: { title: string; items: string[]; tone?: string; plain?: boolean }) {
  return <div><h2 className="text-xs font-mono text-muted mb-2">{title}</h2>{plain ? <p className="text-sm text-foreground leading-relaxed">{items[0]}</p> : <ul className="flex flex-col gap-2">{items.length ? items.map((item) => <li key={item} className="text-sm text-foreground flex gap-2"><span className={tone}>·</span>{item}</li>) : <li className="text-sm text-muted">None captured.</li>}</ul>}</div>;
}