import React from "react";
import { X } from "lucide-react";
import { AVATAR_URL } from "../../config/agent.config";

export const AgentHeader = ({ onClose }) => (
  <div className="flex items-start justify-end px-5 pt-5">
    <div className="flex items-start gap-2 flex-1">
      <div className="ml-auto flex items-center gap-2">
        <div className="bg-coral-200 text-coral-600 px-4 py-1.5 rounded-full text-sm font-mono">
          Hello
        </div>
        <img
          data-testid="pinky-avatar"
          src={AVATAR_URL}
          alt="Preeti"
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
      </div>
    </div>
    <button
      data-testid="pinky-close-button"
      onClick={onClose}
      aria-label="Close conversation"
      className="ml-3 w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-300 flex items-center justify-center transition-colors"
    >
      <X className="w-4 h-4 text-neutral-700" />
    </button>
  </div>
);
