import { useEffect } from "react";
import "@/App.css";
import PortfolioAgent from "@/components/portfolio-agent/PortfolioAgent";

/**
 * The widget is served at the root path. It is designed to be loaded
 * standalone OR inside the /widget.js iframe on any parent site. When
 * embedded (`?embed=1` or nested in an iframe), we:
 *   - tag <body> with `pinky-embedded` so CSS keeps the surface
 *     transparent and click-through,
 *   - broadcast `READY` and continuous `RESIZE` messages to the parent
 *     window so the loader can shrink the iframe to just the floating
 *     button when closed and grow it to fit the conversation panel
 *     when open.
 */
const CLOSED_SIZE = { w: 148, h: 148 };  // floating orb + halo
const OPEN_SIZE   = { w: 680, h: 760 };  // >640 keeps desktop panel layout

function postToParent(type, payload = {}) {
  try {
    window.parent.postMessage(
      { source: "pinky-agent", type, payload },
      "*"
    );
  } catch (e) { /* ignore */ }
}

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const embedded = params.get("embed") === "1" || window.self !== window.top;
    if (!embedded) return;

    document.body.classList.add("pinky-embedded");
    postToParent("READY");
    postToParent("RESIZE", CLOSED_SIZE);

    // The panel opens by adding an element with data-testid="pinky-agent-panel"
    // to the DOM. Watch for that mutation and resize the iframe.
    const observer = new MutationObserver(() => {
      const panelOpen = !!document.querySelector('[data-testid="pinky-agent-panel"]');
      postToParent("RESIZE", panelOpen ? OPEN_SIZE : CLOSED_SIZE);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.body.classList.remove("pinky-embedded");
    };
  }, []);

  return (
    <div
      className="App min-h-screen w-full bg-transparent"
      data-testid="pinky-app-root"
    >
      <PortfolioAgent />
    </div>
  );
}

export default App;
