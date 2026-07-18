import { NextRequest, NextResponse } from "next/server";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type Extraction = { decisions: string[]; actionItems: { text: string; owner?: string }[] };

function heuristic(text: string): Extraction {
  const decisions: string[] = [];
  const actionItems: { text: string; owner?: string }[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("decision:") || lower.includes("let's use") || lower.includes("we will use") || lower.includes("use postgres")) {
    decisions.push(text.replace(/^decision:\s*/i, "").trim());
  }
  const actionMatch = text.match(/(?:action(?: item)?:|todo:|([A-Z][a-z]+) should)\s*(.+)/i);
  if (actionMatch) {
    actionItems.push({ text: actionMatch[2]?.trim() || text.trim(), owner: actionMatch[1] });
  }
  return { decisions, actionItems };
}

async function callOpenAI(input: string): Promise<Extraction | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input }),
  });
  if (!res.ok) throw new Error("OpenAI extraction failed");
  const json = await res.json();
  const text = String(json.output_text ?? "{}").replace(/```json|```/g, "").trim();
  return JSON.parse(text) as Extraction;
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const prompt = `Extract developer-meeting decisions and action items from this message.
Return only JSON in this exact shape: {"decisions":["..."],"actionItems":[{"text":"...","owner":"optional"}]}.
If none, use empty arrays. Message: ${text}`;
  try {
    return NextResponse.json((await callOpenAI(prompt)) ?? heuristic(text));
  } catch {
    return NextResponse.json(heuristic(text), { status: 200 });
  }
}
