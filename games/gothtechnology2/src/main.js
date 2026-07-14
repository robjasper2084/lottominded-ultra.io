import { GothTechnologyGame } from "./scenes/game.js?v=motion-atlas4-repaired";
import { PHASE } from "./config/constants.js";

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
    introVideo.removeAttribute("src");
    introVideo.removeAttribute("poster");
    introVideo.load();
  }
};

if (intro && introVideo instanceof HTMLVideoElement && introStart && introSkip && shouldShowIntro) {
  introVideo.src = introVideo.dataset.src || "";
  introVideo.poster = introVideo.dataset.poster || "";
  introVideo.preload = "metadata";
  introVideo.load();
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
const gameStatus = document.getElementById("gameStatus");
const accessibleActions = document.getElementById("accessibleActions");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const resetBindings = document.getElementById("resetBindings");
const fullscreenToggle = document.getElementById("fullscreenToggle");
const keyBindings = document.getElementById("keyBindings");
const controllerStatus = document.getElementById("controllerStatus");

const actionRows = [
  ["MOVE LEFT", "left"],
  ["MOVE RIGHT", "right"],
  ["JUMP", "up"],
  ["CROUCH", "down"],
  ["LIGHT PUNCH", "lightPunch"],
  ["HEAVY PUNCH", "heavyPunch"],
  ["LIGHT KICK", "lightKick"],
  ["HEAVY KICK", "heavyKick"],
  ["SPECIAL", "special"],
  ["SUPER", "super"],
  ["THROW", "throw"],
  ["ASSIST 1", "assist1"],
  ["ASSIST 2", "assist2"],
  ["TAUNT", "taunt"],
  ["DASH", "dash"]
];

const formatKey = (code) => String(code || "Unbound")
  .replace(/^Key/, "")
  .replace(/^Digit/, "")
  .replace(/^Numpad/, "NUM ")
  .replace("Arrow", "");

let listeningButton = null;
const renderBindings = () => {
  if (!keyBindings) return;
  keyBindings.replaceChildren(...actionRows.map(([label, suffix]) => {
    const row = document.createElement("div");
    row.className = "binding-row";
    const name = document.createElement("span");
    name.textContent = label;
    row.append(name);
    for (const player of [1, 2]) {
      const action = `p${player}.${suffix}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "binding-button";
      button.dataset.action = action;
      button.textContent = formatKey(game.input.getBinding(action));
      button.setAttribute("aria-label", `${label}, player ${player}, ${button.textContent}`);
      button.addEventListener("click", () => beginBinding(button, action));
      row.append(button);
    }
    return row;
  }));
};

const cancelBinding = () => {
  if (!listeningButton) return;
  listeningButton.dataset.listening = "false";
  listeningButton = null;
};

const captureBinding = (event) => {
  if (!listeningButton) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const action = listeningButton.dataset.action;
  if (event.code !== "Escape") game.input.rebind(action, event.code);
  cancelBinding();
  renderBindings();
  window.removeEventListener("keydown", captureBinding, true);
};

function beginBinding(button, action) {
  cancelBinding();
  listeningButton = button;
  button.dataset.action = action;
  button.dataset.listening = "true";
  button.textContent = "PRESS KEY";
  window.addEventListener("keydown", captureBinding, true);
}

const updateControllerStatus = () => {
  if (!controllerStatus) return;
  const count = Array.from(navigator.getGamepads?.() || []).filter(Boolean).length;
  controllerStatus.textContent = count === 0
    ? "GAMEPADS: NONE CONNECTED"
    : `GAMEPADS: ${Math.min(2, count)} CONNECTED`;
};

const openSettingsPanel = () => {
  if (!settingsPanel) return;
  renderBindings();
  updateControllerStatus();
  settingsPanel.hidden = false;
  closeSettings?.focus();
};

const closeSettingsPanel = () => {
  cancelBinding();
  window.removeEventListener("keydown", captureBinding, true);
  if (settingsPanel) settingsPanel.hidden = true;
  canvas.focus();
  game.announce("Control settings closed");
};

const toggleMute = () => {
  game.audio.toggleMute();
  game.lastAccessibleState = "";
  game.announce(game.audio.muted ? "Audio muted" : "Audio active");
};

const actionButton = (label, handler) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
};

const renderAccessibleActions = (state) => {
  if (!accessibleActions) return;
  const actions = [];
  if (state.phase === PHASE.TITLE) {
    actions.push(actionButton("Pick fighter", () => game.openCharacterSelect(false)));
    actions.push(actionButton("Training", () => game.openCharacterSelect(true)));
    actions.push(actionButton("Game select", () => game.openGameSelect()));
    actions.push(actionButton(state.cpuEnabled ? "Use local two-player" : "Use CPU opponent", () => {
      game.cpuEnabled = !game.cpuEnabled;
      game.lastAccessibleState = "";
    }));
    actions.push(actionButton("Control settings", () => game.openSettings()));
  } else if (state.phase === PHASE.GAME_SELECT) {
    actions.push(actionButton("Play GOTHTECHNOLOGY", () => { game.selectGame(0); game.launchSelectedGame(); }));
    actions.push(actionButton("Play Shadow Ops", () => { game.selectGame(1); game.launchSelectedGame(); }));
    actions.push(actionButton("Back", () => game.returnToTitle()));
  } else if (state.phase === PHASE.SELECT) {
    actions.push(actionButton("Choose Kalyx", () => game.selectPlayer1("KALYX")));
    actions.push(actionButton("Choose Master Ezra", () => game.selectPlayer1("MASTER_EZRA")));
    actions.push(actionButton("Start versus", () => game.startVersus()));
    actions.push(actionButton("Back", () => game.returnToTitle()));
  } else if (state.phase === PHASE.FIGHT) {
    actions.push(actionButton("Pause", () => { game.phase = PHASE.PAUSE; game.announce("Game paused"); }));
    actions.push(actionButton(state.muted ? "Unmute" : "Mute", toggleMute));
  } else if (state.phase === PHASE.PAUSE) {
    actions.push(actionButton("Resume", () => { game.phase = PHASE.FIGHT; game.announce("Fight resumed"); }));
    actions.push(actionButton("Control settings", () => game.openSettings()));
    actions.push(actionButton("Restart match", () => game.startMatch(game.training)));
    actions.push(actionButton("Return to title", () => game.returnToTitle()));
    actions.push(actionButton(state.muted ? "Unmute" : "Mute", toggleMute));
  } else if (state.phase === PHASE.ROUND_END) {
    actions.push(actionButton("Next round", () => game.startRound()));
  } else if (state.phase === PHASE.MATCH_END) {
    actions.push(actionButton("Return to title", () => game.returnToTitle()));
  }
  accessibleActions.replaceChildren(...actions);
};

window.addEventListener("gothtechnology:state", (event) => renderAccessibleActions(event.detail));
window.addEventListener("gothtechnology:announce", (event) => {
  if (gameStatus) gameStatus.textContent = event.detail;
});
window.addEventListener("gothtechnology:settings", openSettingsPanel);
window.addEventListener("gothtechnology:keymap-changed", renderBindings);
window.addEventListener("gamepadconnected", updateControllerStatus);
window.addEventListener("gamepaddisconnected", updateControllerStatus);
closeSettings?.addEventListener("click", closeSettingsPanel);
resetBindings?.addEventListener("click", () => {
  game.input.resetBindings();
  renderBindings();
  game.announce("Keyboard bindings reset");
});
fullscreenToggle?.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    game.announce("Fullscreen is unavailable in this browser");
  }
});
settingsPanel?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !listeningButton) {
    event.preventDefault();
    closeSettingsPanel();
  }
});
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
