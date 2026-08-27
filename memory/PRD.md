# Pinky — Portfolio Voice Agent Widget · PRD

## Original problem statement
Standalone React widget for the existing Framer portfolio at
preetyux.work. Floating "Ask Pinky" trigger + custom voice+chat
interface that talks to an ElevenLabs ElevenAgent (agent_2701m10g8nw5eec80qzjx5m7ke5c).
Must faithfully reproduce the Figma states: Connecting, Listening,
User speaking, Agent speaking, Text conversation, Tool recommendation,
Error, Microphone permission, Ended.

## Architecture
- Frontend-only React app (CRA + craco). No backend required (public agent).
- ElevenLabs SDK: `@elevenlabs/react` — `ConversationProvider`,
  `useConversationControls`, `useConversationStatus`, `useConversationMode`,
  `useConversationClientTool`.
- Client tools resolve identifiers through allow-lists in
  `src/config/agent.config.js` (single source of truth).
- Parent-page interaction via typed `postMessage` layer
  (`src/lib/postMessage.js`).

## User personas
- Portfolio visitors on preetyux.work who want to ask about Preeti's work.

## Core requirements (static)
- Public agent, no API key in browser.
- Voice + text modes.
- Six client tools: open_project, navigate_to, scroll_to_section,
  open_resume, open_contact, open_linkedin.
- Bottom-sheet layout on ≤640px viewports.
- iframe-embeddable, parent-origin validated postMessage.
- Space Mono typography, coral/lavender palette.

## What's been implemented (v1 — 2026-02)
- Config module with projects (absorb / omnee / manulife), nav
  destinations (home / about / work / contact / connect), section IDs,
  resume URL, LinkedIn URL, allowed parent origins.
- postMessage transport (OPEN_PROJECT / NAVIGATE / SCROLL_TO_SECTION /
  OPEN_CONTACT / OPEN_EXTERNAL) with dev fallback (new-tab / smooth-scroll).
- PortfolioAgent (root) with ConversationProvider + onMessage transcript wiring.
- FloatingButton with rotating SVG textPath "Ask Pinky".
- AgentPanel state machine (text ↔ voice, connecting / connected /
  speaking / listening / error / mic-denied / ended).
- AgentHeader (Hello chip + avatar + close).
- AgentStatus banners (coral pill for status, red pill for errors).
- VoiceOrb (radial gradient + live output-frequency scaling).
- ConversationControls (animated waveform + stop button).
- ConversationTranscript + Message (user lavender / agent cream / tool card).
- SuggestedPrompts pills.
- ChatInput (pill input + send + mic + Voice toggle).
- Six client tools registered via `useConversationClientTool` with exact
  parameter names.
- README with local dev, agent config, embed snippet, message protocol.

## Prioritized backlog
- P1: Sync agent tool cards with real thumbnails per project.
- P1: Add graceful re-connect if `startSession` fails after backgrounding.
- P2: Persist mute state across sessions via `ConversationProvider isMuted`.
- P2: Optional "Ended" summary card after `endSession`.
- P2: Analytics events (open_widget, start_voice, tool_invoked).
- P2: Multi-language support via `overrides.agent.language`.

## Next tasks list
- Wire real project thumbnails when the case-study assets are available.
- QA the embed on a Framer preview page against the actual origin.
