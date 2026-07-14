const merchRoot = document.documentElement;
const merchHero = document.querySelector("[data-merch-tilt]");
const bagDrawer = document.querySelector("[data-bag-drawer]");
const bagItems = document.querySelector("[data-bag-items]");
const bagTotal = document.querySelector("[data-bag-total]");
const cartNote = document.querySelector("[data-cart-note]");
const merchSoundCard = document.querySelector("[data-merch-sound-card]");
const merchSoundVideo = document.querySelector("[data-merch-sound-video]");
const merchSoundToggle = document.querySelector("[data-merch-sound-toggle]");
const merchShadowPopup = document.querySelector("[data-merch-shadow-popup]");
const merchShadowFrame = document.querySelector("[data-merch-shadow-frame]");
const merchShadowCloseButtons = document.querySelectorAll("[data-merch-shadow-close]");
let merchHeroVideo = document.querySelector(".merch-hero-video");
let merchHeroSoundToggle = document.querySelector("[data-merch-hero-sound-toggle]");
const CART_STORAGE_KEY = "lottomind.merch.cart.v1";
const MERCH_SHADOW_AUTO_DELAY = 90000;
const MERCH_SHADOW_AUTO_KEY = "lottomind.merch.shadowAutoShown.v1";
let merchHeroToggleAt = 0;

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

const bag = loadCart();

function getMerchHeroVideo() {
  if (!merchHeroVideo || !document.contains(merchHeroVideo)) {
    merchHeroVideo = document.querySelector(".merch-hero-video");
  }
  return merchHeroVideo;
}

function getMerchHeroSoundToggle() {
  if (!merchHeroSoundToggle || !document.contains(merchHeroSoundToggle)) {
    merchHeroSoundToggle = document.querySelector("[data-merch-hero-sound-toggle]");
  }
  return merchHeroSoundToggle;
}

function primeMerchHeroBackgroundVideo() {
  const video = getMerchHeroVideo();
  if (!video) return;
  const source = video.querySelector("source");
  const heroSource =
    source?.getAttribute("src") ||
    source?.dataset.src ||
    source?.dataset.lmLazySrc ||
    video.dataset.src ||
    video.dataset.lmLazySrc ||
    "./assets/merch/merch-motion-01.opt.mp4";

  video.dataset.lmVideoUnmanaged = "true";
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("loop", "");
  video.setAttribute("playsinline", "");
  video.preload = "metadata";
  video.setAttribute("preload", "metadata");

  if (source && heroSource && !source.getAttribute("src")) {
    source.setAttribute("src", heroSource);
    video.load?.();
  } else if (heroSource && !video.currentSrc && !video.getAttribute("src") && !source) {
    video.setAttribute("src", heroSource);
    video.load?.();
  }

  video.play?.().catch(() => {
    // Muted hero video is decorative; leave the loaded frame visible if autoplay is blocked.
  });
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(bag));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function getCartTotals() {
  return bag.reduce(
    (totals, item) => ({
      count: totals.count + item.quantity,
      subtotal: totals.subtotal + item.price * item.quantity,
    }),
    { count: 0, subtotal: 0 },
  );
}

function updateBag() {
  const totals = getCartTotals();
  document.querySelectorAll("[data-bag-count]").forEach((target) => {
    target.textContent = String(totals.count);
  });
  if (bagTotal) bagTotal.textContent = formatMoney(totals.subtotal);

  if (bagItems) {
    bagItems.innerHTML = bag.length
      ? bag.map((item) => `
          <li class="cart-line">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span>${formatMoney(item.price)} each</span>
            </div>
            <div class="cart-quantity" aria-label="${escapeHtml(item.name)} quantity">
              <button type="button" data-cart-decrease="${escapeHtml(item.id)}" aria-label="Decrease ${escapeHtml(item.name)}">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-increase="${escapeHtml(item.id)}" aria-label="Increase ${escapeHtml(item.name)}">+</button>
            </div>
            <strong>${formatMoney(item.price * item.quantity)}</strong>
            <button class="cart-remove" type="button" data-cart-remove="${escapeHtml(item.id)}">Remove</button>
          </li>
        `).join("")
      : `<li class="cart-empty">Your cart is empty. Add a hoodie, cap, polo, or gallery piece.</li>`;
  }

  if (cartNote) {
    cartNote.textContent = bag.length
      ? "Checkout preview is local only. Connect a live storefront when the drop is ready."
      : "Shipping and taxes are not calculated in this local preview.";
  }
  saveCart();
}

function addToCart(button) {
  const name = button.dataset.addItem;
  const price = Number(button.dataset.itemPrice || 0);
  if (!name || !price) return;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = bag.find((item) => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    bag.push({ id, name, price, quantity: 1 });
  }
  updateBag();
  bagDrawer?.classList.add("is-open");
  bagDrawer?.classList.add("is-cart-popping");
  button.classList.add("is-add-popping");

  const oldText = button.textContent;
  button.textContent = "Added";
  window.setTimeout(() => {
    button.textContent = oldText;
    button.classList.remove("is-add-popping");
    bagDrawer?.classList.remove("is-cart-popping");
  }, 900);
}

function changeCartQuantity(id, delta) {
  const index = bag.findIndex((item) => item.id === id);
  if (index < 0) return;
  bag[index].quantity += delta;
  if (bag[index].quantity <= 0) bag.splice(index, 1);
  updateBag();
}

function removeCartItem(id) {
  const index = bag.findIndex((item) => item.id === id);
  if (index < 0) return;
  bag.splice(index, 1);
  updateBag();
}

function copyTextArea(targetId, button) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const copyJob = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(target.value)
    : Promise.resolve(target.select() || document.execCommand("copy"));
  copyJob.then(() => {
    const oldText = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = oldText;
    }, 1200);
  });
}

function pauseMerchIntroAudio(exceptMedia = merchSoundVideo) {
  document.querySelectorAll("audio, video").forEach((media) => {
    if (media === exceptMedia) return;
    const isIntroMedia =
      media.id === "siteSoundtrack" ||
      media.closest("[data-startup-video]") ||
      media.classList.contains("startup-video-player");
    if (media.tagName === "AUDIO" || isIntroMedia || !media.muted) {
      media.pause();
    }
  });
}

function setMerchHeroSoundState(active) {
  const button = getMerchHeroSoundToggle();
  if (!button) return;
  button.classList.toggle("is-playing", active);
  button.setAttribute("aria-pressed", String(active));
  button.textContent = active ? "Mute hero" : "Hero sound";
}

async function playMerchHeroSound() {
  const video = getMerchHeroVideo();
  if (!video) return;
  pauseMerchIntroAudio(video);
  video.muted = false;
  video.volume = 0.3;
  setMerchHeroSoundState(true);
  try {
    await video.play();
  } catch {
    setMerchHeroSoundState(!video.muted);
  }
}

function pauseMerchHeroSound() {
  const video = getMerchHeroVideo();
  if (!video) return;
  video.muted = true;
  setMerchHeroSoundState(false);
}

function resetMerchCapsuleVideo() {
  if (!merchSoundVideo) return;
  try {
    merchSoundVideo.currentTime = 0;
  } catch {
    // Some browsers block seeking before metadata is ready.
  }
}

async function playMerchCapsuleSound() {
  if (!merchSoundVideo || !merchSoundToggle) return;
  let played = false;
  pauseMerchIntroAudio();
  resetMerchCapsuleVideo();
  try {
    merchSoundVideo.muted = false;
    merchSoundVideo.defaultMuted = false;
    merchSoundVideo.removeAttribute("muted");
    merchSoundVideo.volume = 0.28;
    await merchSoundVideo.play();
    played = true;
  } catch {
    played = false;
    merchSoundVideo.muted = true;
    merchSoundVideo.play().catch(() => {
      // Unmuted autoplay is browser-gated; muted visual playback is the fallback.
    });
  }
  if (played) {
    merchSoundToggle.textContent = "Sound on";
    merchSoundToggle.classList.add("is-playing");
  } else {
    merchSoundToggle.textContent = "Tap for sound";
    merchSoundToggle.classList.remove("is-playing");
  }
}

function startMerchCapsuleOnPageOpen() {
  if (!merchSoundVideo) return;
  merchSoundVideo.autoplay = true;
  merchSoundVideo.playsInline = true;
  merchSoundVideo.setAttribute("autoplay", "");
  merchSoundVideo.setAttribute("playsinline", "");
  playMerchCapsuleSound();
}

function pauseMerchCapsuleSound() {
  if (!merchSoundVideo || !merchSoundToggle) return;
  merchSoundVideo.muted = true;
  merchSoundToggle.textContent = "Play sound";
  merchSoundToggle.classList.remove("is-playing");
}

function openMerchShadowPopup() {
  if (!merchShadowPopup) return;
  if (merchShadowFrame && !merchShadowFrame.getAttribute("src")) {
    merchShadowFrame.setAttribute("src", merchShadowFrame.dataset.src || "");
  }
  merchShadowPopup.classList.remove("is-hidden");
  merchShadowPopup.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-merch-shadow-popup");
}

function closeMerchShadowPopup() {
  if (!merchShadowPopup) return;
  merchShadowPopup.classList.add("is-hidden");
  merchShadowPopup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-merch-shadow-popup");
  merchShadowFrame?.removeAttribute("src");
}

function hasAutoShownMerchShadowPopup() {
  try {
    return sessionStorage.getItem(MERCH_SHADOW_AUTO_KEY) === "true";
  } catch {
    return Boolean(window.__lottomindMerchShadowAutoShown);
  }
}

function rememberAutoShownMerchShadowPopup() {
  window.__lottomindMerchShadowAutoShown = true;
  try {
    sessionStorage.setItem(MERCH_SHADOW_AUTO_KEY, "true");
  } catch {
    // Session storage may be unavailable in private browser modes.
  }
}

function scheduleAutoMerchShadowPopup() {
  if (!merchShadowPopup || hasAutoShownMerchShadowPopup()) return;
  window.setTimeout(() => {
    if (!merchShadowPopup || hasAutoShownMerchShadowPopup() || document.visibilityState === "hidden") return;
    rememberAutoShownMerchShadowPopup();
    openMerchShadowPopup();
  }, MERCH_SHADOW_AUTO_DELAY);
}

function toggleMerchHeroSound(event) {
  const now = performance.now();
  if (event?.type === "click" && now - merchHeroToggleAt < 320) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  merchHeroToggleAt = now;
  event?.preventDefault();
  event?.stopPropagation();
  const video = getMerchHeroVideo();
  if (video?.muted) {
    playMerchHeroSound();
  } else {
    pauseMerchHeroSound();
  }
}

function bindMerchHeroSoundToggle() {
  const button = getMerchHeroSoundToggle();
  if (!button || button.dataset.soundBound === "true") return;
  button.dataset.soundBound = "true";
  button.addEventListener("click", toggleMerchHeroSound);
}

document.addEventListener("pointermove", (event) => {
  merchRoot.style.setProperty("--mx", `${event.clientX}px`);
  merchRoot.style.setProperty("--my", `${event.clientY}px`);
  if (merchSoundCard) {
    const cardRect = merchSoundCard.getBoundingClientRect();
    const insideCard =
      event.clientX >= cardRect.left &&
      event.clientX <= cardRect.right &&
      event.clientY >= cardRect.top &&
      event.clientY <= cardRect.bottom;
    merchSoundCard.classList.toggle("is-hover-grown", insideCard);
  }
  if (!merchHero) return;
  const rect = merchHero.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  merchHero.style.setProperty("--hero-copy-x", `${x * -0.018}px`);
  merchHero.style.setProperty("--hero-copy-y", `${y * -0.018}px`);
  merchHero.style.setProperty("--hero-product-x", `${x * 0.018}px`);
  merchHero.style.setProperty("--hero-product-y", `${y * 0.018}px`);
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-merch-hero-sound-toggle]")) {
    toggleMerchHeroSound(event);
    return;
  }

  if (event.target.closest("[data-merch-sound-toggle]")) {
    event.preventDefault();
    event.stopPropagation();
    if (merchSoundVideo?.muted) {
      playMerchCapsuleSound();
    } else {
      pauseMerchCapsuleSound();
    }
    return;
  }

  const stripLink = event.target.closest(".merch-strip a[href^='#']");
  if (stripLink) {
    const target = document.getElementById(stripLink.getAttribute("href").slice(1));
    if (target) {
      event.preventDefault();
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });
      history.pushState(null, "", stripLink.getAttribute("href"));
    }
    return;
  }

  const addButton = event.target.closest("[data-add-item]");
  if (addButton) {
    addToCart(addButton);
    return;
  }

  const copyButton = event.target.closest("[data-copy-target]");
  if (copyButton) {
    copyTextArea(copyButton.dataset.copyTarget, copyButton);
    return;
  }

  const increaseButton = event.target.closest("[data-cart-increase]");
  if (increaseButton) {
    changeCartQuantity(increaseButton.dataset.cartIncrease, 1);
    return;
  }

  const decreaseButton = event.target.closest("[data-cart-decrease]");
  if (decreaseButton) {
    changeCartQuantity(decreaseButton.dataset.cartDecrease, -1);
    return;
  }

  const removeButton = event.target.closest("[data-cart-remove]");
  if (removeButton) {
    removeCartItem(removeButton.dataset.cartRemove);
    return;
  }

  if (event.target.closest("[data-cart-clear]")) {
    bag.splice(0, bag.length);
    updateBag();
    return;
  }

  if (event.target.closest("[data-cart-checkout]")) {
    if (cartNote) cartNote.textContent = bag.length
      ? "Checkout is ready to connect. Add a Shopify or Stripe URL when the drop goes live."
      : "Add something to the cart before checkout preview.";
    return;
  }

  if (event.target.closest("[data-bag-toggle]")) {
    bagDrawer?.classList.toggle("is-open");
    return;
  }

  if (event.target.closest("[data-bag-close]")) {
    bagDrawer?.classList.remove("is-open");
  }
});

primeMerchHeroBackgroundVideo();
bindMerchHeroSoundToggle();
document.addEventListener("DOMContentLoaded", () => {
  primeMerchHeroBackgroundVideo();
  bindMerchHeroSoundToggle();
});
merchSoundCard?.addEventListener("pointerenter", playMerchCapsuleSound);
merchSoundVideo?.addEventListener("pointerdown", () => {
  pauseMerchIntroAudio();
  resetMerchCapsuleVideo();
});
merchSoundVideo?.addEventListener("click", (event) => {
  event.preventDefault();
  playMerchCapsuleSound();
});
merchSoundVideo?.addEventListener("play", pauseMerchIntroAudio);
merchSoundVideo?.addEventListener("volumechange", () => {
  if (!merchSoundVideo.muted) {
    pauseMerchIntroAudio();
    resetMerchCapsuleVideo();
  }
});

window.addEventListener("load", () => {
  primeMerchHeroBackgroundVideo();
  window.setTimeout(startMerchCapsuleOnPageOpen, 180);
  scheduleAutoMerchShadowPopup();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMerchCapsuleOnPageOpen, { once: true });
} else {
  startMerchCapsuleOnPageOpen();
}

window.addEventListener("pageshow", () => {
  primeMerchHeroBackgroundVideo();
  startMerchCapsuleOnPageOpen();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    startMerchCapsuleOnPageOpen();
  }
});

merchShadowCloseButtons.forEach((button) => button.addEventListener("click", closeMerchShadowPopup));
merchShadowPopup?.addEventListener("click", (event) => {
  if (event.target === merchShadowPopup) {
    closeMerchShadowPopup();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !merchShadowPopup?.classList.contains("is-hidden")) {
    closeMerchShadowPopup();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.18 },
);

document.querySelectorAll(".merch-store-page [data-reveal]").forEach((section) => revealObserver.observe(section));

updateBag();
