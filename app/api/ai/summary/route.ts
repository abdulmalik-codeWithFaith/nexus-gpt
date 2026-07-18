import { NextRequest, NextResponse } from "next/server";
import type { ActionItem, Decision, MeetingSummary, NexusRoom } from "@/lib/types";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type SummaryInput = Partial<NexusRoom> & {
  roomName?: string;
  decisions?: Decision[];
  actionItems?: ActionItem[];
};

function fallback(body: SummaryInput): MeetingSummary {
  return {
    overview: `The team worked in Nexus GPT on ${body.name ?? body.roomName ?? "a development session"}, discussed the shared code, and identified next implementation work.`,
    decisions: body.decisions?.map((d) => d.text) ?? [],
    actionItems: body.actionItems?.map((a) => `${a.text}${a.owner ? ` — ${a.owner}` : ""}`) ?? [],
    codeChanges: ["Reviewed and edited the shared workspace files."],
    openQuestions: ["Confirm validation, persistence, and deployment choices before production use."],
    nextSteps: ["Create a PR from the accepted changes.", "Add tests for the updated code path."],
  };
}

async function callOpenAI(input: string): Promise<MeetingSummary | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input }),
  });
  if (!res.ok) throw new Error("OpenAI summary failed");
  const json = await res.json();
  const text = String(json.output_text ?? "{}").replace(/```json|```/g, "").trim();
  return JSON.parse(text) as MeetingSummary;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SummaryInput;
  const prompt = `Generate a concise developer meeting summary. Return only JSON with keys overview, decisions, actionItems, codeChanges, openQuestions, nextSteps.\nContext: ${JSON.stringify(body)}`;
  try {
    return NextResponse.json((await callOpenAI(prompt)) ?? fallback(body));
  } catch {
    return NextResponse.json(fallback(body));
  }
}
