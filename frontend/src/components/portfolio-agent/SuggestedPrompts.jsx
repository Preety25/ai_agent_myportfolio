import React from "react";
import { SUGGESTED_PROMPTS } from "../../config/agent.config";

export const SuggestedPrompts = ({ onSelect }) => (
  <div
    className="flex flex-wrap gap-2 px-5 pb-3"
    data-testid="pinky-suggested-prompts"
  >
    {SUGGESTED_PROMPTS.map((prompt) => (
      <button
        key={prompt}
        data-testid={`pinky-prompt-${prompt.replace(/\s+/g, "-").toLowerCase()}`}
        onClick={() => onSelect(prompt)}
        className="font-mono text-sm text-coral-600 border border-coral-300 rounded-full px-4 py-2 hover:bg-coral-50 transition-colors"
      >
        {prompt}
      </button>
    ))}
  </div>
);
