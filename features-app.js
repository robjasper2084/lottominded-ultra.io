const year = document.querySelector("#site-year");
if (year) year.textContent = String(new Date().getFullYear());

const studioUrl = "../lottomind-stem-studio/index.html";
const features = [
  { name: "Beat DNA Engine", route: "#beat-dna", color: "rgba(41,247,255,0.28)", copy: "Analyze rhythm, stems, pads, decks, mixer movement, and arrangement into a reusable creative fingerprint." },
  { name: "Stem Studio", route: "#stems", color: "rgba(94,255,157,0.25)", copy: "Load owned stems, trim channels, balance levels, pan, EQ, filter, send, mute, solo, and export maps." },
  { name: "DJ Decks", route: "#dj-decks", color: "rgba(255,79,216,0.25)", copy: "Two local-file decks with cue points, pitch, pitch bend, EQ, filter, crossfader, and recording hooks." },
  { name: "Touch Pads", route: "#pads", color: "rgba(255,224,113,0.26)", copy: "Pressure-aware pads with simulated velocity on regular touch screens, banks, samples, and shortcuts." },
  { name: "16-Level Pads", route: "#pads", color: "rgba(138,92,255,0.26)", copy: "Spread one sound across all pads for velocity, tune, filter, slices, probability, ratchets, and envelope moves." },
  { name: "Song Editor", route: "#song", color: "rgba(41,247,255,0.22)", copy: "Arrange clips, edit sections, sketch scenes, create markers, and bounce local project ideas." },
  { name: "Waveform Studio", route: "#song", color: "rgba(94,255,157,0.22)", copy: "Edit regions, split, crop, fade, normalize, reverse, crossfade, and send audio to other modules." },
  { name: "Piano Roll", route: "#piano-roll", color: "rgba(255,224,113,0.22)", copy: "Write melodies, MIDI sketches, chords, automation notes, and pitched pad performances." },
  { name: "Pattern Editor", route: "#patterns", color: "rgba(255,79,216,0.22)", copy: "Program drums, timing divisions, triplets, probability, swing, ratchets, and loop variations." },
  { name: "AI Master", route: "#ai-master", color: "rgba(41,247,255,0.25)", copy: "Analyze loudness, peaks, EQ balance, dynamics, and build local mastering chains with safe export targets." },
  { name: "Vocal Remover", route: "#vocal-remover", color: "rgba(138,92,255,0.24)", copy: "Create approximate instrumental and acapella versions from audio you own using local browser fallback tools." },
  { name: "Stem Splitter", route: "#stem-splitter", color: "rgba(94,255,157,0.22)", copy: "Split a song into approximate vocals, drums, bass, and other lanes, with local model hooks for later." },
  { name: "Suno Prompt", route: "#suno-prompt", color: "rgba(255,224,113,0.25)", copy: "Turn the current Beat DNA into simple prompts, custom style tags, hook lyrics, instrumentals, and exclusions." },
  { name: "Video Prompt", route: "#video-prompt", color: "rgba(255,79,216,0.24)", copy: "Generate cinematic AI video prompts, platform-ready formats, camera motion, shot lists, and negative prompts." },
  { name: "Beat Lottery", route: "#beat-lottery", color: "rgba(94,255,157,0.24)", copy: "Create beat-seeded entertainment number sets with responsible-play reminders and configurable game formats." },
  { name: "Creative Bundle", route: "#creative-bundle", color: "rgba(41,247,255,0.2)", copy: "Generate Beat DNA, Suno prompt, video prompt, and creative number signals together from one session." },
  { name: "Sampler", route: "#sampler", color: "rgba(255,224,113,0.22)", copy: "Trim samples, preview slices, assign pads, adjust gain, pitch, and playback feel." },
  { name: "How To Drive Manual", href: "./how-to-use.html", color: "rgba(255,224,113,0.25)", copy: "Open the step-by-step guide for studio controls, Beat2Lotto+ audio import, sheet music notes, safety, and prompt workflows." },
  { name: "Open Tools Lab", route: "#help", color: "rgba(138,92,255,0.22)", copy: "See local audio workflow notes, open music tool inspiration, sample licensing, and compatibility roadmap." }
];

const grid = document.querySelector("#featureToolGrid");
if (grid) {
  grid.innerHTML = features.map((feature, index) => `
    <a class="feature-tool-card" href="${feature.href || `${studioUrl}${feature.route}`}" style="--feature-color:${feature.color}" data-feature-index="${index}">
      <h3>${feature.name}</h3>
      <p>${feature.copy}</p>
      <span>Open Module</span>
    </a>
  `).join("");
}

const canvas = document.querySelector("#studio3d");
const nameNode = document.querySelector("#selectedFeatureName");
const copyNode = document.querySelector("#selectedFeatureCopy");
const ctx = canvas?.getContext("2d");
let selected = 0;
let rotation = 0;
let dragging = false;
let lastX = 0;

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(640, Math.floor(rect.width * dpr));
  canvas.height = Math.max(420, Math.floor(rect.height * dpr));
}

function setSelected(index) {
  selected = (index + features.length) % features.length;
  if (nameNode) nameNode.textContent = features[selected].name;
  if (copyNode) copyNode.textContent = features[selected].copy;
}

function drawFeatureConsole() {
  if (!ctx || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.43;
  const radius = Math.min(w, h) * 0.34;

  const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.72);
  grd.addColorStop(0, "rgba(255,224,113,0.18)");
  grd.addColorStop(0.2, "rgba(41,247,255,0.18)");
  grd.addColorStop(0.48, "rgba(8,17,32,0.42)");
  grd.addColorStop(1, "rgba(1,2,7,0.96)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < 18; i++) {
    const x = (i / 17) * w;
    const top = h * (0.08 + ((i * 19) % 11) * 0.014);
    const bottom = h * (0.78 - ((i * 7) % 9) * 0.018);
    ctx.strokeStyle = i % 3 === 0 ? "rgba(255,224,113,0.38)" : "rgba(41,247,255,0.28)";
    ctx.lineWidth = Math.max(1, w * 0.0012);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + Math.sin(i) * 26, bottom);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation * 0.28);
  for (let ring = 0; ring < 5; ring++) {
    ctx.strokeStyle = `rgba(${ring % 2 ? "255,79,216" : "41,247,255"},${0.16 + ring * 0.032})`;
    ctx.lineWidth = 1.4 + ring * 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius + ring * 38, (radius + ring * 38) * 0.31, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  features.forEach((feature, i) => {
    const angle = rotation + (i / features.length) * Math.PI * 2;
    const z = Math.cos(angle);
    const x = cx + Math.sin(angle) * radius;
    const y = cy + z * radius * 0.32;
    const scale = 0.64 + (z + 1) * 0.22;
    const isActive = i === selected;
    const cardW = 176 * scale;
    const cardH = 76 * scale;
    ctx.globalAlpha = 0.5 + (z + 1) * 0.22;
    ctx.shadowBlur = isActive ? 34 : 14;
    ctx.shadowColor = isActive ? "rgba(255,224,113,0.45)" : "rgba(41,247,255,0.18)";
    ctx.fillStyle = isActive ? "rgba(255,224,113,0.28)" : "rgba(8,17,32,0.78)";
    ctx.strokeStyle = isActive ? "rgba(255,224,113,0.9)" : "rgba(41,247,255,0.34)";
    ctx.lineWidth = isActive ? 3.6 : 1.4;
    roundRect(ctx, x - cardW / 2, y - cardH / 2, cardW, cardH, 12 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f8fbff";
    ctx.font = `900 ${Math.max(12, 14.5 * scale)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapLabel(ctx, feature.name, x, y, cardW - 18, 16 * scale);
  });
  ctx.globalAlpha = 1;

  const orb = ctx.createRadialGradient(cx - 24, cy - 32, 5, cx, cy, 92);
  orb.addColorStop(0, "rgba(248,251,255,0.88)");
  orb.addColorStop(0.22, "rgba(41,247,255,0.58)");
  orb.addColorStop(0.62, "rgba(138,92,255,0.36)");
  orb.addColorStop(1, "rgba(3,5,10,0.68)");
  ctx.shadowBlur = 38;
  ctx.shadowColor = "rgba(41,247,255,0.42)";
  ctx.fillStyle = orb;
  ctx.strokeStyle = "rgba(255,224,113,0.84)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(41,247,255,0.44)";
  ctx.lineWidth = 1.4;
  for (let ring = 0; ring < 3; ring++) {
    ctx.beginPath();
    ctx.arc(cx, cy, 100 + ring * 20, rotation * (ring + 1), rotation * (ring + 1) + Math.PI * 1.35);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffe071";
  ctx.font = "900 42px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LM", cx, cy - 6);
  ctx.fillStyle = "rgba(248,251,255,0.86)";
  ctx.font = "800 13px Arial, sans-serif";
  ctx.fillText("OPEN MODULE", cx, cy + 38);

  rotation += dragging ? 0 : 0.0028;
  requestAnimationFrame(drawFeatureConsole);
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function wrapLabel(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((entry, index) => context.fillText(entry, x, startY + index * lineHeight));
}

canvas?.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});

canvas?.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const delta = event.clientX - lastX;
  lastX = event.clientX;
  rotation += delta * 0.006;
  const index = Math.round((((rotation / (Math.PI * 2)) % 1 + 1) % 1) * features.length) % features.length;
  setSelected(features.length - index);
});

canvas?.addEventListener("pointerup", (event) => {
  dragging = false;
  canvas.releasePointerCapture?.(event.pointerId);
});

canvas?.addEventListener("click", () => {
  window.location.href = `${studioUrl}${features[selected].route}`;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") setSelected(selected + 1);
  if (event.key === "ArrowLeft") setSelected(selected - 1);
  if (event.key === "Enter" && document.activeElement === canvas) {
    window.location.href = `${studioUrl}${features[selected].route}`;
  }
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
setSelected(0);
requestAnimationFrame(drawFeatureConsole);
