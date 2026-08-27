import React from "react";

/**
 * Displays the current conversation status (connecting / listening /
 * speaking / error) with an animated indicator.
 */
export const AgentStatus = ({ status, mode, error, micDenied }) => {
  let label = null;
  let tone = "info";

  if (error) {
    label = error;
    tone = "error";
  } else if (micDenied) {
    label = "Microphone access is off. Please allow access.";
    tone = "error";
  } else if (status === "connecting") {
    label = "Connecting...";
  } else if (status === "connected") {
    label = mode === "speaking" ? "Pinky is speaking..." : "Listening...";
  }

  if (!label) return null;

  if (tone === "error") {
    return (
      <div
        data-testid="pinky-error-banner"
        className="mx-5 my-2 px-4 py-2 rounded-full bg-red-500 text-white font-mono text-sm text-center"
      >
        {label}
      </div>
    );
  }

  return (
    <div
      data-testid="pinky-status-banner"
      className="mx-5 my-2 px-4 py-1.5 rounded-full bg-coral-50 text-coral-600 font-mono text-xs text-center inline-flex items-center gap-2 self-start"
    >
      <span className="w-2 h-2 rounded-full bg-coral-400 animate-pulse" />
      {label}
    </div>
  );
};
