import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useConversationControls,
  useConversationStatus,
  useConversationMode,
  useConversationInput,
} from "@elevenlabs/react";
import { X } from "lucide-react";
import { AgentHeader } from "./AgentHeader";
import { AgentStatus } from "./AgentStatus";
import { ConversationTranscript } from "./ConversationTranscript";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatInput } from "./ChatInput";
import { VoiceOrb } from "./VoiceOrb";
import { ConversationControls } from "./ConversationControls";
import { CloseConfirm } from "./CloseConfirm";
import { AGENT_ID } from "../../config/agent.config";
import { usePortfolioTools } from "../../hooks/usePortfolioTools";

/**
 * Panel state machine.
 *  - "idle"  → no ElevenLabs session
 *  - "text"  → SDK session running for text conversation (mic muted)
 *  - "voice" → SDK session with mic enabled
 *
 * Only one session is ever active at a time.
 */
export const AgentPanel = ({
  sessionMode,
  onSendText,
  onStartVoice,
  onStopSession,
  onClose,
  onToolClick,
  onToolInvoked,
  messages,
  clearMessages,
  pendingMessage,
  onPendingConsumed,
}) => {
  const { startSession, endSession, sendUserMessage } = useConversationControls();
  const { status } = useConversationStatus();
  const { mode, isSpeaking } = useConversationMode();
  const { setMuted } = useConversationInput();

  const [error, setError] = useState(null);        // { text, kind: "network"|"mic" }
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const consumedRef = useRef(null);
  const wasConnectedRef = useRef(false);

  usePortfolioTools({ onToolInvoked });

  /* Single connect effect — fires exactly once per mode transition */
  useEffect(() => {
    if (sessionMode === "idle") {
      try { endSession(); } catch (e) { /* silent */ }
      wasConnectedRef.current = false;
      return;
    }
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        if (sessionMode === "voice") {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (cancelled) return;
        await startSession({ agentId: AGENT_ID });
      } catch (e) {
        if (cancelled) return;
        if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) {
          setError({ kind: "mic", text: "Microphone access is off. Please allow access." });
        } else {
          // eslint-disable-next-line no-console
          console.error("[pinky] startSession failed", e);
          setError({ kind: "network", text: "Connection error. Please try again later." });
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMode]);

  /* On `connected`, mute mic in voice mode when unwanted &
     dispatch any pending text message. */
  useEffect(() => {
    if (sessionMode === "idle") return;
    if (status !== "connected") return;

    // Only touch mute state in voice mode. In text mode the provider
    // was created with `textOnly: true`, so no audio context / mic
    // exists to mute in the first place — calling setMuted would
    // throw.
    if (sessionMode === "voice") {
      try { setMuted(false); } catch (e) { /* silent */ }
    }
    wasConnectedRef.current = true;

    if (sessionMode !== "text") return;
    if (!pendingMessage) return;
    if (consumedRef.current === pendingMessage.id) return;
    try {
      sendUserMessage(pendingMessage.text);
      consumedRef.current = pendingMessage.id;
      onPendingConsumed && onPendingConsumed();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[pinky] sendUserMessage failed", e);
    }
  }, [sessionMode, status, pendingMessage, sendUserMessage, setMuted, onPendingConsumed]);

  /* Detect unexpected disconnect */
  useEffect(() => {
    if (
      wasConnectedRef.current &&
      status === "disconnected" &&
      sessionMode !== "idle"
    ) {
      setError({ kind: "network", text: "Connection error. Please try again later." });
      wasConnectedRef.current = false;
    }
  }, [status, sessionMode]);

  const handleCloseButton = useCallback(() => {
    // If nothing has happened yet, just close without asking
    if (!messages || messages.length === 0) {
      onClose && onClose();
      return;
    }
    setShowCloseConfirm(true);
  }, [messages, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose && onClose();
  }, [onClose]);

  const handleCancelClose = useCallback(() => setShowCloseConfirm(false), []);

  const handleMicError = useCallback((kind) => {
    if (kind === "denied") {
      setError({ kind: "mic", text: "Microphone access is off. Please allow access." });
    } else if (kind === "unsupported") {
      setError({ kind: "mic", text: "Dictation isn't supported in this browser." });
    } else {
      setError({ kind: "mic", text: "Something went wrong with the microphone." });
    }
  }, []);

  const handleStopVoice = useCallback(() => {
    onStopSession && onStopSession();
  }, [onStopSession]);

  const handleVoiceToggle = useCallback(() => {
    if (sessionMode === "voice") onStopSession && onStopSession();
    else onStartVoice && onStartVoice();
  }, [sessionMode, onStartVoice, onStopSession]);

  const isVoice = sessionMode === "voice";

  return (
    <div
      data-testid="pinky-agent-panel"
      className="fixed z-[9999] pinky-panel shadow-2xl border border-lavender-100 flex flex-col overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-[28px]"
    >
      <AgentHeader onClose={handleCloseButton} />

      {!showCloseConfirm && sessionMode !== "idle" && !error && (
        <AgentStatus status={status} mode={mode} />
      )}

      {isVoice ? (
        <div className="flex-1 flex items-center justify-center px-5 py-6 overflow-hidden">
          <VoiceOrb isSpeaking={isSpeaking} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <ConversationTranscript
            messages={messages}
            onToolClick={onToolClick}
          />
        </div>
      )}

      {messages.length === 0 && !isVoice && !showCloseConfirm && (
        <SuggestedPrompts onSelect={onSendText} />
      )}

      {/* Error banner sits ABOVE the action bar (per Figma) */}
      {error && !showCloseConfirm && (
        <div
          data-testid="pinky-error-banner"
          className="mx-5 mb-2 px-4 py-2 rounded-full text-white font-mono text-sm flex items-center justify-between gap-3"
          style={{ background: "#FF3333" }}
        >
          <span className="flex-1 text-center">{error.text}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {showCloseConfirm ? (
        <CloseConfirm
          messages={messages}
          onCancel={handleCancelClose}
          onConfirmClose={handleConfirmClose}
        />
      ) : isVoice ? (
        <ConversationControls onStop={handleStopVoice} />
      ) : (
        <ChatInput
          onSend={onSendText}
          onVoiceToggle={handleVoiceToggle}
          onMicError={handleMicError}
          disabled={false}
        />
      )}
    </div>
  );
};
