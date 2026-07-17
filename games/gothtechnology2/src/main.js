import { FIGHTERS } from "./config/assets.js?v=heartline36-leash-wrist";
import { COMMAND_LISTS, GAME_MODES, ROSTER_IDS } from "./config/content.js?v=heartline36-leash-wrist";
import { GothTechnologyGame } from "./scenes/game.js?v=heartline36-leash-wrist";
import { PHASE } from "./config/constants.js?v=heartline36-leash-wrist";

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
const commercialBreak = document.getElementById("commercialBreak");
const commercialVideo = document.getElementById("commercialVideo");
const commercialLabel = document.getElementById("commercialLabel");
const commercialSkip = document.getElementById("commercialSkip");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const resetBindings = document.getElementById("resetBindings");
const fullscreenToggle = document.getElementById("fullscreenToggle");
const keyBindings = document.getElementById("keyBindings");
const controllerStatus = document.getElementById("controllerStatus");
const commandPanel = document.getElementById("commandPanel");
const commandIdentity = document.getElementById("commandIdentity");
const commandList = document.getElementById("commandList");
const closeCommands = document.getElementById("closeCommands");
const trainingPanel = document.getElementById("trainingPanel");
const closeTraining = document.getElementById("closeTraining");
const mobileCommands = document.getElementById("mobileCommands");
const mobileTrainingTools = document.getElementById("mobileTrainingTools");
const replayImport = document.getElementById("replayImport");
const replayImportFile = document.getElementById("replayImportFile");
const TOUCH_POSITIONS_KEY = "gothtechnology.touch.positions.v1";

const settingFields = {
  musicVolume: document.getElementById("musicVolume"),
  sfxVolume: document.getElementById("sfxVolume"),
  shake: document.getElementById("shakeAmount"),
  vibration: document.getElementById("vibrationToggle"),
  highContrast: document.getElementById("contrastToggle"),
  reduceFlash: document.getElementById("reduceFlash"),
  colorFilter: document.getElementById("colorFilter"),
  hudScale: document.getElementById("hudScale"),
  touchLayout: document.getElementById("touchLayout")
};

const trainingFields = {
  trainingGuardMode: document.getElementById("trainingGuard"),
  trainingCounterHit: document.getElementById("trainingCounter"),
  trainingWakeupAction: document.getElementById("trainingWakeup"),
  trainingThrowTech: document.getElementById("trainingThrowTech"),
  trainingInputDelayFrames: document.getElementById("trainingDelay"),
  trainingHitboxes: document.getElementById("trainingHitboxes"),
  showFrameData: document.getElementById("trainingFrameData")
};

let touchPositions = {};
try {
  touchPositions = JSON.parse(window.localStorage?.getItem(TOUCH_POSITIONS_KEY) || "{}") || {};
} catch {
  touchPositions = {};
}

const bindMovableZone = (zoneId, handleId) => {
  const zone = document.getElementById(zoneId);
  const handle = document.getElementById(handleId);
  if (!zone || !handle) return;
  let current = touchPositions[zoneId] || { x: 0, y: 0 };
  const apply = () => {
    zone.style.setProperty("--zone-x", `${current.x}px`);
    zone.style.setProperty("--zone-y", `${current.y}px`);
  };
  apply();
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, baseX: current.x, baseY: current.y };
    const move = (moveEvent) => {
      current = {
        x: Math.max(-96, Math.min(96, start.baseX + moveEvent.clientX - start.x)),
        y: Math.max(-72, Math.min(72, start.baseY + moveEvent.clientY - start.y))
      };
      apply();
    };
    const finish = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      touchPositions[zoneId] = current;
      try {
        window.localStorage?.setItem(TOUCH_POSITIONS_KEY, JSON.stringify(touchPositions));
      } catch {
        // The layout remains movable for this session when storage is blocked.
      }
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  });
};

bindMovableZone("padZone", "movePad");
bindMovableZone("combatZone", "moveCombat");

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

const KEY_LABELS = {
  Slash: "/",
  Period: ".",
  Semicolon: ";",
  Quote: "'",
  BracketRight: "]",
  BracketLeft: "[",
  Backslash: "\\",
  Comma: ",",
  Minus: "-",
  Equal: "="
};
const formatKey = (code) => KEY_LABELS[code] ?? String(code || "Unbound")
  .replace(/^Key/, "")
  .replace(/^Digit/, "")
  .replace(/^Numpad/, "NUM ")
  .replace("Arrow", "");

let listeningButton = null;
let settingsOpener = null;
let dialogOpener = null;
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
  settingsOpener = document.activeElement;
  renderBindings();
  updateControllerStatus();
  for (const [key, field] of Object.entries(settingFields)) {
    if (!field) continue;
    if (field.type === "checkbox") field.checked = Boolean(game.settings[key]);
    else field.value = String(game.settings[key]);
  }
  settingsPanel.hidden = false;
  closeSettings?.focus();
};

const closeDialog = (panel, announce) => {
  if (panel) panel.hidden = true;
  const restoreTarget = dialogOpener instanceof HTMLElement && dialogOpener.isConnected ? dialogOpener : canvas;
  restoreTarget.focus();
  dialogOpener = null;
  game.announce(announce);
};

const openCommandPanel = (event) => {
  if (!commandPanel || !commandList) return;
  dialogOpener = document.activeElement;
  const characterId = event?.detail?.characterId || game.player1Id;
  const commandSet = COMMAND_LISTS[characterId] || COMMAND_LISTS.KALYX;
  const fighter = FIGHTERS[characterId];
  if (commandIdentity) commandIdentity.textContent = `${fighter?.name || characterId} / ${commandSet.title}. ${commandSet.passive}`;
  commandList.replaceChildren(...commandSet.commands.map((command) => {
    const row = document.createElement("div");
    row.className = "command-row";
    const input = document.createElement("span");
    input.className = "command-input";
    input.textContent = command.input;
    const name = document.createElement("span");
    name.className = "command-name";
    name.textContent = command.name;
    const detail = document.createElement("span");
    detail.textContent = command.detail;
    row.append(input, name, detail);
    return row;
  }));
  commandPanel.hidden = false;
  closeCommands?.focus();
};

const openTrainingPanel = () => {
  if (!trainingPanel || !game.training) return;
  dialogOpener = document.activeElement;
  for (const [key, field] of Object.entries(trainingFields)) {
    if (!field) continue;
    if (field.type === "checkbox") field.checked = Boolean(game[key]);
    else field.value = String(game[key]);
  }
  trainingPanel.hidden = false;
  closeTraining?.focus();
};

const closeSettingsPanel = () => {
  cancelBinding();
  window.removeEventListener("keydown", captureBinding, true);
  if (settingsPanel) settingsPanel.hidden = true;
  const restoreTarget = settingsOpener instanceof HTMLElement && settingsOpener.isConnected ? settingsOpener : canvas;
  restoreTarget.focus();
  settingsOpener = null;
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
  document.body.dataset.phase = state.phase;
  document.body.dataset.training = String(Boolean(state.training));
  document.body.dataset.highContrast = String(Boolean(game.settings.highContrast));
  document.body.dataset.touchLayout = game.settings.touchLayout || "classic";
  document.body.dataset.colorFilter = game.settings.colorFilter || "normal";
  if (gameStatus) {
    const combat = state.phase === PHASE.FIGHT
      ? ` Player one health ${state.player1Health} percent, meter ${state.player1Meter}. Player two health ${state.player2Health} percent.`
      : "";
    gameStatus.textContent = `${state.phase}. ${state.player1Name} versus ${state.player2Name}.${combat}`;
  }
  const actions = [];
  if (state.phase === PHASE.TITLE) {
    for (const [mode, config] of Object.entries(GAME_MODES)) {
      actions.push(actionButton(config.label, () => game.openMode(mode)));
    }
    actions.push(actionButton("Game select", () => game.openGameSelect()));
    actions.push(actionButton(state.cpuEnabled ? `CPU ${state.cpuDifficulty}. Change opponent mode` : "Local two-player. Change opponent mode", () => game.cycleCpuMode()));
    actions.push(actionButton("Control settings", () => game.openSettings()));
  } else if (state.phase === PHASE.GAME_SELECT) {
    actions.push(actionButton("Play GOTHTECHNOLOGY", () => { game.selectGame(0); game.launchSelectedGame(); }));
    actions.push(actionButton("Play Robot Rahbe", () => { game.selectGame(1); game.launchSelectedGame(); }));
    actions.push(actionButton("Back", () => game.returnToTitle()));
  } else if (state.phase === PHASE.REPLAY_SELECT) {
    const replays = game.getReplayLibrary();
    replays.forEach((replay, index) => {
      const p1 = FIGHTERS[replay.player1Id]?.name || replay.player1Id || "Fighter";
      const p2 = FIGHTERS[replay.player2Id]?.name || replay.player2Id || "Fighter";
      actions.push(actionButton(`Play replay ${index + 1}: ${p1} versus ${p2}`, () => game.startReplay(index)));
    });
    if (replays.length) {
      actions.push(actionButton("Export selected replay", () => game.exportReplay(game.replaySlotIndex)));
      actions.push(actionButton("Delete selected replay", () => game.deleteReplay(game.replaySlotIndex)));
    }
    actions.push(actionButton("Import replay JSON", () => replayImportFile?.click()));
    actions.push(actionButton("Back", () => game.returnToTitle()));
  } else if (state.phase === PHASE.SELECT) {
    const opponentRole = state.training ? "training dummy" : (state.cpuEnabled ? "CPU opponent" : "Player 2");
    actions.push(actionButton("Select Player 1", () => game.setSelectionTarget("p1")));
    actions.push(actionButton(`Select ${opponentRole}`, () => game.setSelectionTarget("p2")));
    const activeRole = state.selectTarget === "p2" ? opponentRole : "Player 1";
    for (const characterId of ROSTER_IDS) {
      actions.push(actionButton(`Choose ${FIGHTERS[characterId].name} for ${activeRole}`, () => game.selectCharacter(characterId)));
    }
    actions.push(actionButton("Change stage", () => game.cycleStage()));
    actions.push(actionButton(`Start ${GAME_MODES[game.gameMode]?.label || "fight"}`, () => game.startVersus()));
    actions.push(actionButton("Back", () => game.returnToTitle()));
  } else if (state.phase === PHASE.FIGHT) {
    actions.push(actionButton("Pause", () => { game.phase = PHASE.PAUSE; game.announce("Game paused"); }));
    actions.push(actionButton("Command list", () => game.openCommands()));
    if (state.training) {
      actions.push(actionButton("Training tools", () => game.openTrainingTools()));
    }
    if (state.isReplay) actions.push(actionButton(`Replay speed ${state.replaySpeed} times`, () => game.cycleReplaySpeed()));
    actions.push(actionButton(state.muted ? "Unmute" : "Mute", toggleMute));
  } else if (state.phase === PHASE.PAUSE) {
    actions.push(actionButton("Resume", () => { game.phase = PHASE.FIGHT; game.announce("Fight resumed"); }));
    actions.push(actionButton("Control settings", () => game.openSettings()));
    actions.push(actionButton("Command list", () => game.openCommands()));
    if (state.training) actions.push(actionButton("Training tools", () => game.openTrainingTools()));
    if (state.isReplay) {
      actions.push(actionButton(`Replay speed ${state.replaySpeed} times`, () => game.cycleReplaySpeed()));
      actions.push(actionButton("Step one replay frame", () => game.stepReplayFrame()));
      actions.push(actionButton("Export this replay", () => game.exportReplay(game.replaySlotIndex)));
    }
    actions.push(actionButton("Restart match", () => game.startMatch(game.training)));
    actions.push(actionButton("Return to title", () => game.returnToTitle()));
    actions.push(actionButton(state.muted ? "Unmute" : "Mute", toggleMute));
  } else if (state.phase === PHASE.ROUND_END) {
    actions.push(actionButton("Next round", () => game.startRound()));
  } else if (state.phase === PHASE.MATCH_END) {
    actions.push(actionButton(game.matchEndPrompt || "Continue", () => game.advanceAfterMatch()));
  }
  accessibleActions.replaceChildren(...actions);
};

window.addEventListener("gothtechnology:state", (event) => renderAccessibleActions(event.detail));
window.addEventListener("gothtechnology:announce", (event) => {
  if (gameStatus) gameStatus.textContent = event.detail;
});
window.addEventListener("gothtechnology:settings", openSettingsPanel);
window.addEventListener("gothtechnology:commands", openCommandPanel);
window.addEventListener("gothtechnology:training-tools", openTrainingPanel);
window.addEventListener("gothtechnology:commercial", async (event) => {
  if (!(commercialVideo instanceof HTMLVideoElement) || !commercialBreak) {
    game.finishCommercialBreak();
    return;
  }
  commercialLabel.textContent = `ARCADE TRANSMISSION // LEVEL ${event.detail.nextLevel}`;
  commercialVideo.src = event.detail.url;
  commercialVideo.volume = game.settings.sfxVolume;
  commercialVideo.currentTime = 0;
  commercialBreak.hidden = false;
  commercialSkip?.focus();
  try {
    await commercialVideo.play();
  } catch (error) {
    console.warn("[GOTHTECHNOLOGY] Commercial could not play", error);
    game.finishCommercialBreak();
  }
});
window.addEventListener("gothtechnology:commercial-end", () => {
  if (commercialVideo instanceof HTMLVideoElement) {
    commercialVideo.pause();
    commercialVideo.removeAttribute("src");
    commercialVideo.load();
  }
  if (commercialBreak) commercialBreak.hidden = true;
  canvas.focus();
});
window.addEventListener("gothtechnology:keymap-changed", renderBindings);
window.addEventListener("gamepadconnected", updateControllerStatus);
window.addEventListener("gamepaddisconnected", updateControllerStatus);
closeSettings?.addEventListener("click", closeSettingsPanel);
closeCommands?.addEventListener("click", () => closeDialog(commandPanel, "Command list closed"));
closeTraining?.addEventListener("click", () => closeDialog(trainingPanel, "Training tools closed"));
mobileCommands?.addEventListener("click", () => game.openCommands());
mobileTrainingTools?.addEventListener("click", () => game.openTrainingTools());
commercialSkip?.addEventListener("click", () => game.finishCommercialBreak());
commercialVideo?.addEventListener("ended", () => game.finishCommercialBreak());
commercialVideo?.addEventListener("error", () => game.finishCommercialBreak());
commercialBreak?.addEventListener("keydown", (event) => {
  if (["Escape", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    game.finishCommercialBreak();
  }
});

replayImport?.addEventListener("click", () => replayImportFile?.click());
replayImportFile?.addEventListener("change", async () => {
  const file = replayImportFile.files?.[0];
  replayImportFile.value = "";
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    game.importReplay(payload);
  } catch {
    game.announce("Replay import rejected: invalid JSON");
  }
});

for (const [key, field] of Object.entries(settingFields)) {
  field?.addEventListener("input", () => {
    const value = field.type === "checkbox" ? field.checked : field.type === "range" ? Number(field.value) : field.value;
    game.updateSettings({ [key]: value });
  });
}

for (const [key, field] of Object.entries(trainingFields)) {
  field?.addEventListener("input", () => {
    const value = field.type === "checkbox" ? field.checked : field.type === "range" ? Number(field.value) : field.value;
    game.updateTrainingSettings({ [key]: value });
  });
}

document.getElementById("trainingRecord")?.addEventListener("click", () => game.startTrainingRecording());
document.getElementById("trainingPlayback")?.addEventListener("click", () => game.startTrainingPlayback());
document.getElementById("trainingSave")?.addEventListener("click", () => game.saveTrainingRecording());
document.getElementById("trainingLoad")?.addEventListener("click", () => game.loadTrainingRecording());
document.getElementById("trainingReset")?.addEventListener("click", () => game.resetTrainingPosition());
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
    return;
  }
  if (event.key === "Tab") {
    const focusable = [...settingsPanel.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
      .filter((element) => element instanceof HTMLElement && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

const bindDialogKeyboard = (panel, close) => panel?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])")]
    .filter((element) => element instanceof HTMLElement && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

bindDialogKeyboard(commandPanel, () => closeDialog(commandPanel, "Command list closed"));
bindDialogKeyboard(trainingPanel, () => closeDialog(trainingPanel, "Training tools closed"));
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
