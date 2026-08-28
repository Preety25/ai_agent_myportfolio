import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useConversationControls,
  useConversationStatus,
  useConversationMode,
} from "@elevenlabs/react";
import { AgentHeader } from "./AgentHeader";
import { AgentStatus } from "./AgentStatus";
import { ConversationTranscript } from "./ConversationTranscript";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatInput } from "./ChatInput";
import { VoiceOrb } from "./VoiceOrb";
import { ConversationControls } from "./ConversationControls";
import { SessionRecap } from "./SessionRecap";
import { AGENT_ID } from "../../config/agent.config";
import { usePortfolioTools } from "../../hooks/usePortfolioTools";
import { sendToParent, MESSAGE_TYPES } from "../../lib/postMessage";

/**
 * Panel state machine.
 *
 * `uiMode` controls the visible surface (text ↔ voice ↔ ended).
 * `sessionKind` tracks whether the active ElevenLabs session is voice
 * or text — we tear down + re-open when switching.
 */
export const AgentPanel = ({ onClose, messages, appendMessage, clearMessages }) => {
  const { startSession, endSession, sendUserMessage } = useConversationControls();
  const { status } = useConversationStatus();
  const { mode, isSpeaking } = useConversationMode();

  const [uiMode, setUiMode] = useState("text"); // "text" | "voice" | "ended"
  const [error, setError] = useState(null);
  const [micDenied, setMicDenied] = useState(false);
  const sessionKindRef = useRef(null); // "voice" | "text" | null

  usePortfolioTools({
    onToolInvoked: (tool) => appendMessage({ role: "tool", tool }),
  });

  // Clear transient errors when we successfully connect
  useEffect(() => {
    if (status === "connected") {
      setError(null);
      setMicDenied(false);
    }
  }, [status]);

  const handleToolClick = useCallback((tool) => {
    if (tool.kind === "project") {
      sendToParent(MESSAGE_TYPES.OPEN_PROJECT, { id: tool.id, url: tool.url });
    } else if (tool.kind === "navigate") {
      sendToParent(MESSAGE_TYPES.NAVIGATE, { url: tool.url });
    } else if (tool.kind === "scroll") {
      sendToParent(MESSAGE_TYPES.SCROLL_TO_SECTION, {
        sectionId: tool.url.replace(/^#/, ""),
      });
    } else if (tool.kind === "contact") {
      sendToParent(MESSAGE_TYPES.OPEN_CONTACT, { url: tool.url });
    } else {
      sendToParent(MESSAGE_TYPES.OPEN_EXTERNAL, { url: tool.url, kind: tool.kind });
    }
  }, []);

  const openSession = useCallback(
    async (kind /* "voice" | "text" */) => {
      // If we already have the right kind of session, reuse it.
      if (sessionKindRef.current === kind && (status === "connected" || status === "connecting")) {
        return true;
      }
      // Otherwise tear down anything active first.
      if (sessionKindRef.current) {
        try { await endSession(); } catch (e) { /* silent */ }
        sessionKindRef.current = null;
      }
      try {
        if (kind === "voice") {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        await startSession({
          agentId: AGENT_ID,
          ...(kind === "text" ? { connectionType: "websocket" } : {}),
        });
        sessionKindRef.current = kind;
        return true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[pinky] startSession failed", e);
        if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) {
          setMicDenied(true);
        } else {
          setError("Connection error. Please try again later.");
        }
        return false;
      }
    },
    [status, startSession, endSession]
  );

  const handleSendText = useCallback(
    async (text) => {
      appendMessage({ role: "user", text });
      const ok = await openSession("voice"); // Voice session supports both audio + text messages
      if (!ok) return;
      try {
        sendUserMessage(text);
      } catch (e) {
        setError("Connection error. Please try again later.");
      }
    },
    [appendMessage, openSession, sendUserMessage]
  );

  const handleVoiceToggle = useCallback(async () => {
    if (uiMode === "voice") {
      setUiMode("text");
      return;
    }
    setUiMode("voice");
    await openSession("voice");
  }, [uiMode, openSession]);

  const handleMicClick = useCallback(async () => {
    setUiMode("voice");
    await openSession("voice");
  }, [openSession]);

  const handleStop = useCallback(async () => {
    try { await endSession(); } catch (e) { /* silent */ }
    sessionKindRef.current = null;
    setUiMode("ended");
  }, [endSession]);

  const handleClose = useCallback(async () => {
    try { await endSession(); } catch (e) { /* silent */ }
    sessionKindRef.current = null;
    onClose && onClose();
  }, [endSession, onClose]);

  const handleRestart = useCallback(() => {
    clearMessages && clearMessages();
    setUiMode("text");
    setError(null);
    setMicDenied(false);
  }, [clearMessages]);

  const isVoice = uiMode === "voice";
  const isEnded = uiMode === "ended";
  const showBanner = error || micDenied;

  return (
    <div
      data-testid="pinky-agent-panel"
      className="fixed z-[9999] pinky-panel shadow-2xl border border-lavender-100 flex flex-col overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-[28px]"
    >
      <AgentHeader onClose={handleClose} />

      {/* Error banner (mic denied or connection error) */}
      {showBanner && (
        <div
          data-testid="pinky-error-banner"
          className="mx-5 mt-3 px-4 py-2 rounded-full bg-coral-400 text-white font-mono text-sm text-center"
        >
          {micDenied ? "Microphone access is off. Please allow access." : error}
        </div>
      )}

      {!showBanner && !isEnded && <AgentStatus status={status} mode={mode} />}

      {isVoice ? (
        <div className="flex-1 flex items-center justify-center px-5 py-6 overflow-hidden">
          <VoiceOrb isSpeaking={isSpeaking} />
        </div>
      ) : isEnded ? (
        <div className="flex-1 overflow-y-auto">
          <ConversationTranscript messages={messages} onToolClick={handleToolClick} />
          <SessionRecap messages={messages} onRestart={handleRestart} />
        </div>
      ) : (
        <ConversationTranscript messages={messages} onToolClick={handleToolClick} />
      )}

      {messages.length === 0 && !isVoice && !isEnded && (
        <SuggestedPrompts onSelect={handleSendText} />
      )}

      {!isEnded && (isVoice ? (
        <ConversationControls onStop={handleStop} />
      ) : (
        <ChatInput
          onSend={handleSendText}
          onMicClick={handleMicClick}
          onVoiceToggle={handleVoiceToggle}
          disabled={false}
        />
      ))}
    </div>
  );
};
