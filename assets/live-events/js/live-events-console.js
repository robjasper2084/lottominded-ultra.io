(function () {
  const rail = document.querySelector("[data-live-console]");
  if (!rail) return;

  const modeButtons = Array.from(rail.querySelectorAll("[data-live-mode]"));
  const keyButtons = Array.from(rail.querySelectorAll("[data-live-piano] button"));
  const meterBars = Array.from(rail.querySelectorAll("[data-live-meter] i"));
  const knobs = Array.from(rail.querySelectorAll(".lm-synth-knobs i"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  let audioContext = null;
  let analyser = null;
  let outputGain = null;
  let analyserData = null;
  let animationFrame = 0;
  const activeVoices = new Map();

  function setMode(button) {
    modeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    rail.dataset.liveMode = button.dataset.liveMode || "piano";
  }

  function unlockAudio() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
      outputGain = audioContext.createGain();
      outputGain.gain.value = 0.18;
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.76;
      analyserData = new Uint8Array(analyser.frequencyBinCount);
      outputGain.connect(analyser);
      analyser.connect(audioContext.destination);
      renderMeter();
    }
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function makeVoice(frequency) {
    const context = unlockAudio();
    if (!context || !outputGain) return null;
    const now = context.currentTime;
    const voiceGain = context.createGain();
    const filter = context.createBiquadFilter();
    const low = context.createOscillator();
    const high = context.createOscillator();

    low.type = "triangle";
    high.type = "sine";
    low.frequency.setValueAtTime(frequency, now);
    high.frequency.setValueAtTime(frequency * 2.003, now);
    high.detune.setValueAtTime(4, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 0.08);
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.34, now + 0.022);
    voiceGain.gain.exponentialRampToValueAtTime(0.13, now + 0.18);

    low.connect(filter);
    high.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(outputGain);
    low.start(now);
    high.start(now);

    return { low, high, gain: voiceGain, filter };
  }

  function stopVoice(key) {
    const voice = activeVoices.get(key);
    if (!voice || !audioContext) return;
    activeVoices.delete(key);
    const now = audioContext.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.035);
    window.setTimeout(() => {
      try {
        voice.low.stop();
        voice.high.stop();
      } catch {}
      try {
        voice.low.disconnect();
        voice.high.disconnect();
        voice.filter.disconnect();
        voice.gain.disconnect();
      } catch {}
    }, 180);
  }

  function playKey(button) {
    const frequency = Number(button.dataset.frequency);
    if (!Number.isFinite(frequency)) return;
    stopVoice(button);
    const voice = makeVoice(frequency);
    if (!voice) return;
    activeVoices.set(button, voice);
    button.classList.add("is-playing");
    rail.dataset.liveNote = button.dataset.note || "";
  }

  function releaseKey(button) {
    button.classList.remove("is-playing");
    stopVoice(button);
  }

  function renderMeter() {
    if (!analyser || !analyserData) return;
    analyser.getByteFrequencyData(analyserData);
    let sum = 0;
    meterBars.forEach((bar, index) => {
      const bin = analyserData[Math.min(analyserData.length - 1, index * 3)] || 0;
      const level = Math.max(0.12, bin / 255);
      sum += level;
      bar.style.setProperty("--level", level.toFixed(3));
    });
    const energy = meterBars.length ? sum / meterBars.length : 0;
    knobs.forEach((knob, index) => {
      knob.style.transform = `rotate(${Math.round(35 + energy * 210 + index * 18)}deg)`;
      knob.style.filter = `drop-shadow(0 0 ${Math.round(6 + energy * 16)}px rgba(41, 247, 255, 0.42))`;
    });
    if (!reducedMotion) animationFrame = window.requestAnimationFrame(renderMeter);
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button);
      unlockAudio();
      if (button.dataset.liveMode !== "piano") {
        const demoKey = keyButtons[(modeButtons.indexOf(button) + 2) % keyButtons.length];
        playKey(demoKey);
        window.setTimeout(() => releaseKey(demoKey), 180);
      }
    });
  });

  keyButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      playKey(button);
    });
    button.addEventListener("pointerup", () => releaseKey(button));
    button.addEventListener("pointercancel", () => releaseKey(button));
    button.addEventListener("lostpointercapture", () => releaseKey(button));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      playKey(button);
    });
    button.addEventListener("keyup", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      releaseKey(button);
    });
  });

  ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, unlockAudio, { once: true, passive: true });
  });

  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(animationFrame);
    keyButtons.forEach(releaseKey);
  });
})();
