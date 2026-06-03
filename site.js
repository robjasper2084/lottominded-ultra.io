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
const inlineSoundVideos = document.querySelectorAll("[data-inline-sound-video]");
const memberForm = document.querySelector("[data-member-form]");
const memberDownload = document.querySelector("[data-member-download]");
const memberMessage = document.querySelector("[data-member-message]");
const compactHeaderLabels =
  document.body.classList.contains("prompt-lab-page") ||
  document.body.classList.contains("home-page") ||
  document.body.classList.contains("merch-store-page") ||
  document.body.classList.contains("feature-console-page") ||
  document.body.classList.contains("manual-page");
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

function setupNavKineticLabels() {
  document.querySelectorAll(".site-header nav a").forEach((link) => {
    if (!link.dataset.navLabel) link.dataset.navLabel = link.textContent.trim();
  });
}

setupNavKineticLabels();

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

function setupMerchAkariField() {
  const dropSection = document.querySelector("[data-merch-akari]");
  if (!dropSection) return;

  const setDropPointer = (event) => {
    const rect = dropSection.getBoundingClientRect();
    const localX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const localY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    dropSection.classList.add("is-akari-hot");
    dropSection.style.setProperty("--drop-light-x", `${(localX * 100).toFixed(2)}%`);
    dropSection.style.setProperty("--drop-light-y", `${(localY * 100).toFixed(2)}%`);
    const shiftX = (localX - 0.5) * 42;
    const shiftY = (localY - 0.5) * 28;
    dropSection.style.setProperty("--drop-field-x", `${shiftX.toFixed(2)}px`);
    dropSection.style.setProperty("--drop-field-y", `${shiftY.toFixed(2)}px`);
    dropSection.style.setProperty("--drop-field-rx", `${(shiftX * -0.35).toFixed(2)}px`);
    dropSection.style.setProperty("--drop-field-ry", `${(shiftY * -0.35).toFixed(2)}px`);
    dropSection.style.setProperty("--drop-field-tilt", `${((localX - 0.5) * 1.4).toFixed(2)}deg`);
  };

  dropSection.addEventListener("pointerenter", (event) => {
    dropSection.classList.add("is-akari-hot");
    setDropPointer(event);
  }, { passive: true });
  dropSection.addEventListener("pointermove", setDropPointer, { passive: true });
  dropSection.addEventListener("pointerleave", () => {
    dropSection.classList.remove("is-akari-hot");
  }, { passive: true });
}

setupMerchAkariField();

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

function setupInlineSoundVideos() {
  inlineSoundVideos.forEach((video) => {
    video.controls = true;
    video.playsInline = true;
    const soundSurface =
      video.closest("[data-inline-sound-card]") ||
      video.closest(".prompt-video-card, .prompt-video-panel, .merch-drop-video") ||
      video;
    const soundButton = soundSurface.querySelector("[data-inline-sound-button]");

    const setSoundButtonState = (active) => {
      if (!soundButton) return;
      soundButton.classList.toggle("is-active", active);
      soundButton.setAttribute("aria-pressed", String(active));
    };

    setSoundButtonState(false);

    const playWithSound = async () => {
      document.querySelectorAll("audio, video").forEach((media) => {
        if (media === video) return;
        const isSiteAudio =
          media.id === "siteSoundtrack" ||
          media.closest("[data-startup-video]") ||
          media.classList.contains("startup-video-player");
        if (media.tagName === "AUDIO" || isSiteAudio || !media.muted) {
          media.pause();
        }
      });

      try {
        video.muted = false;
        video.volume = Number(video.dataset.inlineSoundVolume || 0.82);
        await video.play();
        video.classList.add("is-sound-active");
        setSoundButtonState(true);
      } catch {
        video.controls = true;
        video.classList.remove("is-sound-active");
        setSoundButtonState(!video.muted);
      }
    };

    video.addEventListener("click", playWithSound);
    if (soundSurface !== video) {
      soundSurface.addEventListener("click", playWithSound);
    }
    soundButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      playWithSound();
    });
    video.addEventListener("focus", playWithSound);
    if (video.dataset.inlineSoundHover === "true") {
      video.addEventListener("pointerenter", playWithSound, { passive: true });
    }
  });
}

setupInlineSoundVideos();

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

function setupGuidePuckField() {
  const field = document.querySelector("[data-guide-puck-field]");
  if (!field) return;

  const pucks = Array.from(field.querySelectorAll(".branded-puck"));
  if (!pucks.length) return;

  field.classList.add("is-reactive");
  const pointer = {
    x: window.innerWidth * 0.52,
    y: window.innerHeight * 0.42,
    active: false,
    lastMove: 0,
  };

  const puckState = pucks.map((element, index) => {
    const columns = Math.min(3, pucks.length);
    const row = Math.floor(index / columns);
    const column = index % columns;
    const baseX = window.innerWidth * (0.12 + column * 0.34);
    const baseY = window.innerHeight * (0.18 + row * 0.3);
    return {
      element,
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      vx: (index % 2 ? 0.28 : -0.22),
      vy: (index % 3 ? -0.18 : 0.22),
      rotation: index * 24 - 18,
      spin: (index % 2 ? 0.18 : -0.14),
      size: 150 + index * 26,
    };
  });

  function resizeGuideField() {
    puckState.forEach((puck, index) => {
      const columns = Math.min(3, pucks.length);
      const row = Math.floor(index / columns);
      const column = index % columns;
      puck.baseX = window.innerWidth * (0.12 + column * 0.34);
      puck.baseY = window.innerHeight * (0.18 + row * 0.3);
      puck.size = Math.max(110, Math.min(320, 130 + window.innerWidth * 0.035 + index * 22));
      puck.element.style.setProperty("--puck-size", `${puck.size}px`);
    });
  }

  function moveGuidePointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    pointer.lastMove = performance.now();
    field.style.setProperty("--guide-pointer-x", `${event.clientX}px`);
    field.style.setProperty("--guide-pointer-y", `${event.clientY}px`);
    field.style.setProperty("--guide-field-x", `${(event.clientX / window.innerWidth - 0.5) * 24}px`);
    field.style.setProperty("--guide-field-y", `${(event.clientY / window.innerHeight - 0.5) * 18}px`);
    document.body.style.setProperty("--guide-pointer-x", `${event.clientX}px`);
    document.body.style.setProperty("--guide-pointer-y", `${event.clientY}px`);
  }

  function renderGuideField(now) {
    const hot = pointer.active && now - pointer.lastMove < 1600;
    const driftScale = reducedMotionQuery.matches ? 0 : 1;

    puckState.forEach((puck, index) => {
      const orbitX = Math.cos(now * 0.00032 + index) * 42 * driftScale;
      const orbitY = Math.sin(now * 0.00028 + index * 1.7) * 34 * driftScale;
      const targetX = puck.baseX + orbitX;
      const targetY = puck.baseY + orbitY;

      puck.vx += (targetX - puck.x) * 0.006;
      puck.vy += (targetY - puck.y) * 0.006;

      if (hot && !reducedMotionQuery.matches) {
        const dx = puck.x + puck.size * 0.5 - pointer.x;
        const dy = puck.y + puck.size * 0.5 - pointer.y;
        const distance = Math.max(80, Math.hypot(dx, dy));
        const force = Math.min(1, 280 / distance) * 0.42;
        puck.vx += (dx / distance) * force;
        puck.vy += (dy / distance) * force;
      }

      puck.vx *= 0.88;
      puck.vy *= 0.88;
      puck.x += puck.vx;
      puck.y += puck.vy;
      puck.rotation += puck.spin * driftScale + puck.vx * 0.08;

      puck.element.classList.toggle("is-hot", hot);
      puck.element.style.transform = `translate3d(${puck.x}px, ${puck.y}px, 0) rotate(${puck.rotation}deg)`;
    });

    window.requestAnimationFrame(renderGuideField);
  }

  resizeGuideField();
  document.addEventListener("pointermove", moveGuidePointer, { passive: true });
  window.addEventListener("resize", resizeGuideField, { passive: true });
  window.requestAnimationFrame(renderGuideField);
}

setupGuidePuckField();

function setupInstrumentKeyboard() {
  const keyboard = document.querySelector("[data-instrument-keyboard]");
  if (!keyboard) return;

  const noteFreq = {
    C4: 261.63,
    "C#4": 277.18,
    D4: 293.66,
    "D#4": 311.13,
    E4: 329.63,
    F4: 349.23,
    "F#4": 369.99,
    G4: 392,
    "G#4": 415.3,
    A4: 440,
    "A#4": 466.16,
    B4: 493.88,
    C5: 523.25,
  };
  let audioContext = null;
  let scaleTimer = 0;

  function getKeyboardAudio() {
    if (!audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      audioContext = new AudioContextCtor();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  }

  function playKeyboardNote(noteName, duration = 0.42, peak = 0.16) {
    const frequency = noteFreq[noteName];
    const context = getKeyboardAudio();
    if (!frequency || !context) return;

    const now = context.currentTime;
    const osc = context.createOscillator();
    const body = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const bodyGain = context.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, now);
    body.type = "sine";
    body.frequency.setValueAtTime(frequency / 2, now);
    bodyGain.gain.setValueAtTime(0.035, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(920, now + duration);
    filter.Q.setValueAtTime(0.86, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(peak * 0.44, now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    body.connect(bodyGain);
    bodyGain.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    body.start(now);
    osc.stop(now + duration + 0.04);
    body.stop(now + duration + 0.04);
  }

  function setKeyPressed(key, pressed) {
    key.classList.toggle("is-pressed", Boolean(pressed));
  }

  function playScale(scaleKey) {
    const scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
    window.clearInterval(scaleTimer);
    let index = 0;
    scaleKey.classList.add("is-demo-active");
    playKeyboardNote(scale[index], 0.28, 0.12);
    index += 1;
    scaleTimer = window.setInterval(() => {
      playKeyboardNote(scale[index], 0.28, 0.12);
      index += 1;
      if (index >= scale.length) {
        window.clearInterval(scaleTimer);
        scaleTimer = 0;
        scaleKey.classList.remove("is-demo-active");
      }
    }, 190);
  }

  function routeInstrumentKey(key) {
    const action = key.dataset.action;
    if (action === "toggle-scale") {
      playScale(key);
      return;
    }
    if (action === "back") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "./index.html";
      }
      return;
    }
    const target = key.dataset.href || key.getAttribute("href");
    if (target) window.location.href = target;
  }

  keyboard.querySelectorAll("[data-note]").forEach((key) => {
    key.addEventListener("pointerenter", () => playKeyboardNote(key.dataset.note, 0.22, 0.075), { passive: true });
    key.addEventListener("pointerdown", () => {
      playKeyboardNote(key.dataset.note);
      setKeyPressed(key, true);
    });
    key.addEventListener("pointerup", () => setKeyPressed(key, false));
    key.addEventListener("pointercancel", () => setKeyPressed(key, false));
    key.addEventListener("pointerleave", () => setKeyPressed(key, false));
    key.addEventListener("click", (event) => {
      event.preventDefault();
      setKeyPressed(key, true);
      window.setTimeout(() => {
        setKeyPressed(key, false);
        routeInstrumentKey(key);
      }, 120);
    });
    key.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      playKeyboardNote(key.dataset.note);
      routeInstrumentKey(key);
    });
  });

  window.addEventListener("pagehide", () => window.clearInterval(scaleTimer));
}

setupInstrumentKeyboard();

function setupPromptBallpassGame() {
  const game = document.querySelector("[data-ballpass-game]");
  const canvas = game?.querySelector("[data-ballpass-canvas]");
  if (!game || !canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const puck = new Image();
  puck.src = "./assets/brand/lottomind-branded-puck.png";

  const pointer = { x: 0.72, y: 0.48, active: false, burst: 0 };
  const balls = Array.from({ length: 9 }, (_, index) => ({
    t: index / 9,
    speed: 0.00012 + index * 0.00001,
    radius: 12 + (index % 3) * 5,
    color: index % 2 ? "#ffe071" : "#29f7ff",
  }));

  function resizeBallpass() {
    const rect = game.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawBallpass(now) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) {
      window.requestAnimationFrame(drawBallpass);
      return;
    }

    context.clearRect(0, 0, width, height);
    const centerX = width * 0.54;
    const centerY = height * 0.52;
    const pointerX = pointer.x * width;
    const pointerY = pointer.y * height;
    const laneRadiusX = width * 0.34;
    const laneRadiusY = height * 0.28;

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineWidth = 2;
    context.strokeStyle = "rgba(41, 247, 255, 0.22)";
    for (let i = 0; i < 4; i += 1) {
      context.beginPath();
      context.ellipse(centerX, centerY, laneRadiusX - i * 28, laneRadiusY - i * 18, -0.22, 0, Math.PI * 2);
      context.stroke();
    }

    balls.forEach((ball, index) => {
      const drift = reducedMotionQuery.matches ? 0 : now * ball.speed;
      const angle = (ball.t + drift) * Math.PI * 2;
      const pullX = (pointerX - centerX) * 0.08;
      const pullY = (pointerY - centerY) * 0.08;
      const x = centerX + Math.cos(angle) * (laneRadiusX - index * 7) + pullX;
      const y = centerY + Math.sin(angle) * (laneRadiusY - index * 4) + pullY;
      const glow = pointer.active ? 1.3 : 0.86;

      context.beginPath();
      context.fillStyle = ball.color;
      context.shadowColor = ball.color;
      context.shadowBlur = 18 * glow;
      context.arc(x, y, ball.radius * glow, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "rgba(3, 5, 10, 0.78)";
      context.font = "800 12px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String((index + 1) * 7).padStart(2, "0"), x, y);
    });

    const puckSize = Math.min(width, height) * (pointer.active ? 0.2 : 0.17);
    const puckX = pointerX - puckSize / 2;
    const puckY = pointerY - puckSize / 2;
    if (puck.complete) {
      context.shadowColor = "rgba(255, 224, 113, 0.55)";
      context.shadowBlur = 28 + pointer.burst * 18;
      context.drawImage(puck, puckX, puckY, puckSize, puckSize);
    } else {
      context.beginPath();
      context.fillStyle = "#ffe071";
      context.arc(pointerX, pointerY, puckSize / 2, 0, Math.PI * 2);
      context.fill();
    }

    if (pointer.burst > 0.01) {
      context.beginPath();
      context.strokeStyle = `rgba(255, 224, 113, ${pointer.burst})`;
      context.lineWidth = 3;
      context.arc(pointerX, pointerY, puckSize * (1.1 + (1 - pointer.burst) * 1.4), 0, Math.PI * 2);
      context.stroke();
      pointer.burst *= 0.92;
    }
    context.restore();

    window.requestAnimationFrame(drawBallpass);
  }

  game.addEventListener("pointermove", (event) => {
    const rect = game.getBoundingClientRect();
    pointer.x = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
    pointer.y = Math.max(0.12, Math.min(0.88, (event.clientY - rect.top) / rect.height));
    pointer.active = true;
  }, { passive: true });
  game.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  game.addEventListener("click", () => {
    pointer.burst = 1;
  });
  window.addEventListener("resize", resizeBallpass, { passive: true });
  puck.addEventListener("load", () => pointer.burst = 0.6);
  resizeBallpass();
  window.requestAnimationFrame(drawBallpass);
}

setupPromptBallpassGame();

function setupMascotMotionCursor() {
  if (window.matchMedia("(pointer: coarse)").matches || reducedMotionQuery.matches) return;

  const cursor = document.createElement("div");
  cursor.className = "mascot-motion-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);

  const spriteMap = {
    idle: [[0, 0]],
    right: [[1, 0], [2, 0], [3, 0], [5, 1]],
    left: [[1, 0], [2, 0], [3, 0], [5, 1]],
    up: [[5, 0], [5, 3]],
    down: [[2, 3], [3, 3], [4, 3]],
  };
  const position = { x: -120, y: -120 };
  const last = { x: -120, y: -120, time: 0 };
  let state = "idle";
  let facing = 1;
  let frameIndex = 0;
  let frameTimer = 0;
  let idleTimer = 0;
  let visible = false;

  function setSpriteFrame(now) {
    const frames = spriteMap[state] || spriteMap.idle;
    if (now - frameTimer > (state === "idle" ? 460 : 115)) {
      frameIndex = (frameIndex + 1) % frames.length;
      frameTimer = now;
    }
    const [column, row] = frames[frameIndex] || frames[0];
    cursor.style.backgroundPosition = `${column * 20}% ${row * 33.333}%`;
    cursor.classList.toggle("is-up", state === "up");
    cursor.classList.toggle("is-down", state === "down");
  }

  function render(now) {
    setSpriteFrame(now);
    const lift = state === "up" ? -22 : state === "down" ? 14 : state === "idle" ? 0 : -4;
    const tilt = state === "up" ? -10 : state === "down" ? 14 : state === "right" || state === "left" ? 4 : 0;
    cursor.style.transform = `translate3d(${Math.round(position.x + 14)}px, ${Math.round(position.y + lift + 12)}px, 0) scaleX(${facing}) rotate(${tilt * facing}deg)`;
    if (visible) cursor.classList.add("is-visible");
    window.requestAnimationFrame(render);
  }

  document.addEventListener("pointermove", (event) => {
    if (isEditableTarget(event.target)) {
      cursor.classList.remove("is-visible");
      visible = false;
      return;
    }

    const now = performance.now();
    const dx = last.time ? event.clientX - last.x : 0;
    const dy = last.time ? event.clientY - last.y : 0;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    position.x = event.clientX;
    position.y = event.clientY;
    visible = true;
    window.clearTimeout(idleTimer);

    if (absX < 2 && absY < 2) {
      state = "idle";
    } else if (absY > absX * 1.1) {
      state = dy < 0 ? "up" : "down";
    } else {
      state = dx < 0 ? "left" : "right";
      facing = dx < 0 ? -1 : 1;
    }

    if (state !== "idle") frameIndex %= (spriteMap[state] || spriteMap.idle).length;
    last.x = event.clientX;
    last.y = event.clientY;
    last.time = now;
    idleTimer = window.setTimeout(() => {
      state = "idle";
      frameIndex = 0;
    }, 180);
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    visible = false;
    cursor.classList.remove("is-visible");
  }, { passive: true });

  window.requestAnimationFrame(render);
}

setupMascotMotionCursor();

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
