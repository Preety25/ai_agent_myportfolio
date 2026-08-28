import React, { useEffect, useRef } from "react";
import { Message } from "./Message";
import { IntroMessage } from "./IntroMessage";

export const ConversationTranscript = ({ messages, onToolClick }) => {
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollerRef}
      className="flex-1 overflow-y-auto px-5 pb-3 space-y-4"
      data-testid="pinky-transcript"
    >
      <IntroMessage />

      {messages.map((m, i) => (
        <Message
          key={i}
          role={m.role}
          text={m.text}
          tool={m.tool}
          onToolClick={onToolClick}
        />
      ))}
    </div>
  );
};
