(() => {
  "use strict";

  const ARRIVAL_KEY = "lmTransitionArriving";
  const THEME_KEY = "lmTransitionTheme";
  const LABEL_KEY = "lmTransitionLabel";
  const DURATION = 620;
  const NAVIGATE_AT = 520;

  const THEMES = {
    home:       { rgb: "41 247 255",  color: "#29f7ff" },
    features:   { rgb: "0 255 200",   color: "#00ffc8" },
    events:     { rgb: "255 79 216",  color: "#ff4fd8" },
    merch:      { rgb: "255 224 113", color: "#ffe071" },
    prompts:    { rgb: "138 92 255",  color: "#8a5cff" },
    guide:      { rgb: "94 255 157",  color: "#5eff9d" },
    studio:     { rgb: "61 123 255",  color: "#3d7bff" },
    beat2lotto: { rgb: "255 105 45",  color: "#ff692d" },
    spheres:    { rgb: "255 200 74",  color: "#ffc84a" }
  };

  const overlay = document.querySelector("[data-lm-page-transition]");
  const video = overlay?.querySelector("[data-lm-transition-video]");
  const label = overlay?.querySelector("[data-lm-transition-label]");

  if (!overlay || !video) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scriptElement =
    document.currentScript ||
    document.querySelector('script[src*="lm-page-transition.js"]');

  const videoBase = scriptElement
    ? new URL("../video/transitions/", scriptElement.src)
    : new URL("./assets/video/transitions/", window.location.href);

  const preloaded = new Map();
  const MAX_PRELOADED_CLIPS = 4;
  let transitioning = false;
  let navigationTimer = 0;
  let cleanupTimer = 0;

  function normalizeTheme(value) {
    return Object.prototype.hasOwnProperty.call(THEMES, value) ? value : "home";
  }

  function themeForPath(pathname) {
    const path = decodeURIComponent(pathname || "").toLowerCase();
    const filename = path.split("/").filter(Boolean).pop() || "";

    if (/beat2lotto/.test(path)) return "beat2lotto";
    if (/lottery-spheres|selcirm|spheres/.test(path)) return "spheres";
    if (/lottomind-stem-studio|stem-studio|studio/.test(path)) return "studio";
    if (/live-events|events/.test(path)) return "events";
    if (/merch/.test(path)) return "merch";
    if (/prompt/.test(path)) return "prompts";
    if (/how-to-use|guide/.test(path)) return "guide";
    if (/features-app|features/.test(path)) return "features";
    if (!filename || filename === "index.html") return "home";

    return "home";
  }

  function clipUrl(theme, phase) {
    const safeTheme = normalizeTheme(theme);
    const safePhase = phase === "close" ? "close" : "open";
    return new URL(`lm-${safeTheme}-${safePhase}.mp4`, videoBase).href;
  }

  function applyTheme(theme) {
    const safeTheme = normalizeTheme(theme);
    const meta = THEMES[safeTheme];

    overlay.dataset.transitionTheme = safeTheme;
    overlay.style.setProperty("--lm-transition-rgb", meta.rgb);
    overlay.style.setProperty("--lm-transition-color", meta.color);

    return safeTheme;
  }

  function setLabel(text, phase) {
    if (!label) return;

    const clean = String(text || "NEXT SIGNAL").replace(/\s+/g, " ").trim();
    label.textContent = phase === "close"
      ? `${clean.toUpperCase()} - SIGNAL LOCKED`
      : `OPENING ${clean.toUpperCase()}`;
  }

  function preload(theme, phase = "open", eager = false) {
    const url = clipUrl(theme, phase);
    if (preloaded.has(url)) {
      const existing = preloaded.get(url);
      if (eager && existing.preload !== "auto") {
        existing.preload = "auto";
        existing.load();
      }
      return existing;
    }

    const media = document.createElement("video");
    media.preload = eager ? "auto" : "metadata";
    media.muted = true;
    media.playsInline = true;
    media.src = url;
    media.load();
    preloaded.set(url, media);

    while (preloaded.size > MAX_PRELOADED_CLIPS) {
      const staleUrl = preloaded.keys().next().value;
      const staleMedia = preloaded.get(staleUrl);
      staleMedia?.pause?.();
      staleMedia?.removeAttribute?.("src");
      staleMedia?.load?.();
      preloaded.delete(staleUrl);
    }

    return media;
  }

  function preloadCurrentArrival() {
    preload(themeForPath(window.location.pathname), "close", true);
  }

  function preloadLinkDestination(link) {
    if (!link || link.dataset.noTransition === "true") return;

    const href = link.getAttribute("href");
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;

    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      preload(normalizeTheme(link.dataset.transitionTheme || themeForPath(url.pathname)), "open", true);
    } catch (_) {}
  }

  function playVideo(theme, phase) {
    const url = clipUrl(theme, phase);

    video.preload = "auto";
    video.setAttribute("preload", "auto");

    if (video.src !== url) {
      video.src = url;
      video.load();
    }

    try {
      video.currentTime = 0;
    } catch (_) {}

    const playback = video.play();
    playback?.catch?.(() => {
      // The CSS flash and background remain as a graceful visual fallback.
    });
  }

  function activate(theme, phase, text) {
    window.clearTimeout(cleanupTimer);

    const safeTheme = applyTheme(theme);
    setLabel(text, phase);

    overlay.classList.remove("is-opening", "is-closing");
    // Force animation restart when navigating quickly or restoring from bfcache.
    void overlay.offsetWidth;
    overlay.classList.add("is-active", phase === "close" ? "is-closing" : "is-opening");
    document.body.classList.add("lm-page-is-transitioning");

    if (!reduceMotion.matches) playVideo(safeTheme, phase);

    window.dispatchEvent(new CustomEvent("lottomind:page-transition", {
      detail: { phase, theme: safeTheme, label: text || "" }
    }));
  }

  function resetTransition() {
    window.clearTimeout(navigationTimer);
    window.clearTimeout(cleanupTimer);

    video.pause();
    video.removeAttribute("src");
    video.load();

    overlay.classList.remove("is-active", "is-opening", "is-closing");
    document.documentElement.classList.remove("lm-transition-arriving");
    document.body.classList.remove("lm-page-is-transitioning");
    transitioning = false;
  }

  function shouldTransition(event, link) {
    if (!link || event.defaultPrevented || transitioning) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.hasAttribute("download")) return false;
    if (link.dataset.noTransition === "true") return false;

    const target = link.getAttribute("target");
    if (target && target !== "_self") return false;

    const href = link.getAttribute("href");
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return false;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (_) {
      return false;
    }

    if (url.origin !== window.location.origin) return false;

    const sameDocument =
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (sameDocument) return false;

    return true;
  }

  function beginNavigation(link) {
    transitioning = true;

    const url = new URL(link.href, window.location.href);
    const theme = normalizeTheme(link.dataset.transitionTheme || themeForPath(url.pathname));
    const customLabel = link.dataset.transitionTitle;
    const linkText = link.textContent?.replace(/\s+/g, " ").trim();
    const destinationLabel = customLabel || linkText || theme;

    preload(theme, "open", true);

    try {
      sessionStorage.setItem(ARRIVAL_KEY, "yes");
      sessionStorage.setItem(THEME_KEY, theme);
      sessionStorage.setItem(LABEL_KEY, destinationLabel);
    } catch (_) {}

    activate(theme, "open", destinationLabel);

    navigationTimer = window.setTimeout(() => {
      window.location.assign(url.href);
    }, reduceMotion.matches ? 120 : NAVIGATE_AT);
  }

  function playArrival() {
    let arriving = document.documentElement.classList.contains("lm-transition-arriving");
    let theme = themeForPath(window.location.pathname);
    let destinationLabel = document.title || theme;

    try {
      arriving = arriving || sessionStorage.getItem(ARRIVAL_KEY) === "yes";
      theme = normalizeTheme(sessionStorage.getItem(THEME_KEY) || theme);
      destinationLabel = sessionStorage.getItem(LABEL_KEY) || destinationLabel;
      sessionStorage.removeItem(ARRIVAL_KEY);
      sessionStorage.removeItem(THEME_KEY);
      sessionStorage.removeItem(LABEL_KEY);
    } catch (_) {}

    if (!arriving) {
      document.documentElement.classList.remove("lm-transition-arriving");
      return;
    }

    transitioning = true;
    activate(theme, "close", destinationLabel);

    cleanupTimer = window.setTimeout(
      resetTransition,
      reduceMotion.matches ? 150 : DURATION + 70
    );
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!shouldTransition(event, link)) return;

    event.preventDefault();
    beginNavigation(link);
  });

  document.addEventListener("pointerenter", (event) => {
    preloadLinkDestination(event.target.closest?.("a[href]"));
  }, true);

  document.addEventListener("focusin", (event) => {
    preloadLinkDestination(event.target.closest?.("a[href]"));
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resetTransition();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !transitioning) video.pause();
  });

  const schedulePreload = window.requestIdleCallback || ((callback) => setTimeout(callback, 250));
  schedulePreload(preloadCurrentArrival);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", playArrival, { once: true });
  } else {
    playArrival();
  }
})();
