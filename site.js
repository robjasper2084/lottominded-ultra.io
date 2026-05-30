const year = document.querySelector("#site-year");
if (year) year.textContent = String(new Date().getFullYear());

const heroMotion = document.querySelector(".hero-motion");
const kineticHero = document.querySelector("[data-kinetic-hero]");
const revealSections = document.querySelectorAll("[data-reveal]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteHeader = document.querySelector("[data-site-header]");
const headerToggle = document.querySelector("[data-header-toggle]");
const siteBackButton = document.querySelector("[data-site-back]");
const siteSoundtrack = document.querySelector("#siteSoundtrack");
const soundtrackButtons = document.querySelectorAll("[data-soundtrack-toggle]");
const startupVideoModal = document.querySelector("[data-startup-video]");
const startupVideoClose = document.querySelector("[data-startup-video-close]");
const startupVideoPlayer = startupVideoModal?.querySelector("video");
const HEADER_COLLAPSED_KEY = "lottominded.ultra.siteHeaderCollapsed.v1";
const miniGameConfigs = {
  pick3: { label: "Pick 3", type: "digits", count: 3, min: 0, max: 9 },
  pick4: { label: "Pick 4", type: "digits", count: 4, min: 0, max: 9 },
  cash5: { label: "Cash 5", type: "matrix", count: 5, min: 1, max: 39 },
  powerball: { label: "Powerball Style", type: "special", count: 5, min: 1, max: 69, special: "Powerball", sMin: 1, sMax: 26 }
};

function setHeaderCollapsed(collapsed) {
  if (!siteHeader || !headerToggle) return;
  siteHeader.classList.toggle("is-collapsed", collapsed);
  headerToggle.setAttribute("aria-expanded", String(!collapsed));
  headerToggle.textContent = collapsed ? "Expand Menu" : "Shrink Menu";
  localStorage.setItem(HEADER_COLLAPSED_KEY, collapsed ? "true" : "false");
}

function syncHeroMotionPreference() {
  if (!heroMotion) return;
  if (reducedMotionQuery.matches) {
    heroMotion.pause();
    return;
  }
  heroMotion.play().catch(() => {
    // Some static-file previews block autoplay until the user interacts.
  });
}

reducedMotionQuery.addEventListener?.("change", syncHeroMotionPreference);
syncHeroMotionPreference();

if (kineticHero && !reducedMotionQuery.matches) {
  kineticHero.addEventListener("pointermove", (event) => {
    const rect = kineticHero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    kineticHero.style.setProperty("--mx", `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
    kineticHero.style.setProperty("--my", `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
  });
}

if ("IntersectionObserver" in window && revealSections.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );
  revealSections.forEach((section) => revealObserver.observe(section));
} else {
  revealSections.forEach((section) => section.classList.add("is-visible"));
}

setHeaderCollapsed(localStorage.getItem(HEADER_COLLAPSED_KEY) === "true");
headerToggle?.addEventListener("click", () => {
  setHeaderCollapsed(!siteHeader.classList.contains("is-collapsed"));
});

siteBackButton?.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = "./";
});

function closeStartupVideo() {
  startupVideoModal?.classList.add("is-hidden");
  startupVideoPlayer?.pause();
}

startupVideoClose?.addEventListener("click", closeStartupVideo);
startupVideoModal?.addEventListener("click", (event) => {
  if (event.target === startupVideoModal) closeStartupVideo();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !startupVideoModal?.classList.contains("is-hidden")) {
    closeStartupVideo();
  }
});

function setSoundtrackButtonState(isPlaying, blocked = false) {
  soundtrackButtons.forEach((button) => {
    button.textContent = blocked ? "Play Demo Music" : isPlaying ? "Pause Demo Music" : "Play Demo Music";
    button.setAttribute("aria-pressed", String(isPlaying));
  });
}

async function playSiteSoundtrack() {
  if (!siteSoundtrack) return;
  try {
    siteSoundtrack.volume = 0.32;
    await siteSoundtrack.play();
    setSoundtrackButtonState(true);
  } catch {
    setSoundtrackButtonState(false, true);
  }
}

soundtrackButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!siteSoundtrack) return;
    if (siteSoundtrack.paused) {
      await playSiteSoundtrack();
    } else {
      siteSoundtrack.pause();
      setSoundtrackButtonState(false);
    }
  });
});

window.setTimeout(playSiteSoundtrack, 600);

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

function generateMiniLottoSet(rng, game) {
  if (game.type === "digits") {
    return Array.from({ length: game.count }, () => drawNumber(rng, game.min, game.max)).join("-");
  }
  const main = [];
  while (main.length < game.count) {
    const next = drawNumber(rng, game.min, game.max);
    if (!main.includes(next)) main.push(next);
  }
  main.sort((a, b) => a - b);
  const mainText = main.map((number) => String(number).padStart(2, "0")).join(" ");
  if (game.type !== "special") return mainText;
  return `${mainText} | ${game.special} ${drawNumber(rng, game.sMin, game.sMax)}`;
}

function generateMiniSunoPrompt() {
  const beat = document.querySelector("#miniSunoBeat")?.value?.trim() || "neon drums and bass";
  const mood = document.querySelector("#miniSunoMood")?.value?.trim() || "cinematic futuristic R&B";
  const bpm = document.querySelector("#miniSunoBpm")?.value || "120";
  const output = document.querySelector("#miniSunoOutput");
  if (!output) return;
  output.value = [
    `Create an original ${bpm} BPM song inspired by this beat DNA: ${beat}.`,
    `Style language: ${mood}, polished modern production, deep low end, glowing synth texture, memorable hook, dynamic arrangement.`,
    "Arrangement: 8-bar intro, verse groove, pre-hook lift, hook/drop, short bridge, final chorus.",
    "Lyrics: original only, no real artist names, no copyrighted lines. Keep it emotionally direct and performance-ready.",
    "Exclude: muddy mix, off-key vocals, weak drums, crowded lyrics, copyrighted references."
  ].join(" ");
}

function generateMiniVideoPrompt() {
  const subject = document.querySelector("#miniVideoSubject")?.value?.trim() || "futuristic producer";
  const location = document.querySelector("#miniVideoLocation")?.value?.trim() || "neon studio";
  const motion = document.querySelector("#miniVideoMotion")?.value?.trim() || "dolly-in and orbit";
  const output = document.querySelector("#miniVideoOutput");
  if (!output) return;
  output.value = [
    `Create a cinematic 10-second 16:9 music-video prompt. Subject: ${subject}.`,
    `Scene: ${location} with holographic waveforms, glowing pads, mixer meters, Beat DNA lines, cyan/violet/gold light, glossy reflections, and dramatic haze.`,
    `Camera: ${motion}. Editing: beat-synced cuts on kick and snare, spark trails on hi-hats, bass pulses through the floor.`,
    "Keep characters generic and original. Avoid celebrity likenesses, copyrighted logos, watermark text, and artist imitation.",
    "Negative prompt: blurry, low quality, warped hands, unreadable text, random logos, watermark, inconsistent subject, off-beat motion."
  ].join(" ");
}

function generateMiniNumberSignals() {
  const seed = document.querySelector("#miniLottoSeed")?.value?.trim() || "lottominded ultra";
  const game = miniGameConfigs[document.querySelector("#miniLottoGame")?.value] || miniGameConfigs.pick3;
  const rng = seededRandom(hashString(`${seed}|${game.label}|${Date.now()}`));
  const sets = Array.from({ length: 5 }, (_, index) => `Set ${index + 1}: ${generateMiniLottoSet(rng, game)}`);
  const output = document.querySelector("#miniLottoOutput");
  if (!output) return;
  output.value = [
    `${game.label} - Beat-seeded entertainment picks`,
    "Creative number generation. Not a prediction.",
    ...sets,
    "Lottery outcomes are random. Verify game rules, matrices, draw times, prizes, and eligibility with official lottery sources before playing."
  ].join("\n");
}

async function copyFieldValue(fieldId) {
  const field = document.querySelector(`#${fieldId}`);
  if (!field?.value) return;
  try {
    await navigator.clipboard.writeText(field.value);
  } catch {
    field.select();
    document.execCommand("copy");
  }
}

document.addEventListener("click", (event) => {
  const miniAction = event.target.closest("[data-mini-action]")?.dataset.miniAction;
  if (miniAction === "suno") generateMiniSunoPrompt();
  if (miniAction === "video") generateMiniVideoPrompt();
  if (miniAction === "numbers") generateMiniNumberSignals();
  const copyTarget = event.target.closest("[data-copy-target]")?.dataset.copyTarget;
  if (copyTarget) copyFieldValue(copyTarget);
});

generateMiniSunoPrompt();
generateMiniVideoPrompt();
generateMiniNumberSignals();
