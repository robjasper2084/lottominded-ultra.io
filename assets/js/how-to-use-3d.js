(() => {
  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  if (!body?.classList.contains("home-page")) return;

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionKey = "lottominded.guide3d.motion.v2";
  const stored = (() => {
    try { return localStorage.getItem(motionKey); } catch (error) { return null; }
  })();

  const state = {
    pointerX: window.innerWidth * 0.5,
    pointerY: window.innerHeight * 0.36,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.36,
    scroll: window.scrollY || 0,
    depth: 0,
    width: 1,
    height: 1,
    dpr: 1,
    running: true,
    visible: !doc.hidden,
    motion: stored ? stored !== "off" : !reduceQuery.matches,
    particles: [],
    numbers: [],
    rings: [],
    lastTime: 0,
    frame: 0,
    pathFrame: 0,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const prefersReduced = () => reduceQuery.matches || !state.motion;

  function installScene() {
    let scene = doc.querySelector("[data-guide3d-scene]");
    if (scene) return scene;
    scene = doc.createElement("div");
    scene.className = "guide3d-scene";
    scene.dataset.guide3dScene = "";
    scene.setAttribute("aria-hidden", "true");
    scene.innerHTML = `
      <canvas class="guide3d-canvas" data-guide3d-canvas></canvas>
      <div class="guide3d-grid"></div>
      <div class="guide3d-light-beams"></div>
      <div class="guide3d-orbit-field"></div>
    `;
    body.insertBefore(scene, body.firstElementChild);
    return scene;
  }

  function installProgress() {
    let progress = doc.querySelector("[data-guide3d-progress]");
    if (progress) return progress;
    progress = doc.createElement("div");
    progress.className = "guide3d-signal-progress";
    progress.dataset.guide3dProgress = "";
    progress.setAttribute("aria-hidden", "true");
    body.append(progress);
    return progress;
  }

  function installToggle() {
    let toggle = doc.querySelector("[data-guide3d-toggle]");
    if (toggle) return toggle;
    toggle = doc.createElement("button");
    toggle.type = "button";
    toggle.className = "guide3d-motion-toggle";
    toggle.dataset.guide3dToggle = "";
    toggle.textContent = "3D Motion";
    toggle.addEventListener("click", () => {
      state.motion = !state.motion;
      try { localStorage.setItem(motionKey, state.motion ? "on" : "off"); } catch (error) {}
      updateMotionState();
      scheduleFrame();
      drawEnergyPaths();
    });
    body.append(toggle);
    return toggle;
  }

  const scene = installScene();
  installProgress();
  const toggle = installToggle();
  const canvas = scene.querySelector("[data-guide3d-canvas]");
  const ctx = canvas?.getContext("2d", { alpha: true });

  function updateMotionState() {
    const reduced = prefersReduced();
    body.classList.toggle("guide3d-reduced", reduced);
    toggle.setAttribute("aria-pressed", String(!reduced));
    toggle.setAttribute("aria-label", reduced ? "Turn on 3D motion" : "Turn off 3D motion");
    toggle.textContent = reduced ? "3D Motion Off" : "3D Motion";
  }

  function resize() {
    state.width = Math.max(window.innerWidth, 1);
    state.height = Math.max(window.innerHeight, 1);
    state.dpr = Math.min(window.devicePixelRatio || 1, state.width < 760 ? 1.4 : 1.75);
    if (canvas && ctx) {
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }
    buildSceneObjects();
    drawEnergyPaths();
    updateDepth();
  }

  function buildSceneObjects() {
    const density = state.width < 760 ? 18 : state.width < 1100 ? 32 : 48;
    state.numbers = Array.from({ length: density }, (_, index) => ({
      value: String((index * 7 + 9) % 70 || 70).padStart(2, "0"),
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      z: 0.3 + Math.random() * 1.25,
      r: 9 + Math.random() * 24,
      hue: index % 5,
      drift: 0.2 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
    state.rings = Array.from({ length: state.width < 760 ? 4 : 7 }, (_, index) => ({
      x: state.width * (0.18 + Math.random() * 0.7),
      y: state.height * (0.18 + Math.random() * 0.66),
      r: 90 + index * 54 + Math.random() * 64,
      spin: Math.random() * Math.PI * 2,
      speed: 0.00008 + Math.random() * 0.00012,
    }));
  }

  function updateDepth() {
    const scrollMax = Math.max(doc.documentElement.scrollHeight - window.innerHeight, 1);
    state.scroll = window.scrollY || 0;
    state.depth = clamp(state.scroll / scrollMax, 0, 1);
    root.style.setProperty("--guide3d-scroll", String(Math.round(state.scroll)));
    root.style.setProperty("--guide3d-depth", String(state.depth.toFixed(4)));
  }

  function updatePointerVars() {
    const x = clamp(state.pointerX / Math.max(state.width, 1), 0, 1);
    const y = clamp(state.pointerY / Math.max(state.height, 1), 0, 1);
    root.style.setProperty("--guide3d-pointer-x", x.toFixed(4));
    root.style.setProperty("--guide3d-pointer-y", y.toFixed(4));
  }

  function scheduleFrame() {
    if (state.frame) return;
    state.frame = window.requestAnimationFrame(render);
  }

  function drawBackground(now) {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, state.width, state.height);
    if (prefersReduced()) {
      const staticGradient = ctx.createRadialGradient(state.width * 0.72, state.height * 0.22, 20, state.width * 0.72, state.height * 0.22, state.width * 0.54);
      staticGradient.addColorStop(0, "rgba(33,247,255,0.12)");
      staticGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = staticGradient;
      ctx.fillRect(0, 0, state.width, state.height);
      return;
    }

    const driftX = (state.pointerX / state.width - 0.5) * 40;
    const driftY = (state.pointerY / state.height - 0.5) * 30;
    const bg = ctx.createRadialGradient(state.width * 0.62 + driftX, state.height * 0.26 + driftY, 20, state.width * 0.62, state.height * 0.26, Math.max(state.width, state.height) * 0.68);
    bg.addColorStop(0, "rgba(33,247,255,0.18)");
    bg.addColorStop(0.34, "rgba(248,217,107,0.07)");
    bg.addColorStop(0.68, "rgba(3,16,31,0.06)");
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, state.width, state.height);

    state.rings.forEach((ring, index) => {
      ring.spin += ring.speed * (now || 16);
      ctx.save();
      ctx.translate(ring.x + driftX * (index % 3), ring.y + driftY * 0.6);
      ctx.rotate(ring.spin);
      ctx.scale(1, 0.28 + (index % 3) * 0.08);
      ctx.strokeStyle = index % 2 ? "rgba(248,217,107,0.13)" : "rgba(33,247,255,0.16)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    state.numbers.forEach((number) => {
      number.phase += 0.006 * number.drift;
      const parallax = number.z * 18;
      const x = (number.x + Math.cos(number.phase) * 8 + driftX * number.z * 0.9 + state.width) % state.width;
      const y = (number.y + Math.sin(number.phase * 0.7) * 10 + driftY * number.z * 0.55 + state.height) % state.height;
      const alpha = 0.16 + number.z * 0.12;
      const fill = number.hue === 2 ? "248,217,107" : number.hue === 4 ? "196,108,255" : "33,247,255";
      ctx.fillStyle = `rgba(${fill},${alpha})`;
      ctx.strokeStyle = `rgba(${fill},${alpha + 0.08})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, number.r + parallax * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(238,255,251,${Math.min(alpha + 0.22, 0.62)})`;
      ctx.font = `800 ${Math.max(10, number.r * 0.72)}px system-ui, sans-serif`;
      ctx.fillText(number.value, x, y);
    });

    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.particles.forEach((particle) => {
      particle.life -= 0.024;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.014;
      ctx.fillStyle = particle.color.replace("ALPHA", String(Math.max(particle.life, 0)));
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * Math.max(particle.life, 0.2), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function render(now) {
    state.frame = 0;
    const shouldAnimate = state.visible && state.running;
    state.pointerX += (state.targetX - state.pointerX) * 0.08;
    state.pointerY += (state.targetY - state.pointerY) * 0.08;
    updatePointerVars();
    updateDepth();
    drawBackground(now);
    if (shouldAnimate && !prefersReduced()) scheduleFrame();
  }

  function handlePointer(event) {
    const point = event.touches?.[0] || event.changedTouches?.[0] || event;
    if (!Number.isFinite(point.clientX) || !Number.isFinite(point.clientY)) return;
    state.targetX = point.clientX;
    state.targetY = point.clientY;
    scheduleFrame();
  }

  function burst(x, y, count = 18) {
    if (prefersReduced()) return;
    const colors = ["rgba(33,247,255,ALPHA)", "rgba(142,255,212,ALPHA)", "rgba(248,217,107,ALPHA)", "rgba(196,108,255,ALPHA)"];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 1.6 + (i % 5) * 0.62;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.2 + (i % 4),
        life: 1,
        color: colors[i % colors.length],
      });
    }
    scheduleFrame();
  }

  function pulseAt(x, y) {
    const wave = doc.createElement("span");
    wave.className = "guide3d-orb-wave";
    wave.style.setProperty("--wave-x", `${x}px`);
    wave.style.setProperty("--wave-y", `${y}px`);
    body.append(wave);
    window.setTimeout(() => wave.remove(), 820);
    for (let index = 0; index < 14; index += 1) {
      const spark = doc.createElement("span");
      const angle = (Math.PI * 2 * index) / 14;
      const distance = 48 + (index % 5) * 12;
      spark.className = "guide3d-orb-spark";
      spark.style.setProperty("--spark-x", `${x}px`);
      spark.style.setProperty("--spark-y", `${y}px`);
      spark.style.setProperty("--spark-dx", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-dy", `${Math.sin(angle) * distance}px`);
      spark.style.setProperty("--spark-color", index % 3 === 0 ? "#f8d96b" : index % 3 === 1 ? "#21f7ff" : "#8effd4");
      body.append(spark);
      window.setTimeout(() => spark.remove(), 960);
    }
    burst(x, y, 20);
  }

  function installOrbInteraction() {
    const orbImage = doc.querySelector(".hero-card .orb-stage img");
    const heroCard = doc.querySelector(".hero-card");
    if (!orbImage || !heroCard) return;
    orbImage.setAttribute("draggable", "false");
    orbImage.addEventListener("pointerdown", (event) => {
      if (event.button && event.button > 0) return;
      heroCard.classList.add("is-orb-pulsing");
      pulseAt(event.clientX, event.clientY);
      window.setTimeout(() => heroCard.classList.remove("is-orb-pulsing"), 780);
    });
    orbImage.addEventListener("pointermove", handlePointer, { passive: true });
    orbImage.addEventListener("touchmove", handlePointer, { passive: true });
  }

  function installTilt() {
    const selectors = ".step-card, .feature-card, .manual-card, .faq details, .warning, .refined-bridge-grid article";
    doc.querySelectorAll(selectors).forEach((card) => {
      card.dataset.guide3dTilt = "";
      card.classList.add("guide3d-reveal");
      card.addEventListener("pointermove", (event) => {
        if (prefersReduced()) return;
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
        const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
        card.style.setProperty("--guide3d-card-x", `${Math.round(x * 100)}%`);
        card.style.setProperty("--guide3d-card-y", `${Math.round(y * 100)}%`);
        card.style.setProperty("--guide3d-tilt-x", `${(0.5 - y) * 7}deg`);
        card.style.setProperty("--guide3d-tilt-y", `${(x - 0.5) * 8}deg`);
      }, { passive: true });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--guide3d-tilt-x", "0deg");
        card.style.setProperty("--guide3d-tilt-y", "0deg");
      });
      card.addEventListener("focusin", () => card.classList.add("is-guide3d-active"));
      card.addEventListener("focusout", () => card.classList.remove("is-guide3d-active"));
    });
  }

  function installReveal() {
    const items = doc.querySelectorAll(".guide3d-reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-guide3d-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-guide3d-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  function ensurePathSvg(container) {
    let svg = container.querySelector(":scope > .guide3d-step-paths");
    if (svg) return svg;
    svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("guide3d-step-paths");
    svg.setAttribute("aria-hidden", "true");
    container.prepend(svg);
    return svg;
  }

  function drawEnergyPaths() {
    doc.querySelectorAll("#how .steps, #lottomind-app-guide .steps").forEach((container) => {
      const cards = Array.from(container.querySelectorAll(".step-card")).slice(0, 6);
      const svg = ensurePathSvg(container);
      const cRect = container.getBoundingClientRect();
      const width = Math.max(cRect.width, 1);
      const height = Math.max(cRect.height, 1);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.replaceChildren();
      if (cards.length < 2 || width < 420) return;
      for (let index = 0; index < cards.length - 1; index += 1) {
        const a = cards[index].getBoundingClientRect();
        const b = cards[index + 1].getBoundingClientRect();
        const startX = a.left - cRect.left + a.width * 0.5;
        const startY = a.top - cRect.top + a.height * 0.55;
        const endX = b.left - cRect.left + b.width * 0.5;
        const endY = b.top - cRect.top + b.height * 0.45;
        const curve = Math.max(44, Math.abs(endX - startX) * 0.35);
        const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${startX} ${startY} C ${startX + curve} ${startY - 24}, ${endX - curve} ${endY + 24}, ${endX} ${endY}`);
        path.style.animationDelay = `${index * -0.55}s`;
        svg.append(path);
      }
    });
  }

  function schedulePathDraw() {
    if (state.pathFrame) return;
    state.pathFrame = window.requestAnimationFrame(() => {
      state.pathFrame = 0;
      drawEnergyPaths();
    });
  }

  function installStepFocus() {
    doc.querySelectorAll("#how .step-card, #lottomind-app-guide .step-card").forEach((card) => {
      const activate = () => card.classList.add("is-guide3d-active");
      const deactivate = () => card.classList.remove("is-guide3d-active");
      card.addEventListener("pointerenter", activate);
      card.addEventListener("pointerleave", deactivate);
      card.addEventListener("click", () => {
        doc.querySelectorAll(".step-card.is-guide3d-active").forEach((active) => {
          if (active !== card) active.classList.remove("is-guide3d-active");
        });
        card.classList.add("is-guide3d-active");
      });
    });
  }

  function installAnchorTransitions() {
    doc.querySelectorAll('a[href^="#"], a[href*="how-to-use.html#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href") || "";
        const hash = href.includes("#") ? href.slice(href.indexOf("#")) : href;
        const target = hash.length > 1 ? doc.querySelector(hash) : null;
        if (!target) return;
        event.preventDefault();
        body.classList.add("guide3d-anchor-travel");
        target.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
        history.pushState(null, "", hash);
        const rect = target.getBoundingClientRect();
        pulseAt(Math.min(Math.max(rect.left + rect.width * 0.5, 40), window.innerWidth - 40), Math.min(Math.max(rect.top + 90, 60), window.innerHeight - 60));
        window.setTimeout(() => body.classList.remove("guide3d-anchor-travel"), 720);
      });
    });
  }

  function installFaqKeyboardGuard() {
    doc.querySelectorAll(".faq details").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        const rect = details.getBoundingClientRect();
        pulseAt(rect.left + Math.min(rect.width * 0.5, 220), rect.top + 34);
      });
    });
  }

  function setupLifecycle() {
    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("touchmove", handlePointer, { passive: true });
    window.addEventListener("scroll", () => {
      updateDepth();
      scheduleFrame();
    }, { passive: true });
    window.addEventListener("resize", () => {
      resize();
      schedulePathDraw();
    }, { passive: true });
    window.addEventListener("orientationchange", () => {
      window.setTimeout(resize, 160);
    }, { passive: true });
    doc.addEventListener("visibilitychange", () => {
      state.visible = !doc.hidden;
      if (state.visible) scheduleFrame();
    });
    reduceQuery.addEventListener?.("change", () => {
      if (reduceQuery.matches) state.motion = false;
      updateMotionState();
      scheduleFrame();
      drawEnergyPaths();
    });
  }

  updateMotionState();
  resize();
  installTilt();
  installReveal();
  installOrbInteraction();
  installStepFocus();
  installAnchorTransitions();
  installFaqKeyboardGuard();
  setupLifecycle();
  scheduleFrame();
  window.setTimeout(drawEnergyPaths, 120);
  window.setTimeout(drawEnergyPaths, 800);
})();
