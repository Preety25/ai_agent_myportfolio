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
        className="font-mono text-sm rounded-full px-4 py-2 transition-colors"
        style={{ color: "#F47A7B", border: "1px solid #F47A7B", background: "white" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF1F0"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
      >
        {prompt}
      </button>
    ))}
  </div>
);
