(() => {
  const stage = document.querySelector("[data-spheres-stage]");
  const canvas = document.querySelector("[data-spheres-canvas]");
  if (!stage || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const signalOutput = document.querySelector("[data-sphere-signal]");
  const energyMeter = document.querySelector("[data-sphere-energy]");
  const orbitOutput = document.querySelector("[data-sphere-orbit]");
  const rerollButton = document.querySelector("[data-reroll-spheres]");
  const moveCountOutput = document.querySelector("[data-sphere-move-count]");
  const pick6Output = document.querySelector("[data-sphere-pick6]");
  const pick3Output = document.querySelector("[data-sphere-pick3]");
  const pick4Output = document.querySelector("[data-sphere-pick4]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const sphereTheme = stage.dataset.spheresTheme || "default";
  const standardPalette = [
    { face: "#effbff", rim: "#ffe071", glow: "rgba(255, 224, 113, 0.52)", ink: "#05111c" },
    { face: "#29f7ff", rim: "#eefbff", glow: "rgba(41, 247, 255, 0.58)", ink: "#03101a" },
    { face: "#5eff9d", rim: "#fff3a0", glow: "rgba(94, 255, 157, 0.46)", ink: "#03120b" },
    { face: "#ff65db", rim: "#ffe071", glow: "rgba(255, 101, 219, 0.44)", ink: "#fff7d1" },
    { face: "#ffffff", rim: "#29f7ff", glow: "rgba(255, 255, 255, 0.32)", ink: "#07111b" }
  ];
  const goldenPalette = [
    { face: "#fff3a8", rim: "#d59a22", glow: "rgba(255, 207, 82, 0.58)", trail: "rgba(255, 199, 76, 0.13)", shadow: "#2a1700", center: "rgba(255, 248, 211, 0.88)", number: "#241300" },
    { face: "#ffe071", rim: "#a96d12", glow: "rgba(255, 176, 39, 0.5)", trail: "rgba(255, 177, 44, 0.11)", shadow: "#261300", center: "rgba(255, 239, 168, 0.9)", number: "#241300" },
    { face: "#ffd15a", rim: "#fff0a6", glow: "rgba(255, 224, 113, 0.54)", trail: "rgba(255, 224, 113, 0.12)", shadow: "#3a2100", center: "rgba(255, 250, 222, 0.9)", number: "#241300" },
    { face: "#f6b83c", rim: "#ffe071", glow: "rgba(255, 185, 60, 0.48)", trail: "rgba(255, 185, 60, 0.1)", shadow: "#231100", center: "rgba(255, 242, 190, 0.88)", number: "#241300" }
  ];
  const palette = sphereTheme === "golden" ? goldenPalette : standardPalette;
  const accentImage = stage.dataset.spheresAccentSrc ? new Image() : null;
  if (accentImage) accentImage.src = stage.dataset.spheresAccentSrc;

  const pointer = { x: 0, y: 0, active: false };
  let width = 1;
  let height = 1;
  let dpr = 1;
  let balls = [];
  let raf = 0;
  let energy = 58;
  let audioPulse = 0;
  let audioPulseUntil = 0;
  let audioPulseIndex = 0;
  let moveTriggerCount = 0;
  let lastMovePoint = null;
  let lastMoveTriggerAt = 0;

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeSignal() {
    const pool = Array.from({ length: 69 }, (_, index) => index + 1);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const swapIndex = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
    }
    return pool.slice(0, 5).sort((a, b) => a - b);
  }

  function makeUniqueSet(count, max) {
    const pool = Array.from({ length: max }, (_, index) => index + 1);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const swapIndex = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
    }
    return pool.slice(0, count).sort((a, b) => a - b);
  }

  function makeDigitSet(count) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 10));
  }

  function setSignal(numbers) {
    if (signalOutput) signalOutput.textContent = numbers.map(pad).join(" - ");
  }

  function setGeneratedSets() {
    const pick6 = makeUniqueSet(6, 69);
    const pick3 = makeDigitSet(3);
    const pick4 = makeDigitSet(4);
    if (pick6Output) {
      pick6Output.innerHTML = pick6
        .map((number, index) => `<span class="${index === 5 ? "is-sixth-digit" : ""}">${pad(number)}</span>`)
        .join('<span class="pick-separator"> - </span>');
    }
    if (pick3Output) pick3Output.textContent = pick3.join(" - ");
    if (pick4Output) pick4Output.textContent = pick4.join(" - ");
    if (moveCountOutput) moveCountOutput.textContent = "Generated after 3 ball moves. Move 3 more times for a fresh set.";
    setSignal(pick6.slice(0, 5));
  }

  function updateMoveTriggerLabel() {
    if (!moveCountOutput || moveTriggerCount === 0) return;
    moveCountOutput.textContent = `${moveTriggerCount}/3 ball moves captured.`;
  }

  function setEnergy(value) {
    energy = Math.max(18, Math.min(100, value));
    if (energyMeter) {
      energyMeter.value = energy;
      energyMeter.textContent = String(Math.round(energy));
    }
    if (!orbitOutput) return;
    orbitOutput.textContent = energy > 78 ? "Surge" : energy > 52 ? "Active" : "Calm";
  }

  function seedBalls() {
    const count = width < 720 ? 14 : 22;
    const signal = makeSignal();
    setSignal(signal);
    setEnergy(62 + Math.random() * 28);
    balls = Array.from({ length: count }, (_, index) => {
      const size = randomBetween(width < 720 ? 24 : 34, width < 720 ? 62 : 94);
      const paletteItem = palette[index % palette.length];
      const number = index < signal.length ? signal[index] : Math.ceil(randomBetween(1, 69));
      return {
        x: randomBetween(size, Math.max(size + 1, width - size)),
        y: randomBetween(size, Math.max(size + 1, height - size)),
        baseX: randomBetween(width * 0.16, width * 0.84),
        baseY: randomBetween(height * 0.12, height * 0.86),
        vx: randomBetween(-0.32, 0.32),
        vy: randomBetween(-0.24, 0.24),
        size,
        number,
        asset: Boolean(accentImage && index < (width < 720 ? 1 : 2)),
        phase: randomBetween(0, Math.PI * 2),
        color: paletteItem
      };
    });
    moveTriggerCount = 0;
    lastMovePoint = null;
    if (moveCountOutput) moveCountOutput.textContent = "Move the balls 3 times to generate sets.";
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(320, rect.width);
    height = Math.max(460, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedBalls();
    window.cancelAnimationFrame(raf);
    render(performance.now());
  }

  function drawBackdrop(time, pulse = 0) {
    const drift = reduceMotion.matches ? 0 : Math.sin(time * 0.00032) * 70;
    const gradient = ctx.createRadialGradient(width * 0.55 + drift, height * 0.45, 0, width * 0.55, height * 0.45, Math.max(width, height) * 0.8);
    gradient.addColorStop(0, `rgba(41, 247, 255, ${0.2 + pulse * 0.16})`);
    gradient.addColorStop(0.28, "rgba(4, 18, 34, 0.32)");
    gradient.addColorStop(0.72, "rgba(4, 6, 14, 0.74)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = "rgba(255, 224, 113, 0.18)";
    ctx.lineWidth = 1.2;
    for (let i = -height; i < width; i += 110) {
      ctx.beginPath();
      ctx.moveTo(i + drift * 0.28, height);
      ctx.lineTo(i + height * 0.44 + drift * 0.28, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTrail(ball, time, pulse = 0) {
    const trailSize = ball.size * (2.2 + pulse * 0.8);
    const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, trailSize);
    glow.addColorStop(0, ball.color.glow);
    glow.addColorStop(0.42, ball.color.trail || "rgba(41, 247, 255, 0.08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, trailSize + Math.sin(time * 0.002 + ball.phase) * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBall(ball, time, pulse = 0) {
    const shimmer = reduceMotion.matches ? 0 : Math.sin(time * 0.002 + ball.phase) * ball.size * 0.04;
    const r = ball.size * (1 + pulse * 0.22) + shimmer;
    const gradient = ctx.createRadialGradient(ball.x - r * 0.32, ball.y - r * 0.38, r * 0.08, ball.x, ball.y, r);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.2, ball.color.face);
    gradient.addColorStop(0.62, ball.color.rim);
    gradient.addColorStop(1, ball.color.shadow || "#05101a");

    ctx.save();
    ctx.shadowColor = ball.color.glow;
    ctx.shadowBlur = r * 0.42;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (pulse > 0.015) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(0.48, 0.16 + pulse * 0.58);
      ctx.fillStyle = `hsl(${(time * 0.06 + ball.number * 17 + audioPulseIndex * 9) % 360}, 92%, 62%)`;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r * (0.86 + pulse * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (ball.asset && accentImage?.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r * 0.92, 0, Math.PI * 2);
      ctx.clip();
      const imageSize = r * 2.55;
      ctx.globalAlpha = 0.86;
      ctx.drawImage(accentImage, ball.x - imageSize * 0.5, ball.y - imageSize * 0.5, imageSize, imageSize);
      ctx.restore();
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = "rgba(255, 224, 113, 0.86)";
      ctx.lineWidth = Math.max(2, r * 0.065);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = Math.max(1, r * 0.045);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r * 0.78, -0.6, Math.PI * 1.2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = ball.color.center || "rgba(0, 5, 12, 0.82)";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r * 0.44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ball.color.number || ball.color.rim;
    ctx.font = `900 ${Math.max(16, r * 0.55)}px ${getComputedStyle(document.documentElement).getPropertyValue("--body-font") || "Inter, sans-serif"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pad(ball.number), ball.x, ball.y + r * 0.02);
    ctx.restore();
  }

  function updateBall(ball, time, pulse = 0) {
    if (reduceMotion.matches) return;

    const orbitX = Math.cos(time * 0.00042 + ball.phase) * width * 0.065;
    const orbitY = Math.sin(time * 0.00036 + ball.phase) * height * 0.06;
    const targetX = ball.baseX + orbitX;
    const targetY = ball.baseY + orbitY;
    ball.vx += (targetX - ball.x) * 0.00042;
    ball.vy += (targetY - ball.y) * 0.00042;

    if (pointer.active) {
      const dx = ball.x - pointer.x;
      const dy = ball.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      const force = Math.max(0, 210 - distance) / 210;
      ball.vx += (dx / distance) * force * 0.72;
      ball.vy += (dy / distance) * force * 0.72;
    }

    if (pulse > 0.02) {
      const kick = pulse * (ball.asset ? 0.95 : 0.58);
      ball.vx += Math.cos(time * 0.004 + ball.phase + audioPulseIndex) * kick;
      ball.vy += Math.sin(time * 0.0036 + ball.phase) * kick;
    }

    ball.vx *= 0.972;
    ball.vy *= 0.972;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x < ball.size || ball.x > width - ball.size) {
      ball.vx *= -0.74;
      ball.x = Math.max(ball.size, Math.min(width - ball.size, ball.x));
    }
    if (ball.y < ball.size || ball.y > height - ball.size) {
      ball.vy *= -0.74;
      ball.y = Math.max(ball.size, Math.min(height - ball.size, ball.y));
    }
  }

  function render(time) {
    const pulse = reduceMotion.matches ? 0 : audioPulse;
    if (audioPulse > 0.004) audioPulse *= time < audioPulseUntil ? 0.94 : 0.82;
    if (audioPulse < 0.004) audioPulse = 0;
    stage.style.setProperty("--audio-pulse", pulse.toFixed(3));
    stage.classList.toggle("is-audio-reactive", pulse > 0.05);

    ctx.clearRect(0, 0, width, height);
    drawBackdrop(time, pulse);
    if (!reduceMotion.matches) {
      const idleEnergy = 42 + Math.sin(time * 0.0018) * 8;
      const targetEnergy = Math.max(pointer.active ? 82 + Math.sin(time * 0.006) * 10 : idleEnergy, 44 + pulse * 56);
      setEnergy(energy + (targetEnergy - energy) * 0.04);
    }
    balls.forEach((ball) => {
      updateBall(ball, time, pulse);
      drawTrail(ball, time, pulse);
    });
    balls.forEach((ball) => drawBall(ball, time, pulse));

    if (!reduceMotion.matches) {
      raf = window.requestAnimationFrame(render);
    }
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;

    const now = performance.now();
    if (!lastMovePoint) {
      lastMovePoint = { x: pointer.x, y: pointer.y };
      moveTriggerCount = 1;
      lastMoveTriggerAt = now;
      updateMoveTriggerLabel();
      return;
    }
    const distance = Math.hypot(pointer.x - lastMovePoint.x, pointer.y - lastMovePoint.y);
    if (distance > 90 && now - lastMoveTriggerAt > 250) {
      moveTriggerCount += 1;
      lastMoveTriggerAt = now;
      lastMovePoint = { x: pointer.x, y: pointer.y };
      updateMoveTriggerLabel();
      if (moveTriggerCount >= 3) {
        moveTriggerCount = 0;
        setGeneratedSets();
      }
    }
  }

  stage.addEventListener("pointermove", updatePointer);
  stage.addEventListener("pointerdown", updatePointer);
  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("lottomind:beat-energy", (event) => {
    const nextPulse = clamp01(event.detail?.energy);
    if (!nextPulse) return;
    audioPulse = Math.max(audioPulse, nextPulse);
    audioPulseUntil = performance.now() + 900;
    audioPulseIndex = Number(event.detail?.index) || audioPulseIndex + 1;
    balls.forEach((ball, index) => {
      const angle = (index / Math.max(1, balls.length)) * Math.PI * 2 + audioPulseIndex * 0.13;
      ball.vx += Math.cos(angle) * nextPulse * (ball.asset ? 1.25 : 0.68);
      ball.vy += Math.sin(angle) * nextPulse * (ball.asset ? 1.05 : 0.58);
    });
  });

  rerollButton?.addEventListener("click", () => {
    seedBalls();
    window.cancelAnimationFrame(raf);
    render(performance.now());
  });

  reduceMotion.addEventListener?.("change", () => {
    window.cancelAnimationFrame(raf);
    render(performance.now());
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
})();
