import React, { useCallback, useEffect, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { FloatingButton } from "./FloatingButton";
import { AgentPanel } from "./AgentPanel";

const NUDGE_STORAGE_KEY = "pinky_nudge_seen_v1";

/**
 * Top-level widget. Wraps the panel with ConversationProvider and
 * listens for provider-level `onMessage` callbacks to build the
 * transcript. Transcript state lives here so it survives voice ↔ text
 * session swaps inside the panel.
 */
export const PortfolioAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [nudge, setNudge] = useState(false);

  // First-visit nudge on the floating orb
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(NUDGE_STORAGE_KEY);
      if (!seen) {
        const t = setTimeout(() => setNudge(true), 1200);
        return () => clearTimeout(t);
      }
    } catch (e) { /* localStorage blocked */ }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setNudge(false);
    try { window.localStorage.setItem(NUDGE_STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Reset transcript for the next visit
    setTimeout(() => setTranscript([]), 350);
  }, []);

  const appendMessage = useCallback((m) => {
    setTranscript((prev) => [...prev, m]);
  }, []);

  const clearMessages = useCallback(() => setTranscript([]), []);

  const handleMessage = useCallback(
    (msg) => {
      if (!msg || !msg.message) return;
      const role = msg.source === "user" ? "user" : "agent";
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === role && last.text === msg.message) return prev;
        return [...prev, { role, text: msg.message }];
      });
    },
    []
  );

  return (
    <ConversationProvider
      onMessage={handleMessage}
      onError={(e) => {
        // eslint-disable-next-line no-console
        console.error("[pinky] provider error", e);
      }}
    >
      <FloatingButton onClick={handleOpen} isOpen={isOpen} showNudge={nudge} />
      {isOpen && (
        <AgentPanel
          onClose={handleClose}
          messages={transcript}
          appendMessage={appendMessage}
          clearMessages={clearMessages}
        />
      )}
    </ConversationProvider>
  );
};

export default PortfolioAgent;
