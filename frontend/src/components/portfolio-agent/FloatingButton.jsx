import React from "react";

/**
 * Circular floating trigger with a soft coral aura and curved "Ask Pinky"
 * text rendered via SVG textPath.
 */
export const FloatingButton = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      data-testid="pinky-floating-button"
      onClick={onClick}
      aria-label="Open Pinky, Preeti's portfolio assistant"
      className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-[9998] group focus:outline-none"
    >
      <div className="relative w-24 h-24 md:w-28 md:h-28">
        {/* Soft aura layers */}
        <div className="absolute inset-0 rounded-full bg-coral-200 opacity-60 blur-2xl group-hover:opacity-80 transition-opacity duration-500" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-coral-300 via-coral-400 to-coral-500 opacity-70 blur-md" />

        {/* Solid orb */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-coral-100 via-coral-300 to-coral-500 shadow-[0_10px_40px_-8px_rgba(255,107,107,0.6)] transition-transform duration-500 group-hover:scale-105" />

        {/* Curved "Ask Pinky" text */}
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 w-full h-full animate-[spin_18s_linear_infinite]"
        >
          <defs>
            <path
              id="pinky-arc"
              d="M 60,60 m -46,0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0"
            />
          </defs>
          <text
            fill="#FF4C4C"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", letterSpacing: "3px" }}
          >
            <textPath href="#pinky-arc" startOffset="0%">
              Ask Pinky • Ask Pinky •
            </textPath>
          </text>
        </svg>
      </div>
    </button>
  );
};
