import React, { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { CONTACT_URL } from "../../config/agent.config";
import { sendToParent, MESSAGE_TYPES } from "../../lib/postMessage";

/**
 * "Session Recap" card shown after the conversation ends. Offers to
 * save the transcript to clipboard or open the contact section on the
 * parent page. Deliberately lightweight — no email backend required.
 */
export const SessionRecap = ({ messages, onRestart }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = messages
        .filter((m) => m.text)
        .map((m) => `${m.role === "user" ? "You" : "Pinky"}: ${m.text}`)
        .join("\n\n");
      await navigator.clipboard.writeText(text || "No transcript yet.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* silent */
    }
  };

  const handleContact = () => {
    sendToParent(MESSAGE_TYPES.OPEN_CONTACT, { url: CONTACT_URL });
  };

  return (
    <div
      data-testid="pinky-session-recap"
      className="mx-5 my-4 p-5 rounded-3xl border border-lavender-200 bg-white shadow-sm space-y-4"
    >
      <div>
        <div className="text-[#46454B] font-mono text-sm font-bold">
          Thanks for chatting!
        </div>
        <p className="text-[#46454B]/80 font-mono text-xs mt-1 leading-relaxed">
          Want to keep this conversation or hear back from Preeti directly?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="pinky-recap-email"
          onClick={handleContact}
          className="w-full h-11 rounded-full bg-lavender-400 hover:bg-lavender-500 text-white font-mono text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email me directly
        </button>

        <button
          type="button"
          data-testid="pinky-recap-copy"
          onClick={handleCopy}
          className="w-full h-11 rounded-full border border-lavender-400 bg-white hover:bg-lavender-50 text-lavender-500 font-mono text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Save this conversation"}
        </button>

        <button
          type="button"
          data-testid="pinky-recap-restart"
          onClick={onRestart}
          className="w-full h-9 rounded-full text-[#46454B]/70 hover:text-[#46454B] font-mono text-xs transition-colors"
        >
          ↺ Start a new conversation
        </button>
      </div>
    </div>
  );
};
