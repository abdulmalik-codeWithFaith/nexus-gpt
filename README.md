# Nexus GPT

Nexus GPT is an AI-powered collaborative workspace built for developers. It combines online meetings, collaborative coding, AI assistance, and automatic meeting documentation into one unified experience, helping engineering teams collaborate without constantly switching between multiple tools.

Built for the **OpenAI Build Week** using **GPT-5.6**.

---

# Features

- Create and join meeting rooms
- Public or private meeting links
- Real-time collaborative code editor
- AI coding assistant (Nexus AI)
- AI code review
- AI-generated code patches
- Automatic decision tracking
- Automatic action item extraction
- AI meeting summaries
- Shared workspace state
- Responsive UI

---

# Demo Flow

1. Open the landing page.
2. Create a new meeting.
3. Copy the meeting link.
4. Join the meeting from another browser.
5. Collaborate inside the shared code editor.
6. Ask Nexus AI programming questions.
7. Request AI code review.
8. Generate an AI patch suggestion.
9. End the meeting.
10. View the AI-generated meeting summary.

---

# Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- OpenAI Responses API
- GPT-5.6
- Firebase (optional)
- Browser BroadcastChannel
- localStorage fallback

---

# How GPT-5.6 Powers Nexus GPT

GPT-5.6 is used throughout the application to:

- Answer developer questions
- Review code
- Suggest improvements
- Generate code patches
- Extract meeting decisions
- Track action items
- Produce structured meeting summaries

---

# How Codex Was Used

Codex assisted during development by helping implement parts of the application, debugging issues, refactoring components, and accelerating development of core functionality.

---

# Installation

Clone the repository.

```bash
git clone <repository-url>

cd nexus-gpt
```

Install dependencies.

```bash
npm install
```

Create:

```bash
.env.local
```

Example:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Run locally.

```bash
npm run dev
```

Build for production.

```bash
npm run build
```

---

# Scripts

```bash
npm run dev
npm run build
npm run lint
```

---

# Project Structure

```
app/
components/
hooks/
lib/
public/
styles/
```

---

# Future Improvements

- Live WebRTC video/audio
- Screen sharing
- AI voice assistant
- GitHub integration
- Multi-file collaborative editing
- Team workspaces
- Calendar integration
- Persistent cloud collaboration

---

# License

MIT