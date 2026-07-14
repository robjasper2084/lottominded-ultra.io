(() => {
  "use strict";

  const boot = async () => {

  const body = document.body;
  const root = document.getElementById("lmMembership");
  if (!body?.classList.contains("memberships-page") || !root || body.dataset.lmMembershipReady === "true") return;
  body.dataset.lmMembershipReady = "true";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const gsap = window.gsap || null;
  const ScrollTrigger = window.ScrollTrigger || null;
  const SplitText = window.SplitText || null;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (gsap && SplitText) gsap.registerPlugin(SplitText);
  const sectionMap = [
    ["dust", "Dust", "T − 13.8 Gyr"],
    ["membership-plans", "Ignition", "T − 13.6 Gyr"],
    ["lm-benefits", "Worlds", "T − 4.6 Gyr"],
    ["lm-credits", "Water", "T − 3.8 Gyr"],
    ["lm-unlock-route", "Life", "T − 0.54 Gyr"],
    ["lm-vault-access", "Flight", "T − 0.12 Gyr"],
    ["stripe-pricing-table", "Signal", "T − 0.00 Gyr"],
    ["lm-final", "Return", "Now"],
  ].map(([id, label, time], index) => ({ id, label, time, index, node: document.getElementById(id) })).filter((item) => item.node);

  const state = {
    activeIndex: 0,
    visual: null,
    disturbedTimer: 0,
    lenis: null,
    soundEnabled: false,
    audioContext: null,
    telemetry: { x: 0.5, y: 0.5, status: "ARRAY STABLE" },
  };

  const setChromeHeight = () => {
    const header = document.querySelector("[data-site-header]");
    const ribbon = document.querySelector(".home-signal-marquee");
    const candidates = [header, ribbon].filter(Boolean).map((node) => node.getBoundingClientRect().bottom);
    const height = Math.max(0, ...candidates);
    if (height > 0) body.style.setProperty("--lm-chrome-h", `${Math.ceil(height)}px`);
  };

  const chromeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(setChromeHeight) : null;
  const observeChrome = () => {
    chromeObserver?.disconnect();
    document.querySelectorAll("[data-site-header], .home-signal-marquee").forEach((node) => chromeObserver?.observe(node));
    setChromeHeight();
  };
  observeChrome();
  window.setTimeout(observeChrome, 250);
  window.addEventListener("resize", setChromeHeight, { passive: true });

  if (!reducedMotion.matches && window.Lenis) {
    state.lenis = new window.Lenis({
      duration: 1.35,
      easing: (value) => 1 - Math.pow(1 - value, 4),
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
    state.lenis.stop();
    state.lenis.on("scroll", () => ScrollTrigger?.update());
    if (gsap) {
      gsap.ticker.add((time) => state.lenis?.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  const scrollToNode = (node) => {
    if (!node) return;
    if (state.lenis && !reducedMotion.matches) {
      state.lenis.scrollTo(node, { offset: -(parseFloat(getComputedStyle(body).getPropertyValue("--lm-chrome-h")) || 0) - 20 });
    } else {
      node.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    }
  };

  const rail = document.createElement("nav");
  rail.className = "lm-section-rail";
  rail.setAttribute("aria-label", "Membership sections");
  sectionMap.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.dataset.lmSectionTarget = item.id;
    button.addEventListener("click", () => scrollToNode(item.node));
    rail.append(button);
  });
  root.append(rail);

  const hudLeft = document.createElement("div");
  hudLeft.className = "lm-membership-hud lm-membership-hud--left";
  hudLeft.setAttribute("aria-hidden", "true");
  const hudRight = document.createElement("div");
  hudRight.className = "lm-membership-hud lm-membership-hud--right";
  hudRight.setAttribute("aria-hidden", "true");
  hudRight.textContent = "0.50 · 0.50 · ARRAY STABLE";
  root.append(hudLeft, hudRight);

  const soundToggle = document.createElement("button");
  soundToggle.type = "button";
  soundToggle.className = "lm-sound-toggle";
  soundToggle.setAttribute("aria-pressed", "false");
  soundToggle.setAttribute("aria-label", "Enable membership transition sound effects");
  soundToggle.textContent = "SND OFF";
  root.append(soundToggle);

  const cursorDot = document.createElement("span");
  const cursorRing = document.createElement("span");
  cursorDot.className = "lm-cursor-dot";
  cursorRing.className = "lm-cursor-ring";
  cursorDot.setAttribute("aria-hidden", "true");
  cursorRing.setAttribute("aria-hidden", "true");
  if (finePointer.matches && !reducedMotion.matches) root.append(cursorDot, cursorRing);

  const playEpochTone = (index) => {
    if (!state.soundEnabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    state.audioContext ||= new AudioContext();
    const context = state.audioContext;
    if (context.state === "suspended") context.resume().catch(() => {});
    const now = context.currentTime;
    const fundamental = 116 + index * 24;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const tone = context.createOscillator();
    const overtone = context.createOscillator();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(920 + index * 110, now);
    tone.type = "sine";
    overtone.type = "triangle";
    tone.frequency.setValueAtTime(fundamental, now);
    overtone.frequency.setValueAtTime(fundamental * 2.01, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    tone.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    tone.start(now);
    overtone.start(now);
    tone.stop(now + 0.5);
    overtone.stop(now + 0.5);
  };

  soundToggle.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
    soundToggle.textContent = state.soundEnabled ? "SND ON" : "SND OFF";
    soundToggle.setAttribute("aria-label", `${state.soundEnabled ? "Disable" : "Enable"} membership transition sound effects`);
    if (state.soundEnabled) playEpochTone(state.activeIndex);
  });

  const updateTelemetry = () => {
    hudRight.textContent = `${state.telemetry.x.toFixed(2)} · ${state.telemetry.y.toFixed(2)} · ${state.telemetry.status}`;
  };

  const setActiveSection = (index) => {
    const item = sectionMap[index];
    if (!item || state.activeIndex === index && body.dataset.lmActiveSection) return;
    const previousIndex = state.activeIndex;
    state.activeIndex = index;
    body.dataset.lmActiveSection = item.label.toLowerCase();
    const glow = item.node.dataset.lmGlow || "#5be9ff";
    const background = item.node.dataset.lmBg || "#04060a";
    if (gsap && !reducedMotion.matches) {
      gsap.to(body, { backgroundColor: background, "--lm-active-glow": glow, duration: 0.9, ease: "expo.out", overwrite: true });
    } else {
      body.style.backgroundColor = background;
      body.style.setProperty("--lm-active-glow", glow);
    }
    hudLeft.textContent = `${item.label} · ${item.time}`;
    rail.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.lmSectionTarget === item.id;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    window.dispatchEvent(new CustomEvent("lm:membership-era", {
      detail: { index, label: item.label, time: item.time, glow, background },
    }));
    if (previousIndex !== index) playEpochTone(index);
  };

  if (gsap && ScrollTrigger && !reducedMotion.matches) {
    sectionMap.forEach((item, index) => {
      ScrollTrigger.create({
        trigger: item.node,
        start: "top 52%",
        end: "top 48%",
        onEnter: () => setActiveSection(index),
        onLeaveBack: () => setActiveSection(Math.max(0, index - 1)),
      });
    });
  } else {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => {
        const aDistance = Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - innerHeight / 2);
        const bDistance = Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - innerHeight / 2);
        return aDistance - bDistance;
      });
      if (!visible.length) return;
      const index = sectionMap.findIndex((item) => item.node === visible[0].target);
      if (index >= 0) setActiveSection(index);
    }, { rootMargin: "-32% 0px -48%", threshold: [0, 0.05, 0.2] });
    sectionMap.forEach((item) => sectionObserver.observe(item.node));
  }

  const revealTargets = [...root.querySelectorAll(
    ".membership-section-heading, .membership-signal-card, .membership-plan-card, .membership-feature-grid article, .credit-pack-grid article, .membership-steps li, .membership-vault-copy, .membership-vault-visual, .membership-final"
  )];
  revealTargets.forEach((node) => node.classList.add("lm-reveal"));
  body.classList.add("lm-cinematic-ready");
  if (gsap && ScrollTrigger && !reducedMotion.matches) {
    gsap.set(revealTargets, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(revealTargets, {
      start: "top 96%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.78, stagger: 0.07, ease: "expo.out", overwrite: true }),
    });
  } else if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -7%", threshold: 0.06 });
    revealTargets.filter((node) => !node.classList.contains("is-visible")).forEach((node) => revealObserver.observe(node));
  } else {
    revealTargets.forEach((node) => node.classList.add("is-visible"));
  }

  let heroSplit = null;
  const heroTitle = document.getElementById("membershipHeroTitle");
  if (gsap && SplitText && heroTitle && !reducedMotion.matches) {
    try {
      heroSplit = SplitText.create
        ? SplitText.create(heroTitle, { type: "lines,chars", mask: "lines", charsClass: "lm-hero-char" })
        : new SplitText(heroTitle, { type: "lines,chars", mask: "lines", charsClass: "lm-hero-char" });
      gsap.set(heroSplit.chars, { yPercent: 112, opacity: 0 });
    } catch (error) {
      heroSplit = null;
    }
  }

  if (gsap && SplitText && ScrollTrigger && !reducedMotion.matches) {
    root.querySelectorAll(".membership-section-heading h2, .membership-vault-copy h2, .membership-final h2").forEach((heading) => {
      try {
        const split = SplitText.create
          ? SplitText.create(heading, { type: "lines", mask: "lines", linesClass: "lm-heading-line" })
          : new SplitText(heading, { type: "lines", mask: "lines", linesClass: "lm-heading-line" });
        gsap.from(split.lines, { yPercent: 112, duration: 0.9, stagger: 0.09, ease: "expo.out", scrollTrigger: { trigger: heading, start: "top 92%", once: true } });
      } catch (error) {}
    });
  }

  const revealHero = () => {
    if (!gsap || reducedMotion.matches) return;
    const supporting = root.querySelectorAll(".membership-hero-copy > :not(h1)");
    gsap.timeline()
      .to(heroSplit?.chars || heroTitle, { yPercent: 0, opacity: 1, duration: 1.05, stagger: { each: 0.025, from: "center" }, ease: "expo.out" })
      .fromTo(supporting, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.72, stagger: 0.07, ease: "expo.out" }, "-=0.68");
  };

  root.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", link.getAttribute("href"));
      scrollToNode(target);
    });
  });

  const compareButton = root.querySelector("[data-lm-compare]");
  const comparePanel = document.getElementById(compareButton?.getAttribute("aria-controls") || "");
  compareButton?.addEventListener("click", () => {
    const open = compareButton.getAttribute("aria-expanded") !== "true";
    compareButton.setAttribute("aria-expanded", String(open));
    comparePanel.hidden = !open;
    if (open) comparePanel.querySelector("[tabindex]")?.focus({ preventScroll: true });
  });

  const collectorTrigger = document.querySelector("[data-collector-trigger]");
  const collectorBalance = document.querySelector("[data-collector-trigger-balance]");
  const walletState = root.querySelector(".membership-wallet-state strong");
  const syncWalletState = () => {
    if (!walletState || !collectorTrigger) return;
    const balance = collectorBalance?.textContent?.trim();
    const signedIn = balance && balance !== "--";
    walletState.textContent = signedIn ? `${balance} LottoCredits` : "Sign in to view wallet";
  };
  syncWalletState();
  if (collectorTrigger) new MutationObserver(syncWalletState).observe(collectorTrigger, { attributes: true, childList: true, subtree: true });
  root.querySelector("[data-lm-open-collector]")?.addEventListener("click", () => {
    scrollToNode(document.getElementById("lm-access-hero"));
    window.setTimeout(() => collectorTrigger?.click(), reducedMotion.matches ? 0 : 420);
  });

  if (finePointer.matches && !reducedMotion.matches) {
    root.querySelectorAll(".membership-plan-card, .membership-feature-grid article").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--card-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--card-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      }, { passive: true });
    });

    const pointer = { targetX: -100, targetY: -100, x: -100, y: -100 };
    root.addEventListener("pointermove", (event) => {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      state.telemetry.x = Math.max(0, Math.min(1, event.clientX / innerWidth));
      state.telemetry.y = Math.max(0, Math.min(1, event.clientY / innerHeight));
      updateTelemetry();
      const interactive = !!event.target.closest("a, button, input, [tabindex]");
      cursorRing.classList.toggle("is-interactive", interactive);
      body.classList.add("lm-cursor-ready");
    }, { passive: true });
    root.addEventListener("pointerleave", () => body.classList.remove("lm-cursor-ready"), { passive: true });
    const moveCursor = () => {
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
      const transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      cursorDot.style.transform = transform;
      cursorRing.style.transform = transform;
    };
    if (gsap) gsap.ticker.add(moveCursor);

    root.querySelectorAll(".primary-action, .secondary-action, .lm-sound-toggle").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.35;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.35;
        if (gsap) gsap.to(button, { x, y, duration: 0.34, ease: "expo.out", overwrite: true });
      }, { passive: true });
      button.addEventListener("pointerleave", () => {
        if (gsap) gsap.to(button, { x: 0, y: 0, duration: 0.85, ease: "elastic.out(1, 0.35)", overwrite: true });
      }, { passive: true });
    });
  }

  const setDisturbed = () => {
    window.clearTimeout(state.disturbedTimer);
    state.telemetry.status = "ARRAY DISTURBED";
    updateTelemetry();
    state.visual?.pulse();
    state.disturbedTimer = window.setTimeout(() => {
      state.telemetry.status = "ARRAY STABLE";
      updateTelemetry();
    }, 900);
  };
  root.addEventListener("click", (event) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    if (event.target.closest("a, button, input, form, article, table, .collector-access, .lm-section-rail, footer")) return;
    setDisturbed();
  });

  const footer = document.querySelector("body.memberships-page > footer");
  const syncFooterProximity = () => {
    if (!footer) return;
    body.classList.toggle("lm-near-footer", footer.getBoundingClientRect().top < innerHeight + 70);
  };
  document.addEventListener("scroll", syncFooterProximity, { passive: true });

  // The persistent WebGL entity is isolated in memberships-main.js.


  const runPreloader = () => new Promise((resolve) => {
    let hasVisited = false;
    try { hasVisited = sessionStorage.getItem("lmTemporalMembershipVisited") === "yes"; } catch (error) {}
    if (reducedMotion.matches || hasVisited) {
      resolve();
      return;
    }

    const loader = document.createElement("div");
    loader.className = "lm-temporal-loader is-active";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.innerHTML = '<div class="lm-temporal-loader__number"><span>00.0</span><small>×10⁹ yr</small></div><p class="lm-temporal-loader__label">Calibrating membership temporal array</p><span class="lm-temporal-loader__bar" aria-hidden="true"></span>';
    body.append(loader);
    const number = loader.querySelector(".lm-temporal-loader__number span");
    const bar = loader.querySelector(".lm-temporal-loader__bar");
    const finish = () => {
      loader.remove();
      try { sessionStorage.setItem("lmTemporalMembershipVisited", "yes"); } catch (error) {}
      resolve();
    };

    if (gsap) {
      const progress = { value: 0 };
      gsap.timeline({ onComplete: finish })
        .to(progress, { value: 13.8, duration: 1.25, ease: "expo.out", onUpdate: () => { number.textContent = progress.value.toFixed(1).padStart(4, "0"); } }, 0)
        .to(bar, { scaleX: 1, duration: 1.1, ease: "expo.out" }, 0)
        .to(loader, { autoAlpha: 0, duration: 0.55, ease: "expo.out" }, 1.05);
    } else {
      number.textContent = "13.8";
      bar.style.transform = "scaleX(1)";
      window.setTimeout(finish, 500);
    }
  });

  state.visual = window.__lmMembershipVisual || null;
  window.addEventListener("lm:membership-entity-ready", (event) => { state.visual = event.detail; });
  window.__lmMembershipRuntime = { lenis: state.lenis };
  window.dispatchEvent(new CustomEvent("lm:membership-runtime-ready", { detail: window.__lmMembershipRuntime }));
  setActiveSection(0);
  updateTelemetry();
  syncFooterProximity();
  body.classList.add("lm-motion-ready");
  ScrollTrigger?.refresh();
  await runPreloader();
  state.lenis?.start();
  revealHero();
  ScrollTrigger?.refresh();
  };

  const windowReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  const fontsReady = document.fonts?.ready || Promise.resolve();
  Promise.all([windowReady, fontsReady]).then(boot).catch(() => {
    document.querySelector(".lm-temporal-loader")?.remove();
    document.body?.classList.add("lm-no-webgl");
  });
})();
