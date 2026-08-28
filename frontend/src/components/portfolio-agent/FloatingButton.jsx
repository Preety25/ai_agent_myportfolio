import React, { useEffect, useState } from "react";
import { AVATAR_URL } from "../../config/agent.config";

/**
 * Circular floating trigger with the brand lavender→coral gradient,
 * a soft halo, the avatar overlaid at 40% opacity, and curved
 * "Ask Pinky" text rotating around the top arc.
 *
 * `showNudge` triggers a gentle pulse to hint at voice mode on the
 * visitor's first landing.
 */
export const FloatingButton = ({ onClick, isOpen, showNudge }) => {
  const [nudging, setNudging] = useState(false);

  useEffect(() => {
    if (!showNudge || isOpen) return;
    setNudging(true);
    const t = setTimeout(() => setNudging(false), 6000);
    return () => clearTimeout(t);
  }, [showNudge, isOpen]);

  if (isOpen) return null;

  return (
    <button
      data-testid="pinky-floating-button"
      onClick={onClick}
      aria-label="Open Pinky, Preeti's portfolio assistant"
      className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-[9998] group focus:outline-none"
    >
      <div
        className={`relative w-28 h-28 md:w-32 md:h-32 ${nudging ? "animate-pinky-nudge" : ""}`}
      >
        {/* Halo */}
        <div className="absolute inset-0 rounded-full blur-2xl opacity-60 pinky-brand-gradient" />
        <div className="absolute inset-2 rounded-full blur-md opacity-70 pinky-brand-gradient" />

        {/* Solid orb with brand gradient */}
        <div className="absolute inset-4 rounded-full pinky-brand-gradient shadow-[0_10px_40px_-8px_rgba(182,167,225,0.55)] overflow-hidden">
          {/* Avatar overlay at 40% opacity */}
          <img
            src={AVATAR_URL}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover rounded-full mix-blend-luminosity"
            style={{ opacity: 0.4 }}
          />
        </div>

        {/* Curved "Ask Pinky" text */}
        <svg
          viewBox="0 0 140 140"
          className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] animate-[spin_20s_linear_infinite]"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <path
              id="pinky-arc"
              d="M 70,70 m -56,0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"
            />
          </defs>
          <text
            fill="#EF7B7B"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", letterSpacing: "2px", fontWeight: 700 }}
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
