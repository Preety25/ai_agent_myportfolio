import React from "react";

/**
 * Slim inline status pill. Errors are elevated to their own red pill
 * banner from AgentPanel; this component only shows benign states.
 */
export const AgentStatus = ({ status, mode }) => {
  let label = null;

  if (status === "connecting") {
    label = "Connecting...";
  } else if (status === "connected") {
    label = mode === "speaking" ? "Pinky is speaking..." : "Listening...";
  }

  if (!label) return null;

  return (
    <div
      data-testid="pinky-status-banner"
      className="mx-5 mt-2 px-4 py-1.5 rounded-full bg-lavender-100 text-lavender-500 font-mono text-xs inline-flex items-center gap-2 self-start w-fit"
    >
      <span className="w-2 h-2 rounded-full bg-lavender-400 animate-pulse" />
      {label}
    </div>
  );
};
