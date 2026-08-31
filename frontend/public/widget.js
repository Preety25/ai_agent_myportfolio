/*!
 * Pinky Portfolio Agent Widget Loader
 * --------------------------------------------------------------------
 *  <script src="https://<host>/widget.js" async></script>
 *
 *  Renders the Pinky agent as a small floating iframe pinned to the
 *  bottom-right of the parent viewport. Iframe stays as small as the
 *  floating trigger when closed and grows to fit the conversation
 *  panel when opened — never blocks page interaction outside its
 *  own visible surface.
 *
 *  Communication with the parent uses window.postMessage:
 *    widget -> parent
 *      { source:"pinky-agent", type:"READY" }
 *      { source:"pinky-agent", type:"RESIZE", payload:{ w, h } }
 *      { source:"pinky-agent", type:"OPEN_PROJECT",      payload:{id, url} }
 *      { source:"pinky-agent", type:"NAVIGATE",          payload:{destination, url} }
 *      { source:"pinky-agent", type:"SCROLL_TO_SECTION", payload:{sectionId} }
 *      { source:"pinky-agent", type:"OPEN_CONTACT",      payload:{url} }
 *      { source:"pinky-agent", type:"OPEN_EXTERNAL",     payload:{url, kind} }
 * ------------------------------------------------------------------
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.__pinkyWidgetLoaded) return;
  window.__pinkyWidgetLoaded = true;

  var currentScript =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  var WIDGET_ORIGIN = new URL(currentScript.src, window.location.href).origin;

  // Optional data-attributes for parent-side allow-lists / overrides
  function readJsonAttr(name, fallback) {
    try {
      var raw = currentScript.getAttribute(name);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  var CONFIG = {
    projects: readJsonAttr("data-projects", {
      absorb:   "https://preetyux.work/absorb-case-study",
      omnee:    "https://preetyux.work/omnee",
      manulife: "https://preetyux.work/manulife",
    }),
    routes: readJsonAttr("data-routes", {
      home: "/", about: "/#about", work: "/#work",
      contact: "/#connect", connect: "/#connect",
    }),
    sections: readJsonAttr("data-sections", {
      about: "about", work: "work", connect: "connect",
      contact: "connect", process: "process", hero: "hero",
    }),
    resume:   currentScript.getAttribute("data-resume")   || "",
    linkedin: currentScript.getAttribute("data-linkedin") || "",
  };

  // Default (closed) size: just the floating-button hit area including
  // its halo. Grows to whatever the widget requests via RESIZE.
  var CLOSED = { w: 148, h: 148 };
  var iframe;

  function inject() {
    if (document.getElementById("pinky-agent-iframe")) return;
    iframe = document.createElement("iframe");
    iframe.id = "pinky-agent-iframe";
    iframe.title = "Ask Pinky";
    iframe.src = WIDGET_ORIGIN + "/?embed=1";
    iframe.setAttribute("allow",
      "microphone; autoplay; clipboard-write; clipboard-read");
    iframe.setAttribute("scrolling", "no");
    iframe.style.cssText = [
      "position:fixed",
      "bottom:0",
      "right:0",
      "width:"  + CLOSED.w + "px",
      "height:" + CLOSED.h + "px",
      "border:0",
      "background:transparent",
      "z-index:2147483000",
      "pointer-events:auto",
      "color-scheme:normal",
      "transition:width 220ms ease, height 220ms ease",
    ].join(";");
    document.body.appendChild(iframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  /* Message router (widget -> parent) */
  function absolutize(u) {
    if (!u) return null;
    try { return new URL(u, window.location.href).toString(); } catch (e) { return null; }
  }
  function goto(url)  { if (url) window.location.href = url; }
  function popup(url) { if (url) window.open(url, "_blank", "noopener,noreferrer"); }
  function scrollToSection(sectionId) {
    var id = CONFIG.sections[String(sectionId || "").toLowerCase()];
    if (!id) return;
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== WIDGET_ORIGIN) return;
    var data = event.data;
    if (!data || data.source !== "pinky-agent") return;
    var payload = data.payload || {};

    switch (data.type) {
      case "READY":
        // nothing to do; iframe is already visible
        return;
      case "RESIZE": {
        if (!iframe) return;
        var w = Math.max(CLOSED.w, Math.round(payload.w || CLOSED.w));
        var h = Math.max(CLOSED.h, Math.round(payload.h || CLOSED.h));
        iframe.style.width  = w + "px";
        iframe.style.height = h + "px";
        return;
      }
      case "OPEN_PROJECT": {
        var mapped =
          (payload.id && CONFIG.projects[String(payload.id).toLowerCase()]) ||
          payload.url;
        goto(absolutize(mapped));
        return;
      }
      case "NAVIGATE": {
        var routed =
          (payload.destination &&
            CONFIG.routes[String(payload.destination).toLowerCase()]) ||
          payload.url;
        goto(absolutize(routed));
        return;
      }
      case "OPEN_CONTACT":
        goto(absolutize(CONFIG.routes.contact || CONFIG.routes.connect || payload.url));
        return;
      case "OPEN_EXTERNAL": {
        var kind = payload.kind || "external";
        if (kind === "resume"   && CONFIG.resume)   return popup(CONFIG.resume);
        if (kind === "linkedin" && CONFIG.linkedin) return popup(CONFIG.linkedin);
        return popup(payload.url);
      }
      case "SCROLL_TO_SECTION":
        return scrollToSection(payload.sectionId);
      default:
        return;
    }
  });
})();
