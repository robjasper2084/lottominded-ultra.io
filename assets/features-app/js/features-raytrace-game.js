(() => {
  const canvas = document.getElementById("featureRaytraceGame");
  if (!canvas) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let canvasInView = true;
  let drawFrame = 0;
  const els = {
    score: document.getElementById("rayScore"),
    high: document.getElementById("rayHigh"),
    targets: document.getElementById("rayTargets"),
    status: document.getElementById("rayStatus"),
    level: document.getElementById("rayLevel"),
  };
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    pointer: { x: window.innerWidth * 0.64, y: window.innerHeight * 0.42 },
    emitter: { x: 80, y: window.innerHeight * 0.75 },
    mirrors: [],
    targets: [],
    particles: [],
    score: 18540,
    high: 54210,
    level: 7,
    lastClear: performance.now(),
  };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.emitter = { x: state.width * 0.06, y: state.height * 0.72 };
    buildLevel();
  }
  function mirror(cx, cy, length, angle) { return { cx, cy, length, angle }; }
  function target(x, y, r = 16) { return { x, y, r, hit: false, phase: Math.random() * Math.PI * 2 }; }
  function buildLevel() {
    const w = state.width, h = state.height;
    state.mirrors = [
      mirror(w * 0.16, h * 0.66, 120, -0.78),
      mirror(w * 0.2, h * 0.30, 116, 0.78),
      mirror(w * 0.78, h * 0.22, 130, -0.84),
      mirror(w * 0.87, h * 0.54, 118, 0.84),
      mirror(w * 0.72, h * 0.76, 120, -0.18),
      mirror(w * 0.47, h * 0.33, 100, 0.28),
    ];
    state.targets = [
      target(w * 0.22, h * 0.19),
      target(w * 0.31, h * 0.61),
      target(w * 0.47, h * 0.20),
      target(w * 0.62, h * 0.63),
      target(w * 0.76, h * 0.36),
      target(w * 0.91, h * 0.40),
      target(w * 0.84, h * 0.78),
      target(w * 0.12, h * 0.82),
    ];
  }
  function normalize(v) {
    const m = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / m, y: v.y / m };
  }
  function raySegmentIntersect(origin, dir, x1, y1, x2, y2) {
    const vx = x2 - x1, vy = y2 - y1;
    const det = dir.x * vy - dir.y * vx;
    if (Math.abs(det) < 0.0001) return null;
    const dx = x1 - origin.x, dy = y1 - origin.y;
    const t = (dx * vy - dy * vx) / det;
    const u = (dx * dir.y - dy * dir.x) / det;
    if (t > 0.001 && u >= 0 && u <= 1) return { t, x: origin.x + dir.x * t, y: origin.y + dir.y * t };
    return null;
  }
  function reflect(dir, angle) {
    const nx = -Math.sin(angle), ny = Math.cos(angle);
    const dot = dir.x * nx + dir.y * ny;
    return normalize({ x: dir.x - 2 * dot * nx, y: dir.y - 2 * dot * ny });
  }
  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1) : 0;
    const x = ax + dx * t, y = ay + dy * t;
    return Math.hypot(px - x, py - y);
  }
  function trace() {
    const bounds = [
      { x1: 0, y1: 0, x2: state.width, y2: 0, angle: 0 },
      { x1: state.width, y1: 0, x2: state.width, y2: state.height, angle: Math.PI / 2 },
      { x1: state.width, y1: state.height, x2: 0, y2: state.height, angle: 0 },
      { x1: 0, y1: state.height, x2: 0, y2: 0, angle: Math.PI / 2 },
    ];
    const segments = [];
    let origin = { ...state.emitter };
    let dir = normalize({ x: state.pointer.x - origin.x, y: state.pointer.y - origin.y });
    for (let bounce = 0; bounce < 12; bounce += 1) {
      let nearest = null;
      let type = "bound";
      let angle = 0;
      for (const b of bounds) {
        const hit = raySegmentIntersect(origin, dir, b.x1, b.y1, b.x2, b.y2);
        if (hit && (!nearest || hit.t < nearest.t)) { nearest = hit; type = "bound"; angle = b.angle; }
      }
      for (const m of state.mirrors) {
        const half = m.length / 2;
        const x1 = m.cx - Math.cos(m.angle) * half;
        const y1 = m.cy - Math.sin(m.angle) * half;
        const x2 = m.cx + Math.cos(m.angle) * half;
        const y2 = m.cy + Math.sin(m.angle) * half;
        const hit = raySegmentIntersect(origin, dir, x1, y1, x2, y2);
        if (hit && (!nearest || hit.t < nearest.t)) { nearest = hit; type = "mirror"; angle = m.angle; }
      }
      if (!nearest) break;
      segments.push({ x1: origin.x, y1: origin.y, x2: nearest.x, y2: nearest.y });
      for (const t of state.targets) {
        if (t.hit) continue;
        if (distToSegment(t.x, t.y, origin.x, origin.y, nearest.x, nearest.y) < t.r + 8) {
          t.hit = true;
          state.score += 180 + bounce * 14;
          burst(t.x, t.y, 18, "#ff4fd8");
        }
      }
      if (type === "mirror") dir = reflect(dir, angle);
      else {
        if (nearest.x <= 1 || nearest.x >= state.width - 1) dir.x *= -1;
        if (nearest.y <= 1 || nearest.y >= state.height - 1) dir.y *= -1;
      }
      origin = { x: nearest.x + dir.x * 0.8, y: nearest.y + dir.y * 0.8 };
    }
    return segments;
  }
  function burst(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.6 + Math.random() * 2.8;
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
    }
  }
  function drawLine(x1, y1, x2, y2, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function canDraw() {
    return !reduceMotion && !document.hidden && canvasInView;
  }
  function scheduleDraw() {
    if (drawFrame || !canDraw()) return;
    drawFrame = requestAnimationFrame(draw);
  }
  function draw(now, force = false) {
    drawFrame = 0;
    if (!force && !canDraw()) return;
    const hitCount = state.targets.filter((t) => t.hit).length;
    if (els.score) els.score.textContent = Math.round(state.score).toLocaleString();
    if (els.high) els.high.textContent = Math.max(state.high, state.score).toLocaleString();
    if (els.targets) els.targets.textContent = `${hitCount} / ${state.targets.length}`;
    if (els.level) els.level.textContent = String(state.level);
    if (els.status) els.status.textContent = hitCount === state.targets.length ? "Perfect!" : "Tracking";

    ctx.clearRect(0, 0, state.width, state.height);
    const aurora = ctx.createRadialGradient(state.width * 0.86, state.height * 0.26, 20, state.width * 0.86, state.height * 0.26, state.width * 0.42);
    aurora.addColorStop(0, "rgba(255,79,216,.16)");
    aurora.addColorStop(0.48, "rgba(41,247,255,.06)");
    aurora.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aurora;
    ctx.fillRect(0, 0, state.width, state.height);

    const segments = trace();
    for (const t of state.targets) {
      t.phase += 0.025;
      const pulse = 1 + Math.sin(t.phase) * 0.12;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.shadowBlur = t.hit ? 30 : 18;
      ctx.shadowColor = t.hit ? "#ff4fd8" : "#29f7ff";
      ctx.strokeStyle = t.hit ? "rgba(255,79,216,.9)" : "rgba(41,247,255,.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, t.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, t.r * 1.8 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const m of state.mirrors) {
      const half = m.length / 2;
      const x1 = m.cx - Math.cos(m.angle) * half;
      const y1 = m.cy - Math.sin(m.angle) * half;
      const x2 = m.cx + Math.cos(m.angle) * half;
      const y2 = m.cy + Math.sin(m.angle) * half;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#29f7ff";
      drawLine(x1, y1, x2, y2, 8, "rgba(41,247,255,.14)");
      drawLine(x1, y1, x2, y2, 2.4, "rgba(220,255,255,.9)");
    }
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#ff4fd8";
    for (const s of segments) {
      drawLine(s.x1, s.y1, s.x2, s.y2, 14, "rgba(255,79,216,.08)");
      drawLine(s.x1, s.y1, s.x2, s.y2, 5, "rgba(41,247,255,.12)");
      drawLine(s.x1, s.y1, s.x2, s.y2, 2.5, "rgba(255,220,255,.94)");
    }
    const g = ctx.createRadialGradient(state.emitter.x, state.emitter.y, 0, state.emitter.x, state.emitter.y, 34);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.25, "#ffe7ff");
    g.addColorStop(0.55, "rgba(255,79,216,.76)");
    g.addColorStop(1, "rgba(255,79,216,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(state.emitter.x, state.emitter.y, 34, 0, Math.PI * 2);
    ctx.fill();

    state.particles = state.particles.filter((p) => p.life > 0.03);
    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.988;
      p.vy *= 0.988;
      p.life *= 0.972;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (hitCount === state.targets.length && now - state.lastClear > 1400) {
      state.lastClear = now;
      state.score += 600;
      state.level += 1;
      state.targets.forEach((t) => { t.hit = false; });
      burst(state.emitter.x, state.emitter.y, 28, "#ffe071");
    }
    scheduleDraw();
  }
  function rotateNearest(x, y) {
    let best = Infinity, nearest = null;
    for (const m of state.mirrors) {
      const d = Math.hypot(x - m.cx, y - m.cy);
      if (d < best) { best = d; nearest = m; }
    }
    if (nearest && best < 170) {
      nearest.angle += Math.PI / 4;
      state.score += 40;
      burst(nearest.cx, nearest.cy, 10, "#29f7ff");
    }
  }
  window.addEventListener("resize", () => {
    resize();
    scheduleDraw();
  }, { passive: true });
  window.addEventListener("pointermove", (event) => {
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    scheduleDraw();
  }, { passive: true });
  window.addEventListener("click", (event) => rotateNearest(event.clientX, event.clientY));
  document.addEventListener("visibilitychange", scheduleDraw);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      canvasInView = entries.some((entry) => entry.isIntersecting);
      scheduleDraw();
    }, { rootMargin: "180px 0px", threshold: 0.01 });
    observer.observe(canvas);
  }
  resize();
  if (reduceMotion) {
    const wasInView = canvasInView;
    canvasInView = true;
    draw(performance.now(), true);
    canvasInView = wasInView;
  } else {
    scheduleDraw();
  }
})();
