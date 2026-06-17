(() => {
  const root = document.querySelector(".lm-live-page");
  if (!root) return;

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
  let liveAudioContext = null;
  let liveAudioAnalyser = null;
  let liveAudioData = null;
  let liveAudioSource = null;
  let liveWaveFrame = null;
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

  async function toggleLivePlayer() {
    if (!livePlayerAudio) return;
    if (livePlayerAudio.paused || livePlayerAudio.ended) {
      try {
        setupLiveAnalyser();
        await liveAudioContext?.resume?.();
        livePlayerAudio.volume = 0.72;
        await livePlayerAudio.play();
        startLiveWave();
      } catch {
        livePlayer?.classList.add("needs-user-audio");
      }
    } else {
      livePlayerAudio.pause();
      resetLiveWave();
    }
    updateLivePlayer();
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
