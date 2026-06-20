(() => {
  const header = document.querySelector("[data-site-header], .feature-topbar, .lm-live-topbar, [data-guide-header]");
  if (!header) return;

  const navItems = [
    { label: "Home", href: "./index.html#top", icon: "HM" },
    { label: "Features", href: "./features-app.html", icon: "FX" },
    {
      label: "LottoMind App",
      href: "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/",
      icon: "LM",
      attrs: ' data-vault-launch data-plan="free"',
    },
    { label: "Streams", href: "./live-events.html", icon: "EV" },
    { label: "Spheres", href: "./lottery-spheres.html#spheres", icon: "SP" },
    { label: "Beat2Lotto+", href: "./beat2lotto-plus.html#beat2lotto", icon: "B2" },
    { label: "Merch", href: "./merch-store.html", icon: "MC" },
    { label: "Guide", href: "./how-to-use.html", icon: "GD" },
    { label: "Studio", href: "./lottomind-stem-studio/index.html", icon: "ST" },
  ];

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isCurrent = (item) => {
    const hrefPage = item.href.split("#")[0].split("?")[0].split("/").pop().toLowerCase();
    if (item.label === "Home") return currentPage === "index.html";
    return hrefPage && currentPage === hrefPage;
  };

  const navMarkup = navItems
    .map((item) => {
      const current = isCurrent(item) ? ' aria-current="page"' : "";
      return `<a href="${item.href}" data-icon="${item.icon}"${item.attrs || ""}${current}>${item.label}</a>`;
    })
    .join("");

  document.body.classList.add("home-page", "has-sphere-header", "has-global-sphere-header");

  header.outerHTML = `
    <header class="site-header home-like-header home-sphere-header global-sphere-header" data-site-header>
      <div class="site-header-main">
        <a class="brand" href="./index.html#top" aria-label="LOTTOMINDED ULTRA home">
          <img src="./assets/brand/lm-orb-mark.webp" alt="" />
          <span>LOTTOMINDED ULTRA</span>
        </a>
        <button class="site-header-toggle" type="button" data-header-toggle aria-expanded="true">Menu</button>
      </div>
      <nav aria-label="LOTTOMINDED ULTRA sphere navigation">
        ${navMarkup}
      </nav>
      <div class="direct-launch" aria-label="Direct studio launch">
        <a class="direct-action direct-primary" href="./lottomind-stem-studio/index.html">Launch Studio</a>
      </div>
    </header>
  `;
})();

const SITE_SCRIPT_URL = document.currentScript?.src || new URL("./site.js", document.baseURI).href;
const SITE_ASSET_BASE_URL = new URL("./assets/", SITE_SCRIPT_URL);

const year = document.querySelector("#site-year");
if (year) year.textContent = String(new Date().getFullYear());

const heroMotion = document.querySelector(".hero-motion");
const kineticHero = document.querySelector("[data-kinetic-hero]");
const revealSections = document.querySelectorAll("[data-reveal]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteHeader = document.querySelector("[data-site-header]");
const headerToggle = document.querySelector("[data-header-toggle]");
const siteBackButton = document.querySelector("[data-site-back]");
const siteSoundtrack = document.querySelector("#siteSoundtrack");
const soundtrackButtons = document.querySelectorAll("[data-soundtrack-toggle]");
const startupVideoModal = document.querySelector("[data-startup-video]");
const startupVideoCloseButtons = document.querySelectorAll("[data-startup-video-close]");
const startupMusicStart = document.querySelector("[data-startup-music-start]");
const startupVideoPlayer = startupVideoModal?.querySelector("video");
let startupReturnTimer = 0;
let startupReturnAutoCloseTimer = 0;
const domainStrip = document.querySelector(".domain-strip");
const gamePip = document.querySelector("[data-game-pip]");
const gamePipClose = document.querySelector("[data-game-pip-close]");
const gamePipFrame = gamePip?.querySelector("iframe");
const gamePipHead = gamePip?.querySelector(".home-game-pip-head");
const inlineSoundVideos = document.querySelectorAll("[data-inline-sound-video]");
const memberForm = document.querySelector("[data-member-form]");
const memberDownload = document.querySelector("[data-member-download]");
const memberMessage = document.querySelector("[data-member-message]");
const compactHeaderLabels =
  document.body.classList.contains("prompt-lab-page") ||
  document.body.classList.contains("home-page") ||
  document.body.classList.contains("merch-store-page") ||
  document.body.classList.contains("feature-console-page") ||
  document.body.classList.contains("live-events-page") ||
  document.body.classList.contains("manual-page");
const conciseSoundtrackLabels = document.body.classList.contains("home-page");
const HEADER_COLLAPSED_KEY = "lottominded.ultra.siteHeaderCollapsed.v1";
const STARTUP_MODAL_SEEN_KEY = "lottominded.ultra.homeStartupSeen.v1";
const STARTUP_MODAL_RETURN_DELAY = 40000;
const STARTUP_MODAL_RETURN_VISIBLE_MS = 60000;
const MEMBER_SIGNUP_KEY = "lottominded.ultra.memberSignup.v1";
const PROMPT_ACCESS_KEY = "lottominded.ultra.promptAccess.v1";
const PROMPT_ACCESS_PASSWORD = "lottomind";
const SUPPORT_EMAIL = "robjasper2084@gmail.com";
let soundtrackStartedFromPage = false;
let soundtrackStartedFromHover = false;
let gamePipHideTimer = 0;
let gamePipOpenedAt = 0;
let gamePipShouldResumeSoundtrack = false;
let gamePipResumeFromPage = false;
let gamePipResumeFromHover = false;
let gamePipDragState = null;
let activePasswordGatePanel = null;

function setupNavKineticLabels() {
  document.querySelectorAll(".site-header nav a").forEach((link) => {
    if (!link.dataset.navLabel) link.dataset.navLabel = link.textContent.trim();
  });
}

setupNavKineticLabels();

// Keep the Features flyout preserved for later updates, but hidden for now.
const FEATURE_NAV_DROPDOWN_ENABLED = false;

function setupFeatureDropdown() {
  if (!siteHeader) return;
  if (!FEATURE_NAV_DROPDOWN_ENABLED) return;
  const featureLink = Array.from(siteHeader.querySelectorAll("nav a")).find((link) =>
    link.getAttribute("href")?.includes("features-app.html"),
  );
  if (!featureLink) return;

  const featureItems = [
    ["Beat DNA Engine", "./lottomind-stem-studio/index.html#beat-dna"],
    ["Stem Studio", "./lottomind-stem-studio/index.html#stems"],
    ["DJ Decks", "./lottomind-stem-studio/index.html#dj-decks"],
    ["Touch Pads", "./lottomind-stem-studio/index.html#pads"],
    ["16-Level Pads", "./lottomind-stem-studio/index.html#pads"],
    ["Song Editor", "./lottomind-stem-studio/index.html#song"],
    ["Waveform Studio", "./lottomind-stem-studio/index.html#song"],
    ["Piano Roll", "./lottomind-stem-studio/index.html#piano-roll"],
    ["Pattern Editor", "./lottomind-stem-studio/index.html#patterns"],
    ["AI Master", "./lottomind-stem-studio/index.html#ai-master"],
    ["Vocal Remover", "./lottomind-stem-studio/index.html#vocal-remover"],
    ["Stem Splitter", "./lottomind-stem-studio/index.html#stem-splitter"],
    ["Suno Prompt", "./lottomind-stem-studio/index.html#suno-prompt"],
    ["Video Prompt", "./lottomind-stem-studio/index.html#video-prompt"],
    ["Beat Lottery", "./lottomind-stem-studio/index.html#beat-lottery"],
    ["Lottery Spheres", "./lottery-spheres.html#spheres"],
    ["Creative Bundle", "./lottomind-stem-studio/index.html#creative-bundle"],
    ["Sampler", "./lottomind-stem-studio/index.html#sampler"],
    ["How To Drive Manual", "./how-to-use.html"],
    ["Open Tools Lab", "./features-app.html#support"]
  ];

  const menu = document.createElement("div");
  menu.className = "feature-nav-dropdown";
  menu.id = "featureNavDropdown";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "LOTTOMINDED ULTRA features");
  menu.innerHTML = `
    <div class="feature-nav-dropdown-head">
      <span>Feature Deck</span>
      <strong>LOTTOMINDED ULTRA modules</strong>
    </div>
    <div class="feature-nav-dropdown-grid">
      ${featureItems.map(([label, href]) => `<a href="${href}" role="menuitem">${label}</a>`).join("")}
    </div>
  `;
  siteHeader.appendChild(menu);

  featureLink.setAttribute("aria-haspopup", "true");
  featureLink.setAttribute("aria-expanded", "false");
  featureLink.setAttribute("aria-controls", menu.id);

  let closeTimer = 0;

  const openMenu = () => {
    clearTimeout(closeTimer);
    siteHeader.classList.add("is-feature-menu-open");
    featureLink.setAttribute("aria-expanded", "true");
  };

  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      siteHeader.classList.remove("is-feature-menu-open");
      featureLink.setAttribute("aria-expanded", "false");
    }, 140);
  };

  featureLink.addEventListener("mouseenter", openMenu);
  featureLink.addEventListener("focus", openMenu);
  featureLink.addEventListener("click", (event) => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!isCoarsePointer || siteHeader.classList.contains("is-feature-menu-open")) return;
    event.preventDefault();
    openMenu();
  });
  menu.addEventListener("mouseenter", openMenu);
  menu.addEventListener("mouseleave", scheduleClose);
  siteHeader.addEventListener("mouseleave", scheduleClose);
  siteHeader.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!siteHeader.contains(document.activeElement)) scheduleClose();
    }, 0);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    siteHeader.classList.remove("is-feature-menu-open");
    featureLink.setAttribute("aria-expanded", "false");
  });
}

setupFeatureDropdown();

function openPasswordGatePanel(target, onAllowed) {
  if (!target?.dataset?.passwordGate) return;
  activePasswordGatePanel?.remove();

  const label = target.dataset.passwordLabel || "This section";
  const panel = document.createElement("div");
  panel.className = "password-gate-modal";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", `${label} membership or password required`);
  panel.innerHTML = `
    <form class="password-gate-panel">
      <button class="password-gate-close" type="button" aria-label="Close password panel">X</button>
      <p class="eyebrow">Members Only</p>
      <h2>${label} needs access.</h2>
      <p>Enter the member password or sign up before opening this section.</p>
      <label>
        <span>Password</span>
        <input type="password" name="password" autocomplete="current-password" />
      </label>
      <div class="password-gate-actions">
        <button class="primary-action" type="submit">Unlock</button>
        <a class="secondary-action" href="./how-to-use.html#manual">Sign Up</a>
      </div>
      <p class="password-gate-status" aria-live="polite"></p>
    </form>
  `;

  const close = () => {
    panel.remove();
    if (activePasswordGatePanel === panel) activePasswordGatePanel = null;
  };
  const status = panel.querySelector(".password-gate-status");
  const input = panel.querySelector("input");

  panel.addEventListener("click", (event) => {
    if (event.target === panel) close();
  });
  panel.querySelector(".password-gate-close")?.addEventListener("click", close);
  panel.querySelector("form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = String(input?.value || "").trim().toLowerCase();
    if (password === PROMPT_ACCESS_PASSWORD) {
      sessionStorage.setItem(PROMPT_ACCESS_KEY, target.dataset.passwordGate);
      unlockMatchingPasswordGate(target.dataset.passwordGate);
      close();
      window.setTimeout(() => onAllowed?.(), 20);
      return;
    }
    if (status) status.textContent = "Membership or password required to open this section.";
  });

  document.body.appendChild(panel);
  activePasswordGatePanel = panel;
  window.setTimeout(() => input?.focus(), 30);
}

function confirmPasswordGate(target, onAllowed) {
  if (!target?.dataset?.passwordGate) return true;
  if (isPasswordGateUnlocked(target)) {
    syncPasswordGateState(target);
    return true;
  }

  const label = target.dataset.passwordLabel || "This section";
  let password = null;
  try {
    password = window.prompt(`${label} requires membership or password. Enter password to continue.`);
  } catch {
    openPasswordGatePanel(target, onAllowed);
    return false;
  }

  if (password && password.trim().toLowerCase() === PROMPT_ACCESS_PASSWORD) {
    sessionStorage.setItem(PROMPT_ACCESS_KEY, target.dataset.passwordGate);
    unlockMatchingPasswordGate(target.dataset.passwordGate);
    return true;
  }

  if (password !== null) {
    try {
      window.alert("Membership or password required to open this section.");
    } catch {
      openPasswordGatePanel(target, onAllowed);
    }
  }
  return false;
}

function hasMemberAccess() {
  try {
    const profile = JSON.parse(localStorage.getItem(MEMBER_SIGNUP_KEY) || "null");
    return Boolean(profile?.email);
  } catch {
    return false;
  }
}

function isPasswordGateUnlocked(target) {
  if (!target?.dataset?.passwordGate) return true;
  if (sessionStorage.getItem(PROMPT_ACCESS_KEY) === target.dataset.passwordGate) return true;
  return target.dataset.membershipGate === "true" && hasMemberAccess();
}

  function syncPasswordGateState(target) {
    if (!target?.dataset?.passwordGate) return;
    const unlocked = isPasswordGateUnlocked(target);
    target.classList.toggle("is-password-locked", !unlocked);
    target.classList.toggle("is-password-unlocked", unlocked);
    target.setAttribute("aria-locked", String(!unlocked));
    setPasswordGateDescendants(target, unlocked);
  }

  function setPasswordGateDescendants(target, unlocked) {
    if (!target?.matches?.(".prompt-mini-app")) return;

    target.querySelectorAll("input, button, textarea, select").forEach((control) => {
      if (!unlocked) {
        if (!control.disabled) control.dataset.gateLockedDisabled = "true";
        control.disabled = true;
        control.setAttribute("aria-hidden", "true");
        return;
      }

      if (control.dataset.gateLockedDisabled === "true") control.disabled = false;
      delete control.dataset.gateLockedDisabled;
      control.removeAttribute("aria-hidden");
    });

    target.querySelectorAll("a[href]").forEach((link) => {
      if (!unlocked) {
        if (link.dataset.gateLockedTabindex === undefined) {
          link.dataset.gateLockedTabindex = link.getAttribute("tabindex") || "";
        }
        link.tabIndex = -1;
        link.setAttribute("aria-hidden", "true");
        return;
      }

      if (link.dataset.gateLockedTabindex !== undefined) {
        const previousTabIndex = link.dataset.gateLockedTabindex;
        if (previousTabIndex) {
          link.setAttribute("tabindex", previousTabIndex);
        } else {
          link.removeAttribute("tabindex");
        }
        delete link.dataset.gateLockedTabindex;
      }
      link.removeAttribute("aria-hidden");
    });
  }

function unlockMatchingPasswordGate(gate) {
  if (!gate) return;
  document.querySelectorAll("[data-password-gate]").forEach((target) => {
    if (target.dataset.passwordGate === gate) syncPasswordGateState(target);
  });
}

function getGateUrl(target) {
  return target?.dataset?.href || target?.getAttribute?.("href") || "";
}

function setGate(target, gate, label) {
  if (!target || target.dataset.passwordGate) return;
  target.dataset.passwordGate = gate;
  target.dataset.passwordLabel = label;
  target.dataset.membershipGate = "true";
  const ariaLabel = target.getAttribute("aria-label") || target.textContent.trim() || label;
  if (!/membership|password/i.test(ariaLabel)) {
    target.setAttribute("aria-label", `${ariaLabel} membership or password required`);
  }
}

function setupAccessGateTargets() {
  document.querySelectorAll(".piano-key[href], .piano-key[data-href], .direct-action[href], .site-header nav a[href]").forEach((target) => {
    const url = getGateUrl(target);
    if (url.includes("lottomind-stem-studio")) {
      setGate(target, "studio", "Studio");
      return;
    }

    if (url.includes("prompt-lab.html#beat-suno")) {
      setGate(target, "prompt-lab", "Music Prompt");
      return;
    }

    if (url.includes("prompt-lab.html#beat-video")) {
      setGate(target, "prompt-lab", "Video Prompt");
      return;
    }

    if (url.includes("prompt-lab.html")) {
      setGate(target, "prompt-lab", "Prompt Lab");
    }
  });
}

function setupPasswordGates() {
  document.querySelectorAll("[data-password-gate]").forEach((target) => {
    target.setAttribute("title", target.dataset.membershipGate === "true" ? "Membership or password required" : "Password required");
    if (target.matches(".prompt-mini-app")) {
      target.classList.add("is-members-only-panel");
      if (!target.hasAttribute("tabindex")) target.tabIndex = 0;
    }
    syncPasswordGateState(target);
      target.addEventListener(
        "click",
        (event) => {
          if (target.matches(".prompt-mini-app") && !isPasswordGateUnlocked(target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            openPasswordGatePanel(target, () => {
              syncPasswordGateState(target);
              target.querySelector("input, button, textarea, select, a")?.focus();
            });
            return;
          }

          if (
            confirmPasswordGate(target, () => {
              const href = getGateUrl(target);
            if (href) {
              window.location.href = href;
              return;
            }
            target.querySelector("input, button, textarea, select, a")?.focus();
          })
        ) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true,
    );
    if (target.matches(".prompt-mini-app")) {
      target.addEventListener("keydown", (event) => {
        if ((event.key !== "Enter" && event.key !== " ") || isPasswordGateUnlocked(target)) return;
        event.preventDefault();
        openPasswordGatePanel(target, () => {
          syncPasswordGateState(target);
          target.querySelector("input, button, textarea, select, a")?.focus();
        });
      });
    }
  });
}

setupAccessGateTargets();
setupPasswordGates();

function initPageTransitions() {
  if (reducedMotionQuery.matches) return;
  if (document.querySelector("[data-lm-page-transition]")) return;

  const wipe = document.createElement("div");
  wipe.className = "page-wipe";
  wipe.setAttribute("aria-hidden", "true");
  const transitionVideoUrl = new URL("video/lm-transition-open-3s.mp4", SITE_ASSET_BASE_URL).href;
  const transitionPosterUrl = new URL("video/lm-portal-a-poster.jpg", SITE_ASSET_BASE_URL).href;
  wipe.innerHTML = `
    <video class="page-wipe-video" muted playsinline preload="metadata" poster="${transitionPosterUrl}">
      <source src="${transitionVideoUrl}" type="video/mp4">
    </video>
    <div class="page-wipe-signal" aria-hidden="true"></div>
  `;
  document.body.appendChild(wipe);
  const wipeVideo = wipe.querySelector(".page-wipe-video");

  let transitionPending = false;

  document.addEventListener("click", (event) => {
    if (transitionPending) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || link.getAttribute("aria-disabled") === "true" || link.hasAttribute("disabled")) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download") || link.dataset.noTransition === "true") return;

    const rawHref = link.getAttribute("href") || "";
    if (!rawHref || /^(mailto|tel|javascript|data):/i.test(rawHref)) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const samePage =
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search;
    if (samePage && destination.hash) return;
    if (destination.href === window.location.href) return;

    event.preventDefault();
    transitionPending = true;
    window.LMPageTransitionAudio?.play?.("open");
    const audioNavigationDelay = window.LMPageTransitionAudio?.playCloseBeforeNavigate?.() || 0;
    document.body.classList.add("is-page-leaving");
    wipe.classList.add("is-active");
    if (wipeVideo) {
      try {
        wipeVideo.currentTime = 0;
        wipeVideo.play()?.catch?.(() => {});
      } catch {
        /* Transition video is decorative; navigation should never depend on it. */
      }
    }
    window.setTimeout(() => {
      window.location.href = destination.href;
    }, Math.max(260, audioNavigationDelay));
  });

  window.addEventListener("pageshow", () => {
    transitionPending = false;
    document.body.classList.remove("is-page-leaving");
    wipe.classList.remove("is-active");
    if (wipeVideo) {
      wipeVideo.pause();
      try {
        wipeVideo.currentTime = 0;
      } catch {
        /* Some browsers disallow resetting an unloaded decorative video. */
      }
    }
    window.LMPageTransitionAudio?.playCloseOnArrival?.();
  });
}

initPageTransitions();

function initVideoPerformanceMode() {
  const videos = Array.from(document.querySelectorAll("video"));
  if (!videos.length) return;

  const maxActiveDecorativeVideos = reducedMotionQuery.matches ? 0 : 2;
  const visibleVideos = new Set();
  let transitionCooldownUntil = document.documentElement.classList.contains("lm-transition-arriving")
    ? performance.now() + 900
    : performance.now() + 650;
  let refreshFrame = 0;

  const isTransitionVideo = (video) =>
    video.matches("[data-lm-transition-video], .page-wipe-video") ||
    video.closest("[data-lm-page-transition], .page-wipe");

  const canManageVideo = (video) =>
    !isTransitionVideo(video) &&
    video.dataset.lmVideoUnmanaged !== "true" &&
    (video.autoplay || video.loop || video.muted || video.hasAttribute("poster"));

  const isSoundActive = (video) =>
    video.classList.contains("is-sound-active") ||
    (!video.muted && !video.paused);

  const managedVideos = videos.filter(canManageVideo);
  if (!managedVideos.length) return;

  const isNearViewport = (video, margin = 520) => {
    const rect = video.getBoundingClientRect();
    return rect.bottom >= -margin && rect.top <= window.innerHeight + margin;
  };

  const rememberVideoSources = (video) => {
    if (video.dataset.lmLazySourcesReady === "true") return;
    if (video.hasAttribute("src")) {
      video.dataset.lmLazySrc = video.getAttribute("src");
    }
    video.querySelectorAll("source").forEach((source) => {
      if (source.hasAttribute("src")) source.dataset.lmLazySrc = source.getAttribute("src");
    });
    video.dataset.lmLazySourcesReady = "true";
  };

  const restoreVideoSources = (video) => {
    let changed = false;
    if (video.dataset.lmLazySrc && !video.hasAttribute("src")) {
      video.setAttribute("src", video.dataset.lmLazySrc);
      changed = true;
    }
    video.querySelectorAll("source").forEach((source) => {
      if (source.dataset.lmLazySrc && !source.hasAttribute("src")) {
        source.setAttribute("src", source.dataset.lmLazySrc);
        changed = true;
      }
    });
    if (changed) video.load();
  };

  const unloadVideoSources = (video) => {
    if (isSoundActive(video) || isNearViewport(video, 120)) return;
    let changed = false;
    if (video.dataset.lmLazySrc && video.hasAttribute("src")) {
      video.removeAttribute("src");
      changed = true;
    }
    video.querySelectorAll("source").forEach((source) => {
      if (source.dataset.lmLazySrc && source.hasAttribute("src")) {
        source.removeAttribute("src");
        changed = true;
      }
    });
    if (changed) {
      pauseManagedVideo(video);
      video.load();
    }
  };

  const pauseManagedVideo = (video) => {
    if (isSoundActive(video)) return;
    try {
      video.pause();
    } catch {
      /* Decorative media should never block page interaction. */
    }
  };

  const isPlayableDecorativeVideo = (video) => {
    if (!video.isConnected || document.hidden) return false;
    if (document.body.classList.contains("lm-page-is-transitioning") || performance.now() < transitionCooldownUntil) {
      return false;
    }
    if (video.closest(".is-hidden, [hidden]")) return false;
    if (isSoundActive(video)) return false;
    return Boolean(video.autoplay || video.loop) && video.muted;
  };

  const distanceFromViewportCenter = (video) => {
    const rect = video.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    return Math.abs(center - window.innerHeight / 2);
  };

  const refreshVideoPlayback = () => {
    refreshFrame = 0;

    if (document.hidden) {
      managedVideos.forEach(pauseManagedVideo);
      document.body.dataset.lmActiveVideoCount = "0";
      return;
    }

    if (document.body.classList.contains("lm-page-is-transitioning") || performance.now() < transitionCooldownUntil) {
      managedVideos.forEach(pauseManagedVideo);
      document.body.dataset.lmActiveVideoCount = "0";
      window.setTimeout(scheduleVideoRefresh, 260);
      return;
    }

    const candidates = Array.from(visibleVideos)
      .filter(isPlayableDecorativeVideo)
      .sort((a, b) => distanceFromViewportCenter(a) - distanceFromViewportCenter(b));

    let activeCount = 0;
    candidates.forEach((video, index) => {
      if (index >= maxActiveDecorativeVideos) {
        pauseManagedVideo(video);
        return;
      }

      activeCount += 1;
      restoreVideoSources(video);
      if (!video.paused) return;
      video.play()?.catch?.(() => {
        /* Autoplay can be blocked; the poster remains in place. */
      });
    });

    managedVideos.forEach((video) => {
      if (!visibleVideos.has(video)) {
        pauseManagedVideo(video);
        unloadVideoSources(video);
      }
    });

    document.body.dataset.lmActiveVideoCount = String(activeCount);
  };

  const scheduleVideoRefresh = () => {
    if (refreshFrame) return;
    refreshFrame = window.requestAnimationFrame(refreshVideoPlayback);
  };

  managedVideos.forEach((video) => {
    rememberVideoSources(video);
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    if (!video.hasAttribute("preload") || video.getAttribute("preload") === "auto") {
      video.setAttribute("preload", "metadata");
      video.preload = "metadata";
    }
    video.dataset.lmVideoOptimized = "true";
    if (reducedMotionQuery.matches && video.autoplay && video.muted) pauseManagedVideo(video);
    if (isNearViewport(video, 360)) {
      restoreVideoSources(video);
    } else {
      unloadVideoSources(video);
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          restoreVideoSources(entry.target);
          visibleVideos.add(entry.target);
        } else {
          visibleVideos.delete(entry.target);
          pauseManagedVideo(entry.target);
          unloadVideoSources(entry.target);
        }
      });
      scheduleVideoRefresh();
    }, { rootMargin: "280px 0px", threshold: 0.02 });

    managedVideos.forEach((video) => observer.observe(video));
  } else {
    managedVideos.forEach((video) => {
      restoreVideoSources(video);
      visibleVideos.add(video);
    });
  }

  document.addEventListener("visibilitychange", scheduleVideoRefresh);
  window.addEventListener("scroll", scheduleVideoRefresh, { passive: true });
  window.addEventListener("resize", scheduleVideoRefresh);
  window.addEventListener("pagehide", () => managedVideos.forEach(pauseManagedVideo));
  window.addEventListener("lottomind:page-transition", (event) => {
    const phase = event.detail?.phase;
    transitionCooldownUntil = performance.now() + (phase === "close" ? 760 : 560);
    managedVideos.forEach(pauseManagedVideo);
    window.setTimeout(scheduleVideoRefresh, phase === "close" ? 780 : 580);
  });
  document.addEventListener("play", (event) => {
    if (managedVideos.includes(event.target)) {
      restoreVideoSources(event.target);
      scheduleVideoRefresh();
    }
  }, true);

  window.LMVideoPerformance = {
    refresh: scheduleVideoRefresh,
    getState() {
      return {
        managed: managedVideos.length,
        visible: visibleVideos.size,
        active: Number(document.body.dataset.lmActiveVideoCount || 0)
      };
    }
  };

  document.body.dataset.lmVideoPerformance = "ready";
  window.setTimeout(scheduleVideoRefresh, 820);
}

initVideoPerformanceMode();

function setupManualPianoHeader() {
  if (document.body.classList.contains("has-sphere-header")) return;
  const canUsePianoHeader =
    document.body.classList.contains("manual-page") ||
    document.body.classList.contains("merch-store-page") ||
    document.body.classList.contains("home-page") ||
    document.body.classList.contains("live-events-page") ||
    document.body.classList.contains("feature-console-page") ||
    document.body.classList.contains("prompt-lab-page");
  if (!canUsePianoHeader || !siteHeader) return;
  const pianoHeader = document.querySelector(".ultra-piano-header");
  const headerMain = siteHeader.querySelector(".site-header-main");
  if (!pianoHeader) return;

  document.body.classList.add("has-manual-instrument-header");
  siteHeader.classList.add("manual-instrument-header");
  pianoHeader.classList.add("ultra-piano-header-compact");
  pianoHeader.setAttribute("aria-label", "Compact interactive piano navigation header");
  setupPianoMoodRing(pianoHeader);
  if (pianoHeader.closest("header") !== siteHeader) {
    siteHeader.insertBefore(pianoHeader, headerMain?.nextSibling || siteHeader.firstChild);
  } else if (headerMain && pianoHeader.previousElementSibling !== headerMain) {
    siteHeader.insertBefore(pianoHeader, headerMain.nextSibling);
  }

  const keepsPianoHeaderVisible =
    document.body.classList.contains("feature-console-page") ||
    document.body.classList.contains("live-events-page") ||
    document.body.classList.contains("prompt-lab-page") ||
    document.body.classList.contains("merch-store-page");
  if (keepsPianoHeaderVisible) {
    siteHeader.classList.remove("is-piano-hover-hidden");
    document.body.classList.remove(
      "is-feature-piano-hidden",
      "is-live-piano-hidden",
      "is-prompt-piano-hidden",
      "is-merch-piano-hidden",
      "is-home-piano-hidden",
      "is-manual-piano-hidden",
    );
  } else {
    setupHomePianoHoverToggle(pianoHeader);
  }

  const canHoverReveal = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (
    !canHoverReveal.matches ||
    document.body.classList.contains("home-page") ||
    document.body.classList.contains("feature-console-page") ||
    document.body.classList.contains("merch-store-page") ||
    document.body.classList.contains("live-events-page") ||
    document.body.classList.contains("prompt-lab-page")
  ) return;

  let hideRevealTimer = 0;
  const showReveal = () => {
    window.clearTimeout(hideRevealTimer);
    siteHeader.classList.add("is-header-revealed");
  };
  const hideReveal = () => {
    window.clearTimeout(hideRevealTimer);
    hideRevealTimer = window.setTimeout(() => {
      if (!siteHeader.contains(document.activeElement)) {
        siteHeader.classList.remove("is-header-revealed");
      }
    }, 140);
  };

  siteHeader.addEventListener("mouseenter", showReveal);
  siteHeader.addEventListener("mouseleave", hideReveal);
  siteHeader.addEventListener("focusin", showReveal);
  siteHeader.addEventListener("focusout", hideReveal);
  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.clientY <= 84) {
        showReveal();
        return;
      }

      if (event.clientY > 270 && !siteHeader.matches(":hover")) {
        hideReveal();
      }
    },
    { passive: true },
  );
}

setupManualPianoHeader();
setupHeaderPadMoodRing();

function setupUniversalFloatingMenu() {
  if (document.getElementById("universalPageMenu")) return;

  const links = [
    ["Home", "./how-to-use.html"],
    ["Features", "./features-app.html"],
    ["Events", "./live-events.html"],
    ["LottoMind App", "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/"],
    ["Spheres", "./lottery-spheres.html#spheres"],
    ["Beat2Lotto+", "./beat2lotto-plus.html#beat2lotto"],
    ["Merch", "./merch-store.html"],
    ["Guide", "./how-to-use.html"],
    ["Studio", "./lottomind-stem-studio/index.html"]
  ];

  const existingToggle = document.querySelector("[data-universal-menu-toggle], .motion-menu-toggle, .pl-floating");
  const toggle = existingToggle || document.createElement("button");
  if (!existingToggle) {
    toggle.className = "universal-menu-toggle";
    toggle.textContent = "Menu";
  } else {
    toggle.classList.add("universal-floating-trigger");
    if (!toggle.textContent.trim()) toggle.textContent = "Menu";
  }
  if (toggle.tagName === "BUTTON") toggle.type = "button";
  toggle.dataset.universalMenuToggle = "true";
  toggle.setAttribute("aria-controls", "universalPageMenu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open page menu");

  const menu = document.createElement("div");
  menu.className = "universal-page-menu";
  menu.id = "universalPageMenu";
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");
  menu.setAttribute("aria-label", "Page menu");
  menu.setAttribute("aria-hidden", "true");
  menu.innerHTML = `
    <div class="universal-page-menu-panel" data-hud-panel>
      <button class="universal-page-menu-close" type="button" aria-label="Close page menu">X</button>
      <div class="universal-page-menu-scan" aria-hidden="true"></div>
      <strong><span>LOTTOMINDED ULTRA</span><small>HUD NAV / SIGNAL ROUTE</small></strong>
      <div class="universal-page-menu-status" aria-hidden="true">
        <span>Route online</span>
        <span data-hud-clock>00:00</span>
      </div>
      <nav class="universal-page-menu-links" aria-label="Page menu links">
        ${links.map(([label, href], index) => `<a href="${href}" data-hud-index="${String(index + 1).padStart(2, "0")}"><span>${label}</span><i aria-hidden="true"></i></a>`).join("")}
      </nav>
      <p class="universal-page-menu-readout" data-hud-readout>Point to a route to preview the signal lane.</p>
    </div>
  `;

  const panel = menu.querySelector("[data-hud-panel]");
  const menuLinks = Array.from(menu.querySelectorAll("a[href]"));
  const hudClock = menu.querySelector("[data-hud-clock]");
  const hudReadout = menu.querySelector("[data-hud-readout]");

  const updateHudClock = () => {
    if (!hudClock) return;
    const now = new Date();
    hudClock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const setHudReadout = (link) => {
    if (!hudReadout || !link) return;
    const label = link.textContent.trim();
    const index = link.dataset.hudIndex || "--";
    hudReadout.textContent = `Route ${index} armed: ${label} signal lane ready.`;
  };

  const clearHudReadout = () => {
    if (hudReadout) hudReadout.textContent = "Point to a route to preview the signal lane.";
  };

  const armLink = (link) => {
    menuLinks.forEach((item) => item.classList.toggle("is-armed", item === link));
    setHudReadout(link);
  };

  const setActiveLink = () => {
    const current = new URL(window.location.href);
    menuLinks.forEach((link) => {
      const target = new URL(link.getAttribute("href"), window.location.href);
      const samePath = target.pathname.replace(/\/index\.html$/, "/") === current.pathname.replace(/\/index\.html$/, "/");
      link.classList.toggle("is-active", samePath);
      if (samePath) setHudReadout(link);
    });
  };

  let lastFocus = null;
  const open = () => {
    if (menu.classList.contains("is-open")) return;
    lastFocus = document.activeElement;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("universal-menu-open");
    updateHudClock();
    setActiveLink();
    window.setTimeout(() => (menu.querySelector("a.is-active") || menu.querySelector("a") || menu.querySelector("button"))?.focus(), 20);
  };

  const close = ({ restoreFocus = true } = {}) => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("universal-menu-open");
    menuLinks.forEach((link) => link.classList.remove("is-armed", "is-launching"));
    clearHudReadout();
    if (restoreFocus) lastFocus?.focus?.();
  };

  if (!existingToggle) document.body.append(toggle);
  document.body.append(menu);

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    if (menu.classList.contains("is-open")) {
      close({ restoreFocus: false });
    } else {
      open();
    }
  });

  menu.querySelector(".universal-page-menu-close")?.addEventListener("click", () => close());
  menu.addEventListener("click", (event) => {
    if (event.target === menu) close();
  });

  panel?.addEventListener("pointermove", (event) => {
    const rect = panel.getBoundingClientRect();
    panel.style.setProperty("--hud-x", `${Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)).toFixed(2)}%`);
    panel.style.setProperty("--hud-y", `${Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)).toFixed(2)}%`);
  }, { passive: true });

  menuLinks.forEach((link) => {
    link.addEventListener("pointerenter", () => armLink(link), { passive: true });
    link.addEventListener("focus", () => armLink(link));
    link.addEventListener("pointerleave", () => link.classList.remove("is-armed"), { passive: true });
    link.addEventListener("blur", () => link.classList.remove("is-armed"));
    link.addEventListener("pointerdown", () => link.classList.add("is-launching"));
    link.addEventListener("pointerup", () => link.classList.remove("is-launching"));
    link.addEventListener("pointercancel", () => link.classList.remove("is-launching"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) close();
    if (!menu.classList.contains("is-open") || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key) || !menuLinks.length) return;
    const activeIndex = Math.max(0, menuLinks.indexOf(document.activeElement));
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = menuLinks[(activeIndex + direction + menuLinks.length) % menuLinks.length];
    event.preventDefault();
    next?.focus();
  });
}

setupUniversalFloatingMenu();

function setupSharedLivePlayers() {
  if (document.body.classList.contains("lm-live-page")) return;
  document.querySelectorAll("[data-live-player]").forEach((player) => {
    if (player.dataset.livePlayerReady === "true") return;
    const audio = player.querySelector("[data-live-player-audio]");
    const toggle = player.querySelector("[data-live-player-toggle]");
    const prev = player.querySelector("[data-live-player-prev]");
    const next = player.querySelector("[data-live-player-next]");
    const time = player.querySelector("[data-live-player-time]");
    const wave = player.querySelector(".now-wave");
    if (!audio || !toggle) return;
    player.dataset.livePlayerReady = "true";

    let context = null;
    let analyser = null;
    let data = null;
    let source = null;
    let frame = 0;

    const two = (value) => String(value).padStart(2, "0");
    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
      const safe = Math.floor(seconds);
      const hours = Math.floor(safe / 3600);
      const minutes = Math.floor((safe % 3600) / 60);
      const secs = safe % 60;
      return hours ? `${hours}:${two(minutes)}:${two(secs)}` : `${minutes}:${two(secs)}`;
    };

    const update = () => {
      const isPlaying = !audio.paused && !audio.ended;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const progress = duration ? Math.min(1, Math.max(0, audio.currentTime / duration)) : 0;
      player.classList.toggle("is-playing", isPlaying);
      player.style.setProperty("--player-progress", progress.toFixed(3));
      toggle.textContent = isPlaying ? "II" : "\u25b6";
      toggle.setAttribute("aria-pressed", String(isPlaying));
      toggle.setAttribute("aria-label", isPlaying ? "Pause live mix" : "Play live mix");
      if (time) time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
    };

    const resetWave = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      wave?.style.setProperty("--live-energy", "0");
      wave?.style.setProperty("--live-bass", "0");
    };

    const setupAnalyser = () => {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor || !wave) return;
      context = context || new AudioCtor();
      if (!analyser) {
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;
        data = new Uint8Array(analyser.frequencyBinCount);
        source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
      }
    };

    const startWave = () => {
      if (!analyser || !data || frame) return;
      const render = () => {
        analyser.getByteFrequencyData(data);
        let energy = 0;
        let bass = 0;
        const bassCount = Math.max(1, Math.floor(data.length * 0.18));
        data.forEach((value, index) => {
          const normalized = value / 255;
          energy += normalized;
          if (index < bassCount) bass += normalized;
        });
        energy /= data.length;
        bass /= bassCount;
        wave?.style.setProperty("--live-energy", Math.min(1, energy * 2.1).toFixed(3));
        wave?.style.setProperty("--live-bass", Math.min(1, bass * 2.4).toFixed(3));
        frame = window.requestAnimationFrame(render);
      };
      frame = window.requestAnimationFrame(render);
    };

    const togglePlayback = async () => {
      if (audio.paused || audio.ended) {
        try {
          setupAnalyser();
          await context?.resume?.();
          audio.volume = 0.72;
          await audio.play();
          startWave();
        } catch {
          player.classList.add("needs-user-audio");
        }
      } else {
        audio.pause();
        resetWave();
      }
      update();
    };

    toggle.addEventListener("click", togglePlayback);
    prev?.addEventListener("click", () => {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
      update();
    });
    next?.addEventListener("click", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 15;
      audio.currentTime = Math.min(duration, audio.currentTime + 15);
      update();
    });
    ["loadedmetadata", "timeupdate", "play", "pause", "ended", "durationchange"].forEach((eventName) => {
      audio.addEventListener(eventName, update);
    });
    audio.addEventListener("play", startWave);
    audio.addEventListener("pause", resetWave);
    audio.addEventListener("ended", resetWave);
    update();
    resetWave();
  });
}

setupSharedLivePlayers();


const REFINED_APP_URL = "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/";
const VAULT_KEYS = {
  plan: "lottomind_plan",
  credits: "lottomind_credits",
  ledger: "lottomind_credit_ledger",
  unlockedUntil: "lottomind_unlocked_until",
  dailyUsage: "lottomind_daily_usage",
  betaAccess: "lottomind_beta_access"
};
const VAULT_DISCLAIMER = "LottoMind and LottoCredits are for entertainment, organization, music creation, and creative number journaling only. LottoCredits have no cash value and cannot be redeemed for money, prizes, lottery tickets, or gambling. LottoMind does not predict winning lottery numbers.";
const VAULT_DEMO_PASS_MS = 10 * 60 * 1000;

function readVaultNumber(key, fallback = 0) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function readVaultLedger() {
  try {
    return JSON.parse(localStorage.getItem(VAULT_KEYS.ledger) || "[]");
  } catch {
    return [];
  }
}

function writeVaultLedger(entry) {
  const ledger = [entry, ...readVaultLedger()].slice(0, 25);
  localStorage.setItem(VAULT_KEYS.ledger, JSON.stringify(ledger));
}

function getVaultState() {
  const now = Date.now();
  const plan = localStorage.getItem(VAULT_KEYS.plan) || "free";
  let unlockedUntil = readVaultNumber(VAULT_KEYS.unlockedUntil);
  if (plan === "free" && unlockedUntil > now + VAULT_DEMO_PASS_MS) {
    unlockedUntil = now + VAULT_DEMO_PASS_MS;
    localStorage.setItem(VAULT_KEYS.unlockedUntil, String(unlockedUntil));
  }
  const passActive = unlockedUntil > now;
  const vaultActive = ["gold", "ultra"].includes(plan) || passActive;
  return {
    plan,
    credits: readVaultNumber(VAULT_KEYS.credits),
    unlockedUntil,
    passActive,
    vaultActive,
    betaAccess: localStorage.getItem(VAULT_KEYS.betaAccess) === "true"
  };
}

function setVaultState(next = {}) {
  const current = getVaultState();
  const plan = next.plan || current.plan || "free";
  const credits = Number.isFinite(Number(next.credits)) ? Number(next.credits) : current.credits;
  localStorage.setItem(VAULT_KEYS.plan, plan);
  localStorage.setItem(VAULT_KEYS.credits, String(Math.max(0, Math.round(credits))));
  if (Number.isFinite(Number(next.unlockedUntil))) {
    localStorage.setItem(VAULT_KEYS.unlockedUntil, String(Number(next.unlockedUntil)));
  }
  if (typeof next.betaAccess === "boolean") {
    localStorage.setItem(VAULT_KEYS.betaAccess, String(next.betaAccess));
  }
  window.dispatchEvent(new CustomEvent("lottomind:vault-updated", { detail: getVaultState() }));
}

function addVaultCredits(amount, reason) {
  const state = getVaultState();
  const nextCredits = state.credits + amount;
  setVaultState({ credits: nextCredits });
  writeVaultLedger({ amount, reason, createdAt: new Date().toISOString(), balance: nextCredits });
}

function buildRefinedLaunchUrl(state = getVaultState(), override = {}) {
  const plan = override.plan || state.plan || "free";
  const launchUrl = new URL(override.href || REFINED_APP_URL, window.location.href);
  const params = launchUrl.searchParams;
  params.set("plan", plan);
  params.set("credits", String(state.credits || 0));
  if (override.tool) params.set("tool", override.tool);
  if (plan === "gold" || plan === "ultra" || state.vaultActive || override.vault === "active") params.set("vault", "active");
  if (override.pass === "10min" || state.passActive) params.set("pass", "10min");
  if (state.betaAccess) params.set("beta", "active");
  return launchUrl.toString();
}

function setupLottoMindVaultGateway() {
  const hasGatewayTargets = document.querySelector("[data-vault-launch], [data-vault-open], [data-beta-waitlist]") || document.body.classList.contains("home-page");
  if (!hasGatewayTargets) return;

  const badge = document.createElement("button");
  badge.className = "vault-credit-badge";
  badge.type = "button";
  badge.dataset.vaultOpen = "true";
  badge.setAttribute("aria-label", "Open LottoMind Vault Gateway");
  document.body.appendChild(badge);

  const modal = document.createElement("div");
  modal.className = "vault-gateway-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("aria-label", "LottoMind Vault Gateway");
  modal.innerHTML = `
    <div class="vault-gateway-panel">
      <button class="vault-gateway-close" type="button" aria-label="Close LottoMind Vault Gateway">X</button>
      <p class="eyebrow">LottoMind Vault Gateway</p>
      <h2>LottoMind Vault Gateway</h2>
      <p class="vault-gateway-copy">Choose an access lane before entering LottoMind Refined. Premium tools stay locked unless credits, Ultra access, or a 10-minute demo pass is active.</p>
      <div class="vault-gateway-status" data-vault-gateway-status aria-live="polite"></div>
      <div class="vault-gateway-actions">
        <button type="button" data-vault-choice="pass">Use 10-Min Demo</button>
        <button type="button" data-vault-choice="credits">Buy Credits</button>
        <button type="button" class="primary-action" data-vault-continue>Continue to App</button>
      </div>
      <p class="vault-gateway-disclaimer">${VAULT_DISCLAIMER}</p>
    </div>
  `;
  document.body.appendChild(modal);

  const statusTargets = document.querySelectorAll("[data-vault-status], [data-vault-gateway-status]");
  const update = (message = "") => {
    const state = getVaultState();
    const planLabel = state.plan === "ultra" ? "Ultra" : state.plan === "gold" ? "Gold" : state.passActive ? "10-min demo" : "Free";
    const activeText = state.vaultActive
      ? "Vault Access Active. Premium LottoMind Refined tools unlocked."
      : "Standard access active. Premium tools stay locked inside LottoMind Refined.";
    const text = message || `${activeText} ${state.credits} LottoCredits available.`;
    badge.innerHTML = `<strong>${state.credits}</strong><span>${planLabel} credits</span>`;
    statusTargets.forEach((target) => {
      target.textContent = text;
    });
  };

  const open = (message = "") => {
    update(message);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("vault-gateway-open");
    window.setTimeout(() => modal.querySelector("button")?.focus(), 20);
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vault-gateway-open");
  };

  let pendingLaunchOverride = {};

  const launch = (override = {}) => {
    window.location.href = buildRefinedLaunchUrl(getVaultState(), override);
  };

  modal.querySelector(".vault-gateway-close")?.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  document.querySelectorAll("[data-vault-launch]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const requestedPlan = link.dataset.plan || "free";
      pendingLaunchOverride = {
        href: link.href,
        tool: link.dataset.vaultTool || ""
      };
      open(requestedPlan === "free" ? "Continue to App when ready." : "Vault lane selected. Choose access or continue.");
    });
  });

  document.querySelectorAll("[data-vault-open]").forEach((button) => {
    button.addEventListener("click", () => {
      pendingLaunchOverride = {};
      open();
    });
  });

  document.querySelectorAll("[data-beta-waitlist]").forEach((button) => {
    button.addEventListener("click", () => {
      if (localStorage.getItem(VAULT_KEYS.betaAccess) !== "true") {
        addVaultCredits(25, "Beta waitlist demo award");
      }
      setVaultState({ betaAccess: true });
      pendingLaunchOverride = {};
      open("Beta access saved. You earned 25 LottoCredits.");
    });
  });

  modal.querySelectorAll("[data-vault-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.vaultChoice;
      if (choice === "free") {
        setVaultState({ plan: "free" });
        update("Standard access selected. Continue to App when ready.");
      }
      if (choice === "gold") {
        const credits = Math.max(getVaultState().credits, 500);
        setVaultState({ plan: "gold", credits });
        update("Vault Access Active. Premium LottoMind Refined tools unlocked.");
      }
      if (choice === "pass") {
        setVaultState({ plan: "free", unlockedUntil: Date.now() + VAULT_DEMO_PASS_MS });
        update("10-minute demo pass active. Premium LottoMind Refined tools unlocked for this demo window.");
      }
      if (choice === "credits") {
        addVaultCredits(250, "Demo credit pack");
        update("250 LottoCredits added in demo mode.");
      }
    });
  });

  modal.querySelector("[data-vault-continue]")?.addEventListener("click", () => launch(pendingLaunchOverride));
  badge.addEventListener("click", () => {
    pendingLaunchOverride = {};
    open();
  });
  window.addEventListener("lottomind:vault-updated", () => update());
  update();
}

setupLottoMindVaultGateway();
function getReactivePoint(event) {
  if (event?.touches?.length) return { x: event.touches[0].clientX, y: event.touches[0].clientY, touch: true };
  if (event?.changedTouches?.length) return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY, touch: true };
  if (Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY)) {
    return { x: event.clientX, y: event.clientY, touch: event.pointerType === "touch" };
  }
  return null;
}

function setupUniversalInteractionReactivity() {
  const reactiveTargets = document.querySelectorAll([
    "[data-site-header]",
    ".guide-header",
    ".site-header-main",
    ".ultra-piano-header",
    "nav",
    "a[href]",
    "button",
    "summary",
    "[role='button']",
    "[role='tab']",
    ".direct-action",
    ".primary-action",
    ".secondary-action",
    ".piano-key",
    ".stream-event-card",
    ".product-card",
    ".feature-tool-card",
    ".magnetic-card",
    ".sphere-info-grid article",
    ".feature-nav-dropdown-grid a",
    ".gallery-grid article",
  ].join(","));

  reactiveTargets.forEach((target, index) => {
    if (target.dataset.interactionReactiveReady === "true") return;
    target.dataset.interactionReactiveReady = "true";
    target.classList.add("is-interaction-reactive");
    target.style.setProperty("--reactive-hue", String((index * 29 + 176) % 360));

    let touchReleaseTimer = 0;
    let sphereReleaseTimer = 0;
    const isSphereNavButton = target.matches?.(".home-sphere-header nav a");
    const isDisabled = () => target.matches?.(":disabled, [aria-disabled='true']");

    const setReactivePoint = (event, forceTouch = false) => {
      if (isDisabled()) return;
      const point = getReactivePoint(event);
      if (!point) return;
      const rect = target.getBoundingClientRect();
      const x = rect.width ? Math.max(0, Math.min(1, (point.x - rect.left) / rect.width)) : 0.5;
      const y = rect.height ? Math.max(0, Math.min(1, (point.y - rect.top) / rect.height)) : 0.5;
      const hue = Math.round((((index * 29 + 176) % 360) + x * 104 + y * 46) % 360);
      target.style.setProperty("--reactive-hue", String(hue));
      target.style.setProperty("--reactive-x", `${Math.round(x * 100)}%`);
      target.style.setProperty("--reactive-y", `${Math.round(y * 100)}%`);
      target.classList.add("is-pointer-reactive");
      if (point.touch || forceTouch) target.classList.add("is-touch-reactive");
    };

    const press = (event, forceTouch = false) => {
      if (isDisabled()) return;
      if (event?.button && event.button > 0) return;
      window.clearTimeout(touchReleaseTimer);
      if (isSphereNavButton) {
        window.clearTimeout(sphereReleaseTimer);
        target.classList.remove("is-sphere-released");
        target.classList.add("is-sphere-pressed");
      }
      setReactivePoint(event, forceTouch);
      target.classList.add("is-pressed");
      if (forceTouch || event?.pointerType === "touch" || event?.touches?.length) {
        target.classList.add("is-touch-active");
      }
    };

    const release = () => {
      const wasSpherePressed = isSphereNavButton && target.classList.contains("is-sphere-pressed");
      target.classList.remove("is-pressed");
      target.classList.remove("is-sphere-pressed");
      if (wasSpherePressed) {
        target.classList.add("is-sphere-released");
        window.clearTimeout(sphereReleaseTimer);
        sphereReleaseTimer = window.setTimeout(() => {
          target.classList.remove("is-sphere-released");
        }, 320);
      }
      touchReleaseTimer = window.setTimeout(() => {
        target.classList.remove("is-touch-active", "is-touch-reactive");
      }, 220);
    };

    const clearHover = () => {
      target.classList.remove("is-pointer-reactive", "is-mouse-reactive");
      release();
    };

    const mouseFallback = !window.PointerEvent;
    target.addEventListener("pointerenter", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      setReactivePoint(event);
      target.classList.add("is-mouse-reactive");
    });
    target.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      setReactivePoint(event);
      target.classList.add("is-mouse-reactive");
    }, { passive: true });
    target.addEventListener("pointerdown", (event) => press(event));
    target.addEventListener("pointerup", release);
    target.addEventListener("pointercancel", clearHover);
    target.addEventListener("pointerleave", clearHover);
    if (mouseFallback) {
      target.addEventListener("mouseenter", (event) => {
        setReactivePoint(event);
        target.classList.add("is-mouse-reactive");
      });
      target.addEventListener("mousemove", (event) => {
        setReactivePoint(event);
        target.classList.add("is-mouse-reactive");
      }, { passive: true });
      target.addEventListener("mousedown", (event) => press(event));
      target.addEventListener("mouseup", release);
      target.addEventListener("mouseleave", clearHover);
    }
    target.addEventListener("touchstart", (event) => press(event, true), { passive: true });
    target.addEventListener("touchmove", (event) => setReactivePoint(event, true), { passive: true });
    target.addEventListener("touchend", release, { passive: true });
    target.addEventListener("touchcancel", clearHover, { passive: true });
    target.addEventListener("focusin", () => target.classList.add("is-focus-reactive"));
    target.addEventListener("focusout", () => target.classList.remove("is-focus-reactive", "is-pointer-reactive", "is-touch-reactive"));
    target.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      press(event);
    });
    target.addEventListener("keyup", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      release();
    });
  });
}

setupUniversalInteractionReactivity();

function setupPromptCardSpheres() {
  const cards = document.querySelectorAll("[data-prompt-sphere-card]");
  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.dataset.promptSphereReady === "true") return;
    const field = card.querySelector("[data-prompt-sphere-field]");
    const balls = Array.from(card.querySelectorAll(".prompt-card-sphere-ball"));
    if (!field || !balls.length) return;
    card.dataset.promptSphereReady = "true";

    const moveBalls = (event) => {
      const point = getReactivePoint(event);
      if (!point) return;
      const rect = field.getBoundingClientRect();
      const px = rect.width ? Math.max(0, Math.min(1, (point.x - rect.left) / rect.width)) : 0.5;
      const py = rect.height ? Math.max(0, Math.min(1, (point.y - rect.top) / rect.height)) : 0.5;
      card.classList.add("is-sphere-reactive");
      field.style.setProperty("--sphere-pointer-x", `${Math.round(px * 100)}%`);
      field.style.setProperty("--sphere-pointer-y", `${Math.round(py * 100)}%`);

      balls.forEach((ball, index) => {
        const bx = Number.parseFloat(ball.dataset.ballX || ball.style.getPropertyValue("--ball-x")) / 100 || 0.5;
        const by = Number.parseFloat(ball.dataset.ballY || ball.style.getPropertyValue("--ball-y")) / 100 || 0.5;
        const dx = (px - bx) * (index % 2 ? -34 : 42);
        const dy = (py - by) * (index % 2 ? 30 : -26);
        const energy = Math.max(0.2, 1 - Math.hypot(px - bx, py - by));
        ball.style.setProperty("--ball-dx", `${dx.toFixed(1)}px`);
        ball.style.setProperty("--ball-dy", `${dy.toFixed(1)}px`);
        ball.style.setProperty("--ball-energy", energy.toFixed(2));
      });
    };

    const resetBalls = () => {
      card.classList.remove("is-sphere-reactive");
      balls.forEach((ball) => {
        ball.style.setProperty("--ball-dx", "0px");
        ball.style.setProperty("--ball-dy", "0px");
        ball.style.setProperty("--ball-energy", "0");
      });
    };

    card.addEventListener("pointermove", moveBalls, { passive: true });
    card.addEventListener("pointerenter", moveBalls, { passive: true });
    card.addEventListener("pointerleave", resetBalls, { passive: true });
    card.addEventListener("touchstart", moveBalls, { passive: true });
    card.addEventListener("touchmove", moveBalls, { passive: true });
    card.addEventListener("touchend", resetBalls, { passive: true });
    card.addEventListener("touchcancel", resetBalls, { passive: true });
  });
}

setupPromptCardSpheres();

function setupPianoMoodRing(pianoHeader) {
  const keys = pianoHeader.querySelectorAll(".piano-key");
  keys.forEach((key, index) => {
    if (key.dataset.moodRingReady === "true") return;
    key.dataset.moodRingReady = "true";
    const baseHue = (index * 31 + 38) % 360;
    key.style.setProperty("--mood-hue", String(baseHue));

    const updateMood = (event) => {
      const rect = key.getBoundingClientRect();
      const x = rect.width ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0.5;
      const y = rect.height ? Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) : 0.35;
      const hue = Math.round((baseHue + x * 96 + y * 42) % 360);
      key.style.setProperty("--mood-hue", String(hue));
      key.style.setProperty("--mood-x", `${Math.round(x * 100)}%`);
      key.style.setProperty("--mood-y", `${Math.round(y * 100)}%`);
      key.classList.add("is-mood-ring");
    };

    key.addEventListener("pointerenter", updateMood);
    key.addEventListener("pointermove", updateMood, { passive: true });
    key.addEventListener("pointerleave", () => key.classList.remove("is-mood-ring"));
  });
}

function setupHeaderPadMoodRing() {
  if (!siteHeader) return;
  const pads = siteHeader.querySelectorAll("nav a, .direct-action");
  pads.forEach((pad, index) => {
    if (pad.dataset.moodRingReady === "true") return;
    pad.dataset.moodRingReady = "true";
    const baseHue = (index * 37 + 112) % 360;
    pad.style.setProperty("--mood-hue", String(baseHue));

    const updateMood = (event) => {
      const rect = pad.getBoundingClientRect();
      const x = rect.width ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0.5;
      const y = rect.height ? Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) : 0.35;
      const hue = Math.round((baseHue + x * 118 + y * 54) % 360);
      pad.style.setProperty("--mood-hue", String(hue));
      pad.style.setProperty("--mood-x", `${Math.round(x * 100)}%`);
      pad.style.setProperty("--mood-y", `${Math.round(y * 100)}%`);
      pad.classList.add("is-mood-ring");
    };

    pad.addEventListener("pointerenter", updateMood);
    pad.addEventListener("pointermove", updateMood, { passive: true });
    pad.addEventListener("pointerleave", () => pad.classList.remove("is-mood-ring"));
  });
}

function setupHomePianoHoverToggle(pianoHeader) {
  if (!siteHeader || !pianoHeader) return;
  if (siteHeader.dataset.pianoHoverToggleReady === "true") return;
  siteHeader.dataset.pianoHoverToggleReady = "true";

  let revealTimer = 0;
  const hiddenBodyClass = document.body.classList.contains("prompt-lab-page")
    ? "is-prompt-piano-hidden"
    : document.body.classList.contains("merch-store-page")
      ? "is-merch-piano-hidden"
      : document.body.classList.contains("live-events-page")
        ? "is-live-piano-hidden"
        : document.body.classList.contains("feature-console-page")
          ? "is-feature-piano-hidden"
          : document.body.classList.contains("manual-page")
            ? "is-manual-piano-hidden"
            : "is-home-piano-hidden";
  const sensor = document.createElement("div");
  sensor.className = "manual-header-hover-sensor";
  sensor.setAttribute("aria-hidden", "true");
  document.body.append(sensor);

  const setHidden = (hidden) => {
    siteHeader.classList.toggle("is-piano-hover-hidden", hidden);
    document.body.classList.toggle(hiddenBodyClass, hidden);
  };

  const hideFromPiano = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    window.clearTimeout(revealTimer);
    setHidden(true);
  };

  const revealFromHeaderHover = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    if (!siteHeader.classList.contains("is-piano-hover-hidden")) return;
    window.clearTimeout(revealTimer);
    revealTimer = window.setTimeout(() => setHidden(false), 80);
  };

  pianoHeader.addEventListener("pointerenter", hideFromPiano);
  pianoHeader.addEventListener("mouseenter", hideFromPiano);
  siteHeader.addEventListener("pointerenter", revealFromHeaderHover);
  siteHeader.addEventListener("mouseenter", revealFromHeaderHover);
  sensor.addEventListener("pointerenter", revealFromHeaderHover, { passive: true });
  sensor.addEventListener("pointermove", revealFromHeaderHover, { passive: true });
  sensor.addEventListener("pointerover", revealFromHeaderHover, { passive: true });
  sensor.addEventListener("mouseenter", revealFromHeaderHover);
  sensor.addEventListener("mousemove", revealFromHeaderHover);
  sensor.addEventListener("mouseover", revealFromHeaderHover);

  siteHeader.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;
      const isHidden = siteHeader.classList.contains("is-piano-hover-hidden");
      const touchedPiano = pianoHeader.contains(event.target);
      if (!isHidden && !touchedPiano) return;
      event.preventDefault();
      window.clearTimeout(revealTimer);
      setHidden(!isHidden);
    },
    { passive: false },
  );

  sensor.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;
      event.preventDefault();
      window.clearTimeout(revealTimer);
      setHidden(false);
    },
    { passive: false },
  );

  const revealFromTop = (event) => {
    if (!siteHeader.classList.contains("is-piano-hover-hidden")) return;
    const headerMain = siteHeader.querySelector(".site-header-main");
    const comebackLine = Math.max((headerMain?.getBoundingClientRect().bottom || 58) + 16, 78);
    if (event.clientY <= comebackLine) setHidden(false);
  };

  const syncHoverFromPointer = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    const pianoRect = pianoHeader.getBoundingClientRect();
    const isInsidePiano =
      event.clientX >= pianoRect.left &&
      event.clientX <= pianoRect.right &&
      event.clientY >= pianoRect.top &&
      event.clientY <= pianoRect.bottom;
    if (isInsidePiano && !siteHeader.classList.contains("is-piano-hover-hidden")) {
      hideFromPiano(event);
      return;
    }
    revealFromTop(event);
  };

  document.addEventListener("pointermove", syncHoverFromPointer, { passive: true });
  document.addEventListener("mousemove", syncHoverFromPointer, { passive: true });

  siteHeader.addEventListener("focusin", () => setHidden(false));
}

function setupHomeHeaderHoverReveal() {
  const canUseHoverReveal =
    document.body.classList.contains("home-page") ||
    document.body.classList.contains("prompt-lab-page");
  if (!canUseHoverReveal || !siteHeader) return;
  if (document.body.classList.contains("has-sphere-header")) return;
  if (document.body.classList.contains("has-manual-instrument-header")) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.body.classList.add("has-home-header-hover-reveal");
  const hoverSensor = document.createElement("div");
  hoverSensor.className = "home-header-hover-sensor";
  hoverSensor.setAttribute("aria-hidden", "true");
  document.body.append(hoverSensor);
  let hideHomeHeaderTimer = 0;

  const setHidden = (hidden) => {
    siteHeader.classList.toggle("is-home-header-hidden", hidden);
    document.body.classList.toggle("is-home-header-hidden", hidden);
  };

  const revealHeader = () => {
    window.clearTimeout(hideHomeHeaderTimer);
    setHidden(false);
  };

  const scheduleHeaderHide = () => {
    window.clearTimeout(hideHomeHeaderTimer);
    hideHomeHeaderTimer = window.setTimeout(() => {
      if (siteHeader.matches(":hover") || siteHeader.contains(document.activeElement)) return;
      setHidden(true);
    }, 260);
  };

  siteHeader.addEventListener("mouseenter", revealHeader);
  siteHeader.addEventListener("mouseleave", scheduleHeaderHide);
  siteHeader.addEventListener("focusin", revealHeader);
  siteHeader.addEventListener("focusout", scheduleHeaderHide);
  hoverSensor.addEventListener("mouseenter", revealHeader);
  hoverSensor.addEventListener("pointerenter", revealHeader);
  document.addEventListener("pointermove", (event) => {
    if (siteHeader.classList.contains("is-home-header-hidden")) {
      if (event.clientY <= 24) revealHeader();
      return;
    }
    if (siteHeader.contains(document.activeElement)) return;
    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    if (event.clientY > headerBottom + 28) setHidden(true);
  }, { passive: true });
  window.setTimeout(scheduleHeaderHide, 1400);
}

setupHomeHeaderHoverReveal();

function setupHomeSphereHeaderToggle() {
  if (!siteHeader) return;
  if (!document.body.classList.contains("home-page") || !document.body.classList.contains("has-sphere-header")) return;
  if (siteHeader.dataset.sphereHeaderToggleReady === "true") return;
  siteHeader.dataset.sphereHeaderToggleReady = "true";

  const sensor = document.createElement("div");
  sensor.className = "home-sphere-header-hover-sensor";
  sensor.setAttribute("aria-hidden", "true");
  document.body.append(sensor);

  let toggleTimer = 0;
  let lastRevealAt = 0;
  const setHidden = (hidden) => {
    siteHeader.classList.toggle("is-sphere-hover-hidden", hidden);
    document.body.classList.toggle("is-sphere-header-hidden", hidden);
  };

  const hideHeader = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    if (Date.now() - lastRevealAt < 700) return;
    window.clearTimeout(toggleTimer);
    toggleTimer = window.setTimeout(() => {
      if (Date.now() - lastRevealAt < 700) return;
      if (siteHeader.contains(document.activeElement)) return;
      setHidden(true);
    }, 220);
  };

  const revealHeader = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    lastRevealAt = Date.now();
    window.clearTimeout(toggleTimer);
    setHidden(false);
  };

  siteHeader.addEventListener("pointerenter", hideHeader, { passive: true });
  siteHeader.addEventListener("pointermove", hideHeader, { passive: true });
  siteHeader.addEventListener("mouseenter", hideHeader);
  sensor.addEventListener("pointerenter", revealHeader, { passive: true });
  sensor.addEventListener("pointermove", revealHeader, { passive: true });
  sensor.addEventListener("pointerover", revealHeader, { passive: true });
  sensor.addEventListener("mouseenter", revealHeader);
  sensor.addEventListener("mousemove", revealHeader);
  sensor.addEventListener("mouseover", revealHeader);

  siteHeader.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;
      if (event.target.closest("a, button")) return;
      event.preventDefault();
      window.clearTimeout(toggleTimer);
      setHidden(!siteHeader.classList.contains("is-sphere-hover-hidden"));
    },
    { passive: false },
  );

  sensor.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;
      event.preventDefault();
      window.clearTimeout(toggleTimer);
      setHidden(false);
    },
    { passive: false },
  );

  const syncFromPointer = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    if (siteHeader.classList.contains("is-sphere-hover-hidden")) {
      if (event.clientY <= 78) revealHeader(event);
      return;
    }
    const rect = siteHeader.getBoundingClientRect();
    const isInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (isInside) hideHeader(event);
  };

  document.addEventListener("pointermove", syncFromPointer, { passive: true });
  document.addEventListener("mousemove", syncFromPointer, { passive: true });
  siteHeader.addEventListener("focusin", () => setHidden(false));
}

setupHomeSphereHeaderToggle();

function setupPlainSiteHeaderHoverToggle() {
  if (!siteHeader) return;
  if (document.body.classList.contains("has-manual-instrument-header")) return;
  if (document.body.classList.contains("has-sphere-header")) return;
  if (siteHeader.dataset.plainHeaderHoverToggleReady === "true") return;
  siteHeader.dataset.plainHeaderHoverToggleReady = "true";

  document.body.classList.add("has-universal-header-hover-reveal");
  const sensor = document.createElement("div");
  sensor.className = "universal-header-hover-sensor";
  sensor.setAttribute("aria-hidden", "true");
  document.body.append(sensor);

  let toggleTimer = 0;
  let lastRevealAt = 0;
  const setHidden = (hidden) => {
    siteHeader.classList.toggle("is-universal-header-hidden", hidden);
    document.body.classList.toggle("is-universal-header-hidden", hidden);
  };

  const hideHeader = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    if (Date.now() - lastRevealAt < 700) return;
    window.clearTimeout(toggleTimer);
    toggleTimer = window.setTimeout(() => {
      if (Date.now() - lastRevealAt < 700) return;
      if (siteHeader.contains(document.activeElement)) return;
      setHidden(true);
    }, 220);
  };

  const revealHeader = (event) => {
    if (event?.pointerType && event.pointerType !== "mouse") return;
    lastRevealAt = Date.now();
    window.clearTimeout(toggleTimer);
    setHidden(false);
  };

  siteHeader.addEventListener("pointerenter", hideHeader, { passive: true });
  siteHeader.addEventListener("pointermove", hideHeader, { passive: true });
  siteHeader.addEventListener("mouseenter", hideHeader);
  sensor.addEventListener("pointerenter", revealHeader, { passive: true });
  sensor.addEventListener("pointermove", revealHeader, { passive: true });
  sensor.addEventListener("pointerover", revealHeader, { passive: true });
  sensor.addEventListener("mouseenter", revealHeader);
  sensor.addEventListener("mousemove", revealHeader);
  sensor.addEventListener("mouseover", revealHeader);

  siteHeader.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;
      if (event.target.closest("a, button")) return;
      event.preventDefault();
      window.clearTimeout(toggleTimer);
      setHidden(!siteHeader.classList.contains("is-universal-header-hidden"));
    },
    { passive: false },
  );

  sensor.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch") return;
      event.preventDefault();
      window.clearTimeout(toggleTimer);
      setHidden(false);
    },
    { passive: false },
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (event?.pointerType && event.pointerType !== "mouse") return;
      if (siteHeader.classList.contains("is-universal-header-hidden")) {
        if (event.clientY <= 78) revealHeader(event);
        return;
      }
      const rect = siteHeader.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (isInside) hideHeader(event);
    },
    { passive: true },
  );
  siteHeader.addEventListener("focusin", () => setHidden(false));
}

setupPlainSiteHeaderHoverToggle();

if (siteSoundtrack) {
  siteSoundtrack.loop = false;
  siteSoundtrack.removeAttribute("loop");
  siteSoundtrack.addEventListener("ended", () => {
    soundtrackStartedFromPage = false;
    soundtrackStartedFromHover = false;
    setSoundtrackButtonState(false);
  });
}
const miniGameConfigs = {
  pick3: { label: "Pick 3", type: "digits", count: 3, min: 0, max: 9 },
  pick4: { label: "Pick 4", type: "digits", count: 4, min: 0, max: 9 },
  cash5: { label: "Cash 5", type: "matrix", count: 5, min: 1, max: 39 },
  powerball: { label: "Powerball Style", type: "special", count: 5, min: 1, max: 69, special: "Powerball", sMin: 1, sMax: 26 }
};

function setHeaderCollapsed(collapsed) {
  if (!siteHeader || !headerToggle) return;
  siteHeader.classList.toggle("is-collapsed", collapsed);
  headerToggle.setAttribute("aria-expanded", String(!collapsed));
  headerToggle.textContent = collapsed ? "Show Menu" : compactHeaderLabels ? "Menu" : "Shrink Menu";
  localStorage.setItem(HEADER_COLLAPSED_KEY, collapsed ? "true" : "false");
}

function syncHeroMotionPreference() {
  if (!heroMotion) return;
  if (reducedMotionQuery.matches) {
    heroMotion.pause();
    return;
  }
  heroMotion.play().catch(() => {
    // Some static-file previews block autoplay until the user interacts.
  });
}

reducedMotionQuery.addEventListener?.("change", syncHeroMotionPreference);
syncHeroMotionPreference();

if (kineticHero && !reducedMotionQuery.matches) {
  kineticHero.addEventListener("pointermove", (event) => {
    const rect = kineticHero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    kineticHero.style.setProperty("--mx", `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
    kineticHero.style.setProperty("--my", `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
  });
}

function setupMerchAkariField() {
  const akariSections = document.querySelectorAll("[data-merch-akari]");
  if (!akariSections.length) return;

  akariSections.forEach((section) => {
    const setDropPointer = (event) => {
      const rect = section.getBoundingClientRect();
      const localX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const localY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      section.classList.add("is-akari-hot");
      section.style.setProperty("--drop-light-x", `${(localX * 100).toFixed(2)}%`);
      section.style.setProperty("--drop-light-y", `${(localY * 100).toFixed(2)}%`);
      const shiftX = (localX - 0.5) * 42;
      const shiftY = (localY - 0.5) * 28;
      section.style.setProperty("--drop-field-x", `${shiftX.toFixed(2)}px`);
      section.style.setProperty("--drop-field-y", `${shiftY.toFixed(2)}px`);
      section.style.setProperty("--drop-field-rx", `${(shiftX * -0.35).toFixed(2)}px`);
      section.style.setProperty("--drop-field-ry", `${(shiftY * -0.35).toFixed(2)}px`);
      section.style.setProperty("--drop-field-tilt", `${((localX - 0.5) * 1.4).toFixed(2)}deg`);
    };

    section.addEventListener("pointerenter", (event) => {
      section.classList.add("is-akari-hot");
      setDropPointer(event);
    }, { passive: true });
    section.addEventListener("pointermove", setDropPointer, { passive: true });
    section.addEventListener("pointerleave", () => {
      section.classList.remove("is-akari-hot");
    }, { passive: true });
  });
}

setupMerchAkariField();

function setupSwipeRails() {
  const rails = document.querySelectorAll("[data-swipe-rail]");
  if (!rails.length) return;

  rails.forEach((rail) => {
    let activePointerId = null;
    let startX = 0;
    let startScrollLeft = 0;
    let dragged = false;

    const releaseRail = () => {
      if (activePointerId !== null && rail.releasePointerCapture) {
        try {
          rail.releasePointerCapture(activePointerId);
        } catch {
          // Pointer capture may already be released by the browser.
        }
      }
      activePointerId = null;
      rail.classList.remove("is-swiping");
    };

    rail.addEventListener("dragstart", (event) => event.preventDefault());

    rail.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("button, a, input, select, textarea")) return;
      activePointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = rail.scrollLeft;
      dragged = false;
      rail.classList.add("is-swiping");
      rail.setPointerCapture?.(event.pointerId);
    });

    rail.addEventListener("pointermove", (event) => {
      if (activePointerId !== event.pointerId) return;
      const deltaX = event.clientX - startX;
      if (Math.abs(deltaX) > 3) dragged = true;
      rail.scrollLeft = startScrollLeft - deltaX;
      if (dragged) event.preventDefault();
    }, { passive: false });

    rail.addEventListener("pointerup", releaseRail);
    rail.addEventListener("pointercancel", releaseRail);
    rail.addEventListener("lostpointercapture", releaseRail);

    rail.addEventListener("click", (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);

    rail.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.82, 220), behavior: "smooth" });
    });
  });
}

setupSwipeRails();

function initSplitText() {
  document.querySelectorAll(".motion-text-split h1 > span, .hero h1 > span").forEach((span) => {
    if (!span.dataset.text) span.dataset.text = span.textContent.trim();
  });
  window.requestAnimationFrame(() => document.body.classList.add("motion-page-ready"));
}

function inferMotion(element, index) {
  if (element.dataset.motion) return element.dataset.motion;
  if (element.matches(".feature-tool-card, .command-module-list a")) return index % 2 ? "fly-right" : "fly-left";
  if (element.matches(".prompt-mini-app, .product-card, .gallery-grid article, .manual-dropdowns details")) return "pop";
  if (element.matches(".manual-hero, .feature-console-hero, .merch-hero")) return "blur";
  if (element.matches(".instruction-grid article")) return index % 2 ? "fly-right" : "fly-left";
  return "rise";
}

function initMotionReveal() {
  const motionSelector = [
    "[data-reveal]",
    "[data-motion]",
    ".motion-rise",
    ".motion-fly-left",
    ".motion-fly-right",
    ".motion-pop",
    ".motion-blur-in",
    ".motion-flip",
    ".hero-copy",
    ".feature-tool-card",
    ".command-module-list a",
    ".prompt-mini-app",
    ".product-card",
    ".gallery-grid article",
    ".instruction-grid article",
    ".manual-dropdowns details"
  ].join(",");
  const targets = Array.from(document.querySelectorAll(motionSelector));

  targets.forEach((target, index) => {
    if (!target.dataset.motion) target.dataset.motion = inferMotion(target, index);
    target.classList.add(`motion-${target.dataset.motion === "blur" ? "blur-in" : target.dataset.motion}`);
    target.style.setProperty("--stagger-index", String(index % 8));
    if (!target.style.getPropertyValue("--motion-delay")) {
      target.style.setProperty("--motion-delay", `${Math.min(520, (index % 8) * 70)}ms`);
    }
  });

  if (!targets.length) return;
  if (!("IntersectionObserver" in window) || reducedMotionQuery.matches) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((target) => revealObserver.observe(target));
}

function initMagneticCards() {
  if (reducedMotionQuery.matches || window.matchMedia("(pointer: coarse)").matches) return;
  const selectors = [
    ".home-page .feature-grid article",
    ".home-page .prompt-launch-card",
    ".home-page .prompt-brief-card",
    ".member-gate",
    ".primary-action",
    ".secondary-action",
    ".direct-action",
    ".feature-tool-card",
    ".command-module-list a",
    ".prompt-mini-app",
    ".product-card",
    ".gallery-grid article",
    ".feature-mail-panel",
    ".manual-dropdowns details"
  ].join(",");

  document.querySelectorAll(selectors).forEach((card) => {
    if (card.dataset.magneticBound === "true") return;
    card.dataset.magneticBound = "true";
    card.classList.add("magnetic-card", "signal-hover");
    card.addEventListener("pointermove", (event) => {
      if (isEditableTarget(event.target)) return;
      const rect = card.getBoundingClientRect();
      const localX = (event.clientX - rect.left) / Math.max(1, rect.width);
      const localY = (event.clientY - rect.top) / Math.max(1, rect.height);
      card.style.setProperty("--magnetic-x", `${((localX - 0.5) * 8).toFixed(2)}px`);
      card.style.setProperty("--magnetic-y", `${((localY - 0.5) * 8).toFixed(2)}px`);
      card.style.setProperty("--magnetic-rx", `${((0.5 - localY) * 4).toFixed(2)}deg`);
      card.style.setProperty("--magnetic-ry", `${((localX - 0.5) * 5).toFixed(2)}deg`);
      card.classList.add("is-magnetic-hot");
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-magnetic-hot");
      card.style.setProperty("--magnetic-x", "0px");
      card.style.setProperty("--magnetic-y", "0px");
      card.style.setProperty("--magnetic-rx", "0deg");
      card.style.setProperty("--magnetic-ry", "0deg");
    }, { passive: true });
  });
}

function pulseElement(element, className = "is-copy-pulsed", duration = 900) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function markTypingOutput(field) {
  if (!field) return;
  field.classList.add("is-typing-output");
  field.closest(".prompt-mini-app")?.classList.add("is-output-typing");
  window.setTimeout(() => {
    field.classList.remove("is-typing-output");
    field.closest(".prompt-mini-app")?.classList.remove("is-output-typing");
  }, 1150);
}

function initCopyPulse() {
  document.addEventListener("click", (event) => {
    const copyButton = event.target.closest?.("[data-copy-target], #copyLotto, #copySheetPrompts");
    if (copyButton) pulseElement(copyButton);

    const miniAction = event.target.closest?.("[data-mini-action]")?.dataset.miniAction;
    if (miniAction) {
      window.setTimeout(() => {
        const targetId = {
          suno: "miniSunoOutput",
          video: "miniVideoOutput",
          numbers: "miniLottoOutput"
        }[miniAction];
        markTypingOutput(document.getElementById(targetId));
      }, 0);
    }
  });
}

function initAnchorGlow() {
  const links = Array.from(document.querySelectorAll("a[href*='#']")).filter((link) => {
    try {
      const url = new URL(link.href, window.location.href);
      return url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash;
    } catch {
      return false;
    }
  });
  if (!links.length) return;

  const setActive = (hash) => {
    links.forEach((link) => {
      const active = new URL(link.href, window.location.href).hash === hash;
      link.classList.toggle("nav-signal-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else if (link.getAttribute("aria-current") === "location") link.removeAttribute("aria-current");
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const hash = new URL(link.href, window.location.href).hash;
      window.setTimeout(() => setActive(hash), 0);
    });
  });
  setActive(window.location.hash);
  window.addEventListener("hashchange", () => setActive(window.location.hash));
}

initSplitText();
initMotionReveal();
initMagneticCards();
initCopyPulse();
initAnchorGlow();

window.lottomindRefreshMotion = () => {
  initSplitText();
  initMotionReveal();
  initMagneticCards();
  initAnchorGlow();
};

window.addEventListener("lottomind:motion-refresh", window.lottomindRefreshMotion);

setHeaderCollapsed(localStorage.getItem(HEADER_COLLAPSED_KEY) === "true");
headerToggle?.addEventListener("click", () => {
  setHeaderCollapsed(!siteHeader.classList.contains("is-collapsed"));
});

siteBackButton?.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = "./";
});

function setupInlineSoundVideos() {
  inlineSoundVideos.forEach((video) => {
    video.controls = true;
    video.playsInline = true;
    const soundSurface =
      video.closest("[data-inline-sound-card]") ||
      video.closest(".prompt-video-card, .prompt-video-panel, .merch-drop-video") ||
      video;
    const soundButton = soundSurface.querySelector("[data-inline-sound-button]");

    const setSoundButtonState = (active) => {
      if (!soundButton) return;
      soundButton.classList.toggle("is-active", active);
      soundButton.setAttribute("aria-pressed", String(active));
    };

    setSoundButtonState(false);

    const playWithSound = async () => {
      document.querySelectorAll("audio, video").forEach((media) => {
        if (media === video) return;
        const isSiteAudio =
          media.id === "siteSoundtrack" ||
          media.closest("[data-startup-video]") ||
          media.classList.contains("startup-video-player");
        if (media.tagName === "AUDIO" || isSiteAudio || !media.muted) {
          media.pause();
        }
      });

      try {
        video.muted = false;
        video.volume = Number(video.dataset.inlineSoundVolume || 0.82);
        await video.play();
        video.classList.add("is-sound-active");
        setSoundButtonState(true);
      } catch {
        video.controls = true;
        video.classList.remove("is-sound-active");
        setSoundButtonState(!video.muted);
      }
    };

    video.addEventListener("click", playWithSound);
    if (soundSurface !== video) {
      soundSurface.addEventListener("click", playWithSound);
    }
    soundButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      playWithSound();
    });
    video.addEventListener("focus", playWithSound);
    if (video.dataset.inlineSoundHover === "true") {
      video.addEventListener("pointerenter", playWithSound, { passive: true });
    }
  });
}

setupInlineSoundVideos();

function hasSeenStartupVideo() {
  try {
    return localStorage.getItem(STARTUP_MODAL_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberStartupVideoSeen() {
  try {
    localStorage.setItem(STARTUP_MODAL_SEEN_KEY, "true");
  } catch {
    // Storage may be unavailable in private or locked-down browser modes.
  }
}

function clearStartupReturnAutoClose() {
  if (!startupReturnAutoCloseTimer) return;
  window.clearTimeout(startupReturnAutoCloseTimer);
  startupReturnAutoCloseTimer = 0;
}

async function closeStartupVideo(options = {}) {
  clearStartupReturnAutoClose();
  if (options.remember !== false) rememberStartupVideoSeen();
  startupVideoModal?.classList.add("is-hidden");
  startupVideoModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-startup-modal");
  startupVideoPlayer?.pause();
  if (options.playMusic === false) return;
  await playSiteSoundtrack({ fromPage: true, restart: true, volume: 0.5 });
}

function showStartupVideo() {
  if (!startupVideoModal) {
    startupVideoModal?.classList.add("is-hidden");
    startupVideoModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-startup-modal");
    return;
  }
  document.body.classList.add("has-startup-modal");
  startupVideoModal.classList.remove("is-hidden");
  startupVideoModal.setAttribute("aria-hidden", "false");
  rememberStartupVideoSeen();
  if (!reducedMotionQuery.matches) {
    startupVideoPlayer.muted = false;
    startupVideoPlayer.defaultMuted = false;
    startupVideoPlayer.removeAttribute("muted");
    startupVideoPlayer.volume = 0.86;
    startupVideoPlayer.autoplay = true;
    startupVideoPlayer?.play().catch(() => {
      // Browsers may block autoplay until the first user gesture.
    });
  }
}

function showStartupVideoReturn() {
  if (!startupVideoModal) return;
  document.body.classList.add("has-startup-modal");
  startupVideoModal.classList.remove("is-hidden");
  startupVideoModal.setAttribute("aria-hidden", "false");
  if (!reducedMotionQuery.matches && startupVideoPlayer) {
    startupVideoPlayer.muted = false;
    startupVideoPlayer.defaultMuted = false;
    startupVideoPlayer.removeAttribute("muted");
    startupVideoPlayer.volume = 0.72;
    startupVideoPlayer.currentTime = 0;
    startupVideoPlayer.play().catch(() => {
      // Browsers may block timed playback until the first user gesture.
    });
  }
  clearStartupReturnAutoClose();
  startupReturnAutoCloseTimer = window.setTimeout(() => {
    closeStartupVideo({ remember: false, playMusic: false });
  }, STARTUP_MODAL_RETURN_VISIBLE_MS);
}

function scheduleStartupVideoReturn() {
  if (!startupVideoModal || startupReturnTimer) return;
  startupReturnTimer = window.setTimeout(() => {
    startupReturnTimer = 0;
    showStartupVideoReturn();
  }, STARTUP_MODAL_RETURN_DELAY);
}

function getGamePipOffset() {
  if (!gamePip) return { x: 0, y: 0 };
  const styles = getComputedStyle(gamePip);
  return {
    x: parseFloat(styles.getPropertyValue("--game-pip-x")) || 0,
    y: parseFloat(styles.getPropertyValue("--game-pip-y")) || 0,
  };
}

function clampGamePipOffset(x, y) {
  if (!gamePip) return { x, y };
  const margin = 12;
  const rect = gamePip.getBoundingClientRect();
  const baseLeft = (window.innerWidth - rect.width) / 2;
  const baseTop = (window.innerHeight - rect.height) / 2;
  const minX = margin - baseLeft;
  const maxX = window.innerWidth - margin - rect.width - baseLeft;
  const minY = margin - baseTop;
  const maxY = window.innerHeight - margin - rect.height - baseTop;
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

function setGamePipOffset(x, y) {
  if (!gamePip) return;
  const next = clampGamePipOffset(x, y);
  gamePip.style.setProperty("--game-pip-x", `${Math.round(next.x)}px`);
  gamePip.style.setProperty("--game-pip-y", `${Math.round(next.y)}px`);
}

function setupGuidePuckField() {
  const field = document.querySelector("[data-guide-puck-field]");
  if (!field) return;

  const pucks = Array.from(field.querySelectorAll(".branded-puck"));
  if (!pucks.length) return;

  field.classList.add("is-reactive");
  const pointer = {
    x: window.innerWidth * 0.52,
    y: window.innerHeight * 0.42,
    active: false,
    lastMove: 0,
  };

  const puckState = pucks.map((element, index) => {
    const columns = Math.min(3, pucks.length);
    const row = Math.floor(index / columns);
    const column = index % columns;
    const baseX = window.innerWidth * (0.12 + column * 0.34);
    const baseY = window.innerHeight * (0.18 + row * 0.3);
    return {
      element,
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      vx: (index % 2 ? 0.28 : -0.22),
      vy: (index % 3 ? -0.18 : 0.22),
      rotation: index * 24 - 18,
      spin: (index % 2 ? 0.18 : -0.14),
      size: 150 + index * 26,
    };
  });

  function resizeGuideField() {
    puckState.forEach((puck, index) => {
      const columns = Math.min(3, pucks.length);
      const row = Math.floor(index / columns);
      const column = index % columns;
      puck.baseX = window.innerWidth * (0.12 + column * 0.34);
      puck.baseY = window.innerHeight * (0.18 + row * 0.3);
      puck.size = Math.max(110, Math.min(320, 130 + window.innerWidth * 0.035 + index * 22));
      puck.element.style.setProperty("--puck-size", `${puck.size}px`);
    });
  }

  function moveGuidePointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    pointer.lastMove = performance.now();
    field.style.setProperty("--guide-pointer-x", `${event.clientX}px`);
    field.style.setProperty("--guide-pointer-y", `${event.clientY}px`);
    field.style.setProperty("--guide-field-x", `${(event.clientX / window.innerWidth - 0.5) * 24}px`);
    field.style.setProperty("--guide-field-y", `${(event.clientY / window.innerHeight - 0.5) * 18}px`);
    document.body.style.setProperty("--guide-pointer-x", `${event.clientX}px`);
    document.body.style.setProperty("--guide-pointer-y", `${event.clientY}px`);
  }

  function renderGuideField(now) {
    const hot = pointer.active && now - pointer.lastMove < 1600;
    const driftScale = reducedMotionQuery.matches ? 0 : 1;

    puckState.forEach((puck, index) => {
      const orbitX = Math.cos(now * 0.00032 + index) * 42 * driftScale;
      const orbitY = Math.sin(now * 0.00028 + index * 1.7) * 34 * driftScale;
      const targetX = puck.baseX + orbitX;
      const targetY = puck.baseY + orbitY;

      puck.vx += (targetX - puck.x) * 0.006;
      puck.vy += (targetY - puck.y) * 0.006;

      if (hot && !reducedMotionQuery.matches) {
        const dx = puck.x + puck.size * 0.5 - pointer.x;
        const dy = puck.y + puck.size * 0.5 - pointer.y;
        const distance = Math.max(80, Math.hypot(dx, dy));
        const force = Math.min(1, 280 / distance) * 0.42;
        puck.vx += (dx / distance) * force;
        puck.vy += (dy / distance) * force;
      }

      puck.vx *= 0.88;
      puck.vy *= 0.88;
      puck.x += puck.vx;
      puck.y += puck.vy;
      puck.rotation += puck.spin * driftScale + puck.vx * 0.08;

      puck.element.classList.toggle("is-hot", hot);
      puck.element.style.transform = `translate3d(${puck.x}px, ${puck.y}px, 0) rotate(${puck.rotation}deg)`;
    });

    window.requestAnimationFrame(renderGuideField);
  }

  resizeGuideField();
  document.addEventListener("pointermove", moveGuidePointer, { passive: true });
  window.addEventListener("resize", resizeGuideField, { passive: true });
  window.requestAnimationFrame(renderGuideField);
}

setupGuidePuckField();

function setupInstrumentKeyboard() {
  const keyboard = document.querySelector("[data-instrument-keyboard]");
  if (!keyboard) return;

  const noteFreq = {
    C4: 261.63,
    "C#4": 277.18,
    D4: 293.66,
    "D#4": 311.13,
    E4: 329.63,
    F4: 349.23,
    "F#4": 369.99,
    G4: 392,
    "G#4": 415.3,
    A4: 440,
    "A#4": 466.16,
    B4: 493.88,
    C5: 523.25,
    "C#5": 554.37,
    D5: 587.33,
    "D#5": 622.25,
    E5: 659.25,
    F5: 698.46,
    "F#5": 739.99,
    G5: 783.99,
    "G#5": 830.61,
    A5: 880,
    "A#5": 932.33,
    B5: 987.77,
    C6: 1046.5,
  };
  let audioContext = null;
  let scaleTimer = 0;
  let wheelGate = 0;
  let lastWheelNote = "";
  const pressTimers = new WeakMap();

  function getKeyboardAudio() {
    if (!audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      audioContext = new AudioContextCtor();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  }

  function playKeyboardNote(noteName, duration = 0.42, peak = 0.16) {
    const frequency = noteFreq[noteName];
    const context = getKeyboardAudio();
    if (!frequency || !context) return;

    const now = context.currentTime;
    const osc = context.createOscillator();
    const body = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const bodyGain = context.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, now);
    body.type = "sine";
    body.frequency.setValueAtTime(frequency / 2, now);
    bodyGain.gain.setValueAtTime(0.035, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(920, now + duration);
    filter.Q.setValueAtTime(0.86, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(peak * 0.44, now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    body.connect(bodyGain);
    bodyGain.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    body.start(now);
    osc.stop(now + duration + 0.04);
    body.stop(now + duration + 0.04);
  }

  function setKeyPressed(key, pressed) {
    window.clearTimeout(pressTimers.get(key));
    key.classList.toggle("is-pressed", Boolean(pressed));
  }

  function pressKeyMomentarily(key, duration = 150) {
    setKeyPressed(key, true);
    pressTimers.set(
      key,
      window.setTimeout(() => setKeyPressed(key, false), duration),
    );
  }

  function pressHoveredKey(key) {
    if (!key.classList.contains("is-pressed")) {
      playKeyboardNote(key.dataset.note, 0.2, 0.07);
    }
    setKeyPressed(key, true);
  }

  function playScale(scaleKey) {
    const scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"];
    window.clearInterval(scaleTimer);
    let index = 0;
    scaleKey.classList.add("is-demo-active");
    playKeyboardNote(scale[index], 0.28, 0.12);
    index += 1;
    scaleTimer = window.setInterval(() => {
      playKeyboardNote(scale[index], 0.28, 0.12);
      index += 1;
      if (index >= scale.length) {
        window.clearInterval(scaleTimer);
        scaleTimer = 0;
        scaleKey.classList.remove("is-demo-active");
      }
    }, 190);
  }

  function routeInstrumentKey(key) {
    if (!confirmPasswordGate(key, () => routeInstrumentKey(key))) return;
    const action = key.dataset.action;
    if (action === "toggle-scale") {
      playScale(key);
      return;
    }
    if (action === "back") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "./index.html";
      }
      return;
    }
    const target = key.dataset.href || key.getAttribute("href");
    if (target) window.location.href = target;
  }

  keyboard.querySelectorAll("[data-note]").forEach((key) => {
    key.addEventListener(
      "pointerenter",
      () => pressHoveredKey(key),
      { passive: true },
    );
    key.addEventListener("mouseenter", () => pressHoveredKey(key), { passive: true });
    key.addEventListener("pointerdown", () => {
      playKeyboardNote(key.dataset.note);
      setKeyPressed(key, true);
    });
    key.addEventListener("pointerup", () => setKeyPressed(key, false));
    key.addEventListener("pointercancel", () => setKeyPressed(key, false));
    key.addEventListener("pointerleave", () => setKeyPressed(key, false));
    key.addEventListener("mouseleave", () => setKeyPressed(key, false));
    key.addEventListener("click", (event) => {
      event.preventDefault();
      setKeyPressed(key, true);
      window.setTimeout(() => {
        setKeyPressed(key, false);
        routeInstrumentKey(key);
      }, 120);
    });
    key.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      playKeyboardNote(key.dataset.note);
      pressKeyMomentarily(key, 130);
      window.setTimeout(() => routeInstrumentKey(key), 130);
    });
  });

  keyboard.addEventListener(
    "wheel",
    (event) => {
      const key = event.target.closest?.("[data-note]");
      if (!key) return;
      event.preventDefault();
      const now = window.performance.now();
      if (key.dataset.note === lastWheelNote && now - wheelGate < 95) return;
      wheelGate = now;
      lastWheelNote = key.dataset.note;
      playKeyboardNote(key.dataset.note, 0.18, 0.06);
      pressKeyMomentarily(key, 320);
    },
    { passive: false },
  );

  window.addEventListener("pagehide", () => window.clearInterval(scaleTimer));
}

setupInstrumentKeyboard();

function setupPromptBallpassGame() {
  const game = document.querySelector("[data-ballpass-game]");
  const canvas = game?.querySelector("[data-ballpass-canvas]");
  if (!game || !canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const puck = new Image();
  puck.src = "./assets/brand/lottomind-branded-puck.png";

  const pointer = { x: 0.72, y: 0.48, active: false, burst: 0 };
  const balls = Array.from({ length: 9 }, (_, index) => ({
    t: index / 9,
    speed: 0.00012 + index * 0.00001,
    radius: 12 + (index % 3) * 5,
    color: index % 2 ? "#ffe071" : "#29f7ff",
  }));

  function resizeBallpass() {
    const rect = game.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawBallpass(now) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) {
      window.requestAnimationFrame(drawBallpass);
      return;
    }

    context.clearRect(0, 0, width, height);
    const centerX = width * 0.54;
    const centerY = height * 0.52;
    const pointerX = pointer.x * width;
    const pointerY = pointer.y * height;
    const laneRadiusX = width * 0.34;
    const laneRadiusY = height * 0.28;

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineWidth = 2;
    context.strokeStyle = "rgba(41, 247, 255, 0.22)";
    for (let i = 0; i < 4; i += 1) {
      context.beginPath();
      context.ellipse(centerX, centerY, laneRadiusX - i * 28, laneRadiusY - i * 18, -0.22, 0, Math.PI * 2);
      context.stroke();
    }

    balls.forEach((ball, index) => {
      const drift = reducedMotionQuery.matches ? 0 : now * ball.speed;
      const angle = (ball.t + drift) * Math.PI * 2;
      const pullX = (pointerX - centerX) * 0.08;
      const pullY = (pointerY - centerY) * 0.08;
      const x = centerX + Math.cos(angle) * (laneRadiusX - index * 7) + pullX;
      const y = centerY + Math.sin(angle) * (laneRadiusY - index * 4) + pullY;
      const glow = pointer.active ? 1.3 : 0.86;

      context.beginPath();
      context.fillStyle = ball.color;
      context.shadowColor = ball.color;
      context.shadowBlur = 18 * glow;
      context.arc(x, y, ball.radius * glow, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "rgba(3, 5, 10, 0.78)";
      context.font = "800 12px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String((index + 1) * 7).padStart(2, "0"), x, y);
    });

    const puckSize = Math.min(width, height) * (pointer.active ? 0.2 : 0.17);
    const puckX = pointerX - puckSize / 2;
    const puckY = pointerY - puckSize / 2;
    if (puck.complete) {
      context.shadowColor = "rgba(255, 224, 113, 0.55)";
      context.shadowBlur = 28 + pointer.burst * 18;
      context.drawImage(puck, puckX, puckY, puckSize, puckSize);
    } else {
      context.beginPath();
      context.fillStyle = "#ffe071";
      context.arc(pointerX, pointerY, puckSize / 2, 0, Math.PI * 2);
      context.fill();
    }

    if (pointer.burst > 0.01) {
      context.beginPath();
      context.strokeStyle = `rgba(255, 224, 113, ${pointer.burst})`;
      context.lineWidth = 3;
      context.arc(pointerX, pointerY, puckSize * (1.1 + (1 - pointer.burst) * 1.4), 0, Math.PI * 2);
      context.stroke();
      pointer.burst *= 0.92;
    }
    context.restore();

    window.requestAnimationFrame(drawBallpass);
  }

  game.addEventListener("pointermove", (event) => {
    const rect = game.getBoundingClientRect();
    pointer.x = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
    pointer.y = Math.max(0.12, Math.min(0.88, (event.clientY - rect.top) / rect.height));
    pointer.active = true;
  }, { passive: true });
  game.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  game.addEventListener("click", () => {
    pointer.burst = 1;
  });
  window.addEventListener("resize", resizeBallpass, { passive: true });
  puck.addEventListener("load", () => pointer.burst = 0.6);
  resizeBallpass();
  window.requestAnimationFrame(drawBallpass);
}

setupPromptBallpassGame();

// Use the mascot artwork as a lightweight mouse pointer without the old lens overlay.

function setupMascotMotionCursor() {
  if (window.matchMedia("(pointer: coarse)").matches || reducedMotionQuery.matches) return;

  const cursor = document.createElement("div");
  cursor.className = "mascot-motion-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.classList.add("has-mascot-motion-cursor");
  document.body.append(cursor);

  const position = { x: -120, y: -120 };
  const last = { x: -120, y: -120, time: 0 };
  let state = "idle";
  let facing = 1;
  let idleTimer = 0;
  let heldScrollState = "";
  let visible = false;

  function setPose() {
    cursor.classList.toggle("is-up", state === "up");
    cursor.classList.toggle("is-down", state === "down");
  }

  function render() {
    setPose();
    const tilt = state === "up" ? -5 : state === "down" ? 3 : state === "right" ? 3 : state === "left" ? -3 : 0;
    const x = Math.round(position.x + 1);
    const y = Math.round(position.y + 1);
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;
    if (visible) cursor.classList.add("is-visible");
    window.requestAnimationFrame(render);
  }

  document.addEventListener("pointermove", (event) => {
    if (isEditableTarget(event.target)) {
      cursor.classList.remove("is-visible");
      visible = false;
      return;
    }

    const now = performance.now();
    const dx = last.time ? event.clientX - last.x : 0;
    const dy = last.time ? event.clientY - last.y : 0;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    position.x = event.clientX;
    position.y = event.clientY;
    visible = true;
    window.clearTimeout(idleTimer);

    if (absX >= 2 && absX >= absY * 0.35) {
      state = dx < 0 ? "left" : "right";
      facing = dx < 0 ? -1 : 1;
      heldScrollState = "";
    } else if (heldScrollState) {
      state = heldScrollState;
    } else if (absX < 2 && absY < 2) {
      state = "idle";
    } else {
      state = facing < 0 ? "left" : "right";
    }

    last.x = event.clientX;
    last.y = event.clientY;
    last.time = now;
    idleTimer = window.setTimeout(() => {
      if (heldScrollState) return;
      state = "idle";
    }, 180);
  }, { passive: true });

  window.addEventListener("wheel", (event) => {
    if (isEditableTarget(event.target)) return;
    visible = true;
    window.clearTimeout(idleTimer);

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 2) {
      state = event.deltaX < 0 ? "left" : "right";
      facing = event.deltaX < 0 ? -1 : 1;
      heldScrollState = "";
    } else if (event.deltaY > 0) {
      state = "down";
      heldScrollState = "down";
    } else if (event.deltaY < 0) {
      state = "up";
      heldScrollState = "up";
    }

  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    visible = false;
    cursor.classList.remove("is-visible");
  }, { passive: true });

  window.addEventListener("blur", () => {
    visible = false;
    cursor.classList.remove("is-visible");
  });

  window.requestAnimationFrame(render);
}

setupMascotMotionCursor();

function showGamePip() {
  if (!gamePip) return;
  if (gamePip.classList.contains("is-open")) return;
  window.clearTimeout(gamePipHideTimer);
  if (gamePipFrame && !gamePipFrame.getAttribute("src")) {
    gamePipFrame.setAttribute("src", gamePipFrame.dataset.src || "");
  }
  gamePip.classList.add("is-open");
  gamePip.setAttribute("aria-hidden", "false");
  gamePipOpenedAt = Date.now();
  if (siteSoundtrack) {
    gamePipShouldResumeSoundtrack = !siteSoundtrack.paused;
    gamePipResumeFromPage = soundtrackStartedFromPage;
    gamePipResumeFromHover = soundtrackStartedFromHover;
    siteSoundtrack.pause();
    soundtrackStartedFromHover = false;
    setSoundtrackButtonState(false);
  }
}

function resumeGamePipSoundtrack() {
  if (!siteSoundtrack || !gamePipShouldResumeSoundtrack) return;
  playSiteSoundtrack({
    fromPage: gamePipResumeFromPage,
    fromHover: gamePipResumeFromHover,
    volume: siteSoundtrack.volume || 0.42,
  });
}

function hideGamePip(options = {}) {
  if (!gamePip) return;
  gamePip.classList.remove("is-open");
  gamePip.setAttribute("aria-hidden", "true");
  if (gamePipFrame) gamePipFrame.removeAttribute("src");
  if (options.resumeSoundtrack) resumeGamePipSoundtrack();
  gamePipShouldResumeSoundtrack = false;
  gamePipResumeFromPage = false;
  gamePipResumeFromHover = false;
}

function scheduleHideGamePip() {
  window.clearTimeout(gamePipHideTimer);
  gamePipHideTimer = window.setTimeout(hideGamePip, 260);
}

function startGamePipDrag(event) {
  if (!gamePip || event.target.closest("[data-game-pip-close]")) return;
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  const offset = getGamePipOffset();
  gamePipDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: offset.x,
    offsetY: offset.y,
  };
  gamePip.classList.add("is-dragging");
  gamePipHead?.setPointerCapture?.(event.pointerId);
}

function updateGamePipDrag(event) {
  if (!gamePipDragState || event.pointerId !== gamePipDragState.pointerId) return;
  setGamePipOffset(
    gamePipDragState.offsetX + event.clientX - gamePipDragState.startX,
    gamePipDragState.offsetY + event.clientY - gamePipDragState.startY,
  );
}

function endGamePipDrag(event) {
  if (!gamePipDragState || event.pointerId !== gamePipDragState.pointerId) return;
  gamePipDragState = null;
  gamePip?.classList.remove("is-dragging");
  gamePipHead?.releasePointerCapture?.(event.pointerId);
}

showStartupVideo();
scheduleStartupVideoReturn();

startupVideoCloseButtons.forEach((button) => {
  button.addEventListener("click", () => closeStartupVideo());
});
startupMusicStart?.addEventListener("click", () => closeStartupVideo());
startupVideoModal?.addEventListener("click", (event) => {
  if (event.target === startupVideoModal) closeStartupVideo();
});

function isEditableTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !isEditableTarget(event.target)) {
    const soundtrackToggle = event.target?.closest?.("[data-soundtrack-toggle]");
    if (soundtrackToggle || document.body.classList.contains("home-page")) {
      event.preventDefault();
      if (soundtrackToggle) event.stopPropagation();
    }
  }
  if (event.key === "Escape" && !startupVideoModal?.classList.contains("is-hidden")) {
    closeStartupVideo({ playMusic: false });
  }
  if (event.key === "Escape" && gamePip?.classList.contains("is-open")) {
    hideGamePip({ resumeSoundtrack: true });
  }
});

function setSoundtrackButtonState(isPlaying, blocked = false) {
  soundtrackButtons.forEach((button) => {
    const defaultPlayLabel = conciseSoundtrackLabels ? "Demo Music" : "Play Demo Music";
    const defaultPauseLabel = conciseSoundtrackLabels ? "Pause Music" : "Pause Demo Music";
    const playLabel = button.dataset.soundtrackPlayLabel || defaultPlayLabel;
    const pauseLabel = button.dataset.soundtrackPauseLabel || defaultPauseLabel;
    button.textContent = blocked ? playLabel : isPlaying ? pauseLabel : playLabel;
    button.setAttribute("aria-pressed", String(isPlaying));
  });
}

async function playSiteSoundtrack(options = {}) {
  if (!siteSoundtrack) return;
  try {
    siteSoundtrack.volume = options.volume ?? 0.42;
    if (options.restart) siteSoundtrack.currentTime = 0;
    await siteSoundtrack.play();
    if (options.fromPage) soundtrackStartedFromPage = true;
    if (options.fromHover) soundtrackStartedFromHover = true;
    setSoundtrackButtonState(true);
  } catch {
    setSoundtrackButtonState(false, true);
  }
}

soundtrackButtons.forEach((button) => {
  button.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  button.addEventListener("click", async () => {
    if (!siteSoundtrack) return;
    if (siteSoundtrack.paused) {
      await playSiteSoundtrack();
    } else {
      siteSoundtrack.pause();
      setSoundtrackButtonState(false);
    }
  });
});

domainStrip?.addEventListener("pointerenter", () => {
  if (gamePipDragState) return;
  if (gamePip?.classList.contains("is-open")) {
    if (Date.now() - gamePipOpenedAt > 400) {
      hideGamePip({ resumeSoundtrack: true });
    }
    return;
  }
  showGamePip();
});

gamePip?.addEventListener("pointerenter", () => window.clearTimeout(gamePipHideTimer));
gamePipClose?.addEventListener("click", () => hideGamePip({ resumeSoundtrack: true }));
gamePipHead?.addEventListener("pointerdown", startGamePipDrag);
document.addEventListener("pointermove", updateGamePipDrag);
document.addEventListener("pointerup", endGamePipDrag);
document.addEventListener("pointercancel", endGamePipDrag);
window.addEventListener("resize", () => {
  if (!gamePip) return;
  const offset = getGamePipOffset();
  setGamePipOffset(offset.x, offset.y);
});

function setMemberDownloadUnlocked(unlocked, profile = null) {
  if (!memberDownload) return;
  const memberName = profile?.name || "member";
  const lockedLabel = memberDownload.dataset.lockedLabel || "Sign up to download";
  const unlockedLabel = memberDownload.dataset.unlockedLabel || "Download Test Build";
  const lockedMessage = memberDownload.dataset.lockedMessage || "Members get the download link after signup.";
  const unlockedMessage =
    memberDownload.dataset.unlockedMessage ||
    "Unlocked for {name}. Download the test ZIP or share the live GitHub Pages preview.";
  memberDownload.classList.toggle("is-locked", !unlocked);
  memberDownload.setAttribute("aria-disabled", String(!unlocked));
  memberDownload.textContent = unlocked ? unlockedLabel : lockedLabel;
  if (memberMessage) {
    memberMessage.textContent = unlocked
      ? unlockedMessage.replace("{name}", memberName)
      : lockedMessage;
  }
}

function openSupportMailDraft(subject, fields) {
  const body = [
    subject,
    "",
    ...Object.entries(fields).map(([label, value]) => `${label}: ${String(value).trim()}`),
    "",
    `Sent from ${window.location.href}`
  ].join("\n");
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

let storedMemberProfile = null;
try {
  storedMemberProfile = JSON.parse(localStorage.getItem(MEMBER_SIGNUP_KEY) || "null");
} catch {
  storedMemberProfile = null;
}

setMemberDownloadUnlocked(Boolean(storedMemberProfile?.email), storedMemberProfile);

memberForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(memberForm);
  const profile = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    focus: String(formData.get("focus") || "").trim(),
    joinedAt: new Date().toISOString()
  };
  if (!profile.name || !profile.email || !profile.focus || !memberForm.checkValidity()) {
    memberForm.reportValidity();
    return;
  }
  localStorage.setItem(MEMBER_SIGNUP_KEY, JSON.stringify(profile));
  setMemberDownloadUnlocked(true, profile);
  if (memberMessage) {
    memberMessage.textContent = "Download unlocked. An email draft to robjasper2084@gmail.com is opening so the signup can be sent.";
  }
  openSupportMailDraft(memberForm.dataset.signupSubject || "LOTTOMINDED ULTRA Member Signup", {
    Name: profile.name,
    Email: profile.email,
    "Testing focus": profile.focus,
    Permission: "Confirmed test-build and owned-media notice",
    Joined: profile.joinedAt
  });
});

memberDownload?.addEventListener("click", (event) => {
  if (memberDownload.getAttribute("aria-disabled") !== "true") return;
  event.preventDefault();
  memberForm?.querySelector("input, select, button")?.focus();
  memberForm?.reportValidity();
});

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function drawNumber(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateMiniLottoSet(rng, game) {
  if (game.type === "digits") {
    return Array.from({ length: game.count }, () => drawNumber(rng, game.min, game.max)).join("-");
  }
  const main = [];
  while (main.length < game.count) {
    const next = drawNumber(rng, game.min, game.max);
    if (!main.includes(next)) main.push(next);
  }
  main.sort((a, b) => a - b);
  const mainText = main.map((number) => String(number).padStart(2, "0")).join(" ");
  if (game.type !== "special") return mainText;
  return `${mainText} | ${game.special} ${drawNumber(rng, game.sMin, game.sMax)}`;
}

function generateMiniSunoPrompt() {
  const beat = document.querySelector("#miniSunoBeat")?.value?.trim() || "neon drums and bass";
  const mood = document.querySelector("#miniSunoMood")?.value?.trim() || "cinematic futuristic R&B";
  const bpm = document.querySelector("#miniSunoBpm")?.value || "120";
  const output = document.querySelector("#miniSunoOutput");
  if (!output) return;
  output.value = [
    `Create an original ${bpm} BPM song inspired by this beat DNA: ${beat}.`,
    `Style language: ${mood}, polished modern production, deep low end, glowing synth texture, memorable hook, dynamic arrangement.`,
    "Arrangement: 8-bar intro, verse groove, pre-hook lift, hook/drop, short bridge, final chorus.",
    "Lyrics: original only, no real artist names, no copyrighted lines. Keep it emotionally direct and performance-ready.",
    "Exclude: muddy mix, off-key vocals, weak drums, crowded lyrics, copyrighted references."
  ].join(" ");
}

function generateMiniVideoPrompt() {
  const subject = document.querySelector("#miniVideoSubject")?.value?.trim() || "futuristic producer";
  const location = document.querySelector("#miniVideoLocation")?.value?.trim() || "neon studio";
  const motion = document.querySelector("#miniVideoMotion")?.value?.trim() || "dolly-in and orbit";
  const output = document.querySelector("#miniVideoOutput");
  if (!output) return;
  output.value = [
    `Create a cinematic 10-second 16:9 music-video prompt. Subject: ${subject}.`,
    `Scene: ${location} with holographic waveforms, glowing pads, mixer meters, Beat DNA lines, cyan/violet/gold light, glossy reflections, and dramatic haze.`,
    `Camera: ${motion}. Editing: beat-synced cuts on kick and snare, spark trails on hi-hats, bass pulses through the floor.`,
    "Keep characters generic and original. Avoid celebrity likenesses, copyrighted logos, watermark text, and artist imitation.",
    "Negative prompt: blurry, low quality, warped hands, unreadable text, random logos, watermark, inconsistent subject, off-beat motion."
  ].join(" ");
}

function generateMiniNumberSignals() {
  const seed = document.querySelector("#miniLottoSeed")?.value?.trim() || "lottominded ultra";
  const game = miniGameConfigs[document.querySelector("#miniLottoGame")?.value] || miniGameConfigs.pick3;
  const rng = seededRandom(hashString(`${seed}|${game.label}|${Date.now()}`));
  const sets = Array.from({ length: 5 }, (_, index) => `Set ${index + 1}: ${generateMiniLottoSet(rng, game)}`);
  const output = document.querySelector("#miniLottoOutput");
  if (!output) return;
  output.value = [
    `${game.label} - Beat-seeded entertainment picks`,
    "Creative number generation. Not a prediction.",
    ...sets,
    "Lottery outcomes are random. Verify game rules, matrices, draw times, prizes, and eligibility with official lottery sources before playing."
  ].join("\n");
}

async function copyFieldValue(fieldId) {
  const field = document.querySelector(`#${fieldId}`);
  if (!field?.value) return;
  try {
    await navigator.clipboard.writeText(field.value);
  } catch {
    field.select();
    document.execCommand("copy");
  }
}

document.addEventListener("click", (event) => {
  const miniAction = event.target.closest("[data-mini-action]")?.dataset.miniAction;
  if (miniAction === "suno") generateMiniSunoPrompt();
  if (miniAction === "video") generateMiniVideoPrompt();
  if (miniAction === "numbers") generateMiniNumberSignals();
  const copyTarget = event.target.closest("[data-copy-target]")?.dataset.copyTarget;
  if (copyTarget) copyFieldValue(copyTarget);
});

generateMiniSunoPrompt();
generateMiniVideoPrompt();
generateMiniNumberSignals();
