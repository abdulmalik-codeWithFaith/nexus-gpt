"use client";

/**
 * WebRTC signaling channel, built on the same Firestore REST pattern as
 * room-store.ts. Signals (offers/answers/ICE candidates) are written as
 * individual documents in a `rooms/{roomId}/signals` subcollection so they
 * never collide with concurrent writes to the main room document.
 *
 * NOTE: requires the same Firestore config as room-store.ts, and requires
 * your Firestore rules to allow read/write on rooms
 */

export type SignalKind = "offer" | "answer" | "ice-candidate" | "leave";

export type SignalPayload = {
  from: string;
  to: string;
  kind: SignalKind;
  data: string; // JSON-stringified SDP or ICE candidate
};

type StoredSignal = SignalPayload & { id: string; createdAt: number };

function firebaseConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY."
    );
  }

  return { projectId, apiKey };
}

function baseUrl(roomId: string) {
  const { projectId, apiKey } = firebaseConfig();
  return {
    apiKey,
    collectionUrl: `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rooms/${roomId}/signals`,
  };
}

function docIdFromName(name: string): string {
  return name.split("/").pop() ?? name;
}

function parseDoc(doc: {
  name: string;
  fields?: Record<string, { stringValue?: string; integerValue?: string }>;
}): StoredSignal {
  const f = doc.fields ?? {};
  return {
    id: docIdFromName(doc.name),
    from: f.from?.stringValue ?? "",
    to: f.to?.stringValue ?? "",
    kind: (f.kind?.stringValue as SignalKind) ?? "offer",
    data: f.data?.stringValue ?? "",
    createdAt: Number(f.createdAt?.integerValue ?? 0),
  };
}

/** Writes one signal document. Fire-and-forget is fine for ICE candidates. */
export async function sendSignal(roomId: string, signal: SignalPayload): Promise<void> {
  const { apiKey, collectionUrl } = baseUrl(roomId);

  await fetch(`${collectionUrl}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        from: { stringValue: signal.from },
        to: { stringValue: signal.to },
        kind: { stringValue: signal.kind },
        data: { stringValue: signal.data },
        createdAt: { integerValue: String(Date.now()) },
      },
    }),
  }).catch(() => {
    // best-effort; ICE candidates especially are fine to drop occasionally
  });
}

/**
 * Polls for signals addressed to `forParticipant` that haven't been seen yet.
 * `seen` should be a Set you own and reuse across calls — this function
 * mutates it. Matched signals are deleted from Firestore afterward so the
 * subcollection doesn't grow unbounded.
 */
export async function pollSignals(
  roomId: string,
  forParticipant: string,
  seen: Set<string>
): Promise<StoredSignal[]> {
  const { apiKey, collectionUrl } = baseUrl(roomId);

  const res = await fetch(`${collectionUrl}?key=${apiKey}&pageSize=100`);
  if (!res.ok) return [];

  const json = (await res.json()) as { documents?: Array<Parameters<typeof parseDoc>[0]> };
  const docs = (json.documents ?? []).map(parseDoc);
  const fresh = docs.filter((d) => d.to === forParticipant && !seen.has(d.id));

  fresh.forEach((d) => {
    seen.add(d.id);
    void fetch(`${collectionUrl}/${d.id}?key=${apiKey}`, { method: "DELETE" }).catch(() => {});
  });

  return fresh;
}