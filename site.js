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
const domainStrip = document.querySelector(".domain-strip");
const gamePip = document.querySelector("[data-game-pip]");
const gamePipClose = document.querySelector("[data-game-pip-close]");
const gamePipFrame = gamePip?.querySelector("iframe");
const gamePipHead = gamePip?.querySelector(".home-game-pip-head");
const memberForm = document.querySelector("[data-member-form]");
const memberDownload = document.querySelector("[data-member-download]");
const memberMessage = document.querySelector("[data-member-message]");
const compactHeaderLabels =
  document.body.classList.contains("prompt-lab-page") ||
  document.body.classList.contains("home-page") ||
  document.body.classList.contains("merch-store-page") ||
  document.body.classList.contains("feature-console-page");
const conciseSoundtrackLabels = document.body.classList.contains("home-page");
const HEADER_COLLAPSED_KEY = "lottominded.ultra.siteHeaderCollapsed.v1";
const MEMBER_SIGNUP_KEY = "lottominded.ultra.memberSignup.v1";
const SUPPORT_EMAIL = "robjasper2084@gmail.com";
let soundtrackStartedFromPage = false;
let soundtrackStartedFromHover = false;
let gamePipHideTimer = 0;
let gamePipOpenedAt = 0;
let gamePipShouldResumeSoundtrack = false;
let gamePipResumeFromPage = false;
let gamePipResumeFromHover = false;
let gamePipDragState = null;
if (siteSoundtrack) {
  siteSoundtrack.loop = false;
  siteSoundtrack.removeAttribute("loop");
  siteSoundtrack.addEventListener("ended", () => {
    soundtrackStartedFromPage = false;
    soundtrackStartedFromHover = false;
    setSoundtrackButtonState(false);
  });
}
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
  headerToggle.textContent = collapsed ? "Show Menu" : compactHeaderLabels ? "Menu" : "Shrink Menu";
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
  playSiteSoundtrack({ fromPage: true });
}

function getGamePipOffset() {
  if (!gamePip) return { x: 0, y: 0 };
  const styles = getComputedStyle(gamePip);
  return {
    x: parseFloat(styles.getPropertyValue("--game-pip-x")) || 0,
    y: parseFloat(styles.getPropertyValue("--game-pip-y")) || 0,
  };
}

function clampGamePipOffset(x, y) {
  if (!gamePip) return { x, y };
  const margin = 12;
  const rect = gamePip.getBoundingClientRect();
  const baseLeft = (window.innerWidth - rect.width) / 2;
  const baseTop = (window.innerHeight - rect.height) / 2;
  const minX = margin - baseLeft;
  const maxX = window.innerWidth - margin - rect.width - baseLeft;
  const minY = margin - baseTop;
  const maxY = window.innerHeight - margin - rect.height - baseTop;
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

function setGamePipOffset(x, y) {
  if (!gamePip) return;
  const next = clampGamePipOffset(x, y);
  gamePip.style.setProperty("--game-pip-x", `${Math.round(next.x)}px`);
  gamePip.style.setProperty("--game-pip-y", `${Math.round(next.y)}px`);
}

function showGamePip() {
  if (!gamePip) return;
  if (gamePip.classList.contains("is-open")) return;
  window.clearTimeout(gamePipHideTimer);
  if (gamePipFrame && !gamePipFrame.getAttribute("src")) {
    gamePipFrame.setAttribute("src", gamePipFrame.dataset.src || "");
  }
  gamePip.classList.add("is-open");
  gamePip.setAttribute("aria-hidden", "false");
  gamePipOpenedAt = Date.now();
  if (siteSoundtrack) {
    gamePipShouldResumeSoundtrack = !siteSoundtrack.paused;
    gamePipResumeFromPage = soundtrackStartedFromPage;
    gamePipResumeFromHover = soundtrackStartedFromHover;
    siteSoundtrack.pause();
    soundtrackStartedFromHover = false;
    setSoundtrackButtonState(false);
  }
}

function resumeGamePipSoundtrack() {
  if (!siteSoundtrack || !gamePipShouldResumeSoundtrack) return;
  playSiteSoundtrack({
    fromPage: gamePipResumeFromPage,
    fromHover: gamePipResumeFromHover,
    volume: siteSoundtrack.volume || 0.42,
  });
}

function hideGamePip(options = {}) {
  if (!gamePip) return;
  gamePip.classList.remove("is-open");
  gamePip.setAttribute("aria-hidden", "true");
  if (gamePipFrame) gamePipFrame.removeAttribute("src");
  if (options.resumeSoundtrack) resumeGamePipSoundtrack();
  gamePipShouldResumeSoundtrack = false;
  gamePipResumeFromPage = false;
  gamePipResumeFromHover = false;
}

function scheduleHideGamePip() {
  window.clearTimeout(gamePipHideTimer);
  gamePipHideTimer = window.setTimeout(hideGamePip, 260);
}

function startGamePipDrag(event) {
  if (!gamePip || event.target.closest("[data-game-pip-close]")) return;
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  const offset = getGamePipOffset();
  gamePipDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: offset.x,
    offsetY: offset.y,
  };
  gamePip.classList.add("is-dragging");
  gamePipHead?.setPointerCapture?.(event.pointerId);
}

function updateGamePipDrag(event) {
  if (!gamePipDragState || event.pointerId !== gamePipDragState.pointerId) return;
  setGamePipOffset(
    gamePipDragState.offsetX + event.clientX - gamePipDragState.startX,
    gamePipDragState.offsetY + event.clientY - gamePipDragState.startY,
  );
}

function endGamePipDrag(event) {
  if (!gamePipDragState || event.pointerId !== gamePipDragState.pointerId) return;
  gamePipDragState = null;
  gamePip?.classList.remove("is-dragging");
  gamePipHead?.releasePointerCapture?.(event.pointerId);
}

startupVideoClose?.addEventListener("click", closeStartupVideo);
startupVideoModal?.addEventListener("click", (event) => {
  if (event.target === startupVideoModal) closeStartupVideo();
});

function isEditableTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !isEditableTarget(event.target)) {
    const soundtrackToggle = event.target?.closest?.("[data-soundtrack-toggle]");
    if (soundtrackToggle || document.body.classList.contains("home-page")) {
      event.preventDefault();
      if (soundtrackToggle) event.stopPropagation();
    }
  }
  if (event.key === "Escape" && !startupVideoModal?.classList.contains("is-hidden")) {
    closeStartupVideo();
  }
  if (event.key === "Escape" && gamePip?.classList.contains("is-open")) {
    hideGamePip({ resumeSoundtrack: true });
  }
});

function setSoundtrackButtonState(isPlaying, blocked = false) {
  soundtrackButtons.forEach((button) => {
    const defaultPlayLabel = conciseSoundtrackLabels ? "Demo Music" : "Play Demo Music";
    const defaultPauseLabel = conciseSoundtrackLabels ? "Pause Music" : "Pause Demo Music";
    const playLabel = button.dataset.soundtrackPlayLabel || defaultPlayLabel;
    const pauseLabel = button.dataset.soundtrackPauseLabel || defaultPauseLabel;
    button.textContent = blocked ? playLabel : isPlaying ? pauseLabel : playLabel;
    button.setAttribute("aria-pressed", String(isPlaying));
  });
}

async function playSiteSoundtrack(options = {}) {
  if (!siteSoundtrack) return;
  try {
    siteSoundtrack.volume = options.volume ?? 0.42;
    await siteSoundtrack.play();
    if (options.fromPage) soundtrackStartedFromPage = true;
    if (options.fromHover) soundtrackStartedFromHover = true;
    setSoundtrackButtonState(true);
  } catch {
    setSoundtrackButtonState(false, true);
  }
}

soundtrackButtons.forEach((button) => {
  button.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      event.stopPropagation();
    }
  });
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

domainStrip?.addEventListener("pointerenter", () => {
  if (gamePipDragState) return;
  if (gamePip?.classList.contains("is-open")) {
    if (Date.now() - gamePipOpenedAt > 400) {
      hideGamePip({ resumeSoundtrack: true });
    }
    return;
  }
  showGamePip();
});

gamePip?.addEventListener("pointerenter", () => window.clearTimeout(gamePipHideTimer));
gamePipClose?.addEventListener("click", () => hideGamePip({ resumeSoundtrack: true }));
gamePipHead?.addEventListener("pointerdown", startGamePipDrag);
document.addEventListener("pointermove", updateGamePipDrag);
document.addEventListener("pointerup", endGamePipDrag);
document.addEventListener("pointercancel", endGamePipDrag);
window.addEventListener("resize", () => {
  if (!gamePip) return;
  const offset = getGamePipOffset();
  setGamePipOffset(offset.x, offset.y);
});

function setMemberDownloadUnlocked(unlocked, profile = null) {
  if (!memberDownload) return;
  memberDownload.classList.toggle("is-locked", !unlocked);
  memberDownload.setAttribute("aria-disabled", String(!unlocked));
  memberDownload.textContent = unlocked ? "Download Test Build" : "Sign up to download";
  if (memberMessage) {
    memberMessage.textContent = unlocked
      ? `Unlocked for ${profile?.name || "member"}. Download the test ZIP or share the live GitHub Pages preview.`
      : "Members get the download link after signup.";
  }
}

function openSupportMailDraft(subject, fields) {
  const body = [
    subject,
    "",
    ...Object.entries(fields).map(([label, value]) => `${label}: ${String(value).trim()}`),
    "",
    `Sent from ${window.location.href}`
  ].join("\n");
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

let storedMemberProfile = null;
try {
  storedMemberProfile = JSON.parse(localStorage.getItem(MEMBER_SIGNUP_KEY) || "null");
} catch {
  storedMemberProfile = null;
}

setMemberDownloadUnlocked(Boolean(storedMemberProfile?.email), storedMemberProfile);

memberForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(memberForm);
  const profile = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    focus: String(formData.get("focus") || "").trim(),
    joinedAt: new Date().toISOString()
  };
  if (!profile.name || !profile.email || !profile.focus || !memberForm.checkValidity()) {
    memberForm.reportValidity();
    return;
  }
  localStorage.setItem(MEMBER_SIGNUP_KEY, JSON.stringify(profile));
  setMemberDownloadUnlocked(true, profile);
  if (memberMessage) {
    memberMessage.textContent = "Download unlocked. An email draft to robjasper2084@gmail.com is opening so the signup can be sent.";
  }
  openSupportMailDraft("LOTTOMINDED ULTRA Member Signup", {
    Name: profile.name,
    Email: profile.email,
    "Testing focus": profile.focus,
    Permission: "Confirmed test-build and owned-media notice",
    Joined: profile.joinedAt
  });
});

memberDownload?.addEventListener("click", (event) => {
  if (memberDownload.getAttribute("aria-disabled") !== "true") return;
  event.preventDefault();
  memberForm?.querySelector("input, select, button")?.focus();
  memberForm?.reportValidity();
});

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
