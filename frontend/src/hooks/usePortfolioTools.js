import { useConversationClientTool } from "@elevenlabs/react";
import {
  resolveProject,
  resolveDestination,
  resolveSection,
  RESUME_URL,
  LINKEDIN_URL,
  CONTACT_URL,
} from "../config/agent.config";
import { sendToParent, MESSAGE_TYPES } from "../lib/postMessage";

/**
 * Registers the six ElevenLabs client tools required by the agent.
 * Every tool resolves user-supplied identifiers through the config
 * allow-lists before dispatching a postMessage to the parent page.
 *
 * A tool recommendation payload can be returned to the UI through the
 * optional `onToolInvoked` callback so the transcript can render a
 * clickable card (see PortfolioAgent).
 */
export function usePortfolioTools({ onToolInvoked } = {}) {
  useConversationClientTool("open_project", (params) => {
    const project = resolveProject(params && params.project_id);
    if (!project) return `Unknown project: ${params && params.project_id}`;
    sendToParent(MESSAGE_TYPES.OPEN_PROJECT, {
      id: project.id,
      url: project.url,
    });
    onToolInvoked &&
      onToolInvoked({
        kind: "project",
        title: project.title,
        url: project.url,
        thumbnail: project.thumbnail,
      });
    return `Opened project ${project.id}`;
  });

  useConversationClientTool("navigate_to", (params) => {
    const url = resolveDestination(params && params.destination);
    if (!url) return `Unknown destination: ${params && params.destination}`;
    sendToParent(MESSAGE_TYPES.NAVIGATE, {
      destination: params.destination,
      url,
    });
    onToolInvoked &&
      onToolInvoked({ kind: "navigate", title: `Go to ${params.destination}`, url });
    return `Navigated to ${params.destination}`;
  });

  useConversationClientTool("scroll_to_section", (params) => {
    const sectionId = resolveSection(params && params.section_id);
    if (!sectionId) return `Unknown section: ${params && params.section_id}`;
    sendToParent(MESSAGE_TYPES.SCROLL_TO_SECTION, { sectionId });
    onToolInvoked &&
      onToolInvoked({
        kind: "scroll",
        title: `Scroll to ${sectionId}`,
        url: `#${sectionId}`,
      });
    return `Scrolled to ${sectionId}`;
  });

  useConversationClientTool("open_resume", () => {
    sendToParent(MESSAGE_TYPES.OPEN_EXTERNAL, { kind: "resume", url: RESUME_URL });
    onToolInvoked &&
      onToolInvoked({ kind: "resume", title: "Open Resume", url: RESUME_URL });
    return "Resume opened";
  });

  useConversationClientTool("open_contact", () => {
    sendToParent(MESSAGE_TYPES.OPEN_CONTACT, { url: CONTACT_URL });
    onToolInvoked &&
      onToolInvoked({ kind: "contact", title: "Contact Preeti", url: CONTACT_URL });
    return "Contact section opened";
  });

  useConversationClientTool("open_linkedin", () => {
    sendToParent(MESSAGE_TYPES.OPEN_EXTERNAL, {
      kind: "linkedin",
      url: LINKEDIN_URL,
    });
    onToolInvoked &&
      onToolInvoked({ kind: "linkedin", title: "Open LinkedIn", url: LINKEDIN_URL });
    return "LinkedIn opened";
  });
}
