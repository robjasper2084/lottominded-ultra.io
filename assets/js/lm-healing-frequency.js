(() => {
  const healingDisabled =
    document.body?.hasAttribute("data-lm-healing-disabled") ||
    /\/(?:lottery-spheres|merch-store)\.html$/i.test(location.pathname);
  if (healingDisabled) {
    document.querySelectorAll(".lm-healing-generator, [data-lm-healing-generator]").forEach((node) => node.remove());
    document.body?.classList.remove("has-lm-healing-generator");
    return;
  }

  if (document.querySelector("[data-lm-healing-generator]")) return;

  const scriptUrl = document.currentScript?.src || new URL("./assets/js/lm-healing-frequency.js", location.href).toString();
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("../css/lm-healing-frequency.css?v=magic-eight-drag-2", scriptUrl).toString();
  document.head.append(stylesheet);

  document.body.classList.add("has-lm-healing-generator");
  document.querySelectorAll("footer#player audio, audio[data-feature-entry-track]").forEach((audio) => {
    audio.pause?.();
    audio.autoplay = false;
  });

  const presets = [174, 220, 432, 528, 741, 963];
  const names = { 174: "Deep", 220: "Ground", 432: "Calm", 528: "Love", 741: "Clear", 963: "Align" };
  const oracleFallbacks = [
    { reading: "The signal points to yes.", score: 0.72 },
    { reading: "Creative conditions look favorable.", score: 0.44 },
    { reading: "The orbit is unclear. Ask again after the next signal.", score: 0 },
    { reading: "The field advises patience.", score: -0.28 },
    { reading: "The signal says not yet.", score: -0.68 }
  ];

  const root = document.createElement("aside");
  root.className = "lm-healing-generator";
  root.dataset.lmHealingGenerator = "true";
  root.setAttribute("aria-label", "Healing frequency generator and Magic 8 Ball oracle");
  root.innerHTML = `
    <button class="lm-healing-generator__drag" type="button" aria-label="Move Magic 8 Ball" title="Drag to move the Magic 8 Ball"><span aria-hidden="true">Move</span></button>
    <div class="lm-healing-generator__header">
      <span class="lm-healing-generator__frequency" data-healing-frequency>528 Hz</span>
      <span class="lm-healing-generator__copy"><small>Magic 8 frequency</small><strong>528 Hz Love</strong></span>
      <button class="lm-healing-generator__minimize" type="button" aria-label="Minimize frequency oracle" aria-expanded="true">-</button>
    </div>
    <section class="lm-healing-generator__oracle" data-magic-eight-oracle data-oracle-tone="neutral" aria-label="Magic 8 Ball signal">
      <p class="lm-healing-generator__oracle-kicker">Magic 8 signal</p>
      <p class="lm-healing-generator__reading" data-magic-eight-reading aria-live="polite">Ask a yes-or-no question.</p>
      <form class="lm-healing-generator__oracle-form" data-magic-eight-form>
        <label class="sr-only" for="lmMagicEightQuestion">Your yes-or-no question</label>
        <input id="lmMagicEightQuestion" type="text" maxlength="160" autocomplete="off" placeholder="Ask the signal..." required data-magic-eight-question />
        <button class="lm-healing-generator__ask" type="submit">Ask</button>
      </form>
      <p class="lm-healing-generator__oracle-status" data-magic-eight-status>Entertainment-only guidance.</p>
    </section>
    <div class="lm-healing-generator__presets" aria-label="Frequency presets">
      ${presets.map((preset) => `<button type="button" data-healing-preset="${preset}" aria-pressed="${preset === 528}">${preset}<br>${names[preset]}</button>`).join("")}
    </div>
    <label class="lm-healing-generator__volume-row"><span>Tone volume</span><input class="lm-healing-generator__level" type="range" min="0" max="0.12" step="0.01" value="0.04" data-healing-volume /></label>
    <div class="lm-healing-generator__actions">
      <button class="lm-healing-generator__toggle" type="button" data-healing-toggle aria-pressed="false">Play tone</button>
      <p class="lm-healing-generator__status" data-healing-status aria-live="polite">Audio starts only when you press Play.</p>
    </div>`;
  document.body.append(root);

  let context = null;
  let oscillator = null;
  let gain = null;
  let oracleRequest = null;
  let frequency = 528;
  try {
    frequency = Number(localStorage.getItem("lottomind_healing_frequency")) || 528;
  } catch {}

  const toggle = root.querySelector("[data-healing-toggle]");
  const status = root.querySelector("[data-healing-status]");
  const volume = root.querySelector("[data-healing-volume]");
  const frequencyLabel = root.querySelector("[data-healing-frequency]");
  const copyStrong = root.querySelector(".lm-healing-generator__copy strong");
  const oracle = root.querySelector("[data-magic-eight-oracle]");
  const oracleForm = root.querySelector("[data-magic-eight-form]");
  const oracleQuestion = root.querySelector("[data-magic-eight-question]");
  const oracleReading = root.querySelector("[data-magic-eight-reading]");
  const oracleStatus = root.querySelector("[data-magic-eight-status]");
  const minimizeButton = root.querySelector(".lm-healing-generator__minimize");
  const dragHandle = root.querySelector(".lm-healing-generator__drag");
  const positionStorageKey = "lottomind_magic_eight_position";

  const clampPosition = (left, top) => {
    const rect = root.getBoundingClientRect();
    const margin = 10;
    return {
      left: Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - rect.width - margin)),
      top: Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - rect.height - margin))
    };
  };

  const placeAt = (left, top, save = true) => {
    const next = clampPosition(left, top);
    root.classList.add("is-positioned");
    root.style.left = `${next.left}px`;
    root.style.top = `${next.top}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
    if (save) {
      try { localStorage.setItem(positionStorageKey, JSON.stringify(next)); } catch {}
    }
  };

  const restorePosition = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(positionStorageKey) || "null");
      if (Number.isFinite(saved?.left) && Number.isFinite(saved?.top)) placeAt(saved.left, saved.top, false);
    } catch {}
  };

  const syncFrequency = () => {
    frequencyLabel.textContent = `${frequency} Hz`;
    copyStrong.textContent = `${frequency} Hz ${names[frequency] || "Tone"}`;
    root.querySelectorAll("[data-healing-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.healingPreset) === frequency));
    });
    if (oscillator && context) oscillator.frequency.setTargetAtTime(frequency, context.currentTime, 0.03);
  };

  const stop = () => {
    if (gain && context) gain.gain.setTargetAtTime(0, context.currentTime, 0.03);
    window.setTimeout(() => {
      try { oscillator?.stop(); } catch {}
      oscillator = null;
      gain = null;
    }, 90);
    toggle.textContent = "Play tone";
    toggle.setAttribute("aria-pressed", "false");
    status.textContent = `${frequency} Hz ready. Audio is off.`;
  };

  const play = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      status.textContent = "Web Audio is unavailable in this browser.";
      return;
    }
    context ||= new AudioContext();
    await context.resume();
    oscillator = context.createOscillator();
    gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    gain.gain.setTargetAtTime(Number(volume.value), context.currentTime, 0.05);
    toggle.textContent = "Stop tone";
    toggle.setAttribute("aria-pressed", "true");
    status.textContent = `${frequency} Hz tone is playing.`;
  };

  const fallbackOracleReading = (question) => {
    const seed = Array.from(question).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);
    return oracleFallbacks[seed % oracleFallbacks.length];
  };

  const showOracleReading = ({ reading, score = 0 }, source) => {
    oracleReading.textContent = reading;
    oracle.dataset.oracleTone = score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral";
    oracleStatus.textContent = source;
  };

  const askOracle = async (question) => {
    oracleRequest?.abort();
    oracleRequest = new AbortController();
    const timeout = window.setTimeout(() => oracleRequest.abort(), 8000);
    oracleReading.textContent = "The signal is turning...";
    oracle.dataset.oracleTone = "neutral";
    oracleStatus.textContent = "Reading the Magic 8 signal.";

    try {
      const endpoint = new URL("/api/eightball", location.origin);
      endpoint.searchParams.set("question", question);
      const response = await fetch(endpoint, { signal: oracleRequest.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Oracle request failed: ${response.status}`);
      const data = await response.json();
      const reading = String(data.reading || data.answer || "").trim();
      if (!reading) throw new Error("Oracle response was empty");
      showOracleReading({ reading, score: Number(data.sentiment?.score ?? data.score ?? 0) }, "Live Magic 8 signal.");
    } catch (error) {
      showOracleReading(fallbackOracleReading(question), "Local Magic 8 signal.");
    } finally {
      window.clearTimeout(timeout);
      oracleRequest = null;
    }
  };

  root.querySelectorAll("[data-healing-preset]").forEach((button) => button.addEventListener("click", () => {
    frequency = Number(button.dataset.healingPreset);
    try { localStorage.setItem("lottomind_healing_frequency", String(frequency)); } catch {}
    syncFrequency();
    status.textContent = `${frequency} Hz selected${oscillator ? " and playing" : ""}.`;
  }));

  toggle.addEventListener("click", () => oscillator ? stop() : play());
  volume.addEventListener("input", () => {
    if (gain && context) gain.gain.setTargetAtTime(Number(volume.value), context.currentTime, 0.03);
  });
  oracleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = oracleQuestion.value.trim();
    if (question) askOracle(question);
  });
  minimizeButton.addEventListener("click", () => {
    const minimized = root.classList.toggle("is-minimized");
    minimizeButton.setAttribute("aria-expanded", String(!minimized));
    minimizeButton.setAttribute("aria-label", minimized ? "Expand frequency oracle" : "Minimize frequency oracle");
    if (root.classList.contains("is-positioned")) requestAnimationFrame(() => placeAt(root.offsetLeft, root.offsetTop));
  });

  let dragState = null;
  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const rect = root.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    root.classList.add("is-dragging");
    dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  dragHandle.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    placeAt(event.clientX - dragState.dx, event.clientY - dragState.dy, false);
  });
  const finishDrag = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    dragState = null;
    root.classList.remove("is-dragging");
    placeAt(root.offsetLeft, root.offsetTop);
  };
  dragHandle.addEventListener("pointerup", finishDrag);
  dragHandle.addEventListener("pointercancel", finishDrag);
  dragHandle.addEventListener("keydown", (event) => {
    if (!event.key.startsWith("Arrow")) return;
    const rect = root.getBoundingClientRect();
    const step = event.shiftKey ? 24 : 8;
    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    placeAt(rect.left + dx, rect.top + dy);
    event.preventDefault();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && oscillator) stop();
  });

  window.addEventListener("resize", () => {
    if (root.classList.contains("is-positioned")) placeAt(root.offsetLeft, root.offsetTop, false);
  });

  syncFrequency();
  requestAnimationFrame(() => requestAnimationFrame(restorePosition));
})();
