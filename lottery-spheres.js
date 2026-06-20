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
  const audioGate = document.querySelector("[data-sphere-audio-gate]");
  const audioStartButton = document.querySelector("[data-sphere-audio-start]");
  const audioSkipButton = document.querySelector("[data-sphere-audio-skip]");
  const audioStatus = document.querySelector("[data-sphere-audio-status]");
  const sphereSoundtrack = document.querySelector("[data-sphere-soundtrack]");
  const liveMixAudio = document.querySelector("[data-live-player] [data-live-player-audio]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sphereSoundtrackFullVolume = 0.58;
  const sphereSoundtrackDuckedVolume = 0.22;
  let sphereSoundtrackStarted = false;
  let sphereSoundtrackUserSkipped = false;
  let liveMixDucking = false;

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

  const pointer = { x: 0, y: 0, active: false, touchBoost: 0 };
  let width = 1;
  let height = 1;
  let dpr = 1;
  let balls = [];
  let raf = 0;
  let energy = 58;
  let audioPulse = 0;
  let audioPulseUntil = 0;
  let audioPulseIndex = 0;
  let audioContext = null;
  let audioAnalyser = null;
  let audioData = null;
  let audioSource = null;
  let lastBeatPulseAt = 0;
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
      const touchRange = pointer.touchBoost > 0.04 ? 285 : 210;
      const touchForce = 0.72 + pointer.touchBoost * 0.42;
      const force = Math.max(0, touchRange - distance) / touchRange;
      ball.vx += (dx / distance) * force * touchForce;
      ball.vy += (dy / distance) * force * touchForce;
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

  function setAudioGateOpen(open) {
    if (!audioGate) return;
    audioGate.hidden = !open;
    audioGate.classList.toggle("is-hidden", !open);
  }

  function setupSphereAudioAnalyzer() {
    if (!sphereSoundtrack || audioAnalyser) return Boolean(audioAnalyser);
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      if (audioStatus) audioStatus.textContent = "Audio reactivity is not available in this browser.";
      return false;
    }
    audioContext = audioContext || new AudioContextCtor();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;
    audioAnalyser.smoothingTimeConstant = 0.78;
    audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
    if (!audioSource) {
      audioSource = audioContext.createMediaElementSource(sphereSoundtrack);
      audioSource.connect(audioAnalyser);
      audioAnalyser.connect(audioContext.destination);
    }
    return true;
  }

  async function startSphereAudio() {
    if (!sphereSoundtrack) return;
    try {
      setupSphereAudioAnalyzer();
      if (audioContext?.state === "suspended") await audioContext.resume();
      sphereSoundtrack.volume = liveMixDucking ? sphereSoundtrackDuckedVolume : sphereSoundtrackFullVolume;
      await sphereSoundtrack.play();
      sphereSoundtrackStarted = true;
      sphereSoundtrackUserSkipped = false;
      setAudioGateOpen(false);
      stage.classList.add("has-sphere-soundtrack");
      if (audioStatus) audioStatus.textContent = "";
    } catch (error) {
      if (audioStatus) audioStatus.textContent = "Tap again to allow the sphere soundtrack.";
    }
  }

  function updateSphereAudioPulse(time) {
    if (!audioAnalyser || !audioData || sphereSoundtrack?.paused || reduceMotion.matches) return;
    audioAnalyser.getByteFrequencyData(audioData);
    let bassTotal = 0;
    let bodyTotal = 0;
    let bassCount = 0;
    let bodyCount = 0;

    audioData.forEach((value, index) => {
      if (index >= 2 && index <= 12) {
        bassTotal += value;
        bassCount += 1;
      }
      if (index > 12 && index <= 32) {
        bodyTotal += value;
        bodyCount += 1;
      }
    });

    const bass = bassTotal / Math.max(1, bassCount) / 255;
    const body = bodyTotal / Math.max(1, bodyCount) / 255;
    const nextPulse = clamp01(bass * 0.95 + body * 0.34);
    if (nextPulse > 0.1) {
      audioPulse = Math.max(audioPulse * 0.9, nextPulse);
      audioPulseUntil = performance.now() + 260;
    }

    if (nextPulse > 0.34 && time - lastBeatPulseAt > 150) {
      lastBeatPulseAt = time;
      audioPulseIndex += 1;
      balls.forEach((ball, index) => {
        const angle = (index / Math.max(1, balls.length)) * Math.PI * 2 + audioPulseIndex * 0.19;
        ball.vx += Math.cos(angle) * nextPulse * (ball.asset ? 0.95 : 0.42);
        ball.vy += Math.sin(angle) * nextPulse * (ball.asset ? 0.82 : 0.36);
      });
    }
  }

  function render(time) {
    updateSphereAudioPulse(time);
    const pulse = reduceMotion.matches ? 0 : audioPulse;
    if (audioPulse > 0.004) audioPulse *= time < audioPulseUntil ? 0.94 : 0.82;
    if (audioPulse < 0.004) audioPulse = 0;
    if (pointer.touchBoost > 0.004) pointer.touchBoost *= 0.9;
    if (pointer.touchBoost < 0.004) pointer.touchBoost = 0;
    stage.style.setProperty("--audio-pulse", pulse.toFixed(3));
    stage.style.setProperty("--touch-pulse", pointer.touchBoost.toFixed(3));
    stage.classList.toggle("is-pointer-reactive", pointer.active);
    stage.classList.toggle("is-audio-reactive", pulse > 0.05);
    stage.classList.toggle("is-touch-reactive", pointer.touchBoost > 0.05);

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

  let lastPointerTouchAt = 0;

  function getEventPoint(event) {
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;
    if (typeof source?.clientX !== "number" || typeof source?.clientY !== "number") return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
      isTouch: event.pointerType === "touch" || Boolean(event.touches || event.changedTouches)
    };
  }

  function updatePointer(event) {
    const point = getEventPoint(event);
    if (!point) return;
    const now = performance.now();
    if (point.isTouch && event.type?.startsWith("touch") && now - lastPointerTouchAt < 45) return;
    if (event.pointerType === "touch") lastPointerTouchAt = now;

    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = true;
    if (point.isTouch) pointer.touchBoost = Math.max(pointer.touchBoost, 1);

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

  function releasePointer(event) {
    if (!event || event.pointerType !== "mouse") pointer.touchBoost = Math.max(pointer.touchBoost, 0.35);
    pointer.active = false;
  }

  const useGlobalPointer = stage.hasAttribute("data-spheres-global-pointer");
  const pointerTarget = useGlobalPointer ? window : stage;
  const handlePointerDown = (event) => {
    if (!useGlobalPointer && event.pointerType === "touch") {
      stage.setPointerCapture?.(event.pointerId);
    }
    updatePointer(event);
  };

  pointerTarget.addEventListener("pointermove", updatePointer, { passive: true });
  pointerTarget.addEventListener("pointerdown", handlePointerDown, { passive: true });
  pointerTarget.addEventListener("pointerup", releasePointer, { passive: true });
  pointerTarget.addEventListener("pointercancel", releasePointer, { passive: true });

  if (useGlobalPointer) {
    window.addEventListener("touchstart", updatePointer, { passive: true });
    window.addEventListener("touchmove", updatePointer, { passive: true });
    window.addEventListener("touchend", releasePointer, { passive: true });
    window.addEventListener("touchcancel", releasePointer, { passive: true });
    window.addEventListener("blur", releasePointer);
    document.addEventListener("mouseleave", releasePointer, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) releasePointer();
    });
  } else {
    stage.addEventListener("lostpointercapture", releasePointer, { passive: true });
    stage.addEventListener("pointerleave", releasePointer, { passive: true });
    stage.addEventListener("touchstart", updatePointer, { passive: true });
    stage.addEventListener("touchmove", updatePointer, { passive: true });
    stage.addEventListener("touchend", releasePointer, { passive: true });
    stage.addEventListener("touchcancel", releasePointer, { passive: true });
  }

  if (sphereSoundtrack && audioGate) setAudioGateOpen(true);
  audioStartButton?.addEventListener("click", startSphereAudio);
  audioSkipButton?.addEventListener("click", () => {
    sphereSoundtrackUserSkipped = true;
    setAudioGateOpen(false);
  });
  sphereSoundtrack?.addEventListener("play", () => {
    sphereSoundtrackStarted = true;
    sphereSoundtrackUserSkipped = false;
    setAudioGateOpen(false);
    stage.classList.add("has-sphere-soundtrack");
  });
  sphereSoundtrack?.addEventListener("pause", () => {
    stage.classList.remove("has-sphere-soundtrack");
  });

  function setSphereBedDucked(ducked) {
    if (!sphereSoundtrack || sphereSoundtrackUserSkipped) return;
    liveMixDucking = ducked;
    sphereSoundtrack.volume = ducked ? sphereSoundtrackDuckedVolume : sphereSoundtrackFullVolume;
    if (!sphereSoundtrackStarted) return;
    if (sphereSoundtrack.paused || sphereSoundtrack.ended) {
      sphereSoundtrack.play().catch(() => {
        if (audioStatus) audioStatus.textContent = "Tap Start Music to bring the sphere soundtrack back.";
      });
    }
  }

  liveMixAudio?.addEventListener("play", () => setSphereBedDucked(true));
  liveMixAudio?.addEventListener("pause", () => setSphereBedDucked(false));
  liveMixAudio?.addEventListener("ended", () => setSphereBedDucked(false));

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

(() => {
  const player = document.querySelector(".spheres-live-player[data-live-player]");
  if (!player || player.dataset.spheresFloatReady === "true") return;

  const storageKey = "lottominded.ultra.spheresPlayerPosition.v1";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const interactiveSelector = "button, a, input, textarea, select, audio, video, [role='button']";
  const ripples = document.createElement("div");
  let position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let drag = null;
  let lastRipple = { time: 0, x: 0, y: 0 };
  let resizeFrame = 0;

  ripples.className = "spheres-player-ripples";
  ripples.setAttribute("aria-hidden", "true");
  document.body.appendChild(ripples);

  player.dataset.spheresFloatReady = "true";
  player.classList.add("is-floatable");
  player.setAttribute("aria-grabbed", "false");

  function getPlayerSize() {
    const rect = player.getBoundingClientRect();
    return {
      width: rect.width || 300,
      height: rect.height || 300
    };
  }

  function clampPosition(x, y) {
    const margin = 12;
    const { width, height } = getPlayerSize();
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const minX = Math.min(window.innerWidth / 2, halfWidth + margin);
    const maxX = Math.max(window.innerWidth / 2, window.innerWidth - halfWidth - margin);
    const minY = Math.min(window.innerHeight / 2, halfHeight + margin);
    const maxY = Math.max(window.innerHeight / 2, window.innerHeight - halfHeight - margin);
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y))
    };
  }

  function defaultPosition() {
    const { height } = getPlayerSize();
    return clampPosition(window.innerWidth / 2, window.innerHeight - height / 2 - 18);
  }

  function savePosition() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // Storage can be unavailable in private or locked-down browser modes.
    }
  }

  function applyPosition(x, y, options = {}) {
    position = clampPosition(x, y);
    player.style.setProperty("--spheres-player-left", `${Math.round(position.x)}px`);
    player.style.setProperty("--spheres-player-top", `${Math.round(position.y)}px`);
    if (options.save) savePosition();
  }

  function loadPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
        applyPosition(saved.x, saved.y);
        return;
      }
    } catch {
      // Ignore invalid saved data and fall back to the default bottom-center position.
    }
    const next = defaultPosition();
    applyPosition(next.x, next.y);
  }

  function spawnRipple(x, y, force = false) {
    if (reduceMotion.matches) return;
    const now = performance.now();
    const distance = Math.hypot(x - lastRipple.x, y - lastRipple.y);
    if (!force && now - lastRipple.time < 58 && distance < 18) return;

    lastRipple = { time: now, x, y };
    const ripple = document.createElement("span");
    const size = Math.min(190, Math.max(64, 58 + distance * 1.35));
    ripple.className = "spheres-player-ripple";
    ripple.style.setProperty("--ripple-x", `${Math.round(x)}px`);
    ripple.style.setProperty("--ripple-y", `${Math.round(y)}px`);
    ripple.style.setProperty("--ripple-size", `${Math.round(size)}px`);
    ripples.appendChild(ripple);

    while (ripples.childElementCount > 26) ripples.firstElementChild?.remove();
    window.setTimeout(() => ripple.remove(), 960);
  }

  function beginDrag(event) {
    if (drag) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest(interactiveSelector)) return;

    const pointerId = event.pointerId ?? "mouse";
    drag = {
      id: pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y
    };

    player.classList.add("is-dragging");
    player.setAttribute("aria-grabbed", "true");
    if (Number.isFinite(event.pointerId)) player.setPointerCapture?.(event.pointerId);
    spawnRipple(position.x, position.y, true);
    event.preventDefault();
  }

  function moveDrag(event) {
    const pointerId = event.pointerId ?? "mouse";
    if (!drag || pointerId !== drag.id) return;
    applyPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY
    );
    spawnRipple(position.x, position.y);
    event.preventDefault();
  }

  function endDrag(event) {
    const pointerId = event.pointerId ?? "mouse";
    if (!drag || pointerId !== drag.id) return;
    if (Number.isFinite(event.pointerId)) player.releasePointerCapture?.(event.pointerId);
    player.classList.remove("is-dragging");
    player.setAttribute("aria-grabbed", "false");
    spawnRipple(position.x, position.y, true);
    savePosition();
    drag = null;
  }

  function cancelDrag() {
    if (!drag) return;
    player.classList.remove("is-dragging");
    player.setAttribute("aria-grabbed", "false");
    savePosition();
    drag = null;
  }

  player.addEventListener("pointerdown", beginDrag);
  player.addEventListener("pointermove", moveDrag);
  player.addEventListener("pointerup", endDrag);
  player.addEventListener("pointercancel", endDrag);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  player.addEventListener("mousedown", beginDrag);
  window.addEventListener("mousemove", moveDrag);
  window.addEventListener("mouseup", endDrag);
  player.addEventListener("lostpointercapture", cancelDrag);
  window.addEventListener("blur", cancelDrag);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelDrag();
  });

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => applyPosition(position.x, position.y, { save: true }));
  }, { passive: true });

  window.requestAnimationFrame(loadPosition);
})();
