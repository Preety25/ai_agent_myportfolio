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
  var readyReceived = false;
  var loadAttempt = 0;
  var MAX_ATTEMPTS = 6;
  var readyWatchdog = null;
  var domObserver = null;

  function log(kind, msg, err) {
    try {
      var line = "[pinky-widget] " + msg;
      if (kind === "error") console.error(line, err || "");
      else if (kind === "warn") console.warn(line);
      else console.info(line);
    } catch (e) { /* noop */ }
  }

  function buildSrc() {
    // Add a per-injection cache-buster so a stale index.html/bundle
    // reference never gets served to the parent — the app itself is
    // always at the same origin/path, so the URL remains stable across
    // Emergent redeployments.
    return WIDGET_ORIGIN + "/?embed=1&v=" + Date.now();
  }

  function armReadyWatchdog() {
    if (readyWatchdog) clearTimeout(readyWatchdog);
    readyWatchdog = setTimeout(function () {
      if (!readyReceived) {
        log("warn", "iframe did not signal READY within 15s — retrying");
        retry();
      }
    }, 15000);
  }

  function retry() {
    if (loadAttempt >= MAX_ATTEMPTS) {
      log("error", "giving up after " + MAX_ATTEMPTS + " load attempts");
      return;
    }
    loadAttempt += 1;
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    iframe = null;
    readyReceived = false;
    // Exponential backoff: 500ms, 1s, 2s, 4s, 8s, 16s (capped)
    var wait = Math.min(500 * Math.pow(2, loadAttempt - 1), 16000);
    setTimeout(inject, wait);
  }

  function inject() {
    if (document.getElementById("pinky-agent-iframe")) return;
    if (!document.body) {
      // Body not ready yet — retry shortly
      setTimeout(inject, 50);
      return;
    }
    iframe = document.createElement("iframe");
    iframe.id = "pinky-agent-iframe";
    iframe.title = "Ask Pinky";
    iframe.src = buildSrc();
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
      "z-index:999999",
      "pointer-events:auto",
      "color-scheme:normal",
      "transition:width 220ms ease, height 220ms ease",
    ].join(";");
    iframe.addEventListener("error", function (e) {
      log("error", "iframe failed to load", e);
      retry();
    });
    iframe.addEventListener("load", function () {
      log("info", "iframe loaded from " + WIDGET_ORIGIN);
    });
    document.body.appendChild(iframe);
    armReadyWatchdog();
    ensureDomWatcher();
  }

  // If some parent-page script (Framer editor, ad blocker rewrite, etc.)
  // removes the iframe node, quietly re-inject it.
  function ensureDomWatcher() {
    if (domObserver || !document.body) return;
    domObserver = new MutationObserver(function () {
      if (!document.getElementById("pinky-agent-iframe")) {
        log("warn", "iframe was removed from DOM — re-injecting");
        loadAttempt = 0;
        readyReceived = false;
        inject();
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: false });
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
        readyReceived = true;
        loadAttempt = 0;
        if (readyWatchdog) { clearTimeout(readyWatchdog); readyWatchdog = null; }
        log("info", "widget READY");
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
