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

  let audioCtx = null;
  function playTone(seed = 0) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioCtx = audioCtx || new AudioCtx();
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
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }
  document.querySelectorAll("button:not(.piano-key), .rail-cards a, .feature-cta").forEach((el, index) => {
    el.addEventListener("pointerdown", () => playTone(index), { passive: true });
  });

  const piano = document.querySelector("[data-playable-piano]");
  if (!piano) return;

  const activeVoices = new Map();
  const master = audioCtx ? audioCtx.createGain() : null;
  if (master) {
    master.gain.value = 0.72;
    master.connect(audioCtx.destination);
  }

  function getContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = audioCtx || new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playPianoKey(key, pointerId = "keyboard") {
    const ctx = getContext();
    if (!ctx) return;
    const output = master || ctx.destination;
    const frequency = Number(key.dataset.frequency || 261.63);
    const now = ctx.currentTime;
    const voiceGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const body = ctx.createOscillator();
    const tine = ctx.createOscillator();
    const shimmer = ctx.createOscillator();

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

    activeVoices.set(pointerId, { body, tine, shimmer, gain: voiceGain, key });
  }

  function releasePianoKey(pointerId = "keyboard") {
    const voice = activeVoices.get(pointerId);
    if (!voice) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;
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
    key.addEventListener("keydown", (event) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      playPianoKey(key, `key-${key.dataset.note}`);
    });
    key.addEventListener("keyup", () => releasePianoKey(`key-${key.dataset.note}`));
  });
})();
