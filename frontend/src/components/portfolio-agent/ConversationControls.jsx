import React from "react";
import { Square } from "lucide-react";

/**
 * Bottom bar shown in voice-mode: gradient waveform + stop button
 * with lavender accent.
 */
export const ConversationControls = ({ onStop, onMicToggle, onSendText, bars = 30 }) => {
  return (
    <div className="px-5 pb-5 pt-2 flex items-center gap-3">
      <div
        className="flex-1 flex items-center gap-0.5 h-8 overflow-hidden"
        data-testid="pinky-waveform"
      >
        {Array.from({ length: bars }).map((_, i) => {
          const h = 20 + Math.abs(Math.sin((i / bars) * Math.PI * 3)) * 65;
          const t = i / (bars - 1);
          // Interpolate lavender -> coral across the bar row
          const r = Math.round(182 + (239 - 182) * t);
          const g = Math.round(167 + (123 - 167) * t);
          const b = Math.round(225 + (123 - 225) * t);
          return (
            <span
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${h}%`,
                backgroundColor: `rgba(${r},${g},${b},0.8)`,
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
        <Square className="w-4 h-4 text-coral-400 fill-coral-400" />
      </button>
    </div>
  );
};
