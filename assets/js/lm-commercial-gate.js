(() => {
  "use strict";

  const filmLibrary = [
    {
      signal: "Film 01 / Product signal",
      title: "Meet the Guardian.",
      telemetry: "LM-GUARDIAN / REVEAL",
      copy: "The $29.95 Little Man Luggage Charm and Backpack Guardian includes three complimentary months of LottoMind app membership.",
      src: "./assets/merch/lottomind-guardian-commercial-reveal-20260716.mp4",
      poster: "./assets/merch/lottomind-guardian-commercial-reveal-poster-20260716.png"
    },
    {
      signal: "Film 02 / Field setup",
      title: "Clip on your mindset.",
      telemetry: "LM-GUARDIAN / DEPLOY",
      copy: "Clip the Guardian onto a backpack or luggage route, then carry the LottoMind signal with you.",
      src: "./assets/merch/lottomind-guardian-commercial-clip-on-20260716.mp4",
      poster: "./assets/merch/lottomind-guardian-commercial-clip-on-poster-20260716.png"
    },
    {
      signal: "Film 03 / Mobile signal",
      title: "Carry the signal.",
      telemetry: "LM-GUARDIAN / IN TRANSIT",
      copy: "The Guardian goes wherever the next idea begins, with three months of LottoMind membership included.",
      src: "./assets/merch/lottomind-merch-commercial-20260716.mp4",
      poster: "./assets/merch/lottomind-merch-commercial-poster-20260716.png"
    }
  ];

  const body = document.body;
  if (!body || body.matches(".memberships-page")) return;

  const isBeat2Lotto = body.matches(".beat2lotto-game-page");
  const films = isBeat2Lotto
    ? [{ ...filmLibrary[1], signal: "Beat2Lotto+ / Guardian signal" }]
    : filmLibrary;
  const routeName = isBeat2Lotto ? "Beat2Lotto+" : "Guide";
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
  modal.innerHTML = `
    <div class="lm-commercial-gate__panel">
      <header class="lm-commercial-gate__header">
        <div>
          <span class="lm-commercial-gate__signal"></span>
          <h2 id="lmCommercialGateTitle"></h2>
        </div>
        <button type="button" class="lm-commercial-gate__skip" aria-label="Skip commercial and enter ${routeName}">Skip &amp; Enter</button>
      </header>
      <div class="lm-commercial-gate__stage">
        <video controls muted autoplay playsinline preload="auto" data-lm-video-unmanaged="true"></video>
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
          <a class="lm-commercial-gate__shop" href="./merch-store.html?product=guardian#keychains">Shop Guardian · $29.95</a>
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
  const closeButtons = [modal.querySelector(".lm-commercial-gate__skip"), modal.querySelector(".lm-commercial-gate__enter")];
  const siblings = [...body.children].filter((node) => node !== modal && node.tagName !== "SCRIPT");
  let closing = false;

  const renderFilm = (index, autoplay = true) => {
    activeIndex = ((index % films.length) + films.length) % films.length;
    const film = films[activeIndex];
    signal.textContent = film.signal;
    title.textContent = film.title;
    telemetry.textContent = film.telemetry;
    copy.textContent = film.copy;
    video.poster = film.poster;
    video.src = film.src;
    video.muted = true;
    // Every route gate is a one-pass commercial. When the film completes,
    // the gate releases the page instead of looping or advancing a playlist.
    video.loop = false;
    chapterButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeIndex;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (autoplay) video.play().catch(() => {});
  };

  const closeGate = () => {
    if (closing) return;
    closing = true;
    video.pause();

    // Start the branded reveal while the commercial still covers the page.
    // The gate then fades onto the already-running transition instead of
    // exposing a blank frame between the two layers.
    window.dispatchEvent(new CustomEvent("lottomind:commercial-dismissed", {
      detail: {
        label: routeName,
        source: "route-commercial",
        theme: isBeat2Lotto ? "beat2lotto" : "guide"
      }
    }));

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        modal.classList.add("is-handing-off");
        modal.classList.remove("is-open");
        window.setTimeout(() => {
          modal.remove();
          body.classList.remove("has-lm-commercial-gate");
          siblings.forEach((node) => node.removeAttribute("inert"));
        }, 150);
      });
    });
  };

  body.append(modal);
  body.classList.add("has-lm-commercial-gate");
  siblings.forEach((node) => node.setAttribute("inert", ""));
  renderFilm(activeIndex);
  requestAnimationFrame(() => {
    modal.classList.add("is-open");
    modal.querySelector(".lm-commercial-gate__skip")?.focus({ preventScroll: true });
  });

  chapterButtons.forEach((button) => {
    button.addEventListener("click", () => renderFilm(Number(button.dataset.filmIndex)));
  });
  replayButton.addEventListener("click", () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });
  closeButtons.forEach((button) => button.addEventListener("click", closeGate));
  video.addEventListener("ended", closeGate);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGate();
  });
})();
