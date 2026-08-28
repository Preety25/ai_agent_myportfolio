import React from "react";
import { INTRO_MESSAGE } from "../../config/agent.config";

/**
 * Renders the intro copy with a soft per-word entrance animation.
 * Keeps whitespace/line-breaks intact.
 */
export const IntroMessage = () => {
  // Split on whitespace but keep newlines as their own tokens so we can render breaks.
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
