(() => {
  const revealEls = document.querySelectorAll("[data-cinematic-reveal]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
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

  const eqPanels = Array.from(document.querySelectorAll("[data-live-eq]"));
  const eqBars = eqPanels.flatMap((panel) => Array.from(panel.querySelectorAll(".live-eq-meter i")));
  const eqStatuses = Array.from(document.querySelectorAll("[data-eq-status]"));
  const knobButtons = Array.from(document.querySelectorAll("[data-fx-control]"));
  const featureTrack = document.querySelector("[data-feature-entry-track]");
  const player = document.querySelector("[data-feature-live-player]");
  const playerToggle = player?.querySelector("[data-feature-player-toggle]");
  const playerPrev = player?.querySelector("[data-feature-player-prev]");
  const playerNext = player?.querySelector("[data-feature-player-next]");
  const playerTime = player?.querySelector("[data-feature-player-time]");
  const playerSeek = player?.querySelector("[data-feature-player-seek]");
  const playerVolume = player?.querySelector("[data-feature-player-volume]");
  const playerVolumeLabel = player?.querySelector("[data-feature-player-volume-label]");
  const playerMute = player?.querySelector("[data-feature-player-mute]");
  const maxEntryLoops = 2;
  let completedEntryLoops = 0;
  let audioCtx = null;
  let analyser = null;
  let master = null;
  let effectInput = null;
  let driveInput = null;
  let driveNode = null;
  let toneFilter = null;
  let bassFilter = null;
  let midFilter = null;
  let highFilter = null;
  let dryGain = null;
  let delayNode = null;
  let delayFeedback = null;
  let delayWet = null;
  let reverbNode = null;
  let reverbWet = null;
  let limiter = null;
  let eqData = null;
  let eqFrame = 0;
  let idlePhase = 0;
  let visualImpulse = 0;
  let lastBeatPaintAt = 0;
  let lastEqSnapshot = { average: 0, bass: 0, mid: 0, high: 0 };
  const featureVolumeStorageKey = "lottomind.features.volume.v1";
  const clampVolume = (value) => Math.min(1, Math.max(0, Number(value) || 0));
  const readStoredFeatureVolume = () => {
    try {
      const stored = Number(window.localStorage.getItem(featureVolumeStorageKey));
      return Number.isFinite(stored) && stored >= 0 && stored <= 1 ? stored : 0.24;
    } catch {
      return 0.24;
    }
  };
  let featureUserVolume = readStoredFeatureVolume();
  let featureVolumeBeforeMute = featureUserVolume > 0.01 ? featureUserVolume : 0.24;
  const mediaSources = new WeakSet();
  const fxState = { drive: 0.16, reverb: 0.22, delay: 0.18, master: 0.72 };

  if (featureTrack) {
    featureTrack.volume = featureUserVolume;
    featureTrack.muted = featureUserVolume <= 0.001;
  }

  function setEqStatus(text) {
    eqStatuses.forEach((status) => {
      status.textContent = text;
    });
    document.body.dataset.featureEqStatus = text;
  }

  function makeDriveCurve(amount = 0) {
    const samples = 512;
    const curve = new Float32Array(samples);
    const drive = 1 + amount * 18;
    const normal = Math.tanh(drive);
    for (let index = 0; index < samples; index += 1) {
      const x = (index * 2) / samples - 1;
      curve[index] = Math.tanh(x * drive) / normal;
    }
    return curve;
  }

  function buildImpulseResponse(ctx) {
    const duration = 1.35;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const decay = Math.pow(1 - index / length, 2.35);
        data[index] = (Math.random() * 2 - 1) * decay;
      }
    }
    return impulse;
  }

  function syncKnobControls(label = "") {
    const labels = { drive: "Drive", reverb: "Reverb", delay: "Delay", master: "Master" };
    knobButtons.forEach((button) => {
      const name = button.dataset.fxControl;
      const value = fxState[name] ?? 0;
      button.dataset.fxValue = value.toFixed(2);
      button.dataset.fxReadout = `${Math.round(value * 100)}%`;
      button.style.setProperty("--knob-fx", value.toFixed(3));
      button.setAttribute("aria-pressed", String(value > 0.05));
      button.title = `${labels[name] || "Effect"} ${Math.round(value * 100)}%`;
    });
    document.body.dataset.featureFxDrive = fxState.drive.toFixed(2);
    document.body.dataset.featureFxReverb = fxState.reverb.toFixed(2);
    document.body.dataset.featureFxDelay = fxState.delay.toFixed(2);
    document.body.dataset.featureFxMaster = fxState.master.toFixed(2);
    if (label) setEqStatus(label);
  }

  function applyFxState(label = "") {
    if (audioCtx) {
      const now = audioCtx.currentTime;
      driveInput?.gain.setTargetAtTime(1 + fxState.drive * 2.4, now, 0.03);
      if (driveNode) {
        driveNode.curve = makeDriveCurve(fxState.drive);
        driveNode.oversample = "4x";
      }
      bassFilter?.gain.setTargetAtTime(1.2 + fxState.drive * 1.4, now, 0.04);
      midFilter?.gain.setTargetAtTime(-0.8 + fxState.reverb * 0.9, now, 0.04);
      highFilter?.gain.setTargetAtTime(0.9 + fxState.delay * 1.8 - fxState.drive * 1.1, now, 0.04);
      toneFilter?.frequency.setTargetAtTime(14200 - fxState.drive * 5200, now, 0.04);
      toneFilter?.Q.setTargetAtTime(0.45 + fxState.drive * 4.2, now, 0.04);
      delayNode?.delayTime.setTargetAtTime(0.07 + fxState.delay * 0.36, now, 0.04);
      delayFeedback?.gain.setTargetAtTime(fxState.delay * 0.42, now, 0.04);
      delayWet?.gain.setTargetAtTime(fxState.delay * 0.28, now, 0.04);
      reverbWet?.gain.setTargetAtTime(fxState.reverb * 0.36, now, 0.04);
      master?.gain.setTargetAtTime(0.32 + fxState.master * 0.78, now, 0.04);
    }
    syncKnobControls(label);
  }

  function nudgeFxControl(name) {
    if (!name || !(name in fxState)) return;
    getContext();
    const step = name === "master" ? 0.16 : 0.24;
    if (name === "master") {
      fxState.master = fxState.master >= 0.96 ? 0.48 : Math.min(1, fxState.master + step);
    } else {
      fxState[name] = fxState[name] >= 0.96 ? 0 : Math.min(1, fxState[name] + step);
    }
    const label = `${name.charAt(0).toUpperCase()}${name.slice(1)} ${Math.round(fxState[name] * 100)}%`;
    applyFxState(label);
    visualImpulse = Math.max(visualImpulse, 0.78);
    startEqRender();
  }


  function formatMediaTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function syncPlayerUi() {
    if (!featureTrack) return;
    const duration = Number.isFinite(featureTrack.duration) ? featureTrack.duration : 0;
    const progress = duration ? Math.min(1, Math.max(0, featureTrack.currentTime / duration)) : 0;
    if (player) {
      player.style.setProperty("--player-progress", progress.toFixed(3));
      player.classList.toggle("is-playing", !featureTrack.paused && !featureTrack.ended);
    }
    if (playerToggle) {
      playerToggle.innerHTML = featureTrack.paused ? "&#9654;" : "II";
      playerToggle.setAttribute("aria-pressed", String(!featureTrack.paused));
    }
    if (playerTime) {
      playerTime.textContent = `${formatMediaTime(featureTrack.currentTime)} / ${formatMediaTime(duration)}`;
    }
    if (playerSeek) {
      playerSeek.disabled = !duration;
      playerSeek.value = String(Math.round(progress * 1000));
      playerSeek.style.setProperty("--seek-progress", progress.toFixed(3));
      playerSeek.setAttribute("aria-valuetext", `${formatMediaTime(featureTrack.currentTime)} of ${formatMediaTime(duration)}`);
    }
    if (playerVolume) {
      playerVolume.value = String(Math.round(featureTrack.volume * 100));
      playerVolume.style.setProperty("--volume-progress", featureTrack.volume.toFixed(3));
    }
    if (playerVolumeLabel) {
      const prefix = featureTrack.muted || featureTrack.volume <= 0.001 ? "Muted" : "Volume";
      playerVolumeLabel.textContent = `${prefix} ${Math.round(featureTrack.volume * 100)}%`;
    }
    if (playerMute) {
      const isMuted = featureTrack.muted || featureTrack.volume <= 0.001;
      playerMute.textContent = isMuted ? "MUTE" : "VOL";
      playerMute.setAttribute("aria-pressed", String(isMuted));
      playerMute.setAttribute("aria-label", isMuted ? "Unmute Digital Static" : "Mute Digital Static");
    }
  }

  function setFeatureVolume(value, { persist = true } = {}) {
    if (!featureTrack) return 0;
    featureUserVolume = clampVolume(value);
    if (featureUserVolume > 0.01) featureVolumeBeforeMute = featureUserVolume;
    featureTrack.volume = featureUserVolume;
    featureTrack.muted = featureUserVolume <= 0.001;
    document.body.dataset.featureTrackVolume = featureUserVolume.toFixed(2);
    if (persist) {
      try {
        window.localStorage.setItem(featureVolumeStorageKey, featureUserVolume.toFixed(2));
      } catch {
        // Private browsing can block persistent storage; playback still works.
      }
    }
    syncPlayerUi();
    return featureUserVolume;
  }

  function toggleFeatureMute() {
    if (!featureTrack) return false;
    if (featureTrack.muted || featureTrack.volume <= 0.001) {
      setFeatureVolume(featureVolumeBeforeMute || 0.24);
    } else {
      featureVolumeBeforeMute = featureTrack.volume;
      featureTrack.muted = true;
      syncPlayerUi();
    }
    return featureTrack.muted;
  }

  function setBeatVars(energy = 0, bass = 0) {
    const root = document.body;
    root.classList.toggle("is-feature-beat-active", energy > 0.035 || bass > 0.035);
    root.style.setProperty("--feature-beat-energy", energy.toFixed(3));
    root.style.setProperty("--feature-beat-bass", bass.toFixed(3));
    root.style.setProperty("--feature-video-opacity-a", (0.13 + energy * 0.12).toFixed(3));
    root.style.setProperty("--feature-video-opacity-b", (0.08 + energy * 0.1).toFixed(3));
  }

  function resetBeatVars() {
    setBeatVars(0, 0);
    lastBeatPaintAt = 0;
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

    if (!effectInput) {
      effectInput = audioCtx.createGain();
      driveInput = audioCtx.createGain();
      driveNode = audioCtx.createWaveShaper();
      toneFilter = audioCtx.createBiquadFilter();
      bassFilter = audioCtx.createBiquadFilter();
      midFilter = audioCtx.createBiquadFilter();
      highFilter = audioCtx.createBiquadFilter();
      dryGain = audioCtx.createGain();
      delayNode = audioCtx.createDelay(0.8);
      delayFeedback = audioCtx.createGain();
      delayWet = audioCtx.createGain();
      reverbNode = audioCtx.createConvolver();
      reverbWet = audioCtx.createGain();
      master = audioCtx.createGain();
      limiter = audioCtx.createDynamicsCompressor();

      toneFilter.type = "lowpass";
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 150;
      midFilter.type = "peaking";
      midFilter.frequency.value = 860;
      midFilter.Q.value = 0.9;
      highFilter.type = "highshelf";
      highFilter.frequency.value = 4100;
      dryGain.gain.value = 0.92;
      delayWet.gain.value = 0;
      delayFeedback.gain.value = 0;
      reverbWet.gain.value = 0;
      reverbNode.buffer = buildImpulseResponse(audioCtx);
      limiter.threshold.value = -12;
      limiter.knee.value = 8;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.24;

      effectInput.connect(driveInput);
      driveInput.connect(driveNode);
      driveNode.connect(toneFilter);
      toneFilter.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(highFilter);
      highFilter.connect(dryGain);
      dryGain.connect(master);
      highFilter.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(delayWet);
      delayWet.connect(master);
      highFilter.connect(reverbNode);
      reverbNode.connect(reverbWet);
      reverbWet.connect(master);
      master.connect(limiter);
      limiter.connect(analyser);
      applyFxState();
    }

    return audioCtx;
  }

  function getOutput() {
    return getContext() ? effectInput : null;
  }

  function connectPlayableMedia(media) {
    if (!media || mediaSources.has(media)) return;
    if (media !== featureTrack && (media.muted || media.volume === 0)) return;
    const ctx = getContext();
    if (!ctx || !analyser) return;

    try {
      const output = getOutput();
      if (!output) return;
      const source = ctx.createMediaElementSource(media);
      source.connect(output);
      mediaSources.add(media);
      if (media === featureTrack) document.body.dataset.featureTrackConnected = "true";
      setEqStatus("Media linked");
    } catch {
      mediaSources.add(media);
    }
  }

  function scanPageMedia() {
    if (document.hidden) return;
    document.querySelectorAll("audio, video").forEach((media) => {
      if (!media.paused && !media.muted && media.volume > 0) connectPlayableMedia(media);
    });
  }


  async function startFeatureTrack({ restart = false, entry = false } = {}) {
    if (!featureTrack) return false;
    const ctx = getContext();
    if (!ctx) return false;
    connectPlayableMedia(featureTrack);
    if (restart) {
      completedEntryLoops = 0;
      try {
        featureTrack.currentTime = 0;
      } catch {
        // Metadata may not be ready yet.
      }
    }
    try {
      if (ctx.state === "suspended") await ctx.resume();
    } catch {
      // Browsers can require a tap before resuming audio.
    }
    try {
      featureTrack.loop = false;
      const targetVolume = entry ? Math.min(featureUserVolume, 0.16) : featureUserVolume;
      featureTrack.volume = targetVolume;
      document.body.dataset.featureTrackVolume = targetVolume.toFixed(2);
      window.LMAudioMix?.claim?.(featureTrack);
      await featureTrack.play();
      setEqStatus(entry ? "Digital Static" : "Playing");
      startEqRender();
      syncPlayerUi();
      return true;
    } catch {
      setEqStatus("Tap Play");
      syncPlayerUi();
      return false;
    }
  }
  function startEqRender() {
    if (eqFrame || !eqBars.length) return;

    const render = () => {
      if (document.hidden) {
        eqFrame = 0;
        resetBeatVars();
        return;
      }

      let average = 0;
      let bass = 0;
      let mid = 0;
      let high = 0;

      if (analyser && eqData) {
        analyser.getByteFrequencyData(eqData);

        const nyquist = audioCtx ? audioCtx.sampleRate / 2 : 22050;
        const readBand = (lowHz, highHz) => {
          const lowIndex = Math.max(0, Math.floor((lowHz / nyquist) * eqData.length));
          const highIndex = Math.min(eqData.length - 1, Math.ceil((highHz / nyquist) * eqData.length));
          let total = 0;
          let count = 0;
          for (let index = lowIndex; index <= highIndex; index += 1) {
            total += eqData[index] / 255;
            count += 1;
          }
          return count ? total / count : 0;
        };

        for (let i = 0; i < eqData.length; i += 1) {
          average += eqData[i] / 255;
        }
        average /= eqData.length;
        bass = readBand(38, 180);
        mid = readBand(220, 1800);
        high = readBand(2200, 12000);
      }

      lastEqSnapshot = { average, bass, mid, high };
      idlePhase += 0.052;
      const idle = 0.1 + Math.sin(idlePhase) * 0.035;
      const energy = Math.max(average, idle, visualImpulse * 0.68);
      const trackIsLive = featureTrack && !featureTrack.paused && !featureTrack.ended;
      const nowMs = Date.now();
      const shouldPaintFullPageBeat =
        !trackIsLive ||
        visualImpulse > 0.72 ||
        nowMs - lastBeatPaintAt > 84;
      if (shouldPaintFullPageBeat) {
        setBeatVars(trackIsLive ? Math.min(1, average * 2.1) : 0, trackIsLive ? Math.min(1, bass * 1.7) : 0);
        lastBeatPaintAt = nowMs;
      }
      syncPlayerUi();

      eqBars.forEach((bar, index) => {
        const bandSeed = index / Math.max(1, eqBars.length - 1);
        let analyzed = 0;
        if (analyser && eqData && audioCtx) {
          const nyquist = audioCtx.sampleRate / 2;
          const lowHz = 42 * Math.pow(12000 / 42, bandSeed);
          const highHz = 42 * Math.pow(12000 / 42, Math.min(1, bandSeed + 1 / Math.max(1, eqBars.length)));
          const lowIndex = Math.max(0, Math.floor((lowHz / nyquist) * eqData.length));
          const highIndex = Math.min(eqData.length - 1, Math.ceil((highHz / nyquist) * eqData.length));
          let bandTotal = 0;
          let bandCount = 0;
          for (let bandIndex = lowIndex; bandIndex <= highIndex; bandIndex += 1) {
            bandTotal += eqData[bandIndex] / 255;
            bandCount += 1;
          }
          analyzed = bandCount ? bandTotal / bandCount : 0;
        }
        const pulse = Math.sin(idlePhase + index * 0.76) * 0.08;
        const hit = visualImpulse * (0.18 + ((index % 5) / 5) * 0.22);
        const level = Math.max(0.1, Math.min(1, analyzed * 0.92 + energy * 0.42 + hit + pulse));
        bar.style.setProperty("--eq-level", level.toFixed(3));
      });

      eqPanels.forEach((panel) => {
        panel.style.setProperty("--eq-bass", Math.max(bass, idle).toFixed(3));
        panel.style.setProperty("--eq-mid", Math.max(mid, idle * 0.9).toFixed(3));
        panel.style.setProperty("--eq-high", Math.max(high, idle * 0.85).toFixed(3));
        panel.dataset.eqEnergy = average.toFixed(3);
        panel.dataset.eqBass = bass.toFixed(3);
        panel.dataset.eqMid = mid.toFixed(3);
        panel.dataset.eqHigh = high.toFixed(3);
      });

      knobButtons.forEach((button, index) => {
        const band = index === 0 ? bass : index === 1 ? mid : index === 2 ? high : energy;
        const motion = Math.max(band, visualImpulse * 0.64, idle * (1 + index * 0.08));
        button.style.setProperty("--knob-energy", motion.toFixed(3));
        button.style.setProperty("--knob-rotation", `${Math.round(-74 + motion * 168 + index * 11)}deg`);
      });

      visualImpulse *= 0.93;
      if (!trackIsLive && visualImpulse < 0.025) {
        eqFrame = 0;
        resetBeatVars();
        return;
      }
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

    osc.type = "sine";
    osc.frequency.setValueAtTime(notes[seed % notes.length], now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(window.LMAudioMix?.levels.ui ?? 0.022, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.24);
    visualImpulse = Math.max(visualImpulse, 0.62);
    startEqRender();
  }

  if (document.body.classList.contains("features-cinematic-page")) {
    document.querySelectorAll("button:not(.piano-key):not([data-feature-player-control]), .rail-cards a, .feature-cta").forEach((el, index) => {
      el.addEventListener("pointerdown", () => playTone(index), { passive: true });
    });
  }

  knobButtons.forEach((button) => {
    button.addEventListener("click", () => nudgeFxControl(button.dataset.fxControl));
    button.addEventListener("keydown", (event) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      nudgeFxControl(button.dataset.fxControl);
    });
  });
  syncKnobControls();

  window.LMFeatureAudio = {
    getState() {
      return {
        contextState: audioCtx?.state || "not-started",
        featureTrackConnected: featureTrack ? mediaSources.has(featureTrack) : false,
        featureTrackPaused: featureTrack ? featureTrack.paused : true,
        featureTrackVolume: featureTrack ? featureTrack.volume : 0,
        featureTrackMuted: featureTrack ? featureTrack.muted : false,
        preferredVolume: featureUserVolume,
        effects: { ...fxState },
        eq: { ...lastEqSnapshot }
      };
    },
    setEffect(name, value) {
      if (!(name in fxState)) return false;
      fxState[name] = Math.max(0, Math.min(1, Number(value) || 0));
      applyFxState(`${name.charAt(0).toUpperCase()}${name.slice(1)} ${Math.round(fxState[name] * 100)}%`);
      visualImpulse = Math.max(visualImpulse, 0.78);
      startEqRender();
      return true;
    },
    setVolume(value) {
      setFeatureVolume(value);
      return featureUserVolume;
    },
    toggleMute() {
      return toggleFeatureMute();
    }
  };

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
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && eqFrame) {
      window.cancelAnimationFrame(eqFrame);
      eqFrame = 0;
      resetBeatVars();
      return;
    }
    if (featureTrack && !featureTrack.paused) startEqRender();
  });
  const scanTimer = window.setInterval(scanPageMedia, 2200);
  startEqRender();


  if (featureTrack) {
    playerToggle?.addEventListener("click", async () => {
      if (featureTrack.paused) {
        await startFeatureTrack({ restart: featureTrack.ended || completedEntryLoops >= maxEntryLoops });
      } else {
        featureTrack.pause();
        resetBeatVars();
        setEqStatus("Paused");
        syncPlayerUi();
      }
    });

    playerPrev?.addEventListener("click", () => {
      try {
        featureTrack.currentTime = Math.max(0, featureTrack.currentTime - 15);
      } catch {
        // Metadata may not be ready yet.
      }
      syncPlayerUi();
    });

    playerNext?.addEventListener("click", () => {
      const duration = Number.isFinite(featureTrack.duration) ? featureTrack.duration : featureTrack.currentTime + 15;
      try {
        featureTrack.currentTime = Math.min(duration, featureTrack.currentTime + 15);
      } catch {
        // Metadata may not be ready yet.
      }
      syncPlayerUi();
    });

    playerSeek?.addEventListener("input", () => {
      const duration = Number.isFinite(featureTrack.duration) ? featureTrack.duration : 0;
      if (!duration) return;
      try {
        featureTrack.currentTime = duration * (Number(playerSeek.value) / 1000);
      } catch {
        // Media can reject seeks until metadata is available.
      }
      syncPlayerUi();
    });

    playerVolume?.addEventListener("input", () => {
      setFeatureVolume(Number(playerVolume.value) / 100);
      setEqStatus(`Volume ${Math.round(featureUserVolume * 100)}%`);
    });

    playerMute?.addEventListener("click", () => {
      const muted = toggleFeatureMute();
      setEqStatus(muted ? "Muted" : `Volume ${Math.round(featureTrack.volume * 100)}%`);
    });

    featureTrack.addEventListener("ended", () => {
      completedEntryLoops += 1;
      resetBeatVars();
      if (completedEntryLoops < maxEntryLoops) {
        try {
          featureTrack.currentTime = 0;
        } catch {
          // Metadata may not be ready yet.
        }
        startFeatureTrack({ entry: true });
        return;
      }
      completedEntryLoops = 0;
      try {
        featureTrack.currentTime = 0;
      } catch {
        // Metadata may not be ready yet.
      }
      setEqStatus("Complete");
      syncPlayerUi();
    });

    featureTrack.addEventListener("play", () => {
      connectPlayableMedia(featureTrack);
      setEqStatus("Playing");
      startEqRender();
      syncPlayerUi();
    });
    featureTrack.addEventListener("pause", () => {
      if (!featureTrack.ended) {
        resetBeatVars();
        setEqStatus("Paused");
        syncPlayerUi();
      }
    });
    featureTrack.addEventListener("loadedmetadata", syncPlayerUi);
    featureTrack.addEventListener("durationchange", syncPlayerUi);
    featureTrack.addEventListener("timeupdate", syncPlayerUi);
    featureTrack.addEventListener("seeking", syncPlayerUi);
    featureTrack.addEventListener("volumechange", syncPlayerUi);
    setFeatureVolume(featureUserVolume, { persist: false });
    syncPlayerUi();
    // Keep playback user-initiated. A deferred autoplay attempt can remain pending
    // until the first click, then restart the track underneath the player controls.
  }
  const pianos = Array.from(document.querySelectorAll("[data-playable-piano]"));
  if (!pianos.length) return;

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
    key.setAttribute("aria-pressed", "true");
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
    voice.key.setAttribute("aria-pressed", "false");
    activeVoices.delete(pointerId);
  }

  pianos.forEach((piano) => {
    piano.querySelectorAll(".piano-key").forEach((key) => {
      key.setAttribute("aria-pressed", "false");
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
  });

  window.addEventListener("pagehide", () => {
    window.clearInterval(scanTimer);
    if (eqFrame) window.cancelAnimationFrame(eqFrame);
  });
})();
