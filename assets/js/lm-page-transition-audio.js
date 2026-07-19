(() => {
  "use strict";

  /*
    LottoMind page transition audio.
    - Empty file names use the generated soft signal chord.
    - To use recorded cues, put files in assets/audio/ and set their names below.
    - Disable sounds by setting AUDIO_CONFIG.enabled to false.
    - Adjust loudness with AUDIO_CONFIG.volume.
    - Keep one cue per transition unless a distinct arrival sound is intentional.
  */
  const AUDIO_CONFIG = {
    enabled: true,
    volume: 0.1,
    playCloseBeforeNavigate: false,
    closeDelay: 150,
    playCloseOnArrival: false,
    files: {
      open: "",
      close: "",
    },
  };

  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const SOUND_TIMING = {
    open: 760,
    close: 620,
    fadeOut: 80,
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

    const now = context.currentTime + 0.01;
    const isClose = kind === "close";
    const duration = isClose ? 0.52 : 0.68;
    const pitches = isClose
      ? [329.63, 277.18, 220]
      : [220, 277.18, 329.63];
    const levels = [0.58, 0.34, 0.2];
    const detunes = [-2, 1, 3];
    const filter = context.createBiquadFilter();
    const master = context.createGain();
    const delay = context.createDelay(0.4);
    const echo = context.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(0.55, now);
    delay.delayTime.setValueAtTime(0.13, now);
    echo.gain.setValueAtTime(0.11, now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(AUDIO_CONFIG.volume * 0.18, now + 0.05);
    master.gain.exponentialRampToValueAtTime(AUDIO_CONFIG.volume * 0.06, now + duration * 0.58);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    filter.connect(master);
    master.connect(context.destination);
    master.connect(delay);
    delay.connect(echo);
    echo.connect(context.destination);

    const oscillators = pitches.map((pitch, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(pitch, now);
      oscillator.detune.setValueAtTime(detunes[index], now);
      voice.gain.setValueAtTime(levels[index], now);
      oscillator.connect(voice);
      voice.connect(filter);
      oscillator.start(now + index * 0.055);
      oscillator.stop(now + duration + 0.12);
      return { oscillator, voice };
    });

    const cleanup = () => {
      [...oscillators.flatMap(({ oscillator, voice }) => [oscillator, voice]), filter, master, delay, echo].forEach((node) => {
        try {
          node.disconnect();
        } catch {
          /* Audio nodes may already be disconnected after a quick page change. */
        }
      });
    };

    oscillators.at(-1)?.oscillator.addEventListener("ended", cleanup, { once: true });
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
