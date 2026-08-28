import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useConversationControls,
  useConversationStatus,
  useConversationMode,
  useConversationInput,
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

/**
 * Panel state machine.
 *
 * `sessionMode` is owned by the parent so it can survive open/close.
 *  - "idle"  → no ElevenLabs session, no microphone permission.
 *  - "text"  → text-mode ElevenLabs session (WebSocket).
 *  - "voice" → voice ElevenLabs session (WebRTC + microphone).
 *
 * We keep exactly one session at a time by binding the connect effect
 * to `sessionMode`. When it flips to text/voice we open a session; when
 * it flips back to idle we tear it down.
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

  const [error, setError] = useState(null);
  const [micDenied, setMicDenied] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const consumedRef = useRef(null);

  usePortfolioTools({ onToolInvoked });

  /* Single connect effect. Bound only to sessionMode so it fires
     exactly once per mode transition. */
  useEffect(() => {
    if (sessionMode === "idle") {
      // Ensure no orphan session lingers
      try { endSession(); } catch (e) { /* silent */ }
      return;
    }

    let cancelled = false;
    setError(null);
    setMicDenied(false);

    const connect = async () => {
      try {
        if (sessionMode === "voice") {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (cancelled) return;
        // Note: we do NOT send the pending user message inline here.
        // The SDK's `startSession` promise resolves before the session
        // is fully registered internally, so a `sendUserMessage` here
        // races with the SDK's setup and throws "No active
        // conversation". Instead we wait for `status === "connected"`
        // in the effect below.
        await startSession({ agentId: AGENT_ID });
        if (cancelled) return;
        // (mic mute + pending-message dispatch happen in the
        // status-based effect below once we actually reach
        // `connected`.)
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[pinky] startSession failed", e);
        if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) {
          setMicDenied(true);
        } else {
          setError("Connection error. Please try again later.");
        }
      }
    };
    connect();

    return () => {
      cancelled = true;
    };
    // We intentionally do not include pendingMessage/sendUserMessage/
    // startSession/endSession/onPendingConsumed as deps — this effect
    // should only re-run when the user explicitly changes sessionMode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMode]);

  /* Once we're connected, dispatch any *subsequent* pending message
     (i.e. the user typed a second message while the session was
     already open). Also apply the desired mic mute state for the
     current mode. */
  useEffect(() => {
    if (sessionMode === "idle") return;
    if (status !== "connected") return;

    // Mute mic in text mode; unmute in voice mode.
    try { setMuted(sessionMode === "text"); } catch (e) { /* silent */ }

    if (sessionMode !== "text") return;
    if (!pendingMessage) return;
    if (consumedRef.current === pendingMessage.id) return;
    try {
      sendUserMessage(pendingMessage.text);
      consumedRef.current = pendingMessage.id;
      onPendingConsumed && onPendingConsumed();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[pinky] sendUserMessage (post-connect) failed", e);
    }
  }, [sessionMode, status, pendingMessage, sendUserMessage, setMuted, onPendingConsumed]);

  /* Detect unexpected disconnects. If we were connected in text/voice
     mode and the session drops without user action, surface a friendly
     error banner. */
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (status === "connected") wasConnectedRef.current = true;
    if (
      wasConnectedRef.current &&
      status === "disconnected" &&
      sessionMode !== "idle" &&
      !showRecap
    ) {
      setError("Connection error. Please try again later.");
      wasConnectedRef.current = false;
    }
  }, [status, sessionMode, showRecap]);

  /* Handlers */
  const handleStop = useCallback(() => {
    setShowRecap(true);
    onStopSession && onStopSession();
  }, [onStopSession]);

  const handleClose = useCallback(() => {
    onClose && onClose();
  }, [onClose]);

  const handleRestart = useCallback(() => {
    clearMessages && clearMessages();
    setShowRecap(false);
    setError(null);
    setMicDenied(false);
  }, [clearMessages]);

  const handleVoiceToggle = useCallback(() => {
    if (sessionMode === "voice") {
      onStopSession && onStopSession();
    } else {
      onStartVoice && onStartVoice();
    }
  }, [sessionMode, onStartVoice, onStopSession]);

  const isVoice = sessionMode === "voice";
  const showBanner = error || micDenied;

  return (
    <div
      data-testid="pinky-agent-panel"
      className="fixed z-[9999] pinky-panel shadow-2xl border border-lavender-100 flex flex-col overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-[28px]"
    >
      <AgentHeader onClose={handleClose} />

      {showBanner && (
        <div
          data-testid="pinky-error-banner"
          className="mx-5 mt-3 px-4 py-2 rounded-full bg-coral-400 text-white font-mono text-sm text-center"
        >
          {micDenied
            ? "Microphone access is off. Please allow access."
            : error}
        </div>
      )}

      {!showBanner && !showRecap && sessionMode !== "idle" && (
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
          {showRecap && (
            <SessionRecap messages={messages} onRestart={handleRestart} />
          )}
        </div>
      )}

      {messages.length === 0 && !isVoice && !showRecap && (
        <SuggestedPrompts onSelect={onSendText} />
      )}

      {isVoice ? (
        <ConversationControls onStop={handleStop} />
      ) : (
        !showRecap && (
          <ChatInput
            onSend={onSendText}
            onMicClick={onStartVoice}
            onVoiceToggle={handleVoiceToggle}
            disabled={false}
          />
        )
      )}
    </div>
  );
};
