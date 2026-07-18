"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  ScreenShare,
  Code2,
  Sparkles,
  ArrowRight,
  Link2,
  Users,
  Plus,
  Minus,
  MessageSquare,
} from "lucide-react";
import JoinMeetingModal from "@/components/JoinMeetingModal";

export default function Home() {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-teal/15 border border-teal/30 flex items-center justify-center">
              <span className="font-mono text-xs text-teal font-semibold">
                {"</>"}
              </span>
            </div>
            <span className="font-medium text-foreground tracking-tight">
              nexus<span className="text-teal">.gpt</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setJoinOpen(true)}
              className="hidden sm:inline-flex text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg transition-colors"
            >
              Join a meeting
            </button>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-[#05201c] px-4 py-2 rounded-lg hover:bg-teal/90 transition-colors"
            >
              New meeting
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-teal border border-teal/25 bg-teal/5 rounded-full px-3 py-1 mb-6">
              <Sparkles size={12} />
              an AI engineer, sitting in the room
            </div>
            <h1 className="font-mono text-4xl sm:text-5xl leading-[1.1] tracking-tight text-foreground">
              Ship code
              <br />
              together.
              <br />
              <span className="text-muted">No tab-switching</span>
              <span className="text-teal cursor-blink">▍</span>
            </h1>
            <p className="mt-6 text-lg text-muted max-w-md leading-relaxed">
              Video, screen share, a live code editor, and an AI software
              engineer — one link, one workspace. No account required.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-[#05201c] px-5 py-3 rounded-lg hover:bg-teal/90 transition-colors"
              >
                Start a meeting
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => setJoinOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground border border-line px-5 py-3 rounded-lg hover:bg-surface transition-colors"
              >
                <Link2 size={15} />
                Join with a link
              </button>
            </div>
            <p className="mt-5 text-xs text-muted font-mono">
              no signup · no download · works in the browser
            </p>
          </div>

          {/* Workspace preview mock */}
          <div className="rounded-xl border border-line bg-surface shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line bg-surface-2">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-teal/70" />
              <span className="ml-3 text-xs font-mono text-muted">
                nexusgpt.dev/meeting/vector-4f2k
              </span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-line">
              {/* video strip */}
              <div className="col-span-3 grid grid-cols-3 gap-px bg-line">
                {["MJ", "AK", "You"].map((initials, i) => (
                  <div
                    key={i}
                    className="bg-surface-2 aspect-[4/3] flex items-center justify-center relative"
                  >
                    <div className="h-10 w-10 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-xs font-mono text-violet">
                      {initials}
                    </div>
                    <Mic
                      size={12}
                      className="absolute bottom-2 right-2 text-muted"
                    />
                  </div>
                ))}
              </div>
              {/* code + AI sidebar */}
              <div className="col-span-2 bg-surface p-4 font-mono text-[11px] leading-relaxed">
                <div className="flex gap-3 text-muted mb-2 text-xs">
                  <span className="text-foreground border-b border-teal pb-1">
                    server.ts
                  </span>
                  <span>utils.ts</span>
                </div>
                <div className="text-violet">
                  export async function <span className="text-teal">handler</span>(req) {"{"}
                </div>
                <div className="pl-4 text-muted">
                  const data = await <span className="text-amber">db.query</span>(req.id);
                </div>
                <div className="pl-4 text-muted">
                  return <span className="text-amber">Response.json</span>(data);
                </div>
                <div>{"}"}</div>
              </div>
              <div className="bg-surface-2 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-violet font-mono mb-1">
                  <Sparkles size={11} /> Nexus AI
                </div>
                <div className="text-[10px] leading-relaxed text-muted bg-background/60 rounded-md p-2 border border-line">
                  This route has no auth check — want me to add one?
                </div>
                <div className="mt-auto flex items-center gap-1 text-[10px] text-muted border border-line rounded-md px-2 py-1.5">
                  <MessageSquare size={11} /> Ask anything...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature diff */}
      <section className="border-t border-line bg-surface/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-mono text-sm text-muted mb-8">
            # what changes when you switch
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-4 font-mono text-sm">
            {[
              { sign: "-", text: "Five tools open for one call", color: "text-danger" },
              { sign: "-", text: "Pasting stack traces into a separate chat", color: "text-danger" },
              { sign: "-", text: "Re-explaining context every meeting", color: "text-danger" },
              { sign: "+", text: "Video, code, and AI in a single tab", color: "text-teal" },
              { sign: "+", text: "An engineer that heard the whole discussion", color: "text-teal" },
              { sign: "+", text: "A summary and action items, generated for you", color: "text-teal" },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`${row.color} mt-0.5`}>
                  {row.sign === "+" ? <Plus size={14} /> : <Minus size={14} />}
                </span>
                <span
                  className={
                    row.sign === "-"
                      ? "text-muted line-through decoration-line"
                      : "text-foreground"
                  }
                >
                  {row.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full">
        <h2 className="font-mono text-sm text-muted mb-10"># how it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Users size={18} />,
              title: "Create a room",
              body: "No account, no install. Give it a name and you're in.",
            },
            {
              icon: <Link2 size={18} />,
              title: "Share the link",
              body: "Anyone with the link joins instantly from their browser.",
            },
            {
              icon: <Code2 size={18} />,
              title: "Build, and ask Nexus AI",
              body: "Talk it through, write code together, let the AI catch what you miss.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="border border-line rounded-xl p-5 bg-surface"
            >
              <div className="h-9 w-9 rounded-lg bg-teal/10 border border-teal/25 flex items-center justify-center text-teal mb-4">
                {step.icon}
              </div>
              <h3 className="text-foreground font-medium mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-mono text-2xl text-foreground">
              Start your first session
              <span className="text-teal cursor-blink">▍</span>
            </h2>
            <p className="text-muted text-sm mt-2">
              Free to use. No account required to create or join.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-[#05201c] px-5 py-3 rounded-lg hover:bg-teal/90 transition-colors whitespace-nowrap"
          >
            New meeting
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-mono">
          <span>nexus.gpt — built for developers</span>
          <div className="flex items-center gap-2">
            <ScreenShare size={12} />
            <span>video · code · AI, in one room</span>
          </div>
        </div>
      </footer>

      <JoinMeetingModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}