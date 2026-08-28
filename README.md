# Pinky — Portfolio Voice Agent Widget

A standalone React widget that adds a floating conversational assistant
("Ask Pinky") to the Framer portfolio at **preetyux.work**. It talks to
an ElevenLabs ElevenAgent over WebRTC/WebSocket and can drive the
parent Framer page through a small, typed `postMessage` protocol.

## Local development
```bash
cd frontend
yarn install --ignore-engines
yarn start
```

## Configuration
All URLs, mappings, allow-lists, and copy live in **one file**:
`frontend/src/config/agent.config.js`

## ElevenLabs tools (must match agent config)
- `open_project({ project_id })`
- `navigate_to({ destination })`
- `scroll_to_section({ section_id })`
- `open_resume()`
- `open_contact()`
- `open_linkedin()`

## ElevenLabs agent configuration (IMPORTANT)
The agent is public. There are two ways to bypass the agent's origin allowlist:

**Option A — Backend signed URL (recommended, already wired up)**
1. Set `ELEVENLABS_API_KEY` in `backend/.env` (already done).
2. **Key must have the `convai_write` permission scope.** If you see
   a 401 with `missing_permissions` in the backend log, open
   ElevenLabs → your profile → API keys → your key → Permissions →
   enable **Conversational AI: Write** and re-save. The widget already
   calls `/api/pinky/auth?mode=text|voice` and uses either
   `signedUrl` (WebSocket) or `conversationToken` (WebRTC) before
   `startSession`. If the request fails it falls back to plain
   `agentId` auth.

**Option B — Allowlist the origin (fallback)**
Add the widget origin to the agent's *Security → Allowlist*:
```
portfolio-voice-chat.preview.emergentagent.com
preetyux.work
www.preetyux.work
```
(or delete the allowlist entirely so any origin is accepted).

If the allowlist is empty and no signed URL is available, the agent
will accept any origin (behaviour of a fully public agent).

## Embedding on Framer
See `frontend/src/lib/postMessage.js` for the message contract. Add an
`<iframe allow="microphone; autoplay; clipboard-write">` on the Framer
page pointing at the deployed widget URL, then listen for messages
whose `source === "pinky-agent"` and dispatch based on the `type` +
`payload` fields. Always validate `event.origin` before acting.

## Message protocol (widget → parent)
- `OPEN_PROJECT`      → `{ id, url }`
- `NAVIGATE`          → `{ destination, url }`
- `SCROLL_TO_SECTION` → `{ sectionId }`
- `OPEN_CONTACT`      → `{ url }`
- `OPEN_EXTERNAL`     → `{ url, kind }`
