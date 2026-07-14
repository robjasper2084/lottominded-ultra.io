(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionKey = "lmGuide3dMotion";
  let motionEnabled = localStorage.getItem(motionKey) !== "off" && !reduceMotionQuery.matches;
  let rafId = 0;
  let latestPointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function installWorld() {
    if (document.querySelector("[data-guide-3d-world]")) return document.querySelector("[data-guide-3d-world]");

    const world = document.createElement("div");
    world.className = "guide-3d-world";
    world.dataset.guide3dWorld = "";
    world.setAttribute("aria-hidden", "true");
    world.innerHTML = `
      <div class="guide-3d-depth-grid"></div>
      <div class="guide-3d-orb" data-guide-3d-orb>
        <span class="guide-3d-orb-core"></span>
        <span class="guide-3d-orb-ring"></span>
        <span class="guide-3d-orb-signal"></span>
      </div>
      <div class="guide-3d-particles" data-guide-3d-particles></div>
    `;
    body.insertBefore(world, body.firstElementChild);
    return world;
  }

  function installToggle() {
    if (document.querySelector("[data-guide-3d-toggle]")) return document.querySelector("[data-guide-3d-toggle]");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "guide-3d-toggle";
    button.dataset.guide3dToggle = "";
    button.textContent = "3D Motion";
    button.addEventListener("click", () => {
      motionEnabled = !motionEnabled;
      localStorage.setItem(motionKey, motionEnabled ? "on" : "off");
      updateMotionState();
      drawEnergyPaths();
    });
    body.append(button);
    return button;
  }

  const world = installWorld();
  const orb = world.querySelector("[data-guide-3d-orb]");
  const particleLayer = world.querySelector("[data-guide-3d-particles]");
  const toggle = installToggle();

  function updateMotionState() {
    body.classList.toggle("guide-3d-paused", !motionEnabled);
    toggle.setAttribute("aria-pressed", String(motionEnabled));
    toggle.setAttribute("aria-label", motionEnabled ? "Turn off 3D motion" : "Turn on 3D motion");
  }

  function scheduleFrame() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      root.style.setProperty("--guide-pointer-x", String(clamp(latestPointer.x / width, 0, 1)));
      root.style.setProperty("--guide-pointer-y", String(clamp(latestPointer.y / height, 0, 1)));
      root.style.setProperty("--guide-scroll", String(Math.round(window.scrollY || 0)));
    });
  }

  function handlePointer(event) {
    if (!motionEnabled) return;
    latestPointer = {
      x: event.clientX ?? latestPointer.x,
      y: event.clientY ?? latestPointer.y,
    };
    scheduleFrame();
  }

  function pulseOrb(x = latestPointer.x, y = latestPointer.y) {
    if (!motionEnabled || !orb || !particleLayer) return;
    orb.classList.remove("is-pulsing");
    void orb.offsetWidth;
    orb.classList.add("is-pulsing");
    window.setTimeout(() => orb.classList.remove("is-pulsing"), 760);

    const originX = clamp(x, 0, window.innerWidth);
    const originY = clamp(y, 0, window.innerHeight);
    const colors = ["#21f7ff", "#8effd4", "#f8d96b", "#b785ff"];
    for (let index = 0; index < 12; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / 12;
      const distance = 46 + (index % 4) * 14;
      particle.className = "guide-3d-particle";
      particle.style.setProperty("--x", String(originX));
      particle.style.setProperty("--y", String(originY));
      particle.style.setProperty("--dx", String(Math.cos(angle) * distance));
      particle.style.setProperty("--dy", String(Math.sin(angle) * distance));
      particle.style.background = colors[index % colors.length];
      particleLayer.append(particle);
      window.setTimeout(() => particle.remove(), 930);
    }
  }

  function installTilt() {
    const cards = document.querySelectorAll(".step-card, .manual-card, .hero-card, .faq details, .warning");
    cards.forEach((card) => {
      card.dataset.guideTilt = "";
      card.addEventListener("pointermove", (event) => {
        if (!motionEnabled) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
        const y = (event.clientY - rect.top) / Math.max(rect.height, 1);
        card.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
        card.style.setProperty("--tilt-y", `${(x - 0.5) * 8}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  function ensurePathSvg(container) {
    let svg = container.querySelector(":scope > .guide-step-paths");
    if (svg) return svg;
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("guide-step-paths");
    svg.setAttribute("aria-hidden", "true");
    container.prepend(svg);
    container.classList.add("has-guide-step-paths");
    return svg;
  }

  function drawEnergyPaths() {
    document.querySelectorAll(".steps").forEach((container) => {
      const cards = Array.from(container.querySelectorAll(".step-card")).slice(0, 6);
      const svg = ensurePathSvg(container);
      const containerRect = container.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${Math.max(containerRect.width, 1)} ${Math.max(containerRect.height, 1)}`);
      svg.setAttribute("width", String(Math.max(containerRect.width, 1)));
      svg.setAttribute("height", String(Math.max(containerRect.height, 1)));
      svg.replaceChildren();

      if (cards.length < 2) return;
      for (let index = 0; index < cards.length - 1; index += 1) {
        const startRect = cards[index].getBoundingClientRect();
        const endRect = cards[index + 1].getBoundingClientRect();
        const startX = startRect.left - containerRect.left + startRect.width / 2;
        const startY = startRect.top - containerRect.top + startRect.height / 2;
        const endX = endRect.left - containerRect.left + endRect.width / 2;
        const endY = endRect.top - containerRect.top + endRect.height / 2;
        const curve = Math.max(32, Math.abs(endX - startX) * 0.32);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${startX} ${startY} C ${startX + curve} ${startY - 22}, ${endX - curve} ${endY + 22}, ${endX} ${endY}`);
        path.style.animationDelay = `${index * -0.5}s`;
        svg.append(path);
      }
    });
  }

  let pathFrame = 0;
  function schedulePathDraw() {
    if (pathFrame) return;
    pathFrame = window.requestAnimationFrame(() => {
      pathFrame = 0;
      drawEnergyPaths();
    });
  }

  updateMotionState();
  installTilt();
  scheduleFrame();
  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) handlePointer(touch);
  }, { passive: true });
  window.addEventListener("scroll", scheduleFrame, { passive: true });
  window.addEventListener("click", (event) => pulseOrb(event.clientX, event.clientY), { passive: true });
  window.addEventListener("resize", schedulePathDraw, { passive: true });
  window.addEventListener("orientationchange", schedulePathDraw, { passive: true });
  reduceMotionQuery.addEventListener?.("change", () => {
    if (reduceMotionQuery.matches) motionEnabled = false;
    updateMotionState();
  });
  window.setTimeout(drawEnergyPaths, 120);
  window.setTimeout(drawEnergyPaths, 700);
})();
