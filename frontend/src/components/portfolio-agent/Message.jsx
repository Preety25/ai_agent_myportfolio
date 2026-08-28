import React from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Single transcript message.
 *  - role="user"  -> lavender bubble, right-aligned
 *  - role="agent" -> ink text on cream, left-aligned
 *  - role="tool"  -> agent tool recommendation card (coral pill)
 */
export const Message = ({ role, text, tool, onToolClick }) => {
  if (role === "user") {
    return (
      <div className="flex justify-end" data-testid="pinky-msg-user">
        <div className="max-w-[80%] bg-lavender-200 text-[#46454B] font-mono text-sm px-4 py-3 rounded-2xl rounded-tr-md">
          {text}
        </div>
      </div>
    );
  }

  if (role === "tool" && tool) {
    return (
      <div className="flex justify-start" data-testid="pinky-msg-tool">
        <button
          type="button"
          onClick={() => onToolClick && onToolClick(tool)}
          className="group flex items-center gap-3 px-3 py-2 rounded-2xl border border-coral-400 bg-white hover:bg-coral-50 transition-colors max-w-[85%] text-left"
        >
          {tool.thumbnail && (
            <img src={tool.thumbnail} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
          )}
          <span className="font-mono text-sm text-coral-500 flex-1">{tool.title}</span>
          <ArrowUpRight className="w-4 h-4 text-coral-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="text-[#46454B] font-mono text-sm leading-relaxed whitespace-pre-wrap"
      data-testid="pinky-msg-agent"
    >
      {text}
    </div>
  );
};
