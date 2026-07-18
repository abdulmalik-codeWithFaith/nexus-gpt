# Nexus GPT

Nexus GPT is an AI-native collaborative workspace for developer meetings. It combines a meeting room, shared code editor, synchronized room state, tracked decisions/action items, AI code review, one-click patch suggestions, and generated meeting summaries.

## Hackathon demo flow

1. Create a meeting from `/create`.
2. Invite another browser tab with the room link.
3. Edit code in the shared workspace.
4. Ask Nexus AI to review the active file.
5. Type `decision: use Postgres for sessions` or `todo: add validation tests` to see automatic artifact tracking.
6. Click **Suggest patch** and **Apply** to demonstrate AI-assisted code changes.
7. End the meeting to generate a structured summary.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Browser BroadcastChannel/localStorage fallback for instant local demos
- Optional Firebase Firestore REST persistence
- OpenAI Responses API for AI chat, extraction, and summaries

## Environment variables

Create `.env.local` when you want cloud-backed AI/persistence:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
```

Firebase is required for meeting links to work across devices. Add the Firebase variables in Vercel before sharing meeting links with other people.

If `OPENAI_API_KEY` is omitted, the AI endpoints return deterministic fallback responses so the demo remains usable.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Notes

The current video controls are a product shell: mic, camera, and screen-share controls update meeting UI state, but a managed media provider such as LiveKit or Daily should be added for production-quality audio/video.
