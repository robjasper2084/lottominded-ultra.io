/*
  Beat2Lotto+ Ballpass background
  Canvas stays pointer-events:none so links, forms, and navigation remain usable.
*/
(() => {
  "use strict";

  const VALID_PAGE =
    document.body?.classList.contains("beat2lotto-current-page") ||
    /beat2lotto-plus\.html(?:$|[?#])/i.test(window.location.pathname);
  const FLAG = "__beat2LottoBallpass";
  const canvas = document.querySelector("[data-b2l-ballpass-canvas]");

  if (!VALID_PAGE || window[FLAG] || !canvas) return;
  window[FLAG] = true;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduceMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let canvasInView = true;
  let frameId = 0;
  const palette = {
    gold: "255, 224, 113",
    cyan: "41, 247, 255",
    green: "94, 255, 157",
    violet: "138, 92, 255",
    magenta: "255, 79, 216",
    cream: "239, 255, 255"
  };
  const orbValues = [3, 7, 8, 11, 13, 17, 19, 22, 24, 29, 32, 36, 44, 51, 55, 62, 68];

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    time: 0,
    lastFrame: 0,
    ready: false,
    score: 0,
    bounces: 0,
    hits: 0,
    combo: 1,
    energy: 0.42,
    pointerMoves: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false, lastMove: 0 },
    keys: new Set(),
    player: { x: 0, y: 0, r: 42 },
    ball: { x: 0, y: 0, vx: 180, vy: -132, r: 15, trail: [] },
    gates: [],
    orbs: [],
    rays: [],
    sparks: [],
    ripples: []
  };

  let rng = mulberry32(hashSeed(`${Date.now()}|${window.innerWidth}|${window.innerHeight}|beat2lotto`) >>> 0);

  function hashSeed(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return () => {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rand(min, max) {
    return min + rng() * (max - min);
  }

  function pick(list) {
    return list[Math.floor(rng() * list.length) % list.length];
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb}, ${alpha})`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function length(x, y) {
    return Math.hypot(x, y) || 1;
  }

  function normalize(v) {
    const mag = length(v.x, v.y);
    return { x: v.x / mag, y: v.y / mag };
  }

  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  function cross(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  function reflect(dir, normal) {
    const power = 2 * dot(dir, normal);
    return normalize({
      x: dir.x - power * normal.x,
      y: dir.y - power * normal.y
    });
  }

  function nearestOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1) : 0;
    return { x: x1 + dx * t, y: y1 + dy * t, t };
  }

  function createOrb() {
    return { x: 0, y: 0, r: 0, value: "00", phase: 0, hue: palette.gold };
  }

  function placeOrb(orb) {
    const padX = Math.max(96, state.width * 0.08);
    const padY = Math.max(116, state.height * 0.12);
    orb.x = rand(padX, Math.max(padX + 1, state.width - padX));
    orb.y = rand(padY, Math.max(padY + 1, state.height - padY));
    orb.r = rand(22, state.width < 720 ? 34 : 48);
    orb.value = String(pick(orbValues)).padStart(2, "0");
    orb.phase = rand(0, Math.PI * 2);
    orb.hue = [palette.gold, palette.cyan, palette.green, palette.magenta][Math.floor(rand(0, 4))];
  }

  function buildLevel() {
    const w = state.width;
    const h = state.height;
    state.gates = [
      { x1: w * 0.08, y1: h * 0.28, x2: w * 0.34, y2: h * 0.12, hue: palette.cyan, flash: 0 },
      { x1: w * 0.54, y1: h * 0.16, x2: w * 0.88, y2: h * 0.32, hue: palette.gold, flash: 0 },
      { x1: w * 0.16, y1: h * 0.76, x2: w * 0.42, y2: h * 0.9, hue: palette.green, flash: 0 },
      { x1: w * 0.64, y1: h * 0.72, x2: w * 0.92, y2: h * 0.54, hue: palette.magenta, flash: 0 },
      { x1: w * 0.38, y1: h * 0.52, x2: w * 0.56, y2: h * 0.42, hue: palette.cyan, flash: 0 }
    ];

    if (!state.orbs.length) {
      state.orbs = Array.from({ length: state.width < 720 ? 6 : 10 }, createOrb);
    }
    state.orbs.forEach(placeOrb);
  }

  function resize() {
    const reduced = reduceMotionQuery?.matches;
    state.width = Math.max(1, window.innerWidth);
    state.height = Math.max(1, window.innerHeight);
    state.dpr = Math.min(window.devicePixelRatio || 1, reduced ? 1 : 1.65);

    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (!state.ready) {
      state.pointer.tx = state.width * 0.56;
      state.pointer.ty = state.height * 0.38;
      state.pointer.x = state.pointer.tx;
      state.pointer.y = state.pointer.ty;
      state.player.x = state.pointer.x;
      state.player.y = state.pointer.y;
      state.ball.x = state.width * 0.28;
      state.ball.y = state.height * 0.54;
      state.ball.r = state.width < 720 ? 12 : 15;
      state.ready = true;
    } else {
      state.ball.x = clamp(state.ball.x, 30, state.width - 30);
      state.ball.y = clamp(state.ball.y, 30, state.height - 30);
    }

    buildLevel();
  }

  function syncPointer(point) {
    if (!point) return;
    const x = clamp(point.clientX, 0, state.width);
    const y = clamp(point.clientY, 0, state.height);
    state.pointer.vx = x - state.pointer.tx;
    state.pointer.vy = y - state.pointer.ty;
    state.pointer.tx = x;
    state.pointer.ty = y;
    state.pointer.active = true;
    state.pointer.lastMove = performance.now();
    state.pointerMoves += 1;
    document.body.style.setProperty("--b2l-ballpass-x", `${(x / Math.max(1, state.width)) * 100}%`);
    document.body.style.setProperty("--b2l-ballpass-y", `${(y / Math.max(1, state.height)) * 100}%`);
  }

  function onKey(event, isDown) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
      return;
    }
    if (isDown) state.keys.add(event.code);
    else state.keys.delete(event.code);
  }

  function addSpark(x, y, hue, amount = 12, speedBoost = 1) {
    if (reduceMotionQuery?.matches) return;
    for (let i = 0; i < amount; i += 1) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(35, 220) * speedBoost;
      state.sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        age: 0,
        life: rand(0.36, 0.92),
        size: rand(1, 3.2),
        hue
      });
    }
    if (state.sparks.length > 180) state.sparks.splice(0, state.sparks.length - 180);
  }

  function addRipple(x, y, hue, strength = 1) {
    state.ripples.push({ x, y, hue, age: 0, life: rand(0.7, 1.2), strength });
    if (state.ripples.length > 24) state.ripples.splice(0, state.ripples.length - 24);
  }

  function scoreEvent(points, comboBoost) {
    state.score += Math.round(points * state.combo);
    state.combo = clamp(state.combo + comboBoost, 1, 9);
    state.energy = clamp(state.energy + 0.08 + comboBoost * 0.04, 0.18, 1);
  }

  function updatePlayer(dt) {
    const keyboardSpeed = 520 * dt;
    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) state.pointer.tx -= keyboardSpeed;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) state.pointer.tx += keyboardSpeed;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) state.pointer.ty -= keyboardSpeed;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) state.pointer.ty += keyboardSpeed;
    state.pointer.tx = clamp(state.pointer.tx, 36, state.width - 36);
    state.pointer.ty = clamp(state.pointer.ty, 48, state.height - 48);

    state.pointer.x = lerp(state.pointer.x, state.pointer.tx, 0.18);
    state.pointer.y = lerp(state.pointer.y, state.pointer.ty, 0.18);
    state.player.x = lerp(state.player.x, state.pointer.x, 0.28);
    state.player.y = lerp(state.player.y, state.pointer.y, 0.28);
  }

  function collideBallWithPlayer() {
    const ball = state.ball;
    const dx = ball.x - state.player.x;
    const dy = ball.y - state.player.y;
    const dist = length(dx, dy);
    const limit = ball.r + state.player.r;
    if (dist >= limit) return;

    const normal = { x: dx / dist, y: dy / dist };
    const incoming = dot({ x: ball.vx, y: ball.vy }, normal);
    if (incoming < 120) {
      const reflected = reflect({ x: ball.vx, y: ball.vy }, normal);
      const impulse = Math.min(220, length(state.pointer.vx, state.pointer.vy) * 8);
      ball.vx = reflected.x * (240 + impulse) + normal.x * 80;
      ball.vy = reflected.y * (240 + impulse) + normal.y * 80;
      ball.x = state.player.x + normal.x * (limit + 1);
      ball.y = state.player.y + normal.y * (limit + 1);
      state.bounces += 1;
      scoreEvent(12, 0.14);
      addSpark(ball.x, ball.y, palette.cyan, 14, 1.1);
      addRipple(ball.x, ball.y, palette.green, 1.2);
    }
  }

  function collideBallWithGate(gate) {
    const ball = state.ball;
    const nearest = nearestOnSegment(ball.x, ball.y, gate.x1, gate.y1, gate.x2, gate.y2);
    const dx = ball.x - nearest.x;
    const dy = ball.y - nearest.y;
    const dist = length(dx, dy);
    if (dist > ball.r + 9 || gate.flash > 0.05) return;

    const sx = gate.x2 - gate.x1;
    const sy = gate.y2 - gate.y1;
    const segLen = length(sx, sy);
    let normal = { x: -sy / segLen, y: sx / segLen };
    if (dot(normal, { x: ball.vx, y: ball.vy }) > 0) normal = { x: -normal.x, y: -normal.y };
    const dir = reflect({ x: ball.vx, y: ball.vy }, normal);
    const speed = clamp(length(ball.vx, ball.vy) * 1.02, 190, 460);
    ball.vx = dir.x * speed;
    ball.vy = dir.y * speed;
    ball.x = nearest.x + normal.x * (ball.r + 11);
    ball.y = nearest.y + normal.y * (ball.r + 11);
    gate.flash = 1;
    state.bounces += 1;
    scoreEvent(18, 0.18);
    addSpark(nearest.x, nearest.y, gate.hue, 18, 1.25);
    addRipple(nearest.x, nearest.y, gate.hue, 1.25);
  }

  function updateBall(dt) {
    const ball = state.ball;
    const pullStrength = state.pointer.active ? 0.62 : 0.26;
    const pullX = (state.player.x - ball.x) * pullStrength;
    const pullY = (state.player.y - ball.y) * pullStrength;
    ball.vx += pullX * dt;
    ball.vy += pullY * dt;

    const speed = length(ball.vx, ball.vy);
    const maxSpeed = reduceMotionQuery?.matches ? 190 : 500;
    const minSpeed = reduceMotionQuery?.matches ? 90 : 185;
    if (speed > maxSpeed) {
      ball.vx = (ball.vx / speed) * maxSpeed;
      ball.vy = (ball.vy / speed) * maxSpeed;
    } else if (speed < minSpeed) {
      const dir = normalize({ x: ball.vx + 0.01, y: ball.vy - 0.02 });
      ball.vx = dir.x * minSpeed;
      ball.vy = dir.y * minSpeed;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    let wallBounce = false;
    if (ball.x < ball.r || ball.x > state.width - ball.r) {
      ball.x = clamp(ball.x, ball.r, state.width - ball.r);
      ball.vx *= -0.96;
      wallBounce = true;
    }
    if (ball.y < ball.r || ball.y > state.height - ball.r) {
      ball.y = clamp(ball.y, ball.r, state.height - ball.r);
      ball.vy *= -0.96;
      wallBounce = true;
    }
    if (wallBounce) {
      state.bounces += 1;
      scoreEvent(5, 0.06);
      addSpark(ball.x, ball.y, palette.gold, 9, 0.9);
    }

    collideBallWithPlayer();
    state.gates.forEach(collideBallWithGate);

    state.orbs.forEach((orb) => {
      const dx = ball.x - orb.x;
      const dy = ball.y - orb.y;
      if (dx * dx + dy * dy > (ball.r + orb.r) * (ball.r + orb.r)) return;
      state.hits += 1;
      scoreEvent(40 + state.hits * 3, 0.35);
      addSpark(orb.x, orb.y, orb.hue, 28, 1.35);
      addRipple(orb.x, orb.y, orb.hue, 1.65);
      placeOrb(orb);
    });

    ball.trail.push({ x: ball.x, y: ball.y, age: 0 });
    if (ball.trail.length > 42) ball.trail.splice(0, ball.trail.length - 42);
  }

  function nextRayHit(pos, dir) {
    const hits = [];
    const epsilon = 0.001;

    if (dir.x > epsilon) hits.push({ t: (state.width - pos.x) / dir.x, normal: { x: -1, y: 0 }, kind: "wall" });
    else if (dir.x < -epsilon) hits.push({ t: (0 - pos.x) / dir.x, normal: { x: 1, y: 0 }, kind: "wall" });
    if (dir.y > epsilon) hits.push({ t: (state.height - pos.y) / dir.y, normal: { x: 0, y: -1 }, kind: "wall" });
    else if (dir.y < -epsilon) hits.push({ t: (0 - pos.y) / dir.y, normal: { x: 0, y: 1 }, kind: "wall" });

    state.gates.forEach((gate) => {
      const q = { x: gate.x1, y: gate.y1 };
      const s = { x: gate.x2 - gate.x1, y: gate.y2 - gate.y1 };
      const qp = { x: q.x - pos.x, y: q.y - pos.y };
      const denom = cross(dir, s);
      if (Math.abs(denom) < epsilon) return;
      const t = cross(qp, s) / denom;
      const u = cross(qp, dir) / denom;
      if (t > 8 && u >= 0 && u <= 1) {
        const segLen = length(s.x, s.y);
        let normal = { x: -s.y / segLen, y: s.x / segLen };
        if (dot(normal, dir) > 0) normal = { x: -normal.x, y: -normal.y };
        hits.push({ t, normal, kind: "gate", hue: gate.hue });
      }
    });

    const hit = hits.filter((item) => item.t > 2).sort((a, b) => a.t - b.t)[0];
    if (!hit) return null;
    return {
      x: pos.x + dir.x * hit.t,
      y: pos.y + dir.y * hit.t,
      normal: hit.normal,
      kind: hit.kind,
      hue: hit.hue || palette.cyan
    };
  }

  function castRay(origin, direction, maxBounces) {
    const segments = [];
    let pos = { x: origin.x, y: origin.y };
    let dir = normalize(direction);
    for (let i = 0; i < maxBounces; i += 1) {
      const hit = nextRayHit(pos, dir);
      if (!hit) break;
      segments.push({ x1: pos.x, y1: pos.y, x2: hit.x, y2: hit.y, kind: hit.kind, hue: hit.hue });
      pos = { x: hit.x + hit.normal.x * 0.8, y: hit.y + hit.normal.y * 0.8 };
      dir = reflect(dir, hit.normal);
    }
    return segments;
  }

  function update(dt) {
    state.time += dt;
    updatePlayer(dt);
    updateBall(dt);

    state.combo = clamp(state.combo - dt * 0.22, 1, 9);
    state.energy = clamp(state.energy - dt * 0.04, 0.18, 1);
    state.gates.forEach((gate) => {
      gate.flash = Math.max(0, gate.flash - dt * 2.4);
    });
    state.sparks = state.sparks.filter((spark) => {
      spark.age += dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= 0.985;
      spark.vy *= 0.985;
      return spark.age < spark.life;
    });
    state.ripples = state.ripples.filter((ripple) => {
      ripple.age += dt;
      return ripple.age < ripple.life;
    });
    state.ball.trail.forEach((point) => {
      point.age += dt;
    });

    const beamDir = normalize({
      x: state.ball.vx + (state.player.x - state.ball.x) * 0.24 + Math.sin(state.time * 1.3) * 38,
      y: state.ball.vy + (state.player.y - state.ball.y) * 0.24 + Math.cos(state.time * 1.1) * 38
    });
    state.rays = castRay({ x: state.ball.x, y: state.ball.y }, beamDir, reduceMotionQuery?.matches ? 3 : 8);
  }

  function drawBackground() {
    ctx.clearRect(0, 0, state.width, state.height);
    const bg = ctx.createLinearGradient(0, 0, state.width, state.height);
    bg.addColorStop(0, "rgba(1, 5, 12, 0.16)");
    bg.addColorStop(0.52, "rgba(5, 29, 42, 0.13)");
    bg.addColorStop(1, "rgba(2, 4, 11, 0.18)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, state.width, state.height);

    const glow = ctx.createRadialGradient(state.player.x, state.player.y, 4, state.player.x, state.player.y, Math.min(state.width, state.height) * 0.62);
    glow.addColorStop(0, rgba(palette.cyan, 0.13));
    glow.addColorStop(0.48, rgba(palette.violet, 0.045));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawGrid() {
    const step = state.width < 720 ? 72 : 96;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = rgba(palette.cyan, 0.28);
    ctx.lineWidth = 1;
    for (let x = (state.time * 12) % step; x < state.width + state.height; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - state.height * 0.34, state.height);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(palette.gold, 0.12);
    for (let y = (state.time * 8) % step; y < state.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRipples() {
    ctx.save();
    state.ripples.forEach((ripple) => {
      const p = ripple.age / ripple.life;
      const alpha = (1 - p) * 0.36 * ripple.strength;
      ctx.strokeStyle = rgba(ripple.hue, alpha);
      ctx.lineWidth = 1.5 + 5 * (1 - p);
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, 24 + p * 110 * ripple.strength, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawGates() {
    ctx.save();
    ctx.lineCap = "round";
    state.gates.forEach((gate) => {
      const alpha = 0.3 + gate.flash * 0.45;
      ctx.strokeStyle = rgba(gate.hue, 0.06 + gate.flash * 0.12);
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(gate.x1, gate.y1);
      ctx.lineTo(gate.x2, gate.y2);
      ctx.stroke();
      ctx.strokeStyle = rgba(gate.hue, alpha);
      ctx.lineWidth = 4.4;
      ctx.stroke();
      ctx.strokeStyle = rgba(palette.cream, 0.36 + gate.flash * 0.28);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawOrbs() {
    ctx.save();
    state.orbs.forEach((orb, index) => {
      const pulse = 1 + Math.sin(state.time * 1.7 + orb.phase) * 0.08;
      const r = orb.r * pulse;
      const g = ctx.createRadialGradient(orb.x - r * 0.3, orb.y - r * 0.36, 2, orb.x, orb.y, r * 1.3);
      g.addColorStop(0, "rgba(255,255,255,0.92)");
      g.addColorStop(0.18, rgba(orb.hue, 0.58));
      g.addColorStop(0.44, rgba(palette.gold, index % 2 ? 0.35 : 0.55));
      g.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.shadowBlur = 24;
      ctx.shadowColor = rgba(orb.hue, 0.72);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(palette.cream, 0.34);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * 0.7, -state.time * 0.8, Math.PI * 1.35 - state.time * 0.8);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(6, 15, 24, 0.78)";
      ctx.font = `900 ${clamp(r * 0.42, 14, 26)}px Inter, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(orb.value, orb.x, orb.y + r * 0.02);
    });
    ctx.restore();
  }

  function drawRaySegments() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    state.rays.forEach((segment, index) => {
      const fade = 1 - index / Math.max(1, state.rays.length);
      ctx.strokeStyle = rgba(segment.hue || palette.cyan, 0.055 * fade);
      ctx.lineWidth = 22 * fade;
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
      ctx.stroke();
      ctx.strokeStyle = segment.kind === "gate" ? rgba(palette.gold, 0.32 * fade) : rgba(palette.cyan, 0.34 * fade);
      ctx.lineWidth = 5.2 * fade;
      ctx.stroke();
      ctx.strokeStyle = rgba(palette.cream, 0.42 * fade);
      ctx.lineWidth = 1.25;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawTrail() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 1; i < state.ball.trail.length; i += 1) {
      const prev = state.ball.trail[i - 1];
      const curr = state.ball.trail[i];
      const alpha = clamp(1 - curr.age / 1.3, 0, 1) * (i / state.ball.trail.length);
      ctx.strokeStyle = rgba(palette.cyan, alpha * 0.34);
      ctx.lineWidth = 2 + alpha * 12;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayerAndBall() {
    const ball = state.ball;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const playerGlow = ctx.createRadialGradient(state.player.x, state.player.y, 2, state.player.x, state.player.y, state.player.r * 2.6);
    playerGlow.addColorStop(0, rgba(palette.green, 0.4));
    playerGlow.addColorStop(0.32, rgba(palette.cyan, 0.16));
    playerGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = playerGlow;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.green, 0.52);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r, state.time, state.time + Math.PI * 1.6);
    ctx.stroke();

    const ballGlow = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, ball.r * 5.6);
    ballGlow.addColorStop(0, "rgba(255,255,255,0.98)");
    ballGlow.addColorStop(0.18, rgba(palette.gold, 0.8));
    ballGlow.addColorStop(0.44, rgba(palette.magenta, 0.22));
    ballGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ballGlow;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r * 5.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(palette.cream, 0.96);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.gold, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r * 1.9, -state.time * 2, Math.PI * 1.25 - state.time * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSparks() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    state.sparks.forEach((spark) => {
      const alpha = clamp(1 - spark.age / spark.life, 0, 1);
      ctx.fillStyle = rgba(spark.hue, alpha * 0.82);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawCanvasHud() {
    const x = Math.max(18, Math.min(state.width - 230, state.width * 0.035));
    const y = Math.max(116, state.height * 0.17);
    const w = state.width < 720 ? 168 : 220;
    const energyWidth = (w - 34) * state.energy;
    ctx.save();
    ctx.globalAlpha = state.width < 620 ? 0.55 : 0.78;
    ctx.fillStyle = "rgba(1, 9, 16, 0.54)";
    ctx.strokeStyle = rgba(palette.cyan, 0.28);
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, 102, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(palette.gold, 0.92);
    ctx.font = "800 10px Inter, Arial, sans-serif";
    ctx.fillText("BALLPASS SIGNAL", x + 16, y + 25);
    ctx.fillStyle = rgba(palette.cream, 0.94);
    ctx.font = "900 20px Inter, Arial, sans-serif";
    ctx.fillText(`${String(state.hits).padStart(2, "0")} / ${Math.round(state.score).toLocaleString()}`, x + 16, y + 52);
    ctx.fillStyle = rgba(palette.cyan, 0.18);
    roundRect(ctx, x + 16, y + 69, w - 34, 7, 999);
    ctx.fill();
    ctx.fillStyle = `rgba(${palette.green}, 0.82)`;
    roundRect(ctx, x + 16, y + 69, energyWidth, 7, 999);
    ctx.fill();
    ctx.fillStyle = rgba(palette.cream, 0.72);
    ctx.font = "700 10px Inter, Arial, sans-serif";
    ctx.fillText(`combo x${state.combo.toFixed(1)}  bounces ${state.bounces}`, x + 16, y + 92);
    ctx.restore();
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function draw() {
    drawBackground();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawGrid();
    drawRipples();
    drawRaySegments();
    drawTrail();
    drawGates();
    drawOrbs();
    drawSparks();
    drawPlayerAndBall();
    ctx.restore();
    drawCanvasHud();
  }

  function canAnimate() {
    return !reduceMotionQuery?.matches && !document.hidden && canvasInView;
  }

  function scheduleFrame() {
    if (frameId || !canAnimate()) return;
    frameId = window.requestAnimationFrame(frame);
  }

  function syncDataset() {
    canvas.dataset.ballpassReady = "true";
    canvas.dataset.ballpassScore = String(Math.round(state.score));
    canvas.dataset.ballpassBounces = String(state.bounces);
    canvas.dataset.ballpassHits = String(state.hits);
    canvas.dataset.ballpassCombo = state.combo.toFixed(2);
    canvas.dataset.ballpassRays = String(state.rays.length);
    canvas.dataset.ballpassPointerMoves = String(state.pointerMoves);
  }

  function frame(now) {
    frameId = 0;
    if (!canAnimate()) return;
    if (!state.lastFrame) state.lastFrame = now;
    const reduced = reduceMotionQuery?.matches;
    const dt = clamp((now - state.lastFrame) / 1000, 0, reduced ? 0.024 : 0.034);
    state.lastFrame = now;
    update(dt);
    draw();
    syncDataset();
    scheduleFrame();
  }

  const controller = {
    getState() {
      return {
        score: Math.round(state.score),
        bounces: state.bounces,
        hits: state.hits,
        combo: state.combo,
        energy: state.energy,
        rays: state.rays.length,
        pointerMoves: state.pointerMoves
      };
    },
    reset() {
      rng = mulberry32(hashSeed(`${Date.now()}|reset|beat2lotto`) >>> 0);
      state.score = 0;
      state.bounces = 0;
      state.hits = 0;
      state.combo = 1;
      state.energy = 0.42;
      state.ball.trail = [];
      state.sparks = [];
      state.ripples = [];
      buildLevel();
    }
  };

  try {
    Object.defineProperty(window, "beat2LottoBallpass", {
      value: controller,
      configurable: true
    });
  } catch (error) {
    canvas.dataset.ballpassGlobal = "blocked";
  }

  window.addEventListener("resize", () => {
    resize();
    draw();
    syncDataset();
    scheduleFrame();
  }, { passive: true });
  window.addEventListener("pointermove", (event) => {
    syncPointer(event);
    scheduleFrame();
  }, { passive: true });
  window.addEventListener("pointerdown", (event) => {
    syncPointer(event);
    scheduleFrame();
  }, { passive: true });
  window.addEventListener("keydown", (event) => {
    onKey(event, true);
    scheduleFrame();
  });
  window.addEventListener("keyup", (event) => {
    onKey(event, false);
    scheduleFrame();
  });
  reduceMotionQuery?.addEventListener?.("change", () => {
    resize();
    draw();
    syncDataset();
    scheduleFrame();
  });
  document.addEventListener("visibilitychange", scheduleFrame);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      canvasInView = entries.some((entry) => entry.isIntersecting);
      scheduleFrame();
    }, { rootMargin: "220px 0px", threshold: 0.01 });
    observer.observe(canvas);
  }

  resize();
  syncDataset();
  draw();
  scheduleFrame();
})();
