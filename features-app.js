const year = document.querySelector("#site-year");
if (year) year.textContent = String(new Date().getFullYear());

const studioUrl = "./lottomind-stem-studio/index.html";
const supportEmail = "robjasper2084@gmail.com";
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
  { name: "Lottery Spheres", href: "./lottery-spheres.html#spheres", color: "rgba(255,224,113,0.3)", copy: "Open the interactive branded sphere room for floating lottery balls, pointer motion, and creative signal rerolls." },
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

const featuredList = document.querySelector("#featuredModuleList");
if (featuredList) {
  featuredList.innerHTML = features.slice(0, 5).map((feature) => `
    <a href="${feature.href || `${studioUrl}${feature.route}`}" style="--feature-color:${feature.color}">
      <strong>${feature.name}</strong>
      <span>${feature.copy}</span>
    </a>
  `).join("");
}

function formatLabel(key) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildMailto(subject, entries) {
  const lines = entries.map(([key, value]) => `${formatLabel(key)}: ${String(value).trim()}`);
  const body = [
    subject,
    "",
    ...lines,
    "",
    `Sent from ${window.location.href}`
  ].join("\n");
  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

document.querySelectorAll("[data-feature-mail-form]").forEach((form) => {
  const status = form.querySelector("[data-mail-status]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const entries = Array.from(formData.entries()).filter(([, value]) => String(value).trim());
    const subject = form.dataset.mailSubject || "LOTTOMINDED ULTRA Website Message";

    if (status) {
      status.textContent = "Opening an email draft to robjasper2084@gmail.com. Send it to finish.";
    }
    window.location.href = buildMailto(subject, entries);
    form.reset();
  });
});
