import { GothTechnologyGame } from "./scenes/game.js?v=fighter-prop1";

const syncViewportHeight = () => {
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
};

syncViewportHeight();
window.addEventListener("resize", syncViewportHeight, { passive: true });
window.addEventListener("orientationchange", syncViewportHeight, { passive: true });
document.addEventListener("contextmenu", (event) => event.preventDefault());

const intro = document.getElementById("startupIntro");
const introVideo = document.getElementById("startupVideo");
const introStart = document.getElementById("introStart");
const introSkip = document.getElementById("introSkip");
const shouldShowIntro = new URLSearchParams(window.location.search).get("intro") === "1";
const closeIntro = () => {
  if (!intro) return;
  intro.hidden = true;
  if (introVideo instanceof HTMLVideoElement) {
    introVideo.pause();
  }
};

if (intro && introVideo instanceof HTMLVideoElement && introStart && introSkip && shouldShowIntro) {
  intro.hidden = false;
  let introStarted = false;
  let fallbackTimer = 0;
  const startIntro = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (introStarted) return;
    introStarted = true;
    intro.dataset.playing = "true";
    fallbackTimer = window.setTimeout(() => {
      if (introVideo.paused || introVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        closeIntro();
      }
    }, 1400);
    try {
      introVideo.muted = false;
      introVideo.currentTime = 0;
      await introVideo.play();
    } catch (error) {
      console.warn("[GOTHTECHNOLOGY] Startup intro could not play", error);
      closeIntro();
    }
  };
  introStart.addEventListener("pointerdown", startIntro, { passive: false });
  introStart.addEventListener("touchstart", startIntro, { passive: false });
  introStart.addEventListener("click", startIntro);
  introSkip.addEventListener("click", closeIntro);
  introSkip.addEventListener("pointerdown", closeIntro, { passive: false });
  introVideo.addEventListener("playing", () => window.clearTimeout(fallbackTimer));
  introVideo.addEventListener("ended", closeIntro);
  introVideo.addEventListener("error", () => {
    closeIntro();
  });
} else {
  closeIntro();
}

const canvas = document.getElementById("game");
if (window.__gothTechnologyGame?.stop) window.__gothTechnologyGame.stop();
const game = new GothTechnologyGame(canvas);
window.__gothTechnologyGame = game;
const unlockAudio = () => game.audio.ensure();
window.addEventListener("pointerdown", unlockAudio, { passive: true });
window.addEventListener("touchstart", unlockAudio, { passive: true });
window.addEventListener("keydown", unlockAudio);
game.render();
game.boot().catch((error) => {
  console.error("[GOTHTECHNOLOGY] Boot failed", error);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050403";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffd66d";
  ctx.font = "700 32px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("GOTHTECHNOLOGY asset boot failed", canvas.width / 2, canvas.height / 2);
});
