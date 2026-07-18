import type { RoomFiles } from "./types";

export const DEFAULT_FILES: RoomFiles = {
  "server.ts": `export async function handler(req: Request) {
  const data = await db.query(req.id);
  return Response.json(data);
}`,
  "utils.ts": `export function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}`,
};

export const DEFAULT_AI_GREETING =
  "I’m Nexus AI. I can review the shared code, track decisions and action items, suggest patches, and generate the meeting summary.";
