const gameConfigs = {
  pick3: { label: "Pick 3", type: "digits", count: 3, min: 0, max: 9, repeats: true },
  pick4: { label: "Pick 4", type: "digits", count: 4, min: 0, max: 9, repeats: true },
  cash5: { label: "Cash 5 / Fantasy 5", type: "matrix", count: 5, min: 1, max: 39 },
  lotto6: { label: "Lotto 6", type: "matrix", count: 6, min: 1, max: 49 },
  powerball: { label: "Powerball Style", type: "special", count: 5, min: 1, max: 69, special: "Powerball", sMin: 1, sMax: 26 },
  mega: { label: "Mega Millions Style", type: "special", count: 5, min: 1, max: 70, special: "Mega Ball", sMin: 1, sMax: 24 }
};

const pianoNotes = [
  "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
  "C5"
];

let importedBeatAnalysis = null;
let sheetFileLabel = "";
let beatPulseTimer = 0;
let beatAudioUrl = "";
let beatAudioContext = null;
let beatAnalyser = null;
let beatSourceNode = null;
let beatEnergyRaf = 0;
let beatTimeDomainData = null;
const b2lPlayer = document.querySelector("[data-b2l-live-player]");
const b2lPlayerToggle = b2lPlayer?.querySelector("[data-b2l-player-toggle]");
const b2lPlayerPrev = b2lPlayer?.querySelector("[data-b2l-player-prev]");
const b2lPlayerNext = b2lPlayer?.querySelector("[data-b2l-player-next]");
const b2lPlayerTime = b2lPlayer?.querySelector("[data-b2l-player-time]");
const b2lPlayerTitle = b2lPlayer?.querySelector("[data-b2l-player-title]");
const b2lPlayerSubtitle = b2lPlayer?.querySelector("[data-b2l-player-subtitle]");

function pulseElement(element, className = "is-copy-pulsed", duration = 900) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function markTypingOutput(field) {
  if (!field) return;
  field.classList.add("is-typing-output");
  window.setTimeout(() => field.classList.remove("is-typing-output"), 1150);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function emitBeatEnergy(energy, detail = {}) {
  window.dispatchEvent(new CustomEvent("lottomind:beat-energy", {
    detail: {
      source: "beat2lotto-upload",
      energy: clamp01(energy),
      ...detail
    }
  }));
}

function buildEnergySeries(data, duration) {
  const bucketCount = Math.max(24, Math.min(96, Math.round(duration * 5) || 36));
  const bucketSize = Math.max(1, Math.floor(data.length / bucketCount));
  const series = [];
  let maxEnergy = 0;
  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = bucket * bucketSize;
    const end = Math.min(data.length, start + bucketSize);
    let sumSquares = 0;
    let localPeak = 0;
    for (let index = start; index < end; index += 1) {
      const sample = data[index] || 0;
      const abs = Math.abs(sample);
      sumSquares += sample * sample;
      if (abs > localPeak) localPeak = abs;
    }
    const rms = Math.sqrt(sumSquares / Math.max(1, end - start));
    const energy = rms * 0.78 + localPeak * 0.22;
    maxEnergy = Math.max(maxEnergy, energy);
    series.push(energy);
  }
  const scale = maxEnergy || 1;
  return series.map((energy) => clamp01(Math.pow(energy / scale, 0.72)));
}

function playBeatEnergySeries(series, bpm = 120) {
  window.clearInterval(beatPulseTimer);
  if (!series?.length) return;
  let index = 0;
  let loops = 0;
  const stepMs = Math.max(90, Math.min(240, (60000 / Math.max(40, Math.min(220, bpm))) / 2));
  emitBeatEnergy(series[0], { index: 0, length: series.length, bpm });
  beatPulseTimer = window.setInterval(() => {
    index = (index + 1) % series.length;
    if (index === 0) loops += 1;
    emitBeatEnergy(series[index], { index, length: series.length, bpm });
    if (loops >= 3) window.clearInterval(beatPulseTimer);
  }, stepMs);
}


function formatB2LMediaTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function syncB2LLivePlayer() {
  const audio = document.querySelector("#lottoAudioPlayer");
  const hasAudio = Boolean(audio?.src);
  const duration = hasAudio && Number.isFinite(audio.duration) ? audio.duration : 0;
  const progress = duration ? Math.min(1, Math.max(0, audio.currentTime / duration)) : 0;
  const isPlaying = hasAudio && !audio.paused && !audio.ended;

  b2lPlayer?.style.setProperty("--player-progress", progress.toFixed(3));
  b2lPlayer?.classList.toggle("is-playing", isPlaying);
  b2lPlayer?.classList.toggle("is-disabled", !hasAudio);

  [b2lPlayerToggle, b2lPlayerPrev, b2lPlayerNext].forEach((button) => {
    if (!button) return;
    button.disabled = !hasAudio;
    button.setAttribute("aria-disabled", String(!hasAudio));
  });

  if (b2lPlayerToggle) {
    b2lPlayerToggle.innerHTML = isPlaying ? "II" : "&#9654;";
    b2lPlayerToggle.setAttribute("aria-pressed", String(isPlaying));
  }

  if (b2lPlayerTime) {
    b2lPlayerTime.textContent = `${formatB2LMediaTime(audio?.currentTime || 0)} / ${formatB2LMediaTime(duration)}`;
  }
}
function setBeatPlaybackStatus(message) {
  const status = document.querySelector("#beatPlaybackStatus");
  if (status) status.textContent = message;
  if (b2lPlayerSubtitle) b2lPlayerSubtitle.textContent = message;
  syncB2LLivePlayer();
}

function setBeatPlaybackEnergy(energy) {
  const playback = document.querySelector("#beatPlayback");
  const safeEnergy = clamp01(energy);
  if (playback) playback.style.setProperty("--beat-live-energy", safeEnergy.toFixed(3));
  if (b2lPlayer) b2lPlayer.style.setProperty("--beat-live-energy", safeEnergy.toFixed(3));
}

function setBeatPlaybackButtonState(isPlaying) {
  const button = document.querySelector("#playBeatAudio");
  if (!button) return;
  button.textContent = isPlaying ? "Pause uploaded beat" : "Play uploaded beat";
  syncB2LLivePlayer();
}

function stopLiveBeatEnergy() {
  if (beatEnergyRaf) window.cancelAnimationFrame(beatEnergyRaf);
  beatEnergyRaf = 0;
  setBeatPlaybackEnergy(0);
}

function startLiveBeatEnergy() {
  stopLiveBeatEnergy();
  renderLiveBeatEnergy();
}

function prepareBeatPlayback(file) {
  const playback = document.querySelector("#beatPlayback");
  const audio = document.querySelector("#lottoAudioPlayer");
  const button = document.querySelector("#playBeatAudio");
  if (!playback || !audio || !button || !file) return;

  stopLiveBeatEnergy();
  window.clearInterval(beatPulseTimer);
  if (!audio.paused) audio.pause();
  if (beatAudioUrl) URL.revokeObjectURL(beatAudioUrl);
  beatAudioUrl = URL.createObjectURL(file);
  audio.src = beatAudioUrl;
  audio.load();
  playback.hidden = false;
  audio.controls = true;
  button.disabled = false;
  setBeatPlaybackButtonState(false);
  setBeatPlaybackStatus(`Ready to play ${file.name}. Local analysis is running in the browser.`);
}

function resetBeatPlayback() {
  const playback = document.querySelector("#beatPlayback");
  const audio = document.querySelector("#lottoAudioPlayer");
  const button = document.querySelector("#playBeatAudio");
  stopLiveBeatEnergy();
  if (audio && !audio.paused) audio.pause();
  if (audio) audio.removeAttribute("src");
  if (button) {
    button.disabled = true;
    setBeatPlaybackButtonState(false);
  }
  if (playback) playback.hidden = true;
  if (beatAudioUrl) URL.revokeObjectURL(beatAudioUrl);
  beatAudioUrl = "";
  if (b2lPlayerTitle) b2lPlayerTitle.textContent = "Beat2Lotto+ Uploaded Media";
  if (b2lPlayerSubtitle) b2lPlayerSubtitle.textContent = "Import audio to drive the signal";
  syncB2LLivePlayer();
}

async function ensureBeatAnalyser() {
  const audio = document.querySelector("#lottoAudioPlayer");
  if (!audio?.src) return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    setBeatPlaybackStatus("This browser cannot analyze playback audio.");
    return null;
  }
  if (!beatAudioContext) {
    beatAudioContext = new AudioContextCtor();
  }
  if (beatAudioContext.state === "suspended") {
    await beatAudioContext.resume();
  }
  if (!beatAnalyser) {
    beatAnalyser = beatAudioContext.createAnalyser();
    beatAnalyser.fftSize = 512;
    beatTimeDomainData = new Uint8Array(beatAnalyser.fftSize);
  }
  if (!beatSourceNode) {
    beatSourceNode = beatAudioContext.createMediaElementSource(audio);
    beatSourceNode.connect(beatAnalyser);
    beatAnalyser.connect(beatAudioContext.destination);
  }
  return { audio, analyser: beatAnalyser };
}

function renderLiveBeatEnergy() {
  const audio = document.querySelector("#lottoAudioPlayer");
  if (!audio || audio.paused || audio.ended || !beatAnalyser || !beatTimeDomainData) {
    stopLiveBeatEnergy();
    return;
  }

  beatAnalyser.getByteTimeDomainData(beatTimeDomainData);
  let sumSquares = 0;
  let peak = 0;
  for (const sample of beatTimeDomainData) {
    const centered = (sample - 128) / 128;
    const abs = Math.abs(centered);
    sumSquares += centered * centered;
    if (abs > peak) peak = abs;
  }
  const rms = Math.sqrt(sumSquares / beatTimeDomainData.length);
  const energy = clamp01(rms * 2.2 + peak * 0.42);
  setBeatPlaybackEnergy(energy);
  emitBeatEnergy(energy, {
    source: "beat2lotto-live-audio",
    index: Math.floor(audio.currentTime * 12),
    currentTime: audio.currentTime
  });
  syncB2LLivePlayer();
  beatEnergyRaf = window.requestAnimationFrame(renderLiveBeatEnergy);
}

async function toggleBeatPlayback() {
  const audio = document.querySelector("#lottoAudioPlayer");
  const button = document.querySelector("#playBeatAudio");
  if (!audio?.src || !button) return;

  if (!audio.paused) {
    audio.pause();
    setBeatPlaybackButtonState(false);
    setBeatPlaybackStatus("Playback paused. Press play to wake the spheres again.");
    return;
  }

  window.clearInterval(beatPulseTimer);
  try {
    await audio.play();
    const setup = await ensureBeatAnalyser();
    setBeatPlaybackButtonState(true);
    setBeatPlaybackStatus(setup ? "Playing locally. Golden balls are reacting to the beat." : "Playing locally with browser audio controls.");
    if (setup) startLiveBeatEnergy();
  } catch {
    setBeatPlaybackButtonState(false);
    setBeatPlaybackStatus("This audio file could not be played by the browser.");
  }
}

async function handleNativeBeatPlay() {
  const audio = document.querySelector("#lottoAudioPlayer");
  if (!audio?.src) return;
  window.clearInterval(beatPulseTimer);
  setBeatPlaybackButtonState(true);
  try {
    const setup = await ensureBeatAnalyser();
    setBeatPlaybackStatus(setup ? "Playing locally. Golden balls are reacting to the beat." : "Playing locally with browser audio controls.");
    if (setup) startLiveBeatEnergy();
  } catch {
    setBeatPlaybackStatus("Playing locally. Visual beat energy is unavailable for this file.");
  }
}

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function drawNumber(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateSet(rng, game) {
  if (game.type === "digits") {
    return {
      main: Array.from({ length: game.count }, () => drawNumber(rng, game.min, game.max)),
      straight: true
    };
  }
  const main = [];
  while (main.length < game.count) {
    const next = drawNumber(rng, game.min, game.max);
    if (!main.includes(next)) main.push(next);
  }
  main.sort((a, b) => a - b);
  const result = { main };
  if (game.type === "special") result.special = drawNumber(rng, game.sMin, game.sMax);
  return result;
}

function formatSet(set, game) {
  const main = game.type === "digits"
    ? set.main.join("-")
    : set.main.map((number) => String(number).padStart(2, "0")).join(" ");
  return set.special ? `${main} | ${game.special} ${set.special}` : main;
}

function getBeatSeedText() {
  if (!importedBeatAnalysis) return "no-audio";
  return [
    importedBeatAnalysis.fileName,
    importedBeatAnalysis.duration.toFixed(3),
    importedBeatAnalysis.sampleRate,
    importedBeatAnalysis.channels,
    importedBeatAnalysis.rms.toFixed(5),
    importedBeatAnalysis.peak.toFixed(5),
    importedBeatAnalysis.zeroCrossRate.toFixed(5),
    importedBeatAnalysis.transientCount,
    importedBeatAnalysis.energySignature
  ].join("|");
}

function renderResults() {
  const seed = document.querySelector("#lottoSeed").value.trim() || "lottominded ultra";
  const bpm = document.querySelector("#lottoBpm").value || "120";
  const game = gameConfigs[document.querySelector("#lottoGame").value] || gameConfigs.pick3;
  const count = Math.max(1, Math.min(12, Number(document.querySelector("#lottoCount").value) || 5));
  const method = document.querySelector("#lottoMethod").value;
  const seedText = `${seed}|${bpm}|${game.label}|${method}|${getBeatSeedText()}|${Date.now()}`;
  const rng = seededRandom(hashString(seedText));
  const sets = Array.from({ length: count }, () => generateSet(rng, game));
  const output = document.querySelector("#lottoOutput");
  output.dataset.copyText = sets.map((set, index) => (
    `Beat2Lotto+ - ${game.label} - ${method} - Set ${index + 1}: ${formatSet(set, game)} - Beat-seeded entertainment picks. Creative number generation. Not a prediction. Verify official rules.`
  )).join("\n");
  output.innerHTML = sets.map((set, index) => `
    <article class="lotto-set-card motion-pop is-visible" style="--motion-delay:${Math.min(420, index * 65)}ms">
      <strong>Set ${index + 1} - ${game.label}</strong>
      <div class="lotto-number-row">
        ${set.main.map((number) => `<span class="lotto-ball">${game.type === "digits" ? number : String(number).padStart(2, "0")}</span>`).join("")}
        ${set.special ? `<span class="lotto-ball special">${set.special}</span>` : ""}
      </div>
      <p class="lotto-note">${method}. Beat-seeded entertainment picks. Creative number generation. Not a prediction.</p>
      <p class="lotto-note">Game rules, matrices, draw times, prizes, and eligibility vary by jurisdiction. Verify with the official lottery before playing.</p>
    </article>
  `).join("");
  output.classList.add("is-results-fresh");
  window.setTimeout(() => output.classList.remove("is-results-fresh"), 900);
}

async function copyResults() {
  const text = document.querySelector("#lottoOutput").dataset.copyText || "";
  if (!text) return;
  await copyText(text);
  pulseElement(document.querySelector("#copyLotto"));
}

async function analyzeBeatFile(file) {
  const status = document.querySelector("#beatAnalysis");
  if (!file || !status) {
    importedBeatAnalysis = null;
    resetBeatPlayback();
    return;
  }
  prepareBeatPlayback(file);
  status.innerHTML = `<strong>Analyzing ${escapeHtml(file.name)}</strong><span>Decoding local audio in the browser...</span>`;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    await audioContext.close?.();
    const data = buffer.getChannelData(0);
    const hop = Math.max(1, Math.floor(data.length / 32000));
    let peak = 0;
    let sumSquares = 0;
    let crossings = 0;
    let previous = data[0] || 0;
    let transientCount = 0;
    let previousAbs = Math.abs(previous);
    const buckets = [0, 0, 0, 0, 0, 0];
    for (let index = 0; index < data.length; index += hop) {
      const sample = data[index];
      const abs = Math.abs(sample);
      peak = Math.max(peak, abs);
      sumSquares += sample * sample;
      if ((sample >= 0 && previous < 0) || (sample < 0 && previous >= 0)) crossings += 1;
      if (abs - previousAbs > 0.18) transientCount += 1;
      buckets[index % buckets.length] += abs;
      previous = sample;
      previousAbs = abs;
    }
    const sampleCount = Math.ceil(data.length / hop);
    const rms = Math.sqrt(sumSquares / Math.max(1, sampleCount));
    const energySignature = buckets.map((value) => Math.round((value / sampleCount) * 10000)).join("-");
    const energySeries = buildEnergySeries(data, buffer.duration);
    importedBeatAnalysis = {
      fileName: file.name,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      peak,
      rms,
      zeroCrossRate: crossings / Math.max(1, sampleCount),
      transientCount,
      energySignature,
      energySeries
    };
    status.innerHTML = `
      <strong>${escapeHtml(file.name)}</strong>
      <span>${buffer.duration.toFixed(1)}s - ${buffer.sampleRate} Hz - ${buffer.numberOfChannels} channel${buffer.numberOfChannels === 1 ? "" : "s"}</span>
      <span>Peak ${(peak * 100).toFixed(1)}% - RMS ${(rms * 100).toFixed(1)}% - Transients ${transientCount}</span>
      <span>Seed signature ${energySignature}</span>
      <span>Golden spheres are reacting to uploaded beat energy.</span>
    `;
    playBeatEnergySeries(energySeries, Number(document.querySelector("#lottoBpm")?.value) || 120);
    syncB2LLivePlayer();
renderResults();
  } catch (error) {
    importedBeatAnalysis = null;
    window.clearInterval(beatPulseTimer);
    setBeatPlaybackStatus("Playback is still available if your browser supports this file. Analysis could not decode it.");
    status.innerHTML = `<strong>Audio ready for playback</strong><span>Waveform analysis could not decode this file, but the local player can still try to play it.</span>`;
  }
}

function renderKeyboard() {
  const keyboard = document.querySelector("#pianoKeyboard");
  if (!keyboard) return;
  keyboard.innerHTML = pianoNotes.map((note) => {
    const accidental = note.includes("#");
    return `<button type="button" class="piano-key ${accidental ? "is-black" : "is-white"}" data-note="${note}" aria-label="Add ${note}">${note}</button>`;
  }).join("");
}

function parseNotes() {
  const input = document.querySelector("#noteSequence")?.value || "";
  return input
    .replace(/[,;\n]/g, " ")
    .split(/\s+/)
    .map((note) => note.trim())
    .filter(Boolean);
}

function syncNoteChips() {
  const chips = document.querySelector("#noteChips");
  if (!chips) return;
  const notes = parseNotes();
  chips.innerHTML = notes.length
    ? notes.map((note) => `<span class="note-chip">${escapeHtml(note)}</span>`).join("")
    : `<span class="note-chip muted">No notes yet</span>`;
}

function addNote(note) {
  const lane = document.querySelector("#noteSequence");
  if (!lane) return;
  const prefix = lane.value.trim() ? `${lane.value.trim()} ` : "";
  lane.value = `${prefix}${note}`;
  syncNoteChips();
}

function scanSheetToNotes() {
  const lane = document.querySelector("#noteSequence");
  if (!lane) return;
  if (!lane.value.trim()) {
    lane.value = "C4 D4 Eb4 G4 Bb4 C5 Bb4 G4";
  }
  syncNoteChips();
  buildSheetPrompts();
}

function handleSheetFile(file) {
  const preview = document.querySelector("#sheetPreview");
  if (!preview || !file) return;
  sheetFileLabel = file.name;
  if (file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" alt="Uploaded sheet music preview" /><span>${escapeHtml(file.name)}</span>`;
  } else {
    preview.innerHTML = `<strong>${escapeHtml(file.name)}</strong><span>PDF loaded. Use the note lane and keyboard to confirm the phrase.</span>`;
  }
}

function buildSheetPrompts(section = "both") {
  const notes = parseNotes();
  const bpm = document.querySelector("#lottoBpm")?.value || "120";
  const seed = document.querySelector("#lottoSeed")?.value?.trim() || "neon studio session";
  const notePhrase = notes.length ? notes.join(" ") : "C4 D4 Eb4 G4 Bb4 C5";
  const sheetName = sheetFileLabel || "manual note lane";
  const musicPrompt = [
    `Create an original song idea from this note phrase: ${notePhrase}.`,
    `Use ${bpm} BPM, a cinematic futuristic studio mood, and the session seed "${seed}".`,
    "Make it melodic, modern, rhythm-forward, and production-ready. Do not reference real artists.",
    `Source: ${sheetName}.`
  ].join(" ");
  const videoPrompt = [
    `Create a 10-second music-video prompt for a melody built from ${notePhrase}.`,
    "Visualize glowing sheet music becoming holographic piano-roll notes, then audio waves and Beat DNA lines.",
    `Sync motion to ${bpm} BPM with cyan, violet, gold, and deep-black lighting.`,
    "Avoid copyrighted logos, celebrity likenesses, and unreadable text."
  ].join(" ");
  const musicField = document.querySelector("#sheetSunoPrompt");
  const videoField = document.querySelector("#sheetVideoPrompt");
  if (musicField && (section === "music" || section === "both")) musicField.value = musicPrompt;
  if (videoField && (section === "video" || section === "both")) videoField.value = videoPrompt;
  if (section === "music" || section === "both") markTypingOutput(musicField);
  if (section === "video" || section === "both") markTypingOutput(videoField);
}

async function copySheetPrompts() {
  const music = document.querySelector("#sheetSunoPrompt")?.value || "";
  const video = document.querySelector("#sheetVideoPrompt")?.value || "";
  await copyText(`Music Prompt:\n${music}\n\nVideo Prompt:\n${video}`.trim());
  pulseElement(document.querySelector("#copySheetPrompts"));
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


b2lPlayerToggle?.addEventListener("click", toggleBeatPlayback);
b2lPlayerPrev?.addEventListener("click", () => {
  const audio = document.querySelector("#lottoAudioPlayer");
  if (!audio?.src) return;
  audio.currentTime = Math.max(0, audio.currentTime - 15);
  syncB2LLivePlayer();
});
b2lPlayerNext?.addEventListener("click", () => {
  const audio = document.querySelector("#lottoAudioPlayer");
  if (!audio?.src) return;
  const duration = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 15;
  audio.currentTime = Math.min(duration, audio.currentTime + 15);
  syncB2LLivePlayer();
});
["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended"].forEach((eventName) => {
  document.querySelector("#lottoAudioPlayer")?.addEventListener(eventName, syncB2LLivePlayer);
});
document.querySelector("#generateLotto")?.addEventListener("click", renderResults);
document.querySelector("#copyLotto")?.addEventListener("click", copyResults);
document.querySelector("#lottoAudioFile")?.addEventListener("change", (event) => analyzeBeatFile(event.target.files?.[0]));
document.querySelector("#playBeatAudio")?.addEventListener("click", toggleBeatPlayback);
document.querySelector("#lottoAudioPlayer")?.addEventListener("play", handleNativeBeatPlay);
document.querySelector("#lottoAudioPlayer")?.addEventListener("ended", () => {
  setBeatPlaybackButtonState(false);
  setBeatPlaybackStatus("Playback ended. Press play to run it again from the top.");
  stopLiveBeatEnergy();
});
document.querySelector("#lottoAudioPlayer")?.addEventListener("pause", () => {
  if (!document.querySelector("#lottoAudioPlayer")?.ended) {
    setBeatPlaybackButtonState(false);
    stopLiveBeatEnergy();
  }
});
document.querySelector("#sheetMusicFile")?.addEventListener("change", (event) => handleSheetFile(event.target.files?.[0]));
document.querySelector("#scanSheet")?.addEventListener("click", scanSheetToNotes);
document.querySelector("#clearNotes")?.addEventListener("click", () => {
  document.querySelector("#noteSequence").value = "";
  syncNoteChips();
});
document.querySelector("#generateSheetSuno")?.addEventListener("click", () => buildSheetPrompts("music"));
document.querySelector("#generateSheetVideo")?.addEventListener("click", () => buildSheetPrompts("video"));
document.querySelector("#copySheetPrompts")?.addEventListener("click", copySheetPrompts);
document.querySelector("#noteSequence")?.addEventListener("input", syncNoteChips);
document.querySelector("#pianoKeyboard")?.addEventListener("click", (event) => {
  const key = event.target.closest("[data-note]");
  if (key) addNote(key.dataset.note);
});
window.addEventListener("beforeunload", () => {
  if (beatAudioUrl) URL.revokeObjectURL(beatAudioUrl);
});

renderKeyboard();
syncNoteChips();
buildSheetPrompts();
syncB2LLivePlayer();
renderResults();
