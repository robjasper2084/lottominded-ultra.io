(() => {
  const root = document.querySelector(".lm-live-page");
  if (!root) return;

  document.querySelectorAll("[data-shadow-ops-modal], .shadow-ops-modal").forEach((modal) => modal.remove());
  document.querySelectorAll("[data-shadow-ops-open], .shadow-ops-trigger").forEach((trigger) => trigger.remove());
  document.querySelectorAll("[data-stream-startup-audio], .stream-startup-audio").forEach((modal) => modal.remove());
  document.body.classList.remove("has-shadow-ops-modal", "has-shadow-ops-frame-expanded", "has-stream-startup-audio");

  const liveStart = Date.now() - (12 * 60 + 45) * 1000;
  const started = document.querySelector(".started");
  const padButtons = document.querySelectorAll(".lm-category-grid button, .lm-interactions button, .lm-synth-tabs button");
  const chatFeed = document.querySelector("[data-live-chat-feed]");
  const chatForm = document.querySelector("[data-live-chat-form]");
  const chatInput = document.querySelector("[data-live-chat-input]");
  const livePlayer = document.querySelector("[data-live-player]");
  const livePlayerAudio = livePlayer?.querySelector("[data-live-player-audio]");
  const livePlayerToggle = livePlayer?.querySelector("[data-live-player-toggle]");
  const livePlayerPrev = livePlayer?.querySelector("[data-live-player-prev]");
  const livePlayerNext = livePlayer?.querySelector("[data-live-player-next]");
  const livePlayerTime = livePlayer?.querySelector("[data-live-player-time]");
  const livePlayerWave = livePlayer?.querySelector(".now-wave");
  const shadowOpsModal = document.querySelector("[data-shadow-ops-modal]");
  const shadowOpsOpeners = document.querySelectorAll("[data-shadow-ops-open]");
  const shadowOpsCloseButtons = shadowOpsModal?.querySelectorAll("[data-shadow-ops-close]");
  const shadowOpsStart = shadowOpsModal?.querySelector("[data-shadow-ops-start]");
  const shadowOpsStatus = shadowOpsModal?.querySelector("[data-shadow-ops-status]");
  const shadowOpsFrameShell = shadowOpsModal?.querySelector(".shadow-ops-frame-shell");
  const shadowOpsFrame = shadowOpsModal?.querySelector("[data-shadow-ops-frame]");
  const shadowOpsFullscreen = shadowOpsModal?.querySelector("[data-shadow-ops-fullscreen]");
  const twitchLiveCard = document.querySelector("#twitch-live");
  const liveBallpassCanvas = document.querySelector("[data-live-ballpass-bg]");
  const previewIframes = Array.from(document.querySelectorAll(".event-card .video-thumb iframe"));
  const decorativeVideos = Array.from(document.querySelectorAll("video")).filter((video) => (
    !video.closest("#twitch-live") &&
    !video.closest("[data-lm-page-transition]") &&
    video.hasAttribute("autoplay")
  ));
  let liveAudioContext = null;
  let liveAudioAnalyser = null;
  let liveAudioData = null;
  let liveAudioSource = null;
  let liveWaveFrame = null;
  let shadowOpsShouldResumeLiveAudio = false;
  let shadowOpsLiveAudioVolume = 0.56;
  const chatBots = [
    {
      name: "DetroitPulse",
      accent: "#29f7ff",
      lines: [
        "That section feels like late-night Woodward Avenue in neon.",
        "I hear the pocket. The drummer is leaving space for the horns.",
        "That clip belongs on the front rail. Clean Detroit energy."
      ],
      jazz: "Jazz-Off Detroit energy is all over this room. That archive feels alive.",
      hype: "Signal boosted. The whole stage just lit up."
    },
    {
      name: "HarmonyAI",
      accent: "#ff4fd8",
      lines: [
        "The harmony is warm, but the visual deck keeps it futuristic.",
        "I would tag this as live soul, archive glow, and midnight brass.",
        "The chat is catching the right notes tonight."
      ],
      jazz: "For jazz, I am hearing story first, solo second, crowd memory third.",
      hype: "That is a strong moment. Save it for the replay shelf."
    },
    {
      name: "StageMod",
      accent: "#ffe071",
      lines: [
        "Room check complete. Keep it respectful and enjoy the stream.",
        "Featured videos are live in the event cards now.",
        "Replay crew, remember to hit the Watch Live button when the stage opens."
      ],
      jazz: "Jazz-Off Detroit links are queued in the featured cards.",
      hype: "Copy that. I am marking this as a highlight."
    },
    {
      name: "BassAlchemy",
      accent: "#5eff9d",
      lines: [
        "The low end is sitting right under the keys.",
        "That groove has a clean bounce. Nothing crowded.",
        "I am watching the waveform. The pocket is steady."
      ],
      jazz: "The bass walk on those Jazz-Off Detroit clips is doing real work.",
      hype: "That hit had weight. Crowd felt it."
    },
    {
      name: "LottoMindAI",
      accent: "#8a5cff",
      lines: [
        "Creative signal logged. Entertainment-only, no predictions.",
        "The stream note is saved as mood, tempo, and scene energy.",
        "I can turn that moment into a prompt, recap, or replay tag."
      ],
      jazz: "Jazz archive signal detected: venue, player, phrase, and crowd feel.",
      hype: "Signal recorded. That one is a clean creative seed."
    }
  ];
  let botCursor = 0;

  function two(value) {
    return String(value).padStart(2, "0");
  }

  function tickLiveTimer() {
    if (!started) return;
    const elapsed = Math.floor((Date.now() - liveStart) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    started.innerHTML = `<span></span> Started ${two(hours)}:${two(minutes)}:${two(seconds)} ago`;
  }

  function playUiTone(seed = 0) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = [261.63, 293.66, 329.63, 392, 440, 523.25][seed % 6];

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
    window.setTimeout(() => ctx.close?.(), 300);
  }

  padButtons.forEach((button, index) => {
    button.addEventListener("click", () => playUiTone(index));
  });

  function formatTrackTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const safeSeconds = Math.floor(seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    if (hours > 0) return `${hours}:${two(minutes)}:${two(secs)}`;
    return `${minutes}:${two(secs)}`;
  }

  function updateLivePlayer() {
    if (!livePlayer || !livePlayerAudio || !livePlayerToggle) return;
    const isPlaying = !livePlayerAudio.paused && !livePlayerAudio.ended;
    livePlayer.classList.toggle("is-playing", isPlaying);
    livePlayerToggle.textContent = isPlaying ? "II" : "\u25b6";
    livePlayerToggle.setAttribute("aria-label", isPlaying ? "Pause live mix" : "Play live mix");
    livePlayerToggle.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    if (livePlayerTime) {
      livePlayerTime.textContent = `${formatTrackTime(livePlayerAudio.currentTime)} / ${formatTrackTime(livePlayerAudio.duration)}`;
    }
  }

  function resetLiveWave() {
    if (!livePlayerWave) return;
    livePlayerWave.style.setProperty("--live-energy", "0");
    livePlayerWave.style.setProperty("--live-bass", "0");
    livePlayerWave.style.setProperty("--live-mid", "0");
    livePlayerWave.style.setProperty("--live-treble", "0");
    livePlayerWave.style.setProperty("--live-bass-x", "18%");
    livePlayerWave.style.setProperty("--live-treble-x", "70%");
    livePlayerWave.style.setProperty("--live-bass-alpha", ".12");
    livePlayerWave.style.setProperty("--live-mid-alpha", ".12");
    livePlayerWave.style.setProperty("--live-treble-alpha", ".12");
    livePlayerWave.style.setProperty("--live-wave-width", "100%");
    livePlayerWave.style.setProperty("--live-wave-height", "100%");
    livePlayerWave.style.setProperty("--live-wave-y", "0px");
    livePlayerWave.style.setProperty("--live-wave-scale", "1");
    livePlayerWave.style.setProperty("--live-saturate", "1");
    livePlayerWave.style.setProperty("--live-brightness", ".95");
    livePlayerWave.style.setProperty("--live-bar-opacity", ".24");
    livePlayerWave.style.setProperty("--live-bar-scale", ".82");
    livePlayerWave.style.setProperty("--live-sweep-opacity", ".32");
    livePlayerWave.style.setProperty("--live-sweep-x", "-44%");
    livePlayerWave.style.setProperty("--live-glint-width", "22%");
    livePlayerWave.style.setProperty("--live-glint-opacity", ".2");
    livePlayerWave.style.setProperty("--live-glow-size", "14px");
    livePlayerWave.style.setProperty("--live-glow-alpha", ".18");
    livePlayerWave.style.setProperty("--live-inner-glow-size", "12px");
    livePlayerWave.style.setProperty("--live-inner-glow-alpha", ".15");
    livePlayerWave.style.setProperty("--live-pulse-speed", "1.15s");
    livePlayerWave.style.setProperty("--wave-back-shift", "0px");
    livePlayerWave.style.setProperty("--wave-glint-shift", "0px");
  }

  function averageBand(data, start, end) {
    let total = 0;
    const safeEnd = Math.min(end, data.length);
    for (let index = start; index < safeEnd; index += 1) total += data[index];
    return safeEnd > start ? total / ((safeEnd - start) * 255) : 0;
  }

  function renderLiveWave() {
    if (!liveAudioAnalyser || !liveAudioData || !livePlayerWave) return;
    liveAudioAnalyser.getByteFrequencyData(liveAudioData);

    const bass = averageBand(liveAudioData, 1, 8);
    const mid = averageBand(liveAudioData, 8, 36);
    const treble = averageBand(liveAudioData, 36, 96);
    const energy = Math.min(1, bass * 0.48 + mid * 0.34 + treble * 0.24);

    livePlayerWave.style.setProperty("--live-energy", energy.toFixed(3));
    livePlayerWave.style.setProperty("--live-bass", bass.toFixed(3));
    livePlayerWave.style.setProperty("--live-mid", mid.toFixed(3));
    livePlayerWave.style.setProperty("--live-treble", treble.toFixed(3));
    const waveShift = Math.round((performance.now() / 18) % 160);
    livePlayerWave.style.setProperty("--wave-shift", `${waveShift}px`);
    livePlayerWave.style.setProperty("--wave-back-shift", `${waveShift * -1}px`);
    livePlayerWave.style.setProperty("--wave-glint-shift", `${Math.round(waveShift * 0.75)}px`);
    livePlayerWave.style.setProperty("--live-bass-x", `${Math.round(18 + bass * 38)}%`);
    livePlayerWave.style.setProperty("--live-treble-x", `${Math.round(70 - treble * 24)}%`);
    livePlayerWave.style.setProperty("--live-bass-alpha", (0.12 + bass * 0.32).toFixed(3));
    livePlayerWave.style.setProperty("--live-mid-alpha", (0.12 + mid * 0.38).toFixed(3));
    livePlayerWave.style.setProperty("--live-treble-alpha", (0.12 + treble * 0.5).toFixed(3));
    livePlayerWave.style.setProperty("--live-wave-width", `${Math.round(100 + energy * 90)}%`);
    livePlayerWave.style.setProperty("--live-wave-height", `${Math.round(100 + mid * 80)}%`);
    livePlayerWave.style.setProperty("--live-wave-y", `${(bass * -3).toFixed(2)}px`);
    livePlayerWave.style.setProperty("--live-wave-scale", (1 + energy * 0.18).toFixed(3));
    livePlayerWave.style.setProperty("--live-saturate", (1 + mid * 0.7).toFixed(3));
    livePlayerWave.style.setProperty("--live-brightness", (0.95 + energy * 0.55).toFixed(3));
    livePlayerWave.style.setProperty("--live-bar-opacity", (0.24 + energy * 0.62).toFixed(3));
    livePlayerWave.style.setProperty("--live-bar-scale", (0.82 + bass * 0.7).toFixed(3));
    livePlayerWave.style.setProperty("--live-sweep-opacity", (0.32 + energy * 0.48).toFixed(3));
    livePlayerWave.style.setProperty("--live-sweep-x", `${Math.round(-44 + energy * 52)}%`);
    livePlayerWave.style.setProperty("--live-glint-width", `${Math.round(22 + bass * 34)}%`);
    livePlayerWave.style.setProperty("--live-glint-opacity", (0.2 + energy * 0.58).toFixed(3));
    livePlayerWave.style.setProperty("--live-glow-size", `${Math.round(14 + energy * 28)}px`);
    livePlayerWave.style.setProperty("--live-glow-alpha", (0.18 + energy * 0.24).toFixed(3));
    livePlayerWave.style.setProperty("--live-inner-glow-size", `${Math.round(12 + mid * 22)}px`);
    livePlayerWave.style.setProperty("--live-inner-glow-alpha", (0.15 + mid * 0.24).toFixed(3));
    livePlayerWave.style.setProperty("--live-pulse-speed", `${(1.15 - energy * 0.45).toFixed(2)}s`);

    if (!livePlayerAudio?.paused && !livePlayerAudio?.ended) {
      liveWaveFrame = window.requestAnimationFrame(renderLiveWave);
    } else {
      liveWaveFrame = null;
      resetLiveWave();
    }
  }

  function startLiveWave() {
    if (!liveAudioAnalyser || !liveAudioData || liveWaveFrame) return;
    liveWaveFrame = window.requestAnimationFrame(renderLiveWave);
  }

  function setupLiveAnalyser() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || !livePlayerAudio || liveAudioAnalyser) return;
    liveAudioContext = liveAudioContext || new AudioCtx();
    liveAudioAnalyser = liveAudioContext.createAnalyser();
    liveAudioAnalyser.fftSize = 256;
    liveAudioAnalyser.smoothingTimeConstant = 0.78;
    liveAudioData = new Uint8Array(liveAudioAnalyser.frequencyBinCount);
    liveAudioSource = liveAudioContext.createMediaElementSource(livePlayerAudio);
    liveAudioSource.connect(liveAudioAnalyser);
    liveAudioAnalyser.connect(liveAudioContext.destination);
  }

  async function startLivePlayer(options = {}) {
    if (!livePlayerAudio) return false;
    try {
      livePlayerAudio.volume = options.volume ?? 0.72;
      if (options.restart) livePlayerAudio.currentTime = 0;
      const playPromise = livePlayerAudio.play();
      const playStarted = await Promise.race([
        playPromise.then(() => true).catch(() => false),
        new Promise((resolve) => window.setTimeout(() => resolve(false), options.timeout ?? 900))
      ]);
      if (!playStarted) throw new Error("Playback was blocked or delayed.");
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      if (livePlayerAudio.paused || livePlayerAudio.ended) throw new Error("Playback did not stay active.");
      if (!options.deferAnalyser) {
        setupLiveAnalyser();
        await Promise.race([
          liveAudioContext?.resume?.().catch(() => {}),
          new Promise((resolve) => window.setTimeout(resolve, 500))
        ]);
      }
      livePlayer?.classList.remove("needs-user-audio");
      startLiveWave();
      updateLivePlayer();
      return true;
    } catch {
      livePlayer?.classList.add("needs-user-audio");
      updateLivePlayer();
      return false;
    }
  }

  async function toggleLivePlayer() {
    if (!livePlayerAudio) return;
    if (livePlayerAudio.paused || livePlayerAudio.ended) {
      await startLivePlayer({ restart: livePlayerAudio.ended, volume: 0.72 });
    } else {
      livePlayerAudio.pause();
      resetLiveWave();
    }
    updateLivePlayer();
  }

  function pauseLiveAudioForShadowOps() {
    if (!livePlayerAudio || livePlayerAudio.paused || livePlayerAudio.ended) return;
    shadowOpsShouldResumeLiveAudio = true;
    shadowOpsLiveAudioVolume = livePlayerAudio.volume || 0.56;
    livePlayerAudio.pause();
    resetLiveWave();
    updateLivePlayer();
    livePlayer?.setAttribute("data-shadow-ops-audio", "paused");
  }

  async function resumeLiveAudioAfterShadowOps() {
    if (!livePlayerAudio) return;
    if (!shadowOpsShouldResumeLiveAudio) {
      livePlayer?.removeAttribute("data-shadow-ops-audio");
      return;
    }

    shadowOpsShouldResumeLiveAudio = false;
    livePlayer?.removeAttribute("data-shadow-ops-audio");
    if (!livePlayerAudio.paused && !livePlayerAudio.ended) return;

    const restored = await startLivePlayer({
      restart: livePlayerAudio.ended,
      volume: shadowOpsLiveAudioVolume,
      timeout: 1200
    });
    if (!restored) closeStreamStartupPrompt();
  }

  function handleShadowOpsGameEngaged() {
    if (!shadowOpsModal?.classList.contains("is-open")) return;
    pauseLiveAudioForShadowOps();
  }

  function closeStreamStartupPrompt() {
    document.body.classList.remove("has-stream-startup-audio");
  }

  async function startStreamOpenAudio(options = {}) {
    if (!livePlayerAudio?.hasAttribute("data-stream-open-audio")) return;
    livePlayer?.setAttribute("data-stream-open-state", "attempting");
    const started = await startLivePlayer({
      restart: true,
      volume: options.volume ?? 0.56,
      deferAnalyser: !options.userGesture
    });
    if (started) {
      livePlayer?.setAttribute("data-stream-open-state", "playing");
      closeStreamStartupPrompt();
      return;
    }
    livePlayer?.setAttribute("data-stream-open-state", "blocked");
    closeStreamStartupPrompt();
  }

  function scheduleStreamOpenAudio() {
    if (!livePlayerAudio?.hasAttribute("data-stream-open-audio")) return;
    if (livePlayerAudio.dataset.streamOpenReady === "true") return;
    livePlayerAudio.dataset.streamOpenReady = "true";
    const run = () => window.setTimeout(() => startStreamOpenAudio({ volume: 0.56 }), 420);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }
  }

  function openShadowOpsModal() {
    if (!shadowOpsModal) return;
    shadowOpsModal.classList.add("is-open");
    shadowOpsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-shadow-ops-modal");
    loadShadowOpsGame();
    if (shadowOpsStatus) shadowOpsStatus.textContent = "Game feed live";
    window.setTimeout(() => shadowOpsModal.querySelector("button")?.focus(), 20);
  }

  function closeShadowOpsModal() {
    if (!shadowOpsModal) return;
    if (isShadowOpsFullscreen()) {
      exitShadowOpsFullscreen();
    }
    shadowOpsModal.classList.remove("is-open");
    shadowOpsModal.classList.remove("is-briefing");
    shadowOpsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-shadow-ops-modal");
    unloadShadowOpsGame();
    resumeLiveAudioAfterShadowOps();
    if (shadowOpsStatus) shadowOpsStatus.textContent = "Standby";
  }

  function loadShadowOpsGame() {
    if (!shadowOpsFrame) return;
    const gameSource = shadowOpsFrame.dataset.src;
    if (gameSource && shadowOpsFrame.getAttribute("src") !== gameSource) {
      shadowOpsFrame.setAttribute("src", gameSource);
    }
  }

  function unloadShadowOpsGame() {
    if (!shadowOpsFrame) return;
    shadowOpsFrame.removeAttribute("src");
  }

  function currentFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isShadowOpsFullscreen() {
    const activeElement = currentFullscreenElement();
    return Boolean(
      shadowOpsFrameShell?.classList.contains("is-expanded") ||
      (activeElement && (activeElement === shadowOpsFrameShell || activeElement === shadowOpsFrame))
    );
  }

  function setShadowOpsFrameExpanded(isExpanded) {
    shadowOpsFrameShell?.classList.toggle("is-expanded", isExpanded);
    document.body.classList.toggle("has-shadow-ops-frame-expanded", isExpanded);
  }

  function updateShadowOpsFullscreenState() {
    if (!shadowOpsFullscreen) return;
    const isActive = isShadowOpsFullscreen();
    shadowOpsFullscreen.classList.toggle("is-active", isActive);
    shadowOpsFullscreen.textContent = isActive ? "Exit Full Screen" : "Full Screen";
    shadowOpsFullscreen.setAttribute("aria-pressed", String(isActive));
    shadowOpsFullscreen.setAttribute("aria-label", isActive ? "Exit 2084 Static WAV full screen" : "Open 2084 Static WAV full screen");
  }

  async function enterShadowOpsFullscreen() {
    if (!shadowOpsFrameShell) return;
    loadShadowOpsGame();
    pauseLiveAudioForShadowOps();
    shadowOpsModal?.classList.add("is-briefing");
    if (shadowOpsStatus) shadowOpsStatus.textContent = "Full screen";

    try {
      if (shadowOpsFrameShell.requestFullscreen) {
        await shadowOpsFrameShell.requestFullscreen();
      } else if (shadowOpsFrameShell.webkitRequestFullscreen) {
        await shadowOpsFrameShell.webkitRequestFullscreen();
      } else {
        setShadowOpsFrameExpanded(true);
      }
      if (!currentFullscreenElement()) {
        setShadowOpsFrameExpanded(true);
      }
      updateShadowOpsFullscreenState();
      shadowOpsFrame?.focus();
      shadowOpsFrame?.contentWindow?.focus?.();
    } catch (error) {
      setShadowOpsFrameExpanded(true);
      updateShadowOpsFullscreenState();
      if (shadowOpsStatus) shadowOpsStatus.textContent = "Full screen";
    }
  }

  async function exitShadowOpsFullscreen() {
    if (!isShadowOpsFullscreen()) {
      updateShadowOpsFullscreenState();
      return;
    }
    try {
      if (shadowOpsFrameShell?.classList.contains("is-expanded")) {
        setShadowOpsFrameExpanded(false);
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    } catch (error) {
      if (shadowOpsStatus) shadowOpsStatus.textContent = "Exit full screen blocked";
    }
    updateShadowOpsFullscreenState();
    if (shadowOpsStatus && shadowOpsModal?.classList.contains("is-open")) {
      shadowOpsStatus.textContent = shadowOpsModal.classList.contains("is-briefing") ? "Pilot control" : "Game feed live";
    }
  }

  function toggleShadowOpsFullscreen() {
    if (isShadowOpsFullscreen()) {
      exitShadowOpsFullscreen();
      return;
    }
    enterShadowOpsFullscreen();
  }

  function scheduleShadowOpsModal() {
    if (!shadowOpsModal) return;
    window.setTimeout(() => {
      openShadowOpsModal();
    }, 1600);
  }

  function setTwitchFocusMode(isFocused) {
    document.body.classList.toggle("is-twitch-focused", isFocused);

    decorativeVideos.forEach((video) => {
      if (isFocused) {
        if (!video.paused) {
          video.dataset.twitchPaused = "true";
          video.pause();
        }
        return;
      }
      if (video.dataset.twitchPaused === "true") {
        video.dataset.twitchPaused = "false";
        video.play?.().catch(() => {});
      }
    });

    previewIframes.forEach((frame) => {
      if (isFocused) {
        const currentSrc = frame.getAttribute("src");
        if (currentSrc) {
          frame.dataset.twitchPausedSrc = currentSrc;
          frame.removeAttribute("src");
        }
        return;
      }
      if (!frame.getAttribute("src") && frame.dataset.twitchPausedSrc) {
        frame.setAttribute("src", frame.dataset.twitchPausedSrc);
      }
    });
  }

  function setupTwitchStreamStability() {
    if (!twitchLiveCard) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const active = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.18);
      setTwitchFocusMode(active);
    }, { rootMargin: "0px 0px -10% 0px", threshold: [0, 0.18, 0.36] });

    observer.observe(twitchLiveCard);
    window.addEventListener("pagehide", () => setTwitchFocusMode(false), { once: true });
  }

  function setupLiveLazyEmbeds() {
    const frames = Array.from(document.querySelectorAll("iframe[data-src]")).filter((frame) => {
      if (frame.dataset.liveLazy === "off") return false;
      const source = frame.getAttribute("src") || frame.dataset.src || "";
      return /(youtube|youtu\.be|twitch\.tv|games\/|shadow-ops|gothtechnology)/i.test(source);
    });
    if (!frames.length) return;

    const loadMargin = 0;
    let refreshFrame = 0;

    const isNearViewport = (frame, margin) => {
      const rect = frame.getBoundingClientRect();
      return rect.bottom >= -margin && rect.top <= window.innerHeight + margin;
    };

    const isProtectedFrame = (frame) => {
      if (frame.closest(".shadow-ops-modal.is-open")) return true;
      if (document.activeElement === frame) return true;
      return Boolean(
        frame.closest("#twitch-live") &&
        document.body.classList.contains("is-twitch-focused") &&
        isNearViewport(frame, 0)
      );
    };

    const loadFrame = (frame) => {
      if (document.hidden) return;
      const source = frame.dataset.src;
      if (!source || frame.getAttribute("src") === source) return;
      frame.setAttribute("src", source);
      frame.dataset.liveLazyLoaded = "true";
    };

    const unloadFrame = (frame) => {
      if (isProtectedFrame(frame)) return;
      const currentSource = frame.getAttribute("src");
      if (!currentSource) return;
      if (!frame.dataset.src) frame.dataset.src = currentSource;
      frame.removeAttribute("src");
      frame.dataset.liveLazyLoaded = "false";
    };

    const refreshEmbeds = () => {
      refreshFrame = 0;
      frames.forEach((frame) => {
        if (isNearViewport(frame, loadMargin)) {
          loadFrame(frame);
          return;
        }
        unloadFrame(frame);
      });
    };

    const scheduleRefresh = () => {
      if (refreshFrame) return;
      refreshFrame = window.requestAnimationFrame(refreshEmbeds);
    };

    frames.forEach((frame) => {
      if (frame.getAttribute("src") && !isNearViewport(frame, loadMargin) && !isProtectedFrame(frame)) {
        unloadFrame(frame);
      }
      frame.setAttribute("loading", "lazy");
      frame.dataset.liveLazyManaged = "true";
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadFrame(entry.target);
          } else {
            unloadFrame(entry.target);
          }
        });
      }, { rootMargin: `${loadMargin}px 0px`, threshold: 0.01 });
      frames.forEach((frame) => observer.observe(frame));
    }

    window.addEventListener("scroll", scheduleRefresh, { passive: true });
    window.addEventListener("resize", scheduleRefresh);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        frames.forEach(unloadFrame);
      } else {
        scheduleRefresh();
      }
    });
    window.addEventListener("pagehide", () => frames.forEach(unloadFrame), { once: true });
    scheduleRefresh();
  }

  function setupLiveBallpassBackground() {
    if (!liveBallpassCanvas) return;
    const section = liveBallpassCanvas.closest(".live-ballpass-section") || liveBallpassCanvas.parentElement;
    const ctx = liveBallpassCanvas.getContext("2d", { alpha: true });
    if (!section || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const balls = [
      { x: 0.15, y: 0.28, r: 0.082, hue: 184, speed: 0.38, offset: 0.2 },
      { x: 0.46, y: 0.18, r: 0.06, hue: 51, speed: 0.3, offset: 1.8 },
      { x: 0.74, y: 0.32, r: 0.07, hue: 288, speed: 0.42, offset: 3.2 },
      { x: 0.27, y: 0.72, r: 0.055, hue: 153, speed: 0.34, offset: 4.4 },
      { x: 0.63, y: 0.78, r: 0.09, hue: 43, speed: 0.28, offset: 2.7 }
    ];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let inView = true;

    function resize() {
      const rect = section.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      liveBallpassCanvas.width = Math.round(width * dpr);
      liveBallpassCanvas.height = Math.round(height * dpr);
      liveBallpassCanvas.style.width = `${width}px`;
      liveBallpassCanvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }

    function ballPoint(ball, t) {
      return {
        x: (ball.x + Math.sin(t * ball.speed + ball.offset) * 0.12) * width,
        y: (ball.y + Math.cos(t * (ball.speed * 0.72) + ball.offset) * 0.12) * height,
        r: Math.max(34, Math.min(width, height) * ball.r)
      };
    }

    function strokeRay(a, b, alpha) {
      const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, `hsla(${a.hue || 184}, 100%, 62%, 0)`);
      gradient.addColorStop(0.5, `hsla(${((a.hue || 184) + (b.hue || 51)) / 2}, 100%, 72%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${b.hue || 51}, 100%, 62%, 0)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    function draw(now) {
      const t = now * 0.001;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      ctx.strokeStyle = "rgba(41, 247, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let i = -2; i < 9; i += 1) {
        const x = (i / 7) * width + Math.sin(t * 0.2 + i) * 18;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + width * 0.18, height);
        ctx.stroke();
      }

      const points = balls.map((ball) => ({ ...ballPoint(ball, t), hue: ball.hue }));
      ctx.globalCompositeOperation = "screen";
      points.forEach((point, index) => {
        for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
          const other = points[otherIndex];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < width * 0.5) {
            strokeRay(point, other, Math.max(0.08, 0.32 - distance / width));
          }
        }
      });

      points.forEach((point, index) => {
        const pulse = 1 + Math.sin(t * 2.2 + index) * 0.08;
        const radius = point.r * pulse;
        const glow = ctx.createRadialGradient(point.x - radius * 0.32, point.y - radius * 0.34, radius * 0.08, point.x, point.y, radius);
        glow.addColorStop(0, "rgba(255,255,255,0.92)");
        glow.addColorStop(0.26, `hsla(${point.hue}, 100%, 72%, 0.72)`);
        glow.addColorStop(0.62, `hsla(${point.hue + 36}, 90%, 54%, 0.26)`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `hsla(${point.hue}, 100%, 72%, 0.38)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * 0.68, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.globalCompositeOperation = "source-over";
    }

    function stop() {
      if (!frame) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    function tick(now) {
      frame = 0;
      if (!inView || document.hidden) return;
      draw(now);
      if (!reduceMotion.matches) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    function start() {
      stop();
      if (!inView || document.hidden) return;
      if (reduceMotion.matches) {
        draw(performance.now());
        return;
      }
      frame = window.requestAnimationFrame(tick);
    }

    resize();
    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(section);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        start();
      }, { threshold: [0, 0.12] });
      observer.observe(section);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
    start();
  }

  if (livePlayerAudio && livePlayerToggle) {
    livePlayerToggle.addEventListener("click", toggleLivePlayer);
    livePlayerPrev?.addEventListener("click", () => {
      livePlayerAudio.currentTime = Math.max(0, livePlayerAudio.currentTime - 15);
      updateLivePlayer();
    });
    livePlayerNext?.addEventListener("click", () => {
      const duration = Number.isFinite(livePlayerAudio.duration) ? livePlayerAudio.duration : livePlayerAudio.currentTime + 15;
      livePlayerAudio.currentTime = Math.min(duration, livePlayerAudio.currentTime + 15);
      updateLivePlayer();
    });
    ["loadedmetadata", "timeupdate", "play", "pause", "ended", "durationchange"].forEach((eventName) => {
      livePlayerAudio.addEventListener(eventName, updateLivePlayer);
    });
    livePlayerAudio.addEventListener("play", startLiveWave);
    livePlayerAudio.addEventListener("pause", resetLiveWave);
    livePlayerAudio.addEventListener("ended", resetLiveWave);
    updateLivePlayer();
    resetLiveWave();
  }

  scheduleStreamOpenAudio();
  setupTwitchStreamStability();
  setupLiveLazyEmbeds();
  setupLiveBallpassBackground();

  shadowOpsOpeners.forEach((button) => {
    button.addEventListener("click", openShadowOpsModal);
  });
  shadowOpsCloseButtons?.forEach((button) => {
    button.addEventListener("click", closeShadowOpsModal);
  });
  shadowOpsStart?.addEventListener("click", () => {
    pauseLiveAudioForShadowOps();
    loadShadowOpsGame();
    if (shadowOpsStatus) shadowOpsStatus.textContent = "Pilot control";
    shadowOpsModal?.classList.add("is-briefing");
    shadowOpsFrame?.focus();
    shadowOpsFrame?.contentWindow?.focus?.();
    playUiTone(5);
  });
  shadowOpsFullscreen?.addEventListener("click", toggleShadowOpsFullscreen);
  document.addEventListener("fullscreenchange", updateShadowOpsFullscreenState);
  document.addEventListener("webkitfullscreenchange", updateShadowOpsFullscreenState);
  shadowOpsFrame?.addEventListener("pointerdown", handleShadowOpsGameEngaged);
  shadowOpsFrame?.addEventListener("focus", handleShadowOpsGameEngaged);
  window.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (document.activeElement === shadowOpsFrame) handleShadowOpsGameEngaged();
    }, 0);
  });
  shadowOpsModal?.addEventListener("click", (event) => {
    if (event.target === shadowOpsModal) closeShadowOpsModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeStreamStartupPrompt();
    if (event.key === "Escape" && isShadowOpsFullscreen()) {
      exitShadowOpsFullscreen();
      return;
    }
    if (event.key === "Escape" && shadowOpsModal?.classList.contains("is-open")) closeShadowOpsModal();
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function appendChatMessage(name, message, options = {}) {
    if (!chatFeed) return null;
    const entry = document.createElement("p");
    if (options.className) entry.className = options.className;
    if (options.accent) entry.style.setProperty("--bot-accent", options.accent);
    entry.innerHTML = `<b>${escapeHtml(name)}</b> ${escapeHtml(message)}`;
    chatFeed.appendChild(entry);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    return entry;
  }

  function getBotReply(bot, message) {
    const lowered = message.toLowerCase();
    if (lowered.includes("jazz") || lowered.includes("detroit") || lowered.includes("band")) return bot.jazz;
    if (lowered.includes("fire") || lowered.includes("wow") || lowered.includes("dope") || lowered.includes("love")) return bot.hype;
    const line = bot.lines[(message.length + bot.name.length + botCursor) % bot.lines.length];
    return line;
  }

  function showTypingThenReply(bot, message, delay) {
    if (!chatFeed) return;
    window.setTimeout(() => {
      const typing = appendChatMessage(bot.name, "typing...", { className: "is-bot is-typing", accent: bot.accent });
      window.setTimeout(() => {
        typing?.remove();
        appendChatMessage(bot.name, getBotReply(bot, message), { className: "is-bot", accent: bot.accent });
        playUiTone(botCursor);
      }, 520);
    }, delay);
  }

  function respondWithBots(message) {
    const replyCount = message.length > 42 ? 3 : 2;
    for (let index = 0; index < replyCount; index += 1) {
      const bot = chatBots[(botCursor + index) % chatBots.length];
      showTypingThenReply(bot, message, 480 + index * 860);
    }
    botCursor = (botCursor + replyCount) % chatBots.length;
  }

  if (chatForm && chatFeed && chatInput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      appendChatMessage("SignalUser", message, { className: "is-user" });
      chatInput.value = "";
      playUiTone(message.length);
      respondWithBots(message);
    });
  }

  tickLiveTimer();
  window.setInterval(tickLiveTimer, 1000);
})();
