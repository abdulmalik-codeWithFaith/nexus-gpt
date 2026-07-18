import { NextRequest, NextResponse } from "next/server";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

async function callOpenAI(input: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input }),
  });
  if (!res.ok) throw new Error(`OpenAI failed: ${res.status}`);
  const json = await res.json();
  return json.output_text as string | undefined;
}

function fallbackAnswer(question: string, file: string, code: string) {
  const missingValidation = /req\.id|db\.query\(/.test(code) && !/zod|parse|safeParse|validate/i.test(code);
  return missingValidation
    ? `I reviewed ${file}. The route appears to pass request data into the database without validation. I recommend validating the input before querying and then logging that as a security hardening action item. Ask me to generate a patch and I can rewrite the file.`
    : `I reviewed ${file} against your question: “${question}”. The structure looks reasonable, but I would still add explicit error handling, request validation, and tests before shipping.`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = `You are Nexus AI, an AI software engineer inside a live collaborative developer meeting.
Be concise, specific, and grounded in the shared code. If there is a useful code change, offer to generate a patch.

Meeting: ${body.roomName}
Active file: ${body.activeFile}
Current code:\n${body.code}
Tracked decisions: ${JSON.stringify(body.decisions ?? [])}
Recent messages: ${JSON.stringify(body.messages ?? [])}
User question: ${body.question}`;

  try {
    const answer = await callOpenAI(prompt);
    return NextResponse.json({ text: answer ?? fallbackAnswer(body.question, body.activeFile, body.code) });
  } catch {
    return NextResponse.json({ text: fallbackAnswer(body.question, body.activeFile, body.code), degraded: true });
  }
}
