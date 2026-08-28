import React from "react";
import { X } from "lucide-react";
import { AVATAR_URL } from "../../config/agent.config";

/**
 * Header sits at the top-right of the panel: coral "Hello" chip,
 * ringed avatar, and a close button that overlaps the panel edge with
 * a dark ink background.
 */
export const AgentHeader = ({ onClose }) => (
  <div className="relative flex items-start justify-end px-5 pt-5">
    <div className="flex items-center gap-2 ml-auto">
      <span className="bg-coral-400 text-white px-4 py-1.5 rounded-full text-sm font-mono shadow-sm">
        Hello
      </span>
      <img
        data-testid="pinky-avatar"
        src={AVATAR_URL}
        alt="Preeti"
        className="w-11 h-11 rounded-full object-cover ring-2 ring-coral-400 ring-offset-2 ring-offset-cream-50"
      />
    </div>

    {/* Overlapping close button */}
    <button
      data-testid="pinky-close-button"
      onClick={onClose}
      aria-label="Close conversation"
      className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-[#46454B] hover:bg-[#5a5960] flex items-center justify-center shadow-lg transition-colors z-10"
    >
      <X className="w-4 h-4 text-white" strokeWidth={2.5} />
    </button>
  </div>
);
