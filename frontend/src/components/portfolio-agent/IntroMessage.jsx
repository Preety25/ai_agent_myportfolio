import React, { useRef } from "react";
import { INTRO_MESSAGE } from "../../config/agent.config";

// Module-level flag: the per-word entrance animation only plays the
// first time the intro is rendered. Subsequent re-mounts (which happen
// when we switch ElevenLabs session modes and remount the provider)
// render the intro immediately, without re-playing the animation.
let hasAnimatedOnce = false;

export const IntroMessage = () => {
  const animateRef = useRef(!hasAnimatedOnce);
  if (animateRef.current) hasAnimatedOnce = true;

  const tokens = INTRO_MESSAGE.split(/(\n)/).flatMap((chunk) =>
    chunk === "\n" ? ["\n"] : chunk.split(/(\s+)/)
  );

  let wordIndex = 0;
  return (
    <div
      data-testid="pinky-intro"
      className="text-[#46454B] font-mono text-sm leading-relaxed"
    >
      {tokens.map((tok, i) => {
        if (tok === "\n") return <br key={i} />;
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        const delay = wordIndex * 60;
        wordIndex += 1;
        if (!animateRef.current) {
          return <span key={i}>{tok}</span>;
        }
        return (
          <span
            key={i}
            className="inline-block animate-pinky-word-in"
            style={{ animationDelay: `${delay}ms` }}
          >
            {tok}
          </span>
        );
      })}
    </div>
  );
};
