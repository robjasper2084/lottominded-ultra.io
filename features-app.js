(() => {
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
  { name: "LottoMind App Beta", href: "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/", color: "rgba(255,224,113,0.3)", copy: "Open the LottoMind beta preview: Number Radar, Dream Oracle, saved wallet, daily tools, scanner, credits, and simple number organization." },
  { name: "Number Radar", href: "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/", color: "rgba(41,247,255,0.24)", copy: "Compare hot, cold, active, and balanced number signals in plain language. Entertainment only - not a prediction." },
  { name: "Dream Oracle", href: "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/", color: "rgba(255,79,216,0.24)", copy: "Type a dream, match symbols, get number ideas, Pick 3 / Pick 4 bridges, and simple meaning notes." },
  { name: "Saved Wallet", href: "https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/", color: "rgba(94,255,157,0.24)", copy: "Save number sets, dream readings, favorite ideas, and history so the user can come back later." },
  { name: "Creative Bundle", route: "#creative-bundle", color: "rgba(41,247,255,0.2)", copy: "Generate Beat DNA, Suno prompt, video prompt, and creative number signals together from one session." },
  { name: "Sampler", route: "#sampler", color: "rgba(255,224,113,0.22)", copy: "Trim samples, preview slices, assign pads, adjust gain, pitch, and playback feel." },
  { name: "How To Drive Manual", href: "./how-to-use.html", color: "rgba(255,224,113,0.25)", copy: "Open the step-by-step guide for studio controls, Beat2Lotto+ audio import, sheet music notes, safety, and prompt workflows." },
  { name: "Open Tools Lab", route: "#help", color: "rgba(138,92,255,0.22)", copy: "See local audio workflow notes, open music tool inspiration, sample licensing, and compatibility roadmap." }
];

const grid = document.querySelector("#featureToolGrid");
if (grid) {
  grid.innerHTML = features.map((feature, index) => `
    <a class="feature-tool-card kinetic-hover" href="${feature.href || `${studioUrl}${feature.route}`}" style="--feature-color:${feature.color}" data-feature-index="${index}" data-motion="${index % 2 ? "fly-right" : "fly-left"}">
      <h3 class="kinetic-word" data-kinetic="${feature.name}">${feature.name}</h3>
      <p>${feature.copy}</p>
      <span>Open Module</span>
    </a>
  `).join("");
}

const featuredList = document.querySelector("#featuredModuleList");
if (featuredList) {
  featuredList.innerHTML = features.slice(0, 5).map((feature, index) => `
    <a href="${feature.href || `${studioUrl}${feature.route}`}" style="--feature-color:${feature.color}" data-motion="${index % 2 ? "fly-right" : "fly-left"}">
      <strong>${feature.name}</strong>
      <span>${feature.copy}</span>
    </a>
  `).join("");
}

window.dispatchEvent(new Event("lottomind:motion-refresh"));

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

function setupFeaturePuckField() {
  const field = document.querySelector("[data-feature-puck-field]");
  if (!field) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const puckSrc = field.dataset.puckSrc || "./assets/brand/lottomind-branded-puck.webp";
  const puckCount = window.innerWidth < 720 ? 5 : 9;
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.42,
    active: false,
    lastMove: 0
  };
  let bounds = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  const pucks = Array.from({ length: puckCount }, (_, index) => {
    const element = document.createElement("span");
    element.className = "branded-puck feature-puck";
    element.style.setProperty("--puck-opacity", String(0.44 + (index % 4) * 0.08));

    const image = document.createElement("img");
    image.src = puckSrc;
    image.alt = "";
    element.appendChild(image);
    field.appendChild(element);

    const wide = window.innerWidth >= 720;
    const size = (wide ? 108 : 82) + Math.random() * (wide ? 142 : 72);
    const puck = {
      element,
      x: Math.random() * Math.max(1, bounds.width - size),
      y: Math.random() * Math.max(1, bounds.height - size),
      vx: (Math.random() - 0.5) * (wide ? 0.58 : 0.34),
      vy: (Math.random() - 0.5) * (wide ? 0.48 : 0.28),
      size,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 0.5
    };

    element.style.setProperty("--puck-size", `${size}px`);
    return puck;
  });

  function placePuck(puck) {
    puck.element.style.transform = `translate3d(${puck.x}px, ${puck.y}px, 0) rotate(${puck.rotation}deg)`;
  }

  function resizeField() {
    bounds = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    pucks.forEach((puck) => {
      puck.x = Math.min(Math.max(0, puck.x), Math.max(0, bounds.width - puck.size));
      puck.y = Math.min(Math.max(0, puck.y), Math.max(0, bounds.height - puck.size));
      placePuck(puck);
    });
  }

  function setPointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    pointer.lastMove = performance.now();
    field.style.setProperty("--puck-pointer-x", `${event.clientX}px`);
    field.style.setProperty("--puck-pointer-y", `${event.clientY}px`);
  }

  function animate(now) {
    if (reduceMotion.matches) {
      pucks.forEach((puck, index) => {
        const columns = Math.min(puckCount, 3);
        const row = Math.floor(index / columns);
        const column = index % columns;
        puck.x = bounds.width * (0.14 + column * 0.34) - puck.size * 0.5;
        puck.y = bounds.height * (0.18 + row * 0.26) - puck.size * 0.5;
        puck.rotation = index * 18;
        placePuck(puck);
      });
      return;
    }

    const pointerIsHot = pointer.active && now - pointer.lastMove < 1500;

    pucks.forEach((puck) => {
      if (pointerIsHot) {
        const centerX = puck.x + puck.size * 0.5;
        const centerY = puck.y + puck.size * 0.5;
        const deltaX = centerX - pointer.x;
        const deltaY = centerY - pointer.y;
        const distance = Math.max(52, Math.hypot(deltaX, deltaY));
        const force = Math.min(1, 220 / distance) * 0.038;
        puck.vx += (deltaX / distance) * force;
        puck.vy += (deltaY / distance) * force;
      }

      puck.vx *= 0.992;
      puck.vy *= 0.992;
      puck.x += puck.vx;
      puck.y += puck.vy;
      puck.rotation += puck.spin + puck.vx * 0.12;

      if (puck.x < -puck.size * 0.2 || puck.x > bounds.width - puck.size * 0.8) {
        puck.vx *= -0.94;
        puck.x = Math.min(Math.max(-puck.size * 0.2, puck.x), bounds.width - puck.size * 0.8);
      }

      if (puck.y < -puck.size * 0.15 || puck.y > bounds.height - puck.size * 0.7) {
        puck.vy *= -0.94;
        puck.y = Math.min(Math.max(-puck.size * 0.15, puck.y), bounds.height - puck.size * 0.7);
      }

      puck.element.classList.toggle("is-pointer-hot", pointerIsHot);
      placePuck(puck);
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("resize", resizeField, { passive: true });
  resizeField();
  requestAnimationFrame(animate);
}

setupFeaturePuckField();
})();
