(() => {
  const canvas = document.querySelector("[data-home-raytrace-canvas]");
  const stage = document.querySelector("[data-spheres-stage]");

  if (!canvas || !stage) {
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let canvasInView = true;
  let frameId = 0;
  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    ready: false,
    score: 0,
    bounces: 0,
    hits: 0,
    pointerMoves: 0,
    time: 0,
    lastFrame: 0,
    beamSegments: [],
    pointer: {
      active: false,
      x: 0,
      y: 0,
      tx: 0,
      ty: 0
    },
    ball: {
      x: 0,
      y: 0,
      vx: 160,
      vy: 96,
      radius: 16
    },
    particles: [],
    targets: [],
    mirrors: []
  };

  const seedBase = Date.now() ^ Math.floor(window.innerWidth * 131 + window.innerHeight * 17);
  let rng = mulberry32(seedBase >>> 0);

  function mulberry32(seed) {
    return () => {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function length(x, y) {
    return Math.hypot(x, y) || 1;
  }

  function normalize(vector) {
    const mag = length(vector.x, vector.y);
    return {
      x: vector.x / mag,
      y: vector.y / mag
    };
  }

  function cross(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  function reflect(dir, normal) {
    const power = 2 * dot(dir, normal);
    return normalize({
      x: dir.x - power * normal.x,
      y: dir.y - power * normal.y
    });
  }

  function placeTarget(target) {
    const pad = Math.max(90, Math.min(state.width, state.height) * 0.08);
    target.x = pad + rng() * Math.max(1, state.width - pad * 2);
    target.y = pad + rng() * Math.max(1, state.height - pad * 2);
    target.r = 18 + rng() * 20;
    target.phase = rng() * Math.PI * 2;
    target.value = String(Math.floor(1 + rng() * 69)).padStart(2, "0");
  }

  function rebuildWorld() {
    const w = state.width;
    const h = state.height;
    state.mirrors = [
      { x1: w * 0.12, y1: h * 0.22, x2: w * 0.34, y2: h * 0.12 },
      { x1: w * 0.52, y1: h * 0.18, x2: w * 0.78, y2: h * 0.28 },
      { x1: w * 0.24, y1: h * 0.55, x2: w * 0.45, y2: h * 0.44 },
      { x1: w * 0.66, y1: h * 0.62, x2: w * 0.88, y2: h * 0.5 },
      { x1: w * 0.18, y1: h * 0.82, x2: w * 0.42, y2: h * 0.9 }
    ];

    if (!state.targets.length) {
      state.targets = Array.from({ length: 7 }, () => ({ x: 0, y: 0, r: 24, value: "00", phase: 0 }));
    }

    state.targets.forEach(placeTarget);
  }

  function resize() {
    const hostHeight = Math.max(stage.scrollHeight, window.innerHeight);
    canvas.style.height = `${hostHeight}px`;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || stage.clientWidth || window.innerWidth);
    const height = Math.max(1, rect.height || hostHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, reduceMotion ? 1 : 1.35);

    state.width = width;
    state.height = height;
    state.dpr = dpr;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!state.ready) {
      state.ball.x = width * 0.64;
      state.ball.y = Math.max(180, height * 0.2);
      state.pointer.x = state.ball.x;
      state.pointer.y = state.ball.y;
      state.pointer.tx = state.ball.x;
      state.pointer.ty = state.ball.y;
      state.ready = true;
    } else {
      state.ball.x = clamp(state.ball.x, 40, width - 40);
      state.ball.y = clamp(state.ball.y, 40, height - 40);
    }

    rebuildWorld();
  }

  function pointerFromEvent(event) {
    const point = event.touches ? event.touches[0] : event;
    if (!point) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    state.pointer.active = true;
    state.pointer.tx = clamp(point.clientX - rect.left, 0, state.width);
    state.pointer.ty = clamp(point.clientY - rect.top, 0, state.height);
    state.pointerMoves += 1;
    stage.style.setProperty("--home-ray-x", `${clamp((point.clientX / window.innerWidth) * 100, 0, 100)}%`);
    stage.style.setProperty("--home-ray-y", `${clamp((point.clientY / window.innerHeight) * 100, 0, 100)}%`);
  }

  function castRay(origin, direction, maxBounces) {
    const segments = [];
    let pos = { x: origin.x, y: origin.y };
    let dir = normalize(direction);

    for (let bounce = 0; bounce < maxBounces; bounce += 1) {
      const hit = nextRayHit(pos, dir);
      if (!hit) {
        break;
      }

      segments.push({
        x1: pos.x,
        y1: pos.y,
        x2: hit.x,
        y2: hit.y,
        kind: hit.kind
      });

      pos = {
        x: hit.x + hit.normal.x * 0.8,
        y: hit.y + hit.normal.y * 0.8
      };
      dir = reflect(dir, hit.normal);
    }

    return segments;
  }

  function nextRayHit(pos, dir) {
    const hits = [];
    const epsilon = 0.001;

    if (dir.x > epsilon) {
      hits.push({ t: (state.width - pos.x) / dir.x, normal: { x: -1, y: 0 }, kind: "wall" });
    } else if (dir.x < -epsilon) {
      hits.push({ t: (0 - pos.x) / dir.x, normal: { x: 1, y: 0 }, kind: "wall" });
    }

    if (dir.y > epsilon) {
      hits.push({ t: (state.height - pos.y) / dir.y, normal: { x: 0, y: -1 }, kind: "wall" });
    } else if (dir.y < -epsilon) {
      hits.push({ t: (0 - pos.y) / dir.y, normal: { x: 0, y: 1 }, kind: "wall" });
    }

    state.mirrors.forEach((mirror) => {
      const q = { x: mirror.x1, y: mirror.y1 };
      const s = { x: mirror.x2 - mirror.x1, y: mirror.y2 - mirror.y1 };
      const r = { x: dir.x, y: dir.y };
      const qp = { x: q.x - pos.x, y: q.y - pos.y };
      const denom = cross(r, s);
      if (Math.abs(denom) < epsilon) {
        return;
      }
      const t = cross(qp, s) / denom;
      const u = cross(qp, r) / denom;
      if (t > 6 && u >= 0 && u <= 1) {
        const segLen = length(s.x, s.y);
        let normal = { x: -s.y / segLen, y: s.x / segLen };
        if (dot(normal, dir) > 0) {
          normal = { x: -normal.x, y: -normal.y };
        }
        hits.push({ t, normal, kind: "mirror" });
      }
    });

    const hit = hits
      .filter((item) => item.t > 1)
      .sort((a, b) => a.t - b.t)[0];

    if (!hit) {
      return null;
    }

    return {
      x: pos.x + dir.x * hit.t,
      y: pos.y + dir.y * hit.t,
      normal: hit.normal,
      kind: hit.kind
    };
  }

  function addSpark(x, y, color, count = 10) {
    if (reduceMotion) {
      return;
    }

    for (let i = 0; i < count; i += 1) {
      const angle = rng() * Math.PI * 2;
      const speed = 26 + rng() * 130;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.55 + rng() * 0.45,
        maxLife: 0.75 + rng() * 0.45,
        size: 1.2 + rng() * 2.8,
        color
      });
    }
  }

  function update(dt) {
    const ball = state.ball;
    state.time += dt;

    state.pointer.x = lerp(state.pointer.x, state.pointer.tx, 0.06);
    state.pointer.y = lerp(state.pointer.y, state.pointer.ty, 0.06);

    const autoX = state.width * (0.5 + Math.sin(state.time * 0.13) * 0.35);
    const autoY = state.height * (0.34 + Math.cos(state.time * 0.1) * 0.18);
    const targetX = state.pointer.active ? state.pointer.x : autoX;
    const targetY = state.pointer.active ? state.pointer.y : autoY;

    const pullX = (targetX - ball.x) * (state.pointer.active ? 0.18 : 0.05);
    const pullY = (targetY - ball.y) * (state.pointer.active ? 0.18 : 0.04);
    ball.vx += pullX * dt;
    ball.vy += pullY * dt;

    const speed = length(ball.vx, ball.vy);
    const maxSpeed = reduceMotion ? 140 : 360;
    if (speed > maxSpeed) {
      ball.vx = (ball.vx / speed) * maxSpeed;
      ball.vy = (ball.vy / speed) * maxSpeed;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const r = ball.radius;
    let bounced = false;
    if (ball.x < r || ball.x > state.width - r) {
      ball.x = clamp(ball.x, r, state.width - r);
      ball.vx *= -0.92;
      bounced = true;
    }
    if (ball.y < r || ball.y > state.height - r) {
      ball.y = clamp(ball.y, r, state.height - r);
      ball.vy *= -0.92;
      bounced = true;
    }
    if (bounced) {
      state.bounces += 1;
      state.score += 3;
      addSpark(ball.x, ball.y, "rgba(41, 247, 255, 0.95)", 8);
    }

    state.targets.forEach((target) => {
      const dx = ball.x - target.x;
      const dy = ball.y - target.y;
      const hitDistance = target.r + ball.radius;
      if (dx * dx + dy * dy < hitDistance * hitDistance) {
        state.hits += 1;
        state.score += 25 + state.hits * 2;
        addSpark(target.x, target.y, "rgba(255, 224, 113, 0.95)", 18);
        placeTarget(target);
      }
    });

    state.particles = state.particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      return particle.life > 0;
    });

    const beamDir = normalize({
      x: ball.vx + (state.pointer.x - ball.x) * 0.16 + Math.cos(state.time * 0.72) * 24,
      y: ball.vy + (state.pointer.y - ball.y) * 0.16 + Math.sin(state.time * 0.68) * 24
    });
    state.beamSegments = castRay({ x: ball.x, y: ball.y }, beamDir, reduceMotion ? 3 : 7);
  }

  function drawGrid() {
    const step = 88;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "rgba(41, 247, 255, 0.16)";
    ctx.lineWidth = 1;
    for (let x = (state.time * 11) % step; x < state.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - state.height * 0.24, state.height);
      ctx.stroke();
    }
    for (let y = (state.time * 8) % step; y < state.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMirrors() {
    ctx.save();
    ctx.lineCap = "round";
    state.mirrors.forEach((mirror, index) => {
      const pulse = 0.55 + Math.sin(state.time * 1.3 + index) * 0.2;
      ctx.lineWidth = 10;
      ctx.strokeStyle = `rgba(41, 247, 255, ${0.06 + pulse * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(mirror.x1, mirror.y1);
      ctx.lineTo(mirror.x2, mirror.y2);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 224, 113, ${0.3 + pulse * 0.18})`;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawTargets() {
    ctx.save();
    state.targets.forEach((target, index) => {
      const pulse = Math.sin(state.time * 1.5 + target.phase) * 0.5 + 0.5;
      const radius = target.r + pulse * 7;
      const gradient = ctx.createRadialGradient(target.x - radius * 0.25, target.y - radius * 0.3, 2, target.x, target.y, radius);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      gradient.addColorStop(0.28, index % 2 ? "rgba(41, 247, 255, 0.72)" : "rgba(255, 224, 113, 0.78)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.82;
      ctx.strokeStyle = index % 2 ? "rgba(41, 247, 255, 0.56)" : "rgba(255, 224, 113, 0.52)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius * 0.66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(245, 251, 255, 0.74)";
      ctx.font = "700 18px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(target.value, target.x, target.y);
    });
    ctx.restore();
  }

  function drawBeam() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    state.beamSegments.forEach((segment, index) => {
      const fade = 1 - index / Math.max(1, state.beamSegments.length);
      ctx.lineWidth = 17 * fade;
      ctx.strokeStyle = `rgba(41, 247, 255, ${0.045 * fade})`;
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
      ctx.stroke();
      ctx.lineWidth = 4.2 * fade;
      ctx.strokeStyle = segment.kind === "mirror"
        ? `rgba(255, 224, 113, ${0.42 * fade})`
        : `rgba(41, 247, 255, ${0.48 * fade})`;
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 * fade})`;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawBall() {
    const ball = state.ball;
    const pulse = 1 + Math.sin(state.time * 4) * 0.08;
    const radius = ball.radius * pulse;
    const aura = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, radius * 4.8);
    aura.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    aura.addColorStop(0.18, "rgba(41, 247, 255, 0.78)");
    aura.addColorStop(0.44, "rgba(138, 92, 255, 0.24)");
    aura.addColorStop(1, "rgba(41, 247, 255, 0)");
    ctx.save();
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, radius * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(245, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 224, 113, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, radius * 1.8, state.time, state.time + Math.PI * 1.25);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    state.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawHudTrace() {
    const x = clamp(state.pointer.x || state.width * 0.66, 80, state.width - 80);
    const y = clamp(state.pointer.y || state.height * 0.24, 80, state.height - 80);
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = "rgba(94, 255, 157, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 42 + Math.sin(state.time * 2) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(94, 255, 157, 0.16)";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawTargets();
    drawParticles();
    drawBall();
    drawHudTrace();
    ctx.restore();
  }

  function syncCanvasState() {
    canvas.dataset.raytraceScore = String(state.score);
    canvas.dataset.raytraceBounces = String(state.bounces);
    canvas.dataset.raytraceHits = String(state.hits);
    canvas.dataset.raytraceSegments = String(state.beamSegments.length);
    canvas.dataset.raytracePointerMoves = String(state.pointerMoves);
  }

  function canAnimate() {
    return !reduceMotion && !document.hidden && canvasInView;
  }

  function scheduleFrame() {
    if (frameId || !canAnimate()) return;
    frameId = requestAnimationFrame(frame);
  }

  function frame(now) {
    frameId = 0;
    if (!canAnimate()) return;
    if (!state.lastFrame) {
      state.lastFrame = now;
    }
    const dt = clamp((now - state.lastFrame) / 1000, 0, reduceMotion ? 0.018 : 0.032);
    state.lastFrame = now;
    update(dt);
    draw();
    syncCanvasState();
    scheduleFrame();
  }

  const controller = {
    getState() {
      return {
        score: state.score,
        bounces: state.bounces,
        hits: state.hits,
        pointerMoves: state.pointerMoves,
        width: state.width,
        height: state.height,
        segments: state.beamSegments.length,
        targets: state.targets.length
      };
    },
    reset() {
      state.score = 0;
      state.bounces = 0;
      state.hits = 0;
      state.pointerMoves = 0;
      rng = mulberry32((Date.now() ^ 0xA11CE) >>> 0);
      rebuildWorld();
    }
  };

  try {
    Object.defineProperty(window, "homeRaytraceGame", {
      value: controller,
      configurable: true
    });
  } catch (error) {
    canvas.dataset.raytraceGlobal = "blocked";
  }

  canvas.dataset.raytraceReady = "true";

  window.addEventListener("resize", () => {
    resize();
    scheduleFrame();
  }, { passive: true });
  window.addEventListener("pointermove", pointerFromEvent, { passive: true });
  window.addEventListener("pointerdown", pointerFromEvent, { passive: true });
  window.addEventListener("touchmove", pointerFromEvent, { passive: true });
  window.addEventListener("scroll", () => {
    if (stage.scrollHeight > state.height + 20 || stage.scrollHeight < state.height - 80) {
      resize();
    }
    scheduleFrame();
  }, { passive: true });
  document.addEventListener("visibilitychange", scheduleFrame);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      canvasInView = entries.some((entry) => entry.isIntersecting);
      scheduleFrame();
    }, { rootMargin: "220px 0px", threshold: 0.01 });
    observer.observe(stage);
  }

  resize();
  draw();
  syncCanvasState();
  scheduleFrame();
})();
