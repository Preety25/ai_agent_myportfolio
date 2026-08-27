import React, { useCallback, useEffect, useState } from "react";
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
import { AGENT_ID } from "../../config/agent.config";
import { usePortfolioTools } from "../../hooks/usePortfolioTools";
import { sendToParent, MESSAGE_TYPES } from "../../lib/postMessage";

/**
 * Main conversational panel. Holds all UI states:
 * text-mode / voice-mode / connecting / listening / speaking /
 * error / mic-denied / ended.
 */
export const AgentPanel = ({ onClose }) => {
  const { startSession, endSession, sendUserMessage, sendUserActivity } =
    useConversationControls();
  const { status, message: statusMsg } = useConversationStatus();
  const { mode, isSpeaking, isListening } = useConversationMode();

  const [uiMode, setUiMode] = useState("text"); // "text" | "voice"
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [micDenied, setMicDenied] = useState(false);

  const appendMessage = useCallback((m) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  // Register client tools; when the agent invokes one, push a tool card
  // into the transcript.
  usePortfolioTools({
    onToolInvoked: (tool) => appendMessage({ role: "tool", tool }),
  });

  useEffect(() => {
    if (statusMsg && status === "error") setError(statusMsg);
  }, [status, statusMsg]);

  const handleToolClick = useCallback((tool) => {
    // Re-dispatch when the user taps a rendered tool card
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
      sendToParent(MESSAGE_TYPES.OPEN_EXTERNAL, {
        url: tool.url,
        kind: tool.kind,
      });
    }
  }, []);

  const ensureConnected = useCallback(
    async ({ textOnly } = {}) => {
      if (status === "connected" || status === "connecting") return true;
      try {
        if (!textOnly) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        await startSession({ agentId: AGENT_ID });
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
    [status, startSession]
  );

  const handleSendText = useCallback(
    async (text) => {
      appendMessage({ role: "user", text });
      const ok = await ensureConnected({ textOnly: true });
      if (!ok) return;
      try {
        sendUserMessage(text);
      } catch (e) {
        setError("Connection error. Please try again later.");
      }
    },
    [appendMessage, ensureConnected, sendUserMessage]
  );

  const handleVoiceToggle = useCallback(async () => {
    if (uiMode === "voice") {
      setUiMode("text");
      return;
    }
    setUiMode("voice");
    await ensureConnected({ textOnly: false });
  }, [uiMode, ensureConnected]);

  const handleMicClick = useCallback(async () => {
    setUiMode("voice");
    await ensureConnected({ textOnly: false });
  }, [ensureConnected]);

  const handleStop = useCallback(async () => {
    try {
      await endSession();
    } catch (e) {
      /* silent */
    }
    setUiMode("text");
  }, [endSession]);

  const handleClose = useCallback(async () => {
    try {
      await endSession();
    } catch (e) {
      /* silent */
    }
    onClose && onClose();
  }, [endSession, onClose]);

  const isVoice = uiMode === "voice";

  return (
    <div
      data-testid="pinky-agent-panel"
      className="fixed z-[9999] pinky-panel bg-cream-50 shadow-2xl border border-coral-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <AgentHeader onClose={handleClose} />

      <AgentStatus
        status={status}
        mode={mode}
        error={error}
        micDenied={micDenied}
      />

      {isVoice ? (
        <div className="flex-1 flex items-center justify-center px-5 py-6">
          <VoiceOrb isSpeaking={isSpeaking} isListening={isListening} />
        </div>
      ) : (
        <ConversationTranscript
          messages={messages}
          onToolClick={handleToolClick}
        />
      )}

      {messages.length === 0 && !isVoice && (
        <SuggestedPrompts onSelect={handleSendText} />
      )}

      {isVoice ? (
        <ConversationControls onStop={handleStop} />
      ) : (
        <ChatInput
          onSend={handleSendText}
          onMicClick={handleMicClick}
          onVoiceToggle={handleVoiceToggle}
          disabled={false}
        />
      )}
    </div>
  );
};
