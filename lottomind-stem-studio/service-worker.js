const CACHE_NAME = "lottomind-stem-studio-v16";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/generated/stem-studio-logo.svg",
  "./assets/generated/neon-turntable.svg",
  "./assets/generated/stem-mixer-console.svg",
  "./assets/generated/pad-matrix.svg",
  "./assets/generated/waveform-orb.svg",
  "./assets/brand/lm-stem-logo.svg",
  "./assets/brand/lm-stem-hero.svg",
  "./assets/brand/lm-settings-console.svg",
  "./assets/brand/lm-help-orb.svg",
  "./assets/brand/lm-touch-pad.svg",
  "./assets/brand/lm-keyboard-synth.svg",
  "./assets/brand/lm-stem-mixer.svg",
  "./assets/brand/lm-dj-decks.svg",
  "./assets/brand/lm-suno-prompt.svg",
  "./assets/brand/lm-video-prompt.svg",
  "./assets/brand/lm-higgsfield-style.svg",
  "./assets/brand/lm-kling-style.svg",
  "./assets/brand/lm-storyboard.svg",
  "./assets/brand/lm-camera-motion.svg",
  "./assets/brand/lm-beat-dna.svg",
  "./assets/brand/lm-beat-lottery.svg",
  "./assets/brand/lm-number-orb.svg",
  "./assets/brand/lm-creative-bundle.svg",
  "./assets/brand/lm-splash-icon.svg",
  "./assets/brand/README.md",
  "./assets/prompts/chatgpt-image-2-brand-assets.md",
  "./docs/DAW-COMPOSER-SUITE.md",
  "./docs/MIDI-IMPORT-EXPORT.md",
  "./docs/PLUGIN-COMPATIBILITY.md",
  "./docs/AUTOMATION.md"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
