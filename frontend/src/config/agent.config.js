/**
 * Single source of truth for portfolio-agent configuration.
 *
 * Update the values in this file to point at real destinations on the
 * Framer portfolio. All client tools and postMessage handlers resolve
 * user-supplied identifiers through the allow-lists declared here, so
 * arbitrary URLs / DOM selectors can never reach the parent page.
 */

// ElevenLabs agent (public agent, no signed URL needed)
export const AGENT_ID = "agent_2701m10g8nw5eec80qzjx5m7ke5c";

// Parent-page origin allow-list for postMessage
export const ALLOWED_PARENT_ORIGINS = [
  "https://preetyux.work",
  "https://www.preetyux.work",
  "http://preetyux.work",
];

// Project ID -> case-study URL on preetyux.work
export const PROJECTS = {
  absorb: {
    id: "absorb",
    title: "Absorb Case study",
    url: "https://preetyux.work/absorb-case-study",
    thumbnail:
      "https://images.unsplash.com/photo-1587355760421-b9de3226a046?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
  },
  omnee: {
    id: "omnee",
    title: "Omnee Case study",
    url: "https://preetyux.work/omnee",
    thumbnail:
      "https://images.unsplash.com/photo-1587355760421-b9de3226a046?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
  },
  manulife: {
    id: "manulife",
    title: "Manulife Case study",
    url: "https://preetyux.work/manulife",
    thumbnail:
      "https://images.unsplash.com/photo-1587355760421-b9de3226a046?crop=entropy&cs=srgb&fm=jpg&w=200&q=80",
  },
};

// navigate_to destination -> URL / hash on preetyux.work
export const NAV_DESTINATIONS = {
  home: "https://preetyux.work/",
  about: "https://preetyux.work/#about",
  work: "https://preetyux.work/#work",
  contact: "https://preetyux.work/#connect",
  connect: "https://preetyux.work/#connect",
};

// scroll_to_section allow-list (values are the hash fragments on the Framer page)
export const SECTION_IDS = {
  about: "about",
  work: "work",
  connect: "connect",
  contact: "connect",
  process: "process",
  hero: "hero",
};

// External destinations
export const RESUME_URL = "https://preetyux.work/cv_preeti-shah_2026.pdf";
export const LINKEDIN_URL = "https://www.linkedin.com/in/preeti25/";
export const CONTACT_URL = "https://preetyux.work/#connect";

// Suggested prompts shown in the empty state
export const SUGGESTED_PROMPTS = [
  "Show me your CV",
  "What impact did your work have?",
];

// Intro / first message rendered before any conversation starts
export const INTRO_MESSAGE =
  "I am Pinky, Preeti's portfolio twin...\n\nAsk me anything about her work or experience and I'll do my best to answer!";

export const AVATAR_URL =
  "https://framerusercontent.com/images/h9UWzVS0GFejRKji4HoNlFneB7U.jpg";

export function resolveProject(projectId) {
  if (!projectId || typeof projectId !== "string") return null;
  return PROJECTS[projectId.toLowerCase().trim()] || null;
}

export function resolveDestination(destination) {
  if (!destination || typeof destination !== "string") return null;
  return NAV_DESTINATIONS[destination.toLowerCase().trim()] || null;
}

export function resolveSection(sectionId) {
  if (!sectionId || typeof sectionId !== "string") return null;
  return SECTION_IDS[sectionId.toLowerCase().trim()] || null;
}
