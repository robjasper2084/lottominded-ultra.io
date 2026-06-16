(() => {
  const root = document.querySelector(".lm-live-page");
  if (!root) return;

  const liveStart = Date.now() - (12 * 60 + 45) * 1000;
  const started = document.querySelector(".started");
  const padButtons = document.querySelectorAll(".lm-category-grid button, .lm-interactions button, .lm-synth-tabs button");
  const chatFeed = document.querySelector("[data-live-chat-feed]");
  const chatForm = document.querySelector("[data-live-chat-form]");
  const chatInput = document.querySelector("[data-live-chat-input]");
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
