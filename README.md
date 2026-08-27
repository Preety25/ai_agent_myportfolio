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
