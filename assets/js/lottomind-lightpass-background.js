/*
  LOTTOMINDED ULTRA LightPass Background
  Drop-in interactive 2D light-tracing / Pong-inspired canvas background for features-app.html.
  - No external libraries
  - Canvas is pointer-events:none, so it never blocks page links/forms
  - Listens to pointer/touch/mouse globally to bend the light ball and spawn signal ripples
  - Respects prefers-reduced-motion
*/
(() => {
  "use strict";

  const BODY_CLASS = "feature-console-page";
  const SCRIPT_FLAG = "__lottomindLightpassBackground";
  const VALID_PAGE = document.body?.classList.contains(BODY_CLASS) || /features-app\.html(?:$|[?#])/i.test(window.location.pathname);

  if (!VALID_PAGE || window[SCRIPT_FLAG]) return;
  window[SCRIPT_FLAG] = true;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lowPowerMode =
    Boolean(connection?.saveData) ||
    Boolean(navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const palette = {
    gold: "255, 224, 113",
    deepGold: "214, 158, 46",
    cyan: "41, 247, 255",
    green: "94, 255, 157",
    violet: "138, 92, 255",
    magenta: "255, 79, 216",
    ink: "1, 3, 10"
  };
  const lottoNumbers = [3, 7, 8, 11, 13, 17, 19, 22, 24, 26, 31, 34, 42, 44, 55];

  const canvas = document.createElement("canvas");
  canvas.className = "lm-lightpass-bg";
  canvas.id = "lmLightpassCanvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("data-lightpass-background", "");

  const style = document.createElement("style");
  style.id = "lm-lightpass-background-style";
  style.textContent = `
    .${BODY_CLASS}.lm-lightpass-active {
      --lm-lightpass-pointer-x: 50%;
      --lm-lightpass-pointer-y: 42%;
    }

    .${BODY_CLASS} .lm-lightpass-bg {
      position: fixed;
      inset: 0;
      z-index: 2;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      opacity: 0.86;
      mix-blend-mode: screen;
      filter: saturate(1.18) contrast(1.05);
      contain: strict;
    }

    .${BODY_CLASS}.lm-lightpass-active .feature-sphere-canvas {
      opacity: 0.54;
    }

    .${BODY_CLASS}.lm-lightpass-active .feature-puck-field {
      opacity: 0.12;
    }

    @media (max-width: 720px) {
      .${BODY_CLASS} .lm-lightpass-bg {
        opacity: 0.62;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .${BODY_CLASS} .lm-lightpass-bg {
        opacity: 0.34;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.classList.add("lm-lightpass-active");
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastFrame = 0;
  let lastDraw = 0;
  let frameHandle = 0;
  let isPaused = false;
  let staticRendered = false;

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.42,
    px: window.innerWidth * 0.5,
    py: window.innerHeight * 0.42,
    vx: 0,
    vy: 0,
    active: false,
    down: false,
    lastMove: 0
  };

  const paddles = [
    { side: "left", x: 64, y: 0, targetY: 0, h: 150, hit: 0, color: palette.gold },
    { side: "right", x: 0, y: 0, targetY: 0, h: 150, hit: 0, color: palette.cyan }
  ];

  let photons = [];
  let sparks = [];
  let ripples = [];
  let numberBursts = [];
  let passiveStars = [];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb}, ${alpha})`;
  }

  function syncPointerCss() {
    const x = `${clamp(pointer.x / Math.max(1, width), 0, 1) * 100}%`;
    const y = `${clamp(pointer.y / Math.max(1, height), 0, 1) * 100}%`;
    document.body.style.setProperty("--lm-lightpass-pointer-x", x);
    document.body.style.setProperty("--lm-lightpass-pointer-y", y);

    const sphereStage = document.querySelector("[data-spheres-stage]");
    const puckField = document.querySelector("[data-feature-puck-field]");
    [sphereStage, puckField].forEach((el) => {
      if (!el) return;
      el.style.setProperty("--puck-pointer-x", `${pointer.x}px`);
      el.style.setProperty("--puck-pointer-y", `${pointer.y}px`);
    });
  }

  function spawnPassiveStars() {
    const count = width < 720 || lowPowerMode ? 16 : 34;
    passiveStars = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(0.45, 1.8),
      a: rand(0.12, 0.58),
      phase: rand(0, Math.PI * 2),
      color: i % 5 === 0 ? palette.green : i % 3 === 0 ? palette.cyan : palette.gold
    }));
  }

  function createPhoton(index) {
    const speed = width < 720 ? rand(180, 260) : rand(235, 355);
    let angle = rand(-0.62, 0.62) + (Math.random() < 0.5 ? 0 : Math.PI);
    if (Math.abs(Math.cos(angle)) < 0.42) angle += 0.5;
    const colors = [palette.gold, palette.cyan, palette.green, palette.magenta];
    return {
      x: width * rand(0.24, 0.76),
      y: height * rand(0.2, 0.8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: index === 0 ? 6.2 : rand(3.2, 5.2),
      color: colors[index % colors.length],
      trail: [],
      energy: index === 0 ? 1.12 : 0.84,
      label: String(pick(lottoNumbers)),
      lastNumberAt: 0
    };
  }

  function resetActors() {
    const photonCount = width < 680 ? 2 : 3;
    photons = Array.from({ length: photonCount }, (_, index) => createPhoton(index));
    paddles[0].x = Math.max(34, Math.min(96, width * 0.07));
    paddles[1].x = width - Math.max(34, Math.min(96, width * 0.07));
    paddles.forEach((paddle, index) => {
      paddle.h = clamp(height * (index ? 0.2 : 0.18), 98, 190);
      paddle.y = height * (index ? 0.62 : 0.38);
      paddle.targetY = paddle.y;
    });
    sparks = [];
    ripples = [];
    numberBursts = [];
    spawnPassiveStars();
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, width < 720 || lowPowerMode ? 1 : 1.25);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    resetActors();
    staticRendered = false;
  }

  function pushRipple(x, y, color, strength = 1) {
    ripples.push({ x, y, color, age: 0, life: rand(0.75, 1.25), strength });
    if (ripples.length > 18) ripples.splice(0, ripples.length - 18);
  }

  function pushNumber(x, y, color) {
    numberBursts.push({
      x,
      y,
      color,
      number: String(pick(lottoNumbers)),
      vx: rand(-22, 22),
      vy: rand(-44, -18),
      age: 0,
      life: rand(1.1, 1.75)
    });
    if (numberBursts.length > 14) numberBursts.splice(0, numberBursts.length - 14);
  }

  function pushSparks(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i += 1) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(42, 240);
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        color,
        age: 0,
        life: rand(0.38, 0.9),
        size: rand(0.9, 2.6)
      });
    }
    if (sparks.length > 90) sparks.splice(0, sparks.length - 90);
  }

  function onPointerMove(event) {
    const now = performance.now();
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.vx = pointer.x - pointer.px;
    pointer.vy = pointer.y - pointer.py;
    pointer.active = true;
    pointer.lastMove = now;
    syncPointerCss();
  }

  function onPointerDown(event) {
    pointer.down = true;
    onPointerMove(event);
    pushRipple(pointer.x, pointer.y, palette.gold, 1.45);
    pushSparks(pointer.x, pointer.y, palette.gold, 16);
  }

  function onPointerUp() {
    pointer.down = false;
  }

  function updatePaddles(now, dt) {
    const main = photons[0];
    const pointerHot = pointer.active && now - pointer.lastMove < 2200;

    paddles.forEach((paddle, index) => {
      const drift = Math.sin(now * 0.00062 + index * 2.4) * height * 0.12;
      let target = main ? main.y + drift : height * 0.5;

      if (pointerHot) {
        const nearLeft = pointer.x < width * 0.5;
        if ((index === 0 && nearLeft) || (index === 1 && !nearLeft)) {
          target = pointer.y;
        } else {
          target = main ? main.y + drift * 0.45 : pointer.y;
        }
      }

      paddle.targetY = clamp(target, paddle.h * 0.62, height - paddle.h * 0.62);
      paddle.y += (paddle.targetY - paddle.y) * Math.min(1, dt * 7.5);
      paddle.hit = Math.max(0, paddle.hit - dt * 2.4);
    });
  }

  function collideWithPaddle(photon, paddle, dt) {
    const half = paddle.h * 0.5;
    const barHalfWidth = 8;
    const withinY = photon.y > paddle.y - half - photon.r && photon.y < paddle.y + half + photon.r;
    if (!withinY) return;

    if (paddle.side === "left" && photon.vx < 0 && photon.x - photon.r <= paddle.x + barHalfWidth && photon.x > paddle.x - 28) {
      const rel = clamp((photon.y - paddle.y) / half, -1, 1);
      photon.x = paddle.x + barHalfWidth + photon.r;
      photon.vx = Math.abs(photon.vx) * 1.035;
      photon.vy += rel * 115 + pointer.vy * 0.8;
      photon.energy = Math.min(1.8, photon.energy + 0.28);
      paddle.hit = 1;
      pushRipple(photon.x, photon.y, paddle.color, 1.2);
      pushSparks(photon.x, photon.y, paddle.color, 12);
      pushNumber(photon.x + 18, photon.y, paddle.color);
    }

    if (paddle.side === "right" && photon.vx > 0 && photon.x + photon.r >= paddle.x - barHalfWidth && photon.x < paddle.x + 28) {
      const rel = clamp((photon.y - paddle.y) / half, -1, 1);
      photon.x = paddle.x - barHalfWidth - photon.r;
      photon.vx = -Math.abs(photon.vx) * 1.035;
      photon.vy += rel * 115 + pointer.vy * 0.8;
      photon.energy = Math.min(1.8, photon.energy + 0.28);
      paddle.hit = 1;
      pushRipple(photon.x, photon.y, paddle.color, 1.2);
      pushSparks(photon.x, photon.y, paddle.color, 12);
      pushNumber(photon.x - 18, photon.y, paddle.color);
    }
  }

  function updatePhotons(now, dt) {
    const pointerHot = pointer.active && now - pointer.lastMove < 2600;

    photons.forEach((photon) => {
      if (pointerHot) {
        const dx = photon.x - pointer.x;
        const dy = photon.y - pointer.y;
        const distance = Math.max(18, Math.hypot(dx, dy));
        const radius = pointer.down ? 240 : 165;

        if (distance < radius) {
          const strength = (1 - distance / radius) * (pointer.down ? 760 : 380);
          photon.vx += (dx / distance) * strength * dt;
          photon.vy += (dy / distance) * strength * dt;
          photon.vx += pointer.vx * 0.55;
          photon.vy += pointer.vy * 0.55;
          photon.energy = Math.min(1.75, photon.energy + 0.02);

          if (now - photon.lastNumberAt > 260) {
            photon.lastNumberAt = now;
            pushRipple(photon.x, photon.y, photon.color, 0.55);
          }
        }
      }

      paddles.forEach((paddle) => collideWithPaddle(photon, paddle, dt));

      photon.vx *= Math.pow(0.992, dt * 60);
      photon.vy *= Math.pow(0.992, dt * 60);
      const speed = Math.hypot(photon.vx, photon.vy);
      const maxSpeed = width < 720 ? 430 : 620;
      const minSpeed = width < 720 ? 145 : 190;
      if (speed > maxSpeed) {
        photon.vx = (photon.vx / speed) * maxSpeed;
        photon.vy = (photon.vy / speed) * maxSpeed;
      } else if (speed < minSpeed) {
        photon.vx = (photon.vx / Math.max(1, speed)) * minSpeed;
        photon.vy = (photon.vy / Math.max(1, speed)) * minSpeed;
      }

      photon.x += photon.vx * dt;
      photon.y += photon.vy * dt;

      if (photon.y < photon.r + 18) {
        photon.y = photon.r + 18;
        photon.vy = Math.abs(photon.vy) * 0.98;
        pushRipple(photon.x, photon.y, palette.green, 0.75);
      }
      if (photon.y > height - photon.r - 18) {
        photon.y = height - photon.r - 18;
        photon.vy = -Math.abs(photon.vy) * 0.98;
        pushRipple(photon.x, photon.y, palette.magenta, 0.75);
      }
      if (photon.x < photon.r + 12) {
        photon.x = photon.r + 12;
        photon.vx = Math.abs(photon.vx) * 1.02;
        pushRipple(photon.x, photon.y, palette.gold, 1);
        pushNumber(photon.x + 20, photon.y, palette.gold);
      }
      if (photon.x > width - photon.r - 12) {
        photon.x = width - photon.r - 12;
        photon.vx = -Math.abs(photon.vx) * 1.02;
        pushRipple(photon.x, photon.y, palette.cyan, 1);
        pushNumber(photon.x - 20, photon.y, palette.cyan);
      }

      photon.energy += (1 - photon.energy) * Math.min(1, dt * 0.8);
      photon.trail.push({ x: photon.x, y: photon.y, e: photon.energy });
      const limit = width < 720 ? 30 : 46;
      if (photon.trail.length > limit) photon.trail.splice(0, photon.trail.length - limit);
    });
  }

  function updateParticles(dt) {
    sparks.forEach((spark) => {
      spark.age += dt;
      spark.vx *= Math.pow(0.965, dt * 60);
      spark.vy *= Math.pow(0.965, dt * 60);
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
    });
    sparks = sparks.filter((spark) => spark.age < spark.life);

    ripples.forEach((ripple) => {
      ripple.age += dt;
    });
    ripples = ripples.filter((ripple) => ripple.age < ripple.life);

    numberBursts.forEach((burst) => {
      burst.age += dt;
      burst.x += burst.vx * dt;
      burst.y += burst.vy * dt;
      burst.vy += 28 * dt;
    });
    numberBursts = numberBursts.filter((burst) => burst.age < burst.life);
  }

  function drawGrid(now) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const spacing = width < 720 ? 92 : 118;
    const offset = (now * 0.018) % spacing;
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(palette.cyan, 0.045);

    for (let x = -spacing + offset; x < width + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width * 0.08, height);
      ctx.stroke();
    }

    ctx.strokeStyle = rgba(palette.gold, 0.04);
    for (let y = -spacing + offset * 0.55; y < height + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y - height * 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStars(now) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    passiveStars.forEach((star) => {
      const twinkle = star.a + Math.sin(now * 0.002 + star.phase) * 0.08;
      ctx.fillStyle = rgba(star.color, Math.max(0.05, twinkle));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPaddles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    paddles.forEach((paddle) => {
      const alpha = 0.28 + paddle.hit * 0.46;
      const half = paddle.h * 0.5;
      const grad = ctx.createLinearGradient(paddle.x, paddle.y - half, paddle.x, paddle.y + half);
      grad.addColorStop(0, rgba(paddle.color, 0));
      grad.addColorStop(0.18, rgba(paddle.color, alpha));
      grad.addColorStop(0.5, rgba(palette.gold, alpha + 0.12));
      grad.addColorStop(0.82, rgba(paddle.color, alpha));
      grad.addColorStop(1, rgba(paddle.color, 0));

      ctx.shadowColor = rgba(paddle.color, 0.9);
      ctx.shadowBlur = 28 + paddle.hit * 26;
      ctx.lineWidth = 4 + paddle.hit * 2;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(paddle.x, paddle.y - half);
      ctx.lineTo(paddle.x, paddle.y + half);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(palette.ink, 0.35);
      ctx.strokeStyle = rgba(paddle.color, 0.3);
      const w = 28;
      const h = 8;
      ctx.beginPath();
      ctx.roundRect(paddle.x - w * 0.5, paddle.y - h * 0.5, w, h, 4);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawTrail(photon) {
    if (photon.trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 1; i < photon.trail.length; i += 1) {
      const a = i / photon.trail.length;
      const prev = photon.trail[i - 1];
      const point = photon.trail[i];
      ctx.strokeStyle = rgba(photon.color, 0.02 + a * 0.34 * point.e);
      ctx.lineWidth = (0.8 + a * photon.r * 1.25) * point.e;
      ctx.shadowColor = rgba(photon.color, 0.82);
      ctx.shadowBlur = 14 + a * 26;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPhoton(photon) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(photon.x, photon.y, 0, photon.x, photon.y, photon.r * 9.5 * photon.energy);
    glow.addColorStop(0, rgba(palette.gold, 0.9));
    glow.addColorStop(0.2, rgba(photon.color, 0.58));
    glow.addColorStop(0.56, rgba(photon.color, 0.16));
    glow.addColorStop(1, rgba(photon.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(photon.x, photon.y, photon.r * 9.5 * photon.energy, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = rgba(photon.color, 1);
    ctx.shadowBlur = 24;
    ctx.fillStyle = rgba(palette.gold, 0.96);
    ctx.beginPath();
    ctx.arc(photon.x, photon.y, photon.r * 1.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(photon.color, 0.72);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(photon.x, photon.y, photon.r * 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawConnections() {
    if (!photons.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    photons.forEach((photon, index) => {
      const paddle = photon.vx < 0 ? paddles[0] : paddles[1];
      const grad = ctx.createLinearGradient(paddle.x, paddle.y, photon.x, photon.y);
      grad.addColorStop(0, rgba(paddle.color, 0.16));
      grad.addColorStop(0.5, rgba(index % 2 ? palette.cyan : palette.gold, 0.12));
      grad.addColorStop(1, rgba(photon.color, 0.06));
      ctx.strokeStyle = grad;
      ctx.lineWidth = index === 0 ? 1.3 : 0.8;
      ctx.setLineDash(index === 0 ? [18, 16] : [8, 20]);
      ctx.beginPath();
      ctx.moveTo(paddle.x, paddle.y);
      ctx.lineTo(photon.x, photon.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawRipples() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ripples.forEach((ripple) => {
      const t = ripple.age / ripple.life;
      const radius = (34 + t * 170) * ripple.strength;
      ctx.strokeStyle = rgba(ripple.color, (1 - t) * 0.38);
      ctx.lineWidth = 1.2 + (1 - t) * 2.8;
      ctx.shadowColor = rgba(ripple.color, 0.8);
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawSparks() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sparks.forEach((spark) => {
      const t = spark.age / spark.life;
      const alpha = (1 - t) * 0.72;
      ctx.fillStyle = rgba(spark.color, alpha);
      ctx.shadowColor = rgba(spark.color, alpha);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * (1 - t * 0.45), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawNumbers() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    numberBursts.forEach((burst) => {
      const t = burst.age / burst.life;
      const alpha = (1 - t) * 0.72;
      const size = 13 + (1 - t) * 8;
      ctx.font = `800 ${size}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = rgba(palette.ink, 0.48);
      ctx.strokeStyle = rgba(burst.color, alpha * 0.9);
      ctx.lineWidth = 1;
      ctx.shadowColor = rgba(burst.color, alpha);
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, size * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(burst.color, alpha);
      ctx.fillText(burst.number, burst.x, burst.y + 0.5);
    });
    ctx.restore();
  }

  function drawPointerLens(now) {
    const pointerHot = pointer.active && now - pointer.lastMove < 1400;
    if (!pointerHot) return;
    const age = now - pointer.lastMove;
    const fade = clamp(1 - age / 1400, 0, 1);
    const radius = pointer.down ? 116 : 76;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius * 2.2);
    grad.addColorStop(0, rgba(palette.gold, 0.18 * fade));
    grad.addColorStop(0.42, rgba(palette.cyan, 0.08 * fade));
    grad.addColorStop(1, rgba(palette.cyan, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rgba(pointer.down ? palette.gold : palette.green, 0.38 * fade);
    ctx.lineWidth = pointer.down ? 2 : 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function render(now) {
    ctx.clearRect(0, 0, width, height);
    drawGrid(now);
    drawStars(now);
    drawConnections();
    photons.forEach(drawTrail);
    drawRipples();
    drawPaddles();
    photons.forEach(drawPhoton);
    drawSparks();
    drawNumbers();
    drawPointerLens(now);
  }

  function staticRender() {
    photons.forEach((photon, index) => {
      photon.x = width * (0.25 + index * 0.24);
      photon.y = height * (0.28 + index * 0.18);
      photon.trail = Array.from({ length: 18 }, (_, i) => ({
        x: photon.x - i * (18 + index * 2),
        y: photon.y + Math.sin(i * 0.5 + index) * 12,
        e: 0.65
      })).reverse();
    });
    paddles[0].y = height * 0.44;
    paddles[1].y = height * 0.56;
    render(performance.now());
  }

  function tick(now) {
    if (isPaused || document.hidden) {
      frameHandle = 0;
      return;
    }

    const frameBudget = width < 720 || lowPowerMode || document.body.classList.contains("lm-page-is-transitioning")
      ? 1000 / 24
      : 1000 / 30;
    if (lastDraw && now - lastDraw < frameBudget) {
      frameHandle = requestAnimationFrame(tick);
      return;
    }
    lastDraw = now;

    if (reduceMotion?.matches) {
      if (!staticRendered) {
        staticRender();
        staticRendered = true;
      }
      frameHandle = 0;
      return;
    }

    const dt = Math.min(0.033, Math.max(0.001, (now - (lastFrame || now)) / 1000));
    lastFrame = now;
    updatePaddles(now, dt);
    updatePhotons(now, dt);
    updateParticles(dt);
    render(now);
    frameHandle = requestAnimationFrame(tick);
  }

  function resume() {
    if (frameHandle) return;
    lastFrame = performance.now();
    lastDraw = 0;
    frameHandle = requestAnimationFrame(tick);
  }

  function handleVisibility() {
    isPaused = document.hidden;
    if (!isPaused) resume();
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility, { passive: true });
  reduceMotion?.addEventListener?.("change", () => {
    staticRendered = false;
    resume();
  });

  if (typeof ctx.roundRect !== "function") {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      this.beginPath();
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      this.closePath();
      return this;
    };
  }

  resize();
  syncPointerCss();
  resume();
})();
