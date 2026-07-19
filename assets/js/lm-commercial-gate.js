(() => {
  "use strict";

  const filmLibrary = [
    {
      signal: "Film 01 / Product signal",
      title: "Meet the Guardian.",
      telemetry: "LM-GUARDIAN / REVEAL",
      copy: "The $29.95 Little Man Luggage Charm and Backpack Guardian includes three complimentary months of LottoMind app membership.",
      src: "./assets/merch/lottomind-guardian-commercial-reveal-20260716.mp4",
      poster: "./assets/merch/lottomind-guardian-commercial-reveal-poster-20260716.png",
      volume: 0.76
    },
    {
      signal: "Film 02 / Field setup",
      title: "Clip on your mindset.",
      telemetry: "LM-GUARDIAN / DEPLOY",
      copy: "Clip the Guardian onto a backpack or luggage route, then carry the LottoMind signal with you.",
      src: "./assets/merch/lottomind-guardian-commercial-clip-on-20260716.mp4",
      poster: "./assets/merch/lottomind-guardian-commercial-clip-on-poster-20260716.png",
      volume: 0.76
    },
    {
      signal: "Film 03 / Mobile signal",
      title: "Carry the signal.",
      telemetry: "LM-GUARDIAN / IN TRANSIT",
      copy: "The Guardian goes wherever the next idea begins, with three months of LottoMind membership included.",
      src: "./assets/merch/lottomind-merch-commercial-20260716.mp4",
      poster: "./assets/merch/lottomind-merch-commercial-poster-20260716.png",
      volume: 0.64
    }
  ];

  const guideFilm = {
    signal: "Guide / Street signal",
    title: "Follow the signal.",
    telemetry: "LM-GUIDE / ROUTE ACTIVE",
    copy: "Enter the LottoMind Guide, explore the playable walkthrough, and carry the creative signal into every route.",
    src: "./assets/merch/lottomind-guide-commercial-20260717.mp4",
    poster: "./assets/merch/lottomind-guide-commercial-poster-20260717.jpg",
    volume: 0.64
  };

  const merchStoreFilm = {
    signal: "Guardian broadcast / Community signal",
    title: "Carry the LottoMind signal.",
    telemetry: "LM-GUARDIAN / COMMUNITY UPLINK",
    copy: "Meet the Little Man Guardian, clip the signal onto your everyday carry, and unlock three complimentary months of LottoMind app membership.",
    src: "./assets/merch/lottomind-community-signal-commercial-20260717.mp4",
    poster: "./assets/merch/lottomind-community-signal-poster-20260717.jpg",
    volume: 0.48
  };

  const body = document.body;
  if (!body || body.matches(".memberships-page")) return;

  const path = location.pathname.toLowerCase();
  const route = [
    {
      matches: body.matches(".beat2lotto-game-page") || path.endsWith("/beat2lotto-plus.html"),
      name: "Beat2Lotto+",
      theme: "beat2lotto",
      films: [{ ...filmLibrary[1], signal: "Beat2Lotto+ / Guardian signal" }]
    },
    {
      matches: body.matches(".merch-store-page") || path.endsWith("/merch-store.html"),
      name: "Merch Store",
      theme: "merch",
      films: [{ ...merchStoreFilm, signal: "Merch vault / Guardian broadcast" }]
    },
    {
      matches: body.matches(".features-cinematic-page") || path.endsWith("/features-app.html"),
      name: "Features",
      theme: "features",
      films: [{ ...merchStoreFilm, signal: "Features / Guardian broadcast" }]
    },
    {
      matches: path.endsWith("/how-to-use.html"),
      name: "Guide",
      theme: "guide",
      films: [guideFilm]
    }
  ].find((candidate) => candidate.matches);

  if (!route) return;

  const { films, name: routeName, theme: routeTheme } = route;
  // Keep the one-commercial-per-page behavior without letting a visit to one
  // route suppress the commercial on every other route in the same tab.
  const sessionKey = `lm-commercial-gate-seen:v4:${routeTheme}`;
  try {
    if (sessionStorage.getItem(sessionKey) === "yes") return;
    sessionStorage.setItem(sessionKey, "yes");
  } catch (error) {}
  const storageKey = `lm-commercial-gate-last:${location.pathname}`;
  let previous = -1;
  try {
    previous = Number.parseInt(localStorage.getItem(storageKey) || "-1", 10);
  } catch (error) {}
  const choices = films.map((_, index) => index).filter((index) => index !== previous);
  let activeIndex = choices[Math.floor(Math.random() * choices.length)] ?? 0;
  try {
    localStorage.setItem(storageKey, String(activeIndex));
  } catch (error) {}

  const modal = document.createElement("aside");
  modal.className = "lm-commercial-gate";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "lmCommercialGateTitle");
  modal.style.setProperty("--lm-commercial-chapter-count", String(films.length));
  modal.innerHTML = `
    <div class="lm-commercial-gate__panel">
      <header class="lm-commercial-gate__header">
        <div>
          <span class="lm-commercial-gate__signal"></span>
          <h2 id="lmCommercialGateTitle"></h2>
        </div>
        <div class="lm-commercial-gate__header-actions">
          <button type="button" class="lm-commercial-gate__sound" hidden>Sound on</button>
          <button type="button" class="lm-commercial-gate__skip" aria-label="Skip commercial and enter ${routeName}">Skip &amp; Enter</button>
        </div>
      </header>
      <div class="lm-commercial-gate__stage">
        <video controls autoplay muted playsinline preload="metadata" data-lm-video-unmanaged="true"></video>
        <span class="lm-commercial-gate__scan" aria-hidden="true"></span>
        <span class="lm-commercial-gate__telemetry"><b></b><b>Transmission secure</b></span>
      </div>
      <nav class="lm-commercial-gate__chapters" aria-label="Commercial chapters">
        ${films.map((film, index) => `
          <button type="button" data-film-index="${index}">
            <b>${String(index + 1).padStart(2, "0")}</b>
            <span>${film.title.replace(/\.$/, "")}</span>
          </button>`).join("")}
      </nav>
      <footer class="lm-commercial-gate__footer">
        <p></p>
        <div class="lm-commercial-gate__actions">
          <button type="button" class="lm-commercial-gate__replay">Replay</button>
          <button type="button" class="lm-commercial-gate__enter">Enter ${routeName}</button>
          <a class="lm-commercial-gate__shop" href="./merch-store.html?product=guardian#keychains">Shop Guardian &middot; $29.95</a>
        </div>
      </footer>
    </div>`;

  const video = modal.querySelector("video");
  const signal = modal.querySelector(".lm-commercial-gate__signal");
  const title = modal.querySelector("h2");
  const telemetry = modal.querySelector(".lm-commercial-gate__telemetry b");
  const copy = modal.querySelector(".lm-commercial-gate__footer p");
  const chapterButtons = [...modal.querySelectorAll("[data-film-index]")];
  const replayButton = modal.querySelector(".lm-commercial-gate__replay");
  const soundButton = modal.querySelector(".lm-commercial-gate__sound");
  const closeButtons = [modal.querySelector(".lm-commercial-gate__skip"), modal.querySelector(".lm-commercial-gate__enter")];
  const siblings = [...body.children].filter((node) => node !== modal && node.tagName !== "SCRIPT");
  const beat2GameFrame = routeTheme === "beat2lotto" ? document.querySelector("[data-beat2-game-frame]") : null;
  const suspendedMedia = [];
  let closing = false;
  let transitionFallbackTimer = 0;

  const pausePageMedia = () => {
    document.querySelectorAll("audio, video").forEach((media) => {
      if (media === video || media.matches("[data-lm-transition-video]")) return;
      if (!media.paused) {
        suspendedMedia.push({
          media,
          audible: media.tagName === "AUDIO" || (!media.muted && media.volume > 0),
        });
      }
      media.pause?.();
    });
  };

  const blockCompetingMedia = (event) => {
    const media = event.target;
    if (!(media instanceof HTMLMediaElement) || media === video || media.matches("[data-lm-transition-video]")) return;
    media.pause();
  };

  const restorePageMedia = () => {
    let audibleRestored = false;
    suspendedMedia.splice(0).forEach(({ media, audible }) => {
      if (!media.isConnected) return;
      if (audible && audibleRestored) return;
      if (audible) audibleRestored = true;
      media.play?.().catch?.(() => {});
    });
  };

  const setBeat2MusicGate = (active) => {
    if (!beat2GameFrame?.contentWindow) return;
    beat2GameFrame.contentWindow.postMessage({
      type: "lottomind:commercial-gate",
      active: Boolean(active)
    }, location.origin);
  };

  const playCommercial = async ({ restart = false } = {}) => {
    if (restart) {
      try { video.currentTime = 0; } catch (error) {}
    }

    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute("muted");
    video.volume = films[activeIndex]?.volume ?? window.LMAudioMix?.levels.commercial ?? 0.64;
    window.LMAudioMix?.claim?.(video);
    try {
      await video.play();
      soundButton.hidden = true;
      return;
    } catch (error) {
      // Chromium blocks unmuted autoplay without a user gesture. Continue the
      // one-pass film muted so `ended` can still release the page, while
      // keeping an explicit sound control available for the first gesture.
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      soundButton.hidden = false;
      await video.play().catch(() => {});
    }
  };

  const renderFilm = (index, autoplay = true) => {
    activeIndex = ((index % films.length) + films.length) % films.length;
    const film = films[activeIndex];
    signal.textContent = film.signal;
    title.textContent = film.title;
    telemetry.textContent = film.telemetry;
    copy.textContent = film.copy;
    video.poster = film.poster;
    video.src = film.src;
    // Every route gate is a one-pass commercial. When the film completes,
    // the gate releases the page instead of looping or advancing a playlist.
    video.loop = false;
    chapterButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeIndex;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (autoplay) playCommercial({ restart: false });
  };

  const finishGate = () => {
    window.clearTimeout(transitionFallbackTimer);
    body.classList.remove("has-lm-commercial-gate");
    siblings.forEach((node) => node.removeAttribute("inert"));
    document.removeEventListener("play", blockCompetingMedia, true);
    window.removeEventListener("lottomind:transition-complete", handleTransitionComplete);
    setBeat2MusicGate(false);
    restorePageMedia();
    window.dispatchEvent(new CustomEvent("lottomind:commercial-gate", {
      detail: { active: false, route: routeTheme }
    }));
  };

  const handleTransitionComplete = (event) => {
    if (event?.detail?.source !== "route-commercial") return;
    finishGate();
  };

  const closeGate = () => {
    if (closing) return;
    closing = true;
    video.pause();
    window.addEventListener("lottomind:transition-complete", handleTransitionComplete);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        modal.classList.add("is-handing-off");
        modal.classList.remove("is-open");
        window.setTimeout(() => {
          // Activate the branded reveal before removing the gate in the same
          // task. The page remains inert and all competing media stay paused
          // until lm-page-transition reports that its close clip completed.
          window.dispatchEvent(new CustomEvent("lottomind:commercial-dismissed", {
            detail: {
              label: routeName,
              source: "route-commercial",
              theme: routeTheme
            }
          }));
          modal.remove();
          transitionFallbackTimer = window.setTimeout(finishGate, 1500);
        }, 150);
      });
    });
  };

  body.append(modal);
  body.classList.add("has-lm-commercial-gate");
  siblings.forEach((node) => node.setAttribute("inert", ""));
  pausePageMedia();
  document.addEventListener("play", blockCompetingMedia, true);
  setBeat2MusicGate(true);
  window.dispatchEvent(new CustomEvent("lottomind:commercial-gate", {
    detail: { active: true, route: routeTheme }
  }));
  beat2GameFrame?.addEventListener("load", () => setBeat2MusicGate(true), { once: true });
  renderFilm(activeIndex);
  requestAnimationFrame(() => {
    modal.classList.add("is-open");
    modal.querySelector(".lm-commercial-gate__skip")?.focus({ preventScroll: true });
  });

  chapterButtons.forEach((button) => {
    button.addEventListener("click", () => renderFilm(Number(button.dataset.filmIndex)));
  });
  replayButton.addEventListener("click", () => {
    playCommercial({ restart: true });
  });
  soundButton.addEventListener("click", () => playCommercial({ restart: false }));
  closeButtons.forEach((button) => button.addEventListener("click", closeGate));
  video.addEventListener("ended", closeGate);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGate();
  });
})();
