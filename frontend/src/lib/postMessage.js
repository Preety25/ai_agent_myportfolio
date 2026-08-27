/**
 * Typed postMessage transport between the widget (iframe) and the parent
 * Framer page.
 *
 * Message contract (widget -> parent):
 *   { source: "pinky-agent", type: "OPEN_PROJECT",       payload: { url, id } }
 *   { source: "pinky-agent", type: "NAVIGATE",           payload: { url, destination } }
 *   { source: "pinky-agent", type: "SCROLL_TO_SECTION",  payload: { sectionId } }
 *   { source: "pinky-agent", type: "OPEN_CONTACT",       payload: { url } }
 *   { source: "pinky-agent", type: "OPEN_EXTERNAL",      payload: { url, kind } }
 *
 * The parent page is expected to validate `event.origin` before acting.
 * See README.md for the drop-in parent script.
 */

import { ALLOWED_PARENT_ORIGINS } from "../config/agent.config";

export const MESSAGE_SOURCE = "pinky-agent";

export const MESSAGE_TYPES = Object.freeze({
  OPEN_PROJECT: "OPEN_PROJECT",
  NAVIGATE: "NAVIGATE",
  SCROLL_TO_SECTION: "SCROLL_TO_SECTION",
  OPEN_CONTACT: "OPEN_CONTACT",
  OPEN_EXTERNAL: "OPEN_EXTERNAL",
});

/**
 * Detect whether we are running inside an iframe.
 */
export function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Post a message to the parent frame. If we are not embedded, we fall
 * back to opening the URL in a new tab / same tab so local development
 * still works.
 */
export function sendToParent(type, payload = {}) {
  const message = { source: MESSAGE_SOURCE, type, payload };

  if (!isEmbedded()) {
    // Local dev fallback: perform the action ourselves
    handleLocallyForDev(type, payload);
    return;
  }

  for (const origin of ALLOWED_PARENT_ORIGINS) {
    try {
      window.parent.postMessage(message, origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[pinky] postMessage failed for origin", origin, e);
    }
  }
}

function handleLocallyForDev(type, payload) {
  const url = payload && payload.url;
  if (
    type === MESSAGE_TYPES.OPEN_PROJECT ||
    type === MESSAGE_TYPES.OPEN_EXTERNAL
  ) {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  if (type === MESSAGE_TYPES.NAVIGATE || type === MESSAGE_TYPES.OPEN_CONTACT) {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  if (type === MESSAGE_TYPES.SCROLL_TO_SECTION) {
    const el = document.getElementById(payload.sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
