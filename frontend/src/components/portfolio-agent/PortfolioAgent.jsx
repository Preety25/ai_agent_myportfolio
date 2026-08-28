import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { FloatingButton } from "./FloatingButton";
import { AgentPanel } from "./AgentPanel";
import { RESUME_URL, PROJECTS } from "../../config/agent.config";
import { sendToParent, MESSAGE_TYPES } from "../../lib/postMessage";

const NUDGE_STORAGE_KEY = "pinky_nudge_seen_v1";

/**
 * Top-level widget.
 *
 * Session lifecycle:
 *   sessionMode = "idle"  → widget open but NO ElevenLabs session; no
 *                            microphone permission requested; no audio
 *                            context created.
 *   sessionMode = "text"  → text-only ElevenLabs session (textOnly=true).
 *   sessionMode = "voice" → full voice session (mic + WebRTC).
 *
 * Only one active ElevenLabs session at a time. We enforce this by
 * remounting the ConversationProvider on every mode change (its `key`
 * is bound to `sessionMode`), which forces the SDK to tear down before
 * the new one mounts. The AgentPanel receives a `pendingMessage` for
 * the just-typed text and dispatches it once the new text session is
 * connected.
 *
 * Transcript state lives here so it survives provider remounts.
 */
export const PortfolioAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [sessionMode, setSessionMode] = useState("idle");
  const [pendingMessage, setPendingMessage] = useState(null);
  const [nudge, setNudge] = useState(false);
  const pendingCounter = useRef(0);

  /* First-visit nudge -------------------------------------------------- */
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(NUDGE_STORAGE_KEY);
      if (!seen) {
        const t = setTimeout(() => setNudge(true), 1200);
        return () => clearTimeout(t);
      }
    } catch (e) { /* ignore */ }
  }, []);

  /* Open / close ------------------------------------------------------- */
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setNudge(false);
    try { window.localStorage.setItem(NUDGE_STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSessionMode("idle");
    setPendingMessage(null);
    // Delay clearing transcript so the panel exit-animation doesn't flash empty
    setTimeout(() => setTranscript([]), 350);
  }, []);

  /* Transcript helpers ------------------------------------------------- */
  const appendMessage = useCallback((m) => {
    setTranscript((prev) => [...prev, m]);
  }, []);

  const clearMessages = useCallback(() => setTranscript([]), []);

  const handlePendingConsumed = useCallback(() => setPendingMessage(null), []);

  const handleProviderMessage = useCallback((msg) => {
    if (!msg || !msg.message) return;
    const role = msg.source === "user" ? "user" : "agent";
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === msg.message) return prev;
      return [...prev, { role, text: msg.message }];
    });
  }, []);

  /* Mode transitions --------------------------------------------------- */

  /**
   * Handle the two hardcoded "canned" prompts client-side so they work
   * even without hitting the agent, and route the rest through a fresh
   * text-only ElevenLabs session.
   */
  const handleSendText = useCallback(
    (text) => {
      const clean = (text || "").trim();
      if (!clean) return;

      // Show the user bubble immediately
      appendMessage({ role: "user", text: clean });

      // Canned prompt: "Show me your CV" → surface the Open Resume card
      if (/^show me your cv$/i.test(clean)) {
        appendMessage({
          role: "tool",
          tool: {
            kind: "resume",
            title: "Open Resume",
            url: RESUME_URL,
          },
        });
        return;
      }

      // Everything else → send to ElevenLabs text session (KB-powered)
      pendingCounter.current += 1;
      setPendingMessage({ id: pendingCounter.current, text: clean });
      if (sessionMode !== "text") setSessionMode("text");
    },
    [appendMessage, sessionMode]
  );

  const handleStartVoice = useCallback(() => {
    if (sessionMode !== "voice") setSessionMode("voice");
  }, [sessionMode]);

  const handleStopSession = useCallback(() => {
    setSessionMode("idle");
    setPendingMessage(null);
  }, []);

  /* When a tool is invoked from a rendered card (or the agent), fan out
     the parent-page action. */
  const handleToolClick = useCallback((tool) => {
    if (tool.kind === "project") {
      const project = PROJECTS[tool.id] || tool;
      sendToParent(MESSAGE_TYPES.OPEN_PROJECT, {
        id: project.id,
        url: project.url,
      });
    } else if (tool.kind === "navigate") {
      sendToParent(MESSAGE_TYPES.NAVIGATE, { url: tool.url });
    } else if (tool.kind === "scroll") {
      sendToParent(MESSAGE_TYPES.SCROLL_TO_SECTION, {
        sectionId: (tool.url || "").replace(/^#/, ""),
      });
    } else if (tool.kind === "contact") {
      sendToParent(MESSAGE_TYPES.OPEN_CONTACT, { url: tool.url });
    } else {
      sendToParent(MESSAGE_TYPES.OPEN_EXTERNAL, {
        url: tool.url,
        kind: tool.kind || "external",
      });
    }
  }, []);

  const providerOnMessage = useCallback((msg) => {
    handleProviderMessage(msg);
  }, [handleProviderMessage]);

  const providerOnError = useCallback((e) => {
    // eslint-disable-next-line no-console
    console.error("[pinky] provider error", e);
  }, []);

  /* Render -------------------------------------------------------------
     Provider is remounted via `key` whenever sessionMode changes so the
     SDK never has more than one active session in flight. */
  return (
    <ConversationProvider
      onMessage={providerOnMessage}
      onError={providerOnError}
    >
      <FloatingButton onClick={handleOpen} isOpen={isOpen} showNudge={nudge} />
      {isOpen && (
        <AgentPanel
          sessionMode={sessionMode}
          onSendText={handleSendText}
          onStartVoice={handleStartVoice}
          onStopSession={handleStopSession}
          onClose={handleClose}
          onToolClick={handleToolClick}
          onToolInvoked={(tool) => appendMessage({ role: "tool", tool })}
          messages={transcript}
          clearMessages={clearMessages}
          pendingMessage={pendingMessage}
          onPendingConsumed={handlePendingConsumed}
        />
      )}
    </ConversationProvider>
  );
};

export default PortfolioAgent;
