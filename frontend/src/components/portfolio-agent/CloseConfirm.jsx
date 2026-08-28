import React, { useState } from "react";
import { Mail, Copy, Check, X } from "lucide-react";
import { CONTACT_URL } from "../../config/agent.config";
import { sendToParent, MESSAGE_TYPES } from "../../lib/postMessage";

/**
 * Shown when the visitor taps the close X. Gives them a chance to
 * save the transcript / reach Preeti before actually closing.
 */
export const CloseConfirm = ({ messages, onCancel, onConfirmClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = (messages || [])
        .filter((m) => m.text)
        .map((m) => `${m.role === "user" ? "You" : "Pinky"}: ${m.text}`)
        .join("\n\n");
      await navigator.clipboard.writeText(text || "No transcript yet.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* silent */ }
  };

  const handleEmail = () => {
    // Open the parent's Connect section — the fastest way to reach
    // Preeti without asking us to run an email backend.
    sendToParent(MESSAGE_TYPES.OPEN_CONTACT, { url: CONTACT_URL });
  };

  return (
    <div
      data-testid="pinky-close-confirm"
      className="mx-5 mb-3 mt-2 p-4 rounded-3xl border border-lavender-200 bg-white shadow-sm space-y-3"
    >
      <div>
        <div className="text-[#46454B] font-mono text-sm font-bold">
          Before you go...
        </div>
        <p className="text-[#46454B]/80 font-mono text-xs mt-1 leading-relaxed">
          Want to keep this conversation or hear back from Preeti directly?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="pinky-close-email"
          onClick={handleEmail}
          className="w-full h-10 rounded-full bg-lavender-400 hover:bg-lavender-500 text-white font-mono text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Send to email
        </button>

        <button
          type="button"
          data-testid="pinky-close-save"
          onClick={handleCopy}
          className="w-full h-10 rounded-full border border-lavender-400 bg-white hover:bg-lavender-50 text-lavender-500 font-mono text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Save transcript"}
        </button>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            data-testid="pinky-close-cancel"
            onClick={onCancel}
            className="flex-1 h-10 rounded-full border border-[#46454B]/20 bg-white hover:bg-[#46454B]/5 text-[#46454B] font-mono text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="pinky-close-confirm-btn"
            onClick={onConfirmClose}
            className="flex-1 h-10 rounded-full bg-[#46454B] hover:bg-[#5a5960] text-white font-mono text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            Close chat
          </button>
        </div>
      </div>
    </div>
  );
};
