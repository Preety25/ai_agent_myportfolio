import React, { useState } from "react";
import { ArrowUp, Mic } from "lucide-react";

export const ChatInput = ({ onSend, onMicClick, onVoiceToggle, disabled }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div className="px-5 pb-5 pt-2 flex items-center gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex items-center border border-lavender-400 rounded-full pl-4 pr-1 py-1 bg-white"
      >
        <input
          data-testid="pinky-text-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Start typing..."
          disabled={disabled}
          className="flex-1 bg-transparent outline-none font-mono text-sm text-[#46454B] placeholder-[#B6A7E1] disabled:opacity-50"
        />
        <button
          type="submit"
          data-testid="pinky-send-button"
          aria-label="Send message"
          disabled={disabled || !value.trim()}
          className="w-8 h-8 rounded-full bg-lavender-400 hover:bg-lavender-500 disabled:opacity-40 flex items-center justify-center transition-colors"
        >
          <ArrowUp className="w-4 h-4 text-white" strokeWidth={2.5} />
        </button>
      </form>

      <button
        type="button"
        data-testid="pinky-mic-button"
        onClick={onMicClick}
        aria-label="Toggle microphone"
        className="w-10 h-10 rounded-full bg-lavender-400 hover:bg-lavender-500 flex items-center justify-center transition-colors"
      >
        <Mic className="w-4 h-4 text-white" />
      </button>

      <button
        type="button"
        data-testid="pinky-voice-toggle"
        onClick={onVoiceToggle}
        className="flex items-center gap-1.5 px-3 h-10 rounded-full border border-lavender-400 bg-white hover:bg-lavender-50 transition-colors"
      >
        <span className="font-mono text-sm text-lavender-500">Voice</span>
        <span className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 h-1  bg-lavender-400 rounded-full" />
          <span className="w-0.5 h-2.5 bg-lavender-400 rounded-full" />
          <span className="w-0.5 h-1.5 bg-lavender-400 rounded-full" />
          <span className="w-0.5 h-2  bg-lavender-400 rounded-full" />
        </span>
      </button>
    </div>
  );
};
