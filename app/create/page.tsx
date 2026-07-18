"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Video,
  User,
  Mail,
  Sparkles,
} from "lucide-react";
import { generateMeetingId } from "@/lib/id";

export default function CreateMeetingPage() {
  const router = useRouter();
  const [meetingName, setMeetingName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sendSummary, setSendSummary] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  function handleStart() {
    if (sendSummary && email && !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("That doesn't look like a valid email.");
      return;
    }

    setStarting(true);
    const id = generateMeetingId();
    const params = new URLSearchParams();
    params.set("name", meetingName.trim() || "Untitled session");
    if (displayName.trim()) params.set("host", displayName.trim());
    if (sendSummary && email.trim()) params.set("email", email.trim());
    router.push(`/meeting/${id}?${params.toString()}`);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
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
          <div className="w-14" />
        </div>
      </header>

      {/* Form */}
      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="h-11 w-11 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center text-teal mb-5">
              <Video size={20} />
            </div>
            <h1 className="font-mono text-2xl text-foreground tracking-tight">
              Start a new session
            </h1>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              No account needed — just create and share the link. Anyone with
              it can join instantly.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-5">
            {/* Meeting name */}
            <div>
              <label
                htmlFor="meetingName"
                className="text-xs font-mono text-muted block mb-2"
              >
                Meeting name{" "}
                <span className="text-muted/60">(optional)</span>
              </label>
              <input
                id="meetingName"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Untitled session"
                className="w-full rounded-lg border border-line bg-surface-2 py-3 px-3.5 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/20 transition-colors"
              />
            </div>

            {/* Display name */}
            <div>
              <label
                htmlFor="displayName"
                className="text-xs font-mono text-muted block mb-2"
              >
                Your name{" "}
                <span className="text-muted/60">(shown to others)</span>
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jordan"
                  className="w-full rounded-lg border border-line bg-surface-2 py-3 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/20 transition-colors"
                />
              </div>
            </div>

            <div className="h-px bg-line" />

            {/* Email summary toggle */}
            <div>
              <button
                type="button"
                onClick={() => setSendSummary((v) => !v)}
                className="flex items-start gap-3 w-full text-left group"
              >
                <span
                  className={`mt-0.5 h-5 w-9 rounded-full border transition-colors relative shrink-0 ${
                    sendSummary
                      ? "bg-teal/25 border-teal/50"
                      : "bg-surface-2 border-line"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
                      sendSummary
                        ? "left-[18px] bg-teal"
                        : "left-0.5 bg-muted"
                    }`}
                  />
                </span>
                <span>
                  <span className="text-sm text-foreground block">
                    Email me the summary when we're done
                  </span>
                  <span className="text-xs text-muted block mt-0.5">
                    Nexus AI writes up decisions and action items automatically.
                  </span>
                </span>
              </button>

              {sendSummary && (
                <div className="mt-3">
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-line bg-surface-2 py-3 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/20 transition-colors"
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-danger mt-1.5">{emailError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={starting}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-teal text-[#05201c] py-3.5 rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-60"
          >
            {starting ? "Setting up your room..." : "Create meeting"}
            {!starting && <ArrowRight size={16} />}
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted font-mono">
            <Sparkles size={12} className="text-violet" />
            Nexus AI joins automatically — with everyone's consent
          </p>
        </div>
      </section>
    </div>
  );
}