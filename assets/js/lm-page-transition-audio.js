(() => {
  "use strict";

  /*
    LottoMind portal transition audio.
    - Put real audio files in assets/audio/.
    - Rename files by editing AUDIO_CONFIG.files below.
    - Disable sounds by setting AUDIO_CONFIG.enabled to false.
    - Adjust loudness with AUDIO_CONFIG.volume.
    - To try an arrival shutdown sound, set playCloseOnArrival to true.
  */
  const AUDIO_CONFIG = {
    enabled: true,
    volume: 0.16,
    playCloseBeforeNavigate: true,
    closeDelay: 150,
    playCloseOnArrival: false,
    files: {
      open: "lm-portal-open.mp3",
      close: "lm-portal-close.mp3",
    },
  };

  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const SOUND_TIMING = {
    open: 500,
    close: 380,
    fadeOut: 36,
  };
  const scriptUrl =
    document.currentScript?.src || new URL("./assets/js/lm-page-transition.js", document.baseURI).href;
  const audioBaseUrl = new URL("../audio/", scriptUrl);
  const cachedAudio = new Map();
  const failedAudio = new Set();
  let unlocked = false;
  let audioContext = null;

  function audioAllowed() {
    return AUDIO_CONFIG.enabled && !reducedMotionQuery?.matches;
  }

  function resolveAudioUrl(fileName) {
    return new URL(fileName, audioBaseUrl).href;
  }

  function getAudioContext() {
    if (!audioAllowed() || !AudioContextCtor) return null;
    if (!audioContext) {
      try {
        audioContext = new AudioContextCtor();
      } catch {
        audioContext = null;
      }
    }
    return audioContext;
  }

  function cacheSound(kind) {
    if (!audioAllowed() || cachedAudio.has(kind) || failedAudio.has(kind)) return;
    const fileName = AUDIO_CONFIG.files[kind];
    if (!fileName) return;

    try {
      const audio = new Audio(resolveAudioUrl(fileName));
      audio.preload = "auto";
      audio.volume = AUDIO_CONFIG.volume;
      audio.addEventListener(
        "error",
        () => {
          failedAudio.add(kind);
        },
        { once: true },
      );
      audio.load();
      cachedAudio.set(kind, audio);
    } catch {
      failedAudio.add(kind);
    }
  }

  function preloadSounds() {
    cacheSound("open");
    cacheSound("close");
  }

  function unlockAudio() {
    if (!audioAllowed()) return;
    unlocked = true;
    preloadSounds();
    getAudioContext()?.resume?.().catch(() => {});
  }

  function playSynth(kind) {
    if (!audioAllowed()) return;
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime + 0.008;
    const isClose = kind === "close";
    const duration = isClose ? 0.28 : 0.34;
    const carrier = context.createOscillator();
    const body = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    carrier.type = "sine";
    body.type = "sine";
    filter.type = "lowpass";
    filter.Q.setValueAtTime(1.35, now);

    if (isClose) {
      carrier.frequency.setValueAtTime(520, now);
      carrier.frequency.exponentialRampToValueAtTime(190, now + duration);
      body.frequency.setValueAtTime(130, now);
      body.frequency.exponentialRampToValueAtTime(74, now + duration);
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(540, now + duration);
    } else {
      carrier.frequency.setValueAtTime(180, now);
      carrier.frequency.exponentialRampToValueAtTime(620, now + duration * 0.82);
      body.frequency.setValueAtTime(82, now);
      body.frequency.exponentialRampToValueAtTime(146, now + duration);
      filter.frequency.setValueAtTime(680, now);
      filter.frequency.exponentialRampToValueAtTime(1900, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(AUDIO_CONFIG.volume * (isClose ? 0.2 : 0.24), now + 0.028);
    gain.gain.exponentialRampToValueAtTime(AUDIO_CONFIG.volume * 0.08, now + duration * 0.58);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    carrier.connect(filter);
    body.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    const cleanup = () => {
      [carrier, body, filter, gain].forEach((node) => {
        try {
          node.disconnect();
        } catch {
          /* Audio nodes may already be disconnected after a quick page change. */
        }
      });
    };

    carrier.addEventListener("ended", cleanup, { once: true });
    carrier.start(now);
    body.start(now);
    carrier.stop(now + duration + 0.05);
    body.stop(now + duration + 0.05);
  }

  function playSound(kind) {
    if (!audioAllowed()) return;
    unlockAudio();

    const baseAudio = cachedAudio.get(kind);
    if (!baseAudio || failedAudio.has(kind)) {
      playSynth(kind);
      return;
    }

    try {
      const audio = baseAudio.cloneNode(true);
      audio.volume = AUDIO_CONFIG.volume;
      audio.currentTime = 0;
      applyPlaybackFade(audio, kind);
      const playback = audio.play();
      if (playback?.catch) {
        playback.catch(() => {
          failedAudio.add(kind);
          playSynth(kind);
        });
      }
    } catch {
      failedAudio.add(kind);
      playSynth(kind);
    }
  }

  function applyPlaybackFade(audio, kind) {
    const totalMs = SOUND_TIMING[kind] || SOUND_TIMING.open;
    const fadeMs = Math.min(SOUND_TIMING.fadeOut, totalMs);
    const fadeStart = Math.max(0, totalMs - fadeMs);
    const startVolume = AUDIO_CONFIG.volume;
    let rafId = 0;
    const fadeTimer = window.setTimeout(() => {
      const startedAt = performance.now();
      const tick = () => {
        const progress = Math.min(1, (performance.now() - startedAt) / fadeMs);
        audio.volume = startVolume * (1 - progress);
        if (progress < 1 && !audio.paused) {
          rafId = window.requestAnimationFrame(tick);
        }
      };
      tick();
    }, fadeStart);

    audio.addEventListener(
      "ended",
      () => {
        window.clearTimeout(fadeTimer);
        if (rafId) window.cancelAnimationFrame(rafId);
      },
      { once: true },
    );
  }

  function scheduleCloseBeforeNavigate() {
    if (!AUDIO_CONFIG.playCloseBeforeNavigate || !audioAllowed()) return 0;
    window.setTimeout(() => playSound("close"), AUDIO_CONFIG.closeDelay);
    return AUDIO_CONFIG.closeDelay + SOUND_TIMING.close + 20;
  }

  function playCloseOnArrival() {
    if (AUDIO_CONFIG.playCloseOnArrival) {
      window.setTimeout(() => playSound("close"), 80);
    }
  }

  ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, unlockAudio, {
      once: true,
      passive: eventName !== "keydown",
    });
  });

  preloadSounds();

  window.LMPageTransitionAudio = {
    config: AUDIO_CONFIG,
    preload: preloadSounds,
    unlock: unlockAudio,
    play: playSound,
    playCloseBeforeNavigate: scheduleCloseBeforeNavigate,
    playCloseOnArrival,
  };

  window.addEventListener("lottomind:page-transition", (event) => {
    const phase = event.detail?.phase;
    if (phase === "open") {
      playSound("open");
      scheduleCloseBeforeNavigate();
      return;
    }

    if (phase === "close") {
      playCloseOnArrival();
    }
  });

  document.documentElement?.setAttribute("data-lm-transition-audio", "ready");
})();
