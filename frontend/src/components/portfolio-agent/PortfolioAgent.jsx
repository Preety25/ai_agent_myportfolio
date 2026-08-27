import React, { useCallback, useEffect, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { FloatingButton } from "./FloatingButton";
import { AgentPanel } from "./AgentPanel";

/**
 * Top-level widget. Wraps the panel with ConversationProvider and
 * listens for provider-level callbacks (onMessage) so we can maintain
 * a live transcript.
 *
 * The ConversationProvider is mounted once and kept alive so the
 * conversation session can persist across open/close cycles if the
 * host wants that behaviour. Currently we tear down on close.
 */
export const PortfolioAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState([]);

  const handleMessage = useCallback((msg) => {
    // ElevenLabs provider dispatches: { source: "user"|"ai", message: string }
    if (!msg || !msg.message) return;
    const role = msg.source === "user" ? "user" : "agent";
    setTranscript((prev) => {
      // Dedup rapid duplicates
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === msg.message) return prev;
      return [...prev, { role, text: msg.message }];
    });
  }, []);

  useEffect(() => {
    if (!isOpen) setTranscript([]);
  }, [isOpen]);

  return (
    <ConversationProvider
      onMessage={handleMessage}
      onError={(e) => {
        // eslint-disable-next-line no-console
        console.error("[pinky] provider error", e);
      }}
    >
      <FloatingButton onClick={() => setIsOpen(true)} isOpen={isOpen} />
      {isOpen && <AgentPanel onClose={() => setIsOpen(false)} />}
    </ConversationProvider>
  );
};

export default PortfolioAgent;
