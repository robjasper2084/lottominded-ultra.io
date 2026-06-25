const wrapper = document.getElementById("marqueeMotion");
const canvas = document.getElementById("marqueeFx");
const overlay = document.getElementById("overlay");
const shell = document.getElementById("shell");

if (wrapper && canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    canvas.hidden = true;
    wrapper.dataset.motion = "fallback";
  } else {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    w: 1,
    h: 1,
    dpr: 1,
    frame: 0,
    rafId: 0,
    active: true,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    pointerEnergy: 0,
    resizedAt: 0
  };

  let seed = 2084;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const particles = Array.from({ length: 88 }, (_, i) => ({
    x: rand(),
    y: rand(),
    z: 0.28 + rand() * 1.6,
    size: 0.6 + rand() * 1.7,
    phase: rand() * Math.PI * 2,
    color: i % 5 === 0 ? "gold" : i % 3 === 0 ? "magenta" : "cyan"
  }));

  const colors = {
    cyan: "41, 247, 255",
    magenta: "255, 45, 170",
    gold: "255, 223, 117",
    white: "246, 251, 255"
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    const pxW = Math.round(state.w * state.dpr);
    const pxH = Math.round(state.h * state.dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
      canvas.dataset.pixelSize = `${pxW}x${pxH}`;
    }
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.resizedAt = performance.now();
  };

  const setPointer = (event) => {
    const rect = wrapper.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    state.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    state.pointerEnergy = 1;
  };

  wrapper.addEventListener("pointermove", setPointer, { passive: true });
  wrapper.addEventListener("pointerleave", () => {
    state.targetX = 0;
    state.targetY = 0;
  });

  document.addEventListener("visibilitychange", () => {
    state.active = !document.hidden;
    syncLoop();
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }

  if (overlay) {
    new MutationObserver(syncLoop).observe(overlay, { attributes: true, attributeFilter: ["hidden", "data-state"] });
  }

  if (shell) {
    new MutationObserver(syncLoop).observe(shell, { attributes: true, attributeFilter: ["data-mode"] });
  }

  resize();

  function rgba(name, alpha) {
    return `rgba(${colors[name]}, ${alpha})`;
  }

  function drawBackground(time) {
    const { w, h } = state;
    const base = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.52, w * 0.82);
    base.addColorStop(0, "rgba(41, 247, 255, 0.12)");
    base.addColorStop(0.32, "rgba(91, 48, 197, 0.1)");
    base.addColorStop(0.58, "rgba(255, 45, 170, 0.08)");
    base.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    const pulseX = w * (0.34 + Math.sin(time * 0.43) * 0.08 + state.pointerX * 0.04);
    const pulseY = h * (0.52 + Math.cos(time * 0.31) * 0.04 + state.pointerY * 0.04);
    const glow = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, w * 0.38);
    glow.addColorStop(0, rgba("magenta", 0.16));
    glow.addColorStop(0.45, rgba("cyan", 0.07));
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPerspectiveGrid(time) {
    const { w, h } = state;
    const horizon = h * (0.45 + state.pointerY * 0.018);
    const vanishX = w * (0.5 + state.pointerX * 0.052);
    const bottom = h * 0.96;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";

    for (let i = -10; i <= 10; i += 1) {
      const bottomX = w * 0.5 + i * w * 0.075;
      const grad = ctx.createLinearGradient(vanishX, horizon, bottomX, bottom);
      grad.addColorStop(0, rgba("cyan", 0.04));
      grad.addColorStop(1, rgba(i % 2 ? "cyan" : "gold", 0.36));
      ctx.strokeStyle = grad;
      ctx.lineWidth = i === 0 ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(bottomX, bottom);
      ctx.stroke();
    }

    for (let i = 0; i < 15; i += 1) {
      const t = i / 14;
      const eased = t * t;
      const y = horizon + eased * (bottom - horizon);
      const alpha = 0.06 + t * 0.24;
      ctx.strokeStyle = rgba(i % 3 === 0 ? "gold" : "cyan", alpha);
      ctx.lineWidth = 0.65 + t * 0.7;
      ctx.beginPath();
      ctx.moveTo(w * (0.08 - t * 0.18), y);
      ctx.lineTo(w * (0.92 + t * 0.18), y);
      ctx.stroke();
    }

    const sweepY = horizon + ((time * 0.18) % 1) * (bottom - horizon);
    const sweep = ctx.createLinearGradient(0, sweepY - 16, 0, sweepY + 16);
    sweep.addColorStop(0, "rgba(0, 0, 0, 0)");
    sweep.addColorStop(0.5, rgba("cyan", 0.28));
    sweep.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.strokeStyle = sweep;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w * -0.04, sweepY);
    ctx.lineTo(w * 1.04, sweepY);
    ctx.stroke();

    ctx.restore();
  }

  function drawSignalBands(time) {
    const { w, h } = state;
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 5; i += 1) {
      const y = h * (0.24 + i * 0.13 + Math.sin(time * 0.8 + i) * 0.018);
      const x = ((time * (0.1 + i * 0.018) + i * 0.19) % 1) * w;
      const length = w * (0.18 + i * 0.04);
      const grad = ctx.createLinearGradient(x - length, y, x + length, y);
      grad.addColorStop(0, "rgba(0, 0, 0, 0)");
      grad.addColorStop(0.45, rgba(i % 2 ? "magenta" : "cyan", 0.2));
      grad.addColorStop(0.52, rgba("white", 0.32));
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1 + i * 0.24;
      ctx.beginPath();
      ctx.moveTo(x - length, y);
      ctx.lineTo(x + length, y + Math.sin(time + i) * h * 0.012);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles(time) {
    const { w, h } = state;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const particle of particles) {
      const drift = time * 0.012 * particle.z;
      const x = ((particle.x + drift + state.pointerX * 0.008 * particle.z) % 1) * w;
      const y = ((particle.y + Math.sin(time * 0.12 + particle.phase) * 0.018 + state.pointerY * 0.008) % 1) * h;
      const twinkle = 0.18 + Math.sin(time * (1.1 + particle.z) + particle.phase) * 0.14;
      ctx.fillStyle = rgba(particle.color, Math.max(0.04, twinkle));
      ctx.fillRect(x, y, particle.size, particle.size);
    }
    ctx.restore();
  }

  function drawScanlines(time) {
    const { w, h } = state;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(246, 251, 255, 0.04)";
    const offset = Math.floor((time * 16) % 8);
    for (let y = offset; y < h; y += 8) {
      ctx.fillRect(0, y, w, 1);
    }

    const rollY = (time * 24) % h;
    const grad = ctx.createLinearGradient(0, rollY - 28, 0, rollY + 28);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.5, "rgba(246, 251, 255, 0.1)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.max(0, rollY - 28), w, 56);
    ctx.restore();
  }

  function drawEdgeEcho(time) {
    const { w, h } = state;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i += 1) {
      const pad = 16 + i * 13 + Math.sin(time * 0.7 + i) * 2;
      ctx.strokeStyle = rgba(i % 2 ? "gold" : "cyan", 0.11 - i * 0.015);
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad * 0.62, w - pad * 2, h - pad * 1.24);
    }
    ctx.restore();
  }

  function render(now) {
    const time = now * 0.001;
    const visible = overlayVisible();
    state.pointerX += (state.targetX - state.pointerX) * 0.08;
    state.pointerY += (state.targetY - state.pointerY) * 0.08;
    state.pointerEnergy *= 0.94;

    wrapper.style.setProperty("--marquee-tilt-x", state.pointerX.toFixed(3));
    wrapper.style.setProperty("--marquee-tilt-y", state.pointerY.toFixed(3));

    ctx.clearRect(0, 0, state.w, state.h);
    if (visible) {
      drawBackground(time);
      drawParticles(time);
      drawPerspectiveGrid(time);
      drawSignalBands(time);
      drawEdgeEcho(time);
      drawScanlines(time);
    }

    state.frame += 1;
    updateMotionState();
    wrapper.dataset.frame = String(state.frame);
    wrapper.dataset.pointer = `${state.pointerX.toFixed(2)},${state.pointerY.toFixed(2)}`;
  }

  function overlayVisible() {
    return Boolean(overlay && !overlay.hidden);
  }

  function updateMotionState() {
    wrapper.dataset.motion = !overlayVisible() ? "paused" : reducedMotion.matches ? "still" : "active";
  }

  function shouldAnimate() {
    return state.active && overlayVisible() && !reducedMotion.matches;
  }

  function stopLoop() {
    if (!state.rafId) return;
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }

  function syncLoop() {
    updateMotionState();
    if (shouldAnimate()) {
      resize();
      if (!state.rafId) state.rafId = requestAnimationFrame(loop);
      return;
    }
    stopLoop();
    if (overlayVisible()) {
      resize();
      render(performance.now());
    }
  }

  function loop(now) {
    state.rafId = 0;
    if (!shouldAnimate()) {
      updateMotionState();
      return;
    }
    if (performance.now() - state.resizedAt > 1500) resize();
    render(now);
    state.rafId = requestAnimationFrame(loop);
  }

  reducedMotion.addEventListener("change", () => {
    state.frame = 0;
    syncLoop();
  });

  render(performance.now());
  syncLoop();
  }
}
