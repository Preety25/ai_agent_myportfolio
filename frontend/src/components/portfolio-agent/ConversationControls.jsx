import React from "react";
import { Square } from "lucide-react";

/**
 * Bottom controls shown in voice-mode: live waveform + stop button.
 */
export const ConversationControls = ({ onStop, bars = 32 }) => {
  return (
    <div className="px-5 pb-5 pt-2 flex items-center gap-3">
      <div
        className="flex-1 flex items-center gap-0.5 h-8"
        data-testid="pinky-waveform"
      >
        {Array.from({ length: bars }).map((_, i) => {
          const h = 20 + Math.abs(Math.sin((i / bars) * Math.PI * 3)) * 60;
          return (
            <span
              key={i}
              className="flex-1 bg-coral-400 rounded-full"
              style={{
                height: `${h}%`,
                animation: `pinky-bar 0.8s ease-in-out ${i * 0.03}s infinite alternate`,
              }}
            />
          );
        })}
      </div>
      <button
        type="button"
        data-testid="pinky-stop-button"
        onClick={onStop}
        aria-label="Stop conversation"
        className="w-10 h-10 rounded-full border border-coral-400 bg-white hover:bg-coral-50 flex items-center justify-center transition-colors"
      >
        <Square className="w-4 h-4 text-coral-500 fill-coral-500" />
      </button>
    </div>
  );
};
