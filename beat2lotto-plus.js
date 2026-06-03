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
    <article class="lotto-set-card">
      <strong>Set ${index + 1} - ${game.label}</strong>
      <div class="lotto-number-row">
        ${set.main.map((number) => `<span class="lotto-ball">${game.type === "digits" ? number : String(number).padStart(2, "0")}</span>`).join("")}
        ${set.special ? `<span class="lotto-ball special">${set.special}</span>` : ""}
      </div>
      <p class="lotto-note">${method}. Beat-seeded entertainment picks. Creative number generation. Not a prediction.</p>
      <p class="lotto-note">Game rules, matrices, draw times, prizes, and eligibility vary by jurisdiction. Verify with the official lottery before playing.</p>
    </article>
  `).join("");
}

async function copyResults() {
  const text = document.querySelector("#lottoOutput").dataset.copyText || "";
  if (!text) return;
  await copyText(text);
}

async function analyzeBeatFile(file) {
  const status = document.querySelector("#beatAnalysis");
  if (!file || !status) return;
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
    renderResults();
  } catch (error) {
    importedBeatAnalysis = null;
    window.clearInterval(beatPulseTimer);
    status.innerHTML = `<strong>Audio could not be decoded</strong><span>Try a browser-supported WAV, MP3, M4A, or OGG file.</span>`;
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
}

async function copySheetPrompts() {
  const music = document.querySelector("#sheetSunoPrompt")?.value || "";
  const video = document.querySelector("#sheetVideoPrompt")?.value || "";
  await copyText(`Music Prompt:\n${music}\n\nVideo Prompt:\n${video}`.trim());
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

document.querySelector("#generateLotto")?.addEventListener("click", renderResults);
document.querySelector("#copyLotto")?.addEventListener("click", copyResults);
document.querySelector("#lottoAudioFile")?.addEventListener("change", (event) => analyzeBeatFile(event.target.files?.[0]));
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

renderKeyboard();
syncNoteChips();
buildSheetPrompts();
renderResults();
