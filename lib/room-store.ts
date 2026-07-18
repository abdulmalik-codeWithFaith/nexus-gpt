"use client";

import { DEFAULT_AI_GREETING, DEFAULT_FILES } from "./defaults";
import { generateMeetingId } from "./id";
import type {
  ActionItem,
  ChatMessage,
  Decision,
  MeetingSummary,
  NexusRoom,
  Participant,
  RoomFiles,
} from "./types";

const CHANNEL_PREFIX = "nexus-room-channel:";
const SYNC_INTERVAL = 1200;

type Listener = (room: NexusRoom | null) => void;
type FirestoreDocument = { fields?: { payload?: { stringValue?: string } } };

function firebaseConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY to Vercel."
    );
  }

  return { projectId, apiKey };
}

function channelName(id: string) {
  return `${CHANNEL_PREFIX}${id}`;
}

function safeParseRoom(raw: string | null): NexusRoom | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NexusRoom;
  } catch {
    return null;
  }
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "Y"
  );
}

function createParticipant(name: string, isSelf = false): Participant {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
    name,
    initials: initialsOf(name),
    isSelf,
    micOn: true,
    camOn: true,
    joinedAt: Date.now(),
  };
}

async function firestoreRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  const { projectId, apiKey } = firebaseConfig();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`;
  const res = await fetch(url, init);

  if (res.status === 404) return null;

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Firebase request failed: ${res.status} ${detail}`);
  }

  return (await res.json()) as T;
}

function toFirestoreFields(room: NexusRoom) {
  return {
    fields: {
      payload: { stringValue: JSON.stringify(room) },
      updatedAt: { integerValue: String(Date.now()) },
    },
  };
}

function fromFirestoreDoc(doc: FirestoreDocument | null): NexusRoom | null {
  return safeParseRoom(doc?.fields?.payload?.stringValue ?? null);
}

function notifyLocalSubscribers(room: NexusRoom) {
  if (typeof BroadcastChannel === "undefined") return;

  const channel = new BroadcastChannel(channelName(room.id));
  channel.postMessage(room);
  channel.close();
}

export async function createRoom(input: {
  name: string;
  hostName: string;
  summaryEmail?: string | null;
}): Promise<NexusRoom> {
  const id = generateMeetingId();
  const hostName = input.hostName.trim() || "You";

  const room: NexusRoom = {
    id,
    name: input.name.trim() || "Untitled session",
    hostName,
    summaryEmail: input.summaryEmail?.trim() || null,
    createdAt: Date.now(),
    endedAt: null,
    participants: [createParticipant(hostName, true)],
    messages: [
      {
        id: "ai-welcome",
        role: "ai",
        text: DEFAULT_AI_GREETING,
        createdAt: Date.now(),
      },
    ],
    files: DEFAULT_FILES,
    decisions: [],
    actionItems: [],
    summary: null,
  };

  await saveRoom(room);
  return room;
}

export async function getRoom(id: string): Promise<NexusRoom | null> {
  const firestoreDoc = await firestoreRequest<FirestoreDocument>(`rooms/${id}`);
  return fromFirestoreDoc(firestoreDoc);
}

export async function saveRoom(room: NexusRoom): Promise<void> {
  await firestoreRequest(`rooms/${room.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toFirestoreFields(room)),
  });

  notifyLocalSubscribers(room);
}

export function subscribeRoom(id: string, listener: Listener): () => void {
  let closed = false;
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(channelName(id))
      : null;

  if (channel) {
    channel.onmessage = (event) => listener(event.data as NexusRoom);
  }

  async function poll() {
    if (closed) return;
    try {
      listener(await getRoom(id));
    } catch {
      listener(null);
    }
  }

  void poll();
  const interval = window.setInterval(poll, SYNC_INTERVAL);

  return () => {
    closed = true;
    channel?.close();
    window.clearInterval(interval);
  };
}

export async function updateRoom(
  id: string,
  updater: (room: NexusRoom) => NexusRoom
): Promise<NexusRoom | null> {
  const room = await getRoom(id);
  if (!room) return null;

  const next = updater(room);
  await saveRoom(next);

  return next;
}

export function joinParticipant(room: NexusRoom, name: string) {
  if (room.participants.some((p) => p.name === name)) return room;

  return {
    ...room,
    participants: [...room.participants, createParticipant(name)],
  };
}

export function addMessage(
  room: NexusRoom,
  message: Omit<ChatMessage, "id" | "createdAt">
) {
  return {
    ...room,
    messages: [
      ...room.messages,
      {
        ...message,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      },
    ],
  };
}

export function addDecision(room: NexusRoom, text: string) {
  if (!text.trim()) return room;

  const decision: Decision = {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: Date.now(),
  };

  return {
    ...room,
    decisions: [...room.decisions, decision],
  };
}

export function addActionItem(room: NexusRoom, text: string, owner?: string) {
  if (!text.trim()) return room;

  const item: ActionItem = {
    id: crypto.randomUUID(),
    text: text.trim(),
    owner,
    createdAt: Date.now(),
  };

  return {
    ...room,
    actionItems: [...room.actionItems, item],
  };
}

export function updateFiles(room: NexusRoom, files: RoomFiles) {
  return {
    ...room,
    files,
  };
}

export function finishRoom(room: NexusRoom, summary: MeetingSummary) {
  return {
    ...room,
    endedAt: Date.now(),
    summary,
  };
}
