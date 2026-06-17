(() => {
  const revealEls = document.querySelectorAll("[data-cinematic-reveal]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  revealEls.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index * 55, 260)}ms`;
    observer.observe(el);
  });

  const eq = document.querySelector("[data-live-eq]");
  const eqBars = Array.from(eq?.querySelectorAll(".live-eq-meter i") || []);
  const eqStatus = document.querySelector("[data-eq-status]");
  const knobButtons = Array.from(document.querySelectorAll(".console-knobs button"));
  let audioCtx = null;
  let analyser = null;
  let master = null;
  let eqData = null;
  let eqFrame = 0;
  let idlePhase = 0;
  let visualImpulse = 0;
  const mediaSources = new WeakSet();

  function setEqStatus(text) {
    if (eqStatus) eqStatus.textContent = text;
  }

  function getContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = audioCtx || new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});

    if (!analyser) {
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      eqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.connect(audioCtx.destination);
    }

    if (!master) {
      master = audioCtx.createGain();
      master.gain.value = 0.72;
      master.connect(analyser);
    }

    return audioCtx;
  }

  function getOutput() {
    return getContext() ? master : null;
  }

  function connectPlayableMedia(media) {
    if (!media || mediaSources.has(media)) return;
    if (media.muted || media.volume === 0) return;
    const ctx = getContext();
    if (!ctx || !analyser) return;

    try {
      const source = ctx.createMediaElementSource(media);
      source.connect(analyser);
      mediaSources.add(media);
      setEqStatus("Media linked");
    } catch {
      mediaSources.add(media);
    }
  }

  function scanPageMedia() {
    document.querySelectorAll("audio, video").forEach((media) => {
      if (!media.paused && !media.muted && media.volume > 0) connectPlayableMedia(media);
    });
  }

  function startEqRender() {
    if (eqFrame || !eqBars.length) return;

    const render = () => {
      let average = 0;
      let bass = 0;
      let mid = 0;
      let high = 0;

      if (analyser && eqData) {
        analyser.getByteFrequencyData(eqData);
        const third = Math.max(1, Math.floor(eqData.length / 3));
        for (let i = 0; i < eqData.length; i += 1) {
          const value = eqData[i] / 255;
          average += value;
          if (i < third) bass += value;
          else if (i < third * 2) mid += value;
          else high += value;
        }
        average /= eqData.length;
        bass /= third;
        mid /= third;
        high /= eqData.length - third * 2 || 1;
      }

      idlePhase += 0.052;
      const idle = 0.1 + Math.sin(idlePhase) * 0.035;
      const energy = Math.max(average, idle, visualImpulse * 0.68);

      eqBars.forEach((bar, index) => {
        const bandSeed = index / Math.max(1, eqBars.length - 1);
        const analyzed = analyser && eqData
          ? (eqData[Math.min(eqData.length - 1, Math.floor(bandSeed * eqData.length))] || 0) / 255
          : 0;
        const pulse = Math.sin(idlePhase + index * 0.76) * 0.08;
        const hit = visualImpulse * (0.18 + ((index % 5) / 5) * 0.22);
        const level = Math.max(0.1, Math.min(1, analyzed * 0.92 + energy * 0.42 + hit + pulse));
        bar.style.setProperty("--eq-level", level.toFixed(3));
      });

      if (eq) {
        eq.style.setProperty("--eq-bass", Math.max(bass, idle).toFixed(3));
        eq.style.setProperty("--eq-mid", Math.max(mid, idle * 0.9).toFixed(3));
        eq.style.setProperty("--eq-high", Math.max(high, idle * 0.85).toFixed(3));
      }

      knobButtons.forEach((button, index) => {
        const band = index === 0 ? bass : index === 1 ? mid : index === 2 ? high : energy;
        const motion = Math.max(band, visualImpulse * 0.64, idle * (1 + index * 0.08));
        button.style.setProperty("--knob-energy", motion.toFixed(3));
        button.style.setProperty("--knob-rotation", `${Math.round(-74 + motion * 168 + index * 11)}deg`);
      });

      visualImpulse *= 0.93;
      eqFrame = window.requestAnimationFrame(render);
    };

    setEqStatus("Listening");
    eqFrame = window.requestAnimationFrame(render);
  }

  function playTone(seed = 0) {
    const output = getOutput();
    if (!audioCtx || !output) return;
    const notes = [261.63, 293.66, 329.63, 392, 440, 493.88, 523.25];
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(notes[seed % notes.length], now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.24);
    visualImpulse = Math.max(visualImpulse, 0.62);
    startEqRender();
  }

  document.querySelectorAll("button:not(.piano-key), .rail-cards a, .feature-cta").forEach((el, index) => {
    el.addEventListener("pointerdown", () => playTone(index), { passive: true });
  });

  ["pointerdown", "touchstart", "keydown"].forEach((type) => {
    document.addEventListener(type, () => {
      getContext();
      scanPageMedia();
      startEqRender();
    }, { once: true, passive: true });
  });

  document.addEventListener("play", (event) => {
    if (event.target instanceof HTMLMediaElement) connectPlayableMedia(event.target);
  }, true);
  document.addEventListener("volumechange", (event) => {
    if (event.target instanceof HTMLMediaElement) connectPlayableMedia(event.target);
  }, true);
  window.setInterval(scanPageMedia, 1600);
  startEqRender();

  const piano = document.querySelector("[data-playable-piano]");
  if (!piano) return;

  const activeVoices = new Map();

  function playPianoKey(key, pointerId = "keyboard") {
    const output = getOutput();
    if (!audioCtx || !output) return;
    const frequency = Number(key.dataset.frequency || 261.63);
    const now = audioCtx.currentTime;
    const voiceGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const body = audioCtx.createOscillator();
    const tine = audioCtx.createOscillator();
    const shimmer = audioCtx.createOscillator();

    body.type = "triangle";
    tine.type = "sine";
    shimmer.type = "sine";
    body.frequency.setValueAtTime(frequency, now);
    tine.frequency.setValueAtTime(frequency * 2.01, now);
    shimmer.frequency.setValueAtTime(frequency * 3.01, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(5200, now);
    filter.frequency.exponentialRampToValueAtTime(1550, now + 0.52);
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(0.18, now + 0.014);
    voiceGain.gain.exponentialRampToValueAtTime(0.045, now + 0.38);

    body.connect(filter);
    tine.connect(filter);
    shimmer.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(output);
    body.start(now);
    tine.start(now);
    shimmer.start(now);
    key.classList.add("is-playing");
    setEqStatus("Piano signal");
    visualImpulse = Math.max(visualImpulse, 0.86);
    startEqRender();

    activeVoices.set(pointerId, { body, tine, shimmer, gain: voiceGain, key });
  }

  function releasePianoKey(pointerId = "keyboard") {
    const voice = activeVoices.get(pointerId);
    if (!voice || !audioCtx) return;
    const now = audioCtx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.07);
    voice.body.stop(now + 0.36);
    voice.tine.stop(now + 0.36);
    voice.shimmer.stop(now + 0.36);
    voice.key.classList.remove("is-playing");
    activeVoices.delete(pointerId);
  }

  piano.querySelectorAll(".piano-key").forEach((key) => {
    key.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      key.setPointerCapture?.(event.pointerId);
      releasePianoKey(event.pointerId);
      playPianoKey(key, event.pointerId);
    });
    key.addEventListener("pointerup", (event) => releasePianoKey(event.pointerId));
    key.addEventListener("pointercancel", (event) => releasePianoKey(event.pointerId));
    key.addEventListener("lostpointercapture", (event) => releasePianoKey(event.pointerId));
    key.addEventListener("mousedown", () => {
      if (activeVoices.has("mouse")) return;
      playPianoKey(key, "mouse");
    });
    key.addEventListener("mouseup", () => releasePianoKey("mouse"));
    key.addEventListener("mouseleave", () => releasePianoKey("mouse"));
    key.addEventListener("click", () => {
      if (activeVoices.size) return;
      playPianoKey(key, `tap-${key.dataset.note}`);
      window.setTimeout(() => releasePianoKey(`tap-${key.dataset.note}`), 240);
    });
    key.addEventListener("keydown", (event) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      playPianoKey(key, `key-${key.dataset.note}`);
    });
    key.addEventListener("keyup", () => releasePianoKey(`key-${key.dataset.note}`));
  });

  window.addEventListener("pagehide", () => {
    if (eqFrame) window.cancelAnimationFrame(eqFrame);
  });
})();
