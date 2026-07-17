import { ASSET_URLS, COMMERCIAL_URLS, FIGHTERS } from "../config/assets.js?v=heartline36-leash-wrist";
import { arcadeRouteFor, GAME_MODES, ROSTER_CARD_LAYOUT, ROSTER_IDS, STAGES, opponentFor } from "../config/content.js?v=heartline36-leash-wrist";
import { ASSISTS, ATTACKS } from "../config/moves.js?v=heartline36-leash-wrist";
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, GROUND_Y, PHASE, ROUND_SECONDS, WORLD } from "../config/constants.js?v=heartline36-leash-wrist";
import { AssetLoader } from "../engine/assets.js?v=heartline36-leash-wrist";
import { WebAudioBus } from "../engine/audio.js?v=heartline36-leash-wrist";
import { InputManager } from "../engine/input.js?v=heartline36-leash-wrist";
import { clamp, rectsOverlap } from "../engine/math.js?v=heartline36-leash-wrist";
import { applyHit, resolveMelee } from "../gameplay/combat.js?v=heartline36-leash-wrist";
import { CpuController } from "../gameplay/cpu.js?v=heartline36-leash-wrist";
import { AttachedSpriteEffect, LovePulseEffect, SpriteEffect } from "../gameplay/effects.js?v=heartline36-leash-wrist";
import { Fighter } from "../gameplay/fighter.js?v=heartline36-leash-wrist";
import { AssistStrike, BoerboelStrike, Projectile } from "../gameplay/projectiles.js?v=heartline36-leash-wrist";
import { applyRoundOutcomeMotions, resolveRoundOutcome } from "../gameplay/rounds.js?v=heartline36-leash-wrist";
import {
  drawCharacterSelect,
  drawArcadeEnding,
  drawDiagnostics,
  drawFightHud,
  drawGameSelect,
  drawLoading,
  drawPause,
  drawReplaySelect,
  drawRoundMessage,
  drawTitle,
  drawVersus
} from "../ui/hud.js?v=heartline36-leash-wrist";

const GAME_SELECT_ITEMS = [
  {
    id: "gothtechnology",
    title: "GOTHTECHNOLOGY",
    subtitle: "Four-fighter Detroit supernatural combat",
    badge: "4-FIGHTER",
    imageKey: "gameTitleGothtechnology"
  },
  {
    id: "shadow-ops",
    title: "ROBOT RAHBE",
    subtitle: "Number-vault run-and-gun adventure",
    badge: "RUN + GUN",
    imageKey: "gameTitleRobotRahbe",
    href: "../shadow-ops-canvas/index.html"
  }
];

const SETTINGS_KEY = "gothtechnology.settings.v3";
const STATS_KEY = "gothtechnology.stats.v2";
const REPLAY_KEY = "gothtechnology.replays.v2";
const LEGACY_REPLAY_KEY = "gothtechnology.replay.v1";
const TRAINING_RECORDING_KEY = "gothtechnology.training.recording.v1";

const readStorage = (key, fallback) => {
  try {
    return { ...fallback, ...JSON.parse(window.localStorage?.getItem(key) || "{}") };
  } catch {
    return { ...fallback };
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is optional when browser storage is blocked.
  }
};

const activeActions = (actions = {}) => Object.fromEntries(Object.entries(actions).filter(([, active]) => Boolean(active)));

const consumeAny = (input, actions) => actions.some((action) => input.consume(action));
const consumeMenuConfirm = (input) => consumeAny(input, ["ui.confirm", "p1.lightPunch", "p2.lightPunch"]);
const consumeMenuBack = (input) => consumeAny(input, ["ui.back", "p1.lightKick", "p2.lightKick"]);

const moveGridIndex = (index, columns, length, dx, dy) => {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rows = Math.ceil(length / columns);
  const nextRow = (row + dy + rows) % rows;
  const nextColumn = (column + dx + columns) % columns;
  return Math.min(nextRow * columns + nextColumn, length - 1);
};

export class GothTechnologyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderScale = window.matchMedia?.("(pointer: coarse)")?.matches ? 0.75 : 1;
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    this.canvas.width = Math.round(CANVAS_WIDTH * this.renderScale);
    this.canvas.height = Math.round(CANVAS_HEIGHT * this.renderScale);
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.input = new InputManager(window);
    this.audio = new WebAudioBus(ASSET_URLS.music, ASSET_URLS.fightMusic);
    this.settings = readStorage(SETTINGS_KEY, {
      musicVolume: 0.72,
      sfxVolume: 0.9,
      vibration: true,
      shake: 1,
      highContrast: false,
      reduceFlash: false,
      colorFilter: "normal",
      hudScale: 1,
      touchLayout: "classic"
    });
    this.audio.setMusicVolume?.(this.settings.musicVolume);
    this.audio.setSfxVolume?.(this.settings.sfxVolume);
    this.audio.setVibrationEnabled?.(this.settings.vibration);
    this.loadingBackdrop = new Image();
    this.loadingBackdrop.decoding = "async";
    this.loadingBackdrop.src = ASSET_URLS.titleBackdrop;
    this.assets = null;
    this.phase = PHASE.LOADING;
    this.loadingProgress = 0;
    this.motionLoadingProgress = 0;
    this.motionAssetsReady = false;
    this.motionLoadPromise = null;
    this.motionLoadError = "";
    this.fightAssetsReady = false;
    this.fightLoadingProgress = 0;
    this.fightLoadPromise = null;
    this.fightLoadError = "";
    this.stageCache = null;
    this.cpuEnabled = true;
    this.cpuDifficulty = "normal";
    this.cpuController = new CpuController();
    this.cpuModeBeforeTraining = null;
    this.training = false;
    this.trainingDummyMode = "stand";
    this.trainingGuardMode = "off";
    this.trainingCounterHit = false;
    this.trainingWakeupAction = "none";
    this.trainingThrowTech = false;
    this.trainingInputDelayFrames = 0;
    this.trainingInputQueue = [];
    this.trainingHitboxes = false;
    this.trainingReadout = null;
    this.trainingPatternTimer = 0;
    this.trainingRecording = [];
    this.trainingPlaybackIndex = 0;
    this.trainingJumpTimer = 0;
    this.showFrameData = false;
    this.player1Id = "MASTER_EZRA";
    this.player2Id = "KALYX";
    this.selectTarget = "p1";
    this.rosterIndex = ROSTER_IDS.indexOf(this.player1Id);
    this.gameMode = "versus";
    this.menuTransitionCooldown = 0;
    this.stageIndex = 0;
    this.arcadeStage = 0;
    this.modeComplete = false;
    this.modeCanContinue = false;
    this.matchEndPrompt = "RETURN TO TITLE";
    this.replayFrames = [];
    this.replayPlayback = [];
    this.replayIndex = 0;
    this.isReplay = false;
    this.stats = readStorage(STATS_KEY, {
      matches: 0,
      wins: 0,
      losses: 0,
      arcadeClears: 0,
      damage: 0,
      perfectBlocks: 0,
      throwTechs: 0
    });
    this.debug = false;
    this.roundNumber = 1;
    this.roundTimer = ROUND_SECONDS;
    this.roundMessageTimer = 0;
    this.matchWinner = null;
    this.roundResultText = "";
    this.roundResultSubtext = "";
    this.playerEngaged = false;
    this.fighters = [];
    this.projectiles = [];
    this.assists = [];
    this.effects = [];
    this.playerEngaged = false;
    this.hitstop = 0;
    this.shake = 0;
    this.slowMo = 0;
    this.flash = 0;
    this.parallax = 0;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.menuHitAreas = [];
    this.titleMenuIndex = 0;
    this.pauseMenuIndex = 0;
    this.gameSelectIndex = 0;
    this.replaySlotIndex = 0;
    this.replaySpeed = 1;
    this.replayLibrary = null;
    this.matchStatsStart = null;
    this.commercialIndex = 0;
    this.cpuDecisionTimer = 0;
    this.cpuDecision = {};
    this.inputLog = ["READY"];
    this.raf = 0;
    this.stopped = false;
    this.rewards = null;
    this.rewardTask = Promise.resolve();
    this.rewardMatchKey = "";
    this.rewardRoundTicks = 0;
    this.rewardTotalTicks = 0;
    this.rewardMeaningfulActions = 0;
    this.rewardStatus = "";
    this.rewardStatusTimer = 0;
    this.lastAccessibleState = "";
    this.handleInterruption = () => this.pauseForInterruption();
    window.addEventListener("blur", this.handleInterruption);
    document.addEventListener("visibilitychange", this.handleInterruption);
    this.bindPointer();
  }

  async boot() {
    this.assets = await new AssetLoader((progress) => {
      this.loadingProgress = progress;
      this.render();
    }).load();
    if (this.stopped) return;
    this.createFighters();
    this.phase = PHASE.TITLE;
    this.syncMusicForPhase();
    this.assets.loadMenuAssets().then(() => this.render());
    this.raf = requestAnimationFrame((time) => this.loop(time));
  }

  stop() {
    this.stopped = true;
    this.rewards?.close?.();
    window.removeEventListener("blur", this.handleInterruption);
    document.removeEventListener("visibilitychange", this.handleInterruption);
    this.input.destroy?.();
    this.audio.stopMusic();
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  pauseForInterruption() {
    if (document.hidden || document.hasFocus?.() === false) {
      this.input.clear();
      if (this.phase === PHASE.FIGHT) {
        this.phase = PHASE.PAUSE;
        this.pauseMenuIndex = 0;
        this.announce("Game paused because focus changed");
      }
    }
  }

  announce(message) {
    window.dispatchEvent(new CustomEvent("gothtechnology:announce", { detail: String(message || "") }));
    this.lastAccessibleState = "";
  }

  openSettings() {
    if (this.phase === PHASE.FIGHT) this.phase = PHASE.PAUSE;
    window.dispatchEvent(new CustomEvent("gothtechnology:settings"));
    this.announce("Control settings opened");
  }

  updateSettings(patch = {}) {
    this.settings = { ...this.settings, ...patch };
    this.audio.setMusicVolume?.(this.settings.musicVolume);
    this.audio.setSfxVolume?.(this.settings.sfxVolume);
    this.audio.setVibrationEnabled?.(this.settings.vibration);
    document.body.dataset.highContrast = String(Boolean(this.settings.highContrast));
    document.body.dataset.touchLayout = this.settings.touchLayout || "classic";
    document.body.dataset.colorFilter = this.settings.colorFilter || "normal";
    writeStorage(SETTINGS_KEY, this.settings);
    this.lastAccessibleState = "";
    this.render();
  }

  openCommands() {
    if (this.phase === PHASE.FIGHT) this.phase = PHASE.PAUSE;
    window.dispatchEvent(new CustomEvent("gothtechnology:commands", { detail: { characterId: this.player1Id } }));
    this.announce(`${this.fighters[0]?.config.name ?? "Fighter"} command list opened`);
  }

  openTrainingTools() {
    if (!this.training) return;
    if (this.phase === PHASE.FIGHT) this.phase = PHASE.PAUSE;
    window.dispatchEvent(new CustomEvent("gothtechnology:training-tools"));
    this.announce("Training tools opened");
  }

  openMode(mode) {
    if (!GAME_MODES[mode]) {
      this.announce("Mode unavailable");
      return;
    }
    if (mode === "replay") {
      this.openReplaySelect();
      return;
    }
    this.gameMode = mode;
    this.arcadeStage = 0;
    this.modeComplete = false;
    if (mode === "arcade") this.cpuEnabled = true;
    this.openCharacterSelect(mode === "training", mode);
  }

  returnToTitle() {
    if (this.cpuModeBeforeTraining) {
      this.cpuEnabled = this.cpuModeBeforeTraining.enabled;
      this.cpuDifficulty = this.cpuModeBeforeTraining.difficulty;
      this.cpuModeBeforeTraining = null;
    }
    this.training = false;
    this.isReplay = false;
    this.replayPlayback = [];
    this.phase = PHASE.TITLE;
    this.matchWinner = null;
    this.syncMusicForPhase();
    this.announce("Title menu");
  }

  cycleCpuMode() {
    const modes = ["local", "easy", "normal", "hard"];
    const current = this.cpuEnabled ? this.cpuDifficulty : "local";
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    this.cpuEnabled = next !== "local";
    if (this.cpuEnabled) this.cpuDifficulty = next;
    this.lastAccessibleState = "";
    this.audio.beep("select");
  }

  cycleStage() {
    this.stageIndex = (this.stageIndex + 1) % STAGES.length;
    this.stageCache = null;
    if (this.fightAssetsReady) this.buildStageCache();
    this.audio.beep("select");
    this.announce(`Stage ${STAGES[this.stageIndex].name}`);
  }

  startRewardSession() {
    this.rewards?.close?.();
    this.rewardTask = Promise.resolve();
    this.rewardMatchKey = `fighter-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    this.rewardRoundTicks = 0;
    this.rewardTotalTicks = 0;
    this.rewardMeaningfulActions = 0;
    this.rewards = window.LottoMindGameRewards?.createClient?.({
      gameId: "fighter",
      buildId: "fighter-2026-06-25",
      mode: this.training ? "training" : this.cpuEnabled ? "versus_cpu" : "local_pvp",
      onStatus: (event) => {
        if (event.status === "ready") {
          this.rewardStatus = "REWARDS CONNECTED";
          this.rewardStatusTimer = 2.5;
        }
        if (event.status === "error") {
          const message = event.detail?.message || String(event.detail || "Rewards unavailable");
          const authRequired = message.includes("AUTH_REQUIRED");
          this.rewardStatus = authRequired ? "SIGN IN TO EARN REWARDS" : "REWARDS TEMPORARILY UNAVAILABLE";
          this.rewardStatusTimer = 5;
          if (authRequired) this.rewards?.close?.();
        }
      }
    }) || null;
  }

  emitRewardEvent(type, payload, options = {}) {
    if (!this.rewards) return;
    this.rewardTask = this.rewardTask.then(async () => {
      const event = await this.rewards.emit({ type, payload });
      if (options.flush) await this.rewards.flush();
      if (options.finalize && event) {
        await this.rewards.finalize({
          idempotencyKey: options.idempotencyKey || this.rewardMatchKey || event.eventId,
          completionEventId: event.eventId
        });
      }
    }).catch((error) => {
      const message = error?.message || String(error);
      if (!message.includes("AUTH_REQUIRED")) console.warn("[GOTHTECHNOLOGY rewards]", error);
    });
  }

  bindPointer() {
    this.canvas.addEventListener("pointerdown", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      this.audio.ensure();
      if (this.phase === PHASE.ROUND_END) {
        this.startRound();
        return;
      }
      if (this.phase === PHASE.MATCH_END) {
        this.advanceAfterMatch();
        return;
      }
      const hit = this.menuHitAreas.find((area) => x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h);
      if (hit) hit.action();
      else if (this.phase === PHASE.TITLE) this.openCharacterSelect(false);
    });
  }

  createFighters() {
    const p1Config = FIGHTERS[this.player1Id] ?? FIGHTERS.KALYX;
    const p2Config = FIGHTERS[this.player2Id] ?? FIGHTERS.MASTER_EZRA;
    this.fighters = [
      new Fighter({ id: p1Config.id, slot: 1, config: { ...p1Config }, assets: this.assets, x: 360, facing: 1 }),
      new Fighter({ id: p2Config.id, slot: 2, config: { ...p2Config }, assets: this.assets, x: 920, facing: -1 })
    ];
    this.fighters[0].resetRound(360, 1);
    this.fighters[1].resetRound(920, -1);
  }

  selectPlayer1(id) {
    this.selectCharacter(id, "p1");
  }

  selectPlayer2(id) {
    this.selectCharacter(id, "p2");
  }

  selectCharacter(id, target = this.selectTarget) {
    if (!FIGHTERS[id]) return;
    if (target === "p2") this.player2Id = id;
    else {
      this.player1Id = id;
      if (this.gameMode === "arcade") {
        const route = arcadeRouteFor(this.player1Id);
        const node = route[this.arcadeStage] ?? route[0];
        this.player2Id = node.opponentId;
        this.stageIndex = node.stageIndex;
        this.cpuDifficulty = node.difficulty;
      }
    }
    this.rosterIndex = ROSTER_IDS.indexOf(id);
    this.createFighters();
    this.prepareCharacterMotions();
    this.audio.beep("select");
    this.lastAccessibleState = "";
    this.render();
  }

  setSelectionTarget(target) {
    if (target !== "p1" && target !== "p2") return;
    this.selectTarget = target;
    const activeId = target === "p2" ? this.player2Id : this.player1Id;
    this.rosterIndex = Math.max(0, ROSTER_IDS.indexOf(activeId));
    this.lastAccessibleState = "";
    this.audio.beep("select");
    this.render();
  }

  opponentForMode() {
    if (this.gameMode === "arcade") {
      return arcadeRouteFor(this.player1Id)[this.arcadeStage]?.opponentId ?? opponentFor(this.player1Id);
    }
    return opponentFor(this.player1Id);
  }

  openCharacterSelect(training = false, mode = training ? "training" : this.gameMode) {
    this.gameMode = mode;
    this.training = training;
    if (training) {
      this.cpuModeBeforeTraining ??= { enabled: this.cpuEnabled, difficulty: this.cpuDifficulty };
      this.cpuEnabled = false;
      this.trainingDummyMode = "stand";
    }
    this.player2Id = this.opponentForMode();
    if (mode === "arcade") {
      const node = arcadeRouteFor(this.player1Id)[0];
      this.stageIndex = node.stageIndex;
      this.cpuDifficulty = node.difficulty;
    }
    this.selectTarget = "p1";
    this.rosterIndex = Math.max(0, ROSTER_IDS.indexOf(this.player1Id));
    this.phase = PHASE.SELECT;
    this.menuTransitionCooldown = 0.12;
    this.createFighters();
    this.prepareCharacterMotions();
    this.prepareFightAssets();
    this.syncMusicForPhase();
    this.audio.beep("select");
  }

  openGameSelect() {
    this.phase = PHASE.GAME_SELECT;
    this.assets.loadGameSelectAssets().then(() => this.render());
    this.syncMusicForPhase();
    this.audio.beep("select");
  }

  selectGame(index) {
    this.gameSelectIndex = clamp(index, 0, GAME_SELECT_ITEMS.length - 1);
    this.audio.beep("select");
  }

  launchSelectedGame() {
    const item = GAME_SELECT_ITEMS[this.gameSelectIndex] ?? GAME_SELECT_ITEMS[0];
    if (item.id === "gothtechnology") {
      this.phase = PHASE.TITLE;
      this.syncMusicForPhase();
      this.audio.beep("select");
      return;
    }
    if (item.href) {
      window.location.href = new URL(item.href, window.location.href).href;
    }
  }

  startVersus() {
    this.phase = PHASE.VERSUS;
    this.roundMessageTimer = 1.35;
    this.prepareCharacterMotions();
    this.prepareFightAssets();
    this.audio.beep("select");
    this.announce(`${this.fighters[0]?.config.name ?? "Player 1"} versus ${this.fighters[1]?.config.name ?? "Player 2"}`);
  }

  startMatch(training = this.training) {
    this.training = training;
    this.roundsToWin = GAME_MODES[this.gameMode]?.roundsToWin || 2;
    if (!this.isReplay) this.replayFrames = [];
    this.replayIndex = 0;
    this.modeComplete = false;
    this.matchEndPrompt = "RETURN TO TITLE";
    this.startRewardSession();
    this.matchStatsStart = {
      damage: this.stats.damage,
      perfectBlocks: this.stats.perfectBlocks,
      throwTechs: this.stats.throwTechs
    };
    this.roundNumber = 1;
    this.roundTimer = ROUND_SECONDS;
    this.matchWinner = null;
    this.fighters.forEach((f) => {
      f.roundWins = 0;
      f.meter = training ? 100 : 0;
    });
    this.emitRewardEvent("fighter.match_started", {
      playerCharacter: this.player1Id,
      opponentCharacter: this.player2Id,
      cpuEnabled: this.cpuEnabled,
      trainingMode: this.training,
      debug: this.debug,
      configuredRoundTimer: ROUND_SECONDS,
      buildId: "fighter-2026-06-25"
    });
    this.startRound();
  }

  prepareCharacterMotions() {
    const manifests = [this.player1Id, this.player2Id]
      .map((id) => FIGHTERS[id]?.manifestKey ?? id);
    if (manifests.every((id) => this.assets.loadedCharacterMotions.has(id))) {
      this.motionAssetsReady = true;
      this.motionLoadingProgress = 1;
      this.createFighters();
      return Promise.resolve(this.assets);
    }
    if (this.motionLoadPromise) {
      return this.motionLoadPromise.then(() => this.prepareCharacterMotions());
    }
    this.motionAssetsReady = false;
    this.motionLoadError = "";
    const loadPromise = this.assets.loadCharacterMotions(
      manifests,
      (progress) => {
        this.motionLoadingProgress = progress;
        this.render();
      }
    ).then((assets) => {
      const selectedManifests = [this.player1Id, this.player2Id]
        .map((id) => FIGHTERS[id]?.manifestKey ?? id);
      this.motionAssetsReady = selectedManifests.every((id) => this.assets.loadedCharacterMotions.has(id));
      if (this.motionAssetsReady) {
        this.motionLoadingProgress = 1;
        this.createFighters();
      }
      this.render();
      return assets;
    }).catch((error) => {
      this.motionLoadError = error?.message || String(error);
      this.phase = PHASE.SELECT;
      this.announce("Fighter motion load failed. Select versus to retry");
      console.warn("[GOTHTECHNOLOGY] Character motion load failed", error);
      return null;
    }).finally(() => {
      this.motionLoadPromise = null;
    });
    this.motionLoadPromise = loadPromise;
    return loadPromise.then(() => {
      const selectedManifests = [this.player1Id, this.player2Id]
        .map((id) => FIGHTERS[id]?.manifestKey ?? id);
      if (!selectedManifests.every((id) => this.assets.loadedCharacterMotions.has(id))) {
        return this.prepareCharacterMotions();
      }
      return this.assets;
    });
  }

  prepareFightAssets() {
    if (this.fightAssetsReady) return Promise.resolve(this.assets);
    if (this.fightLoadPromise) return this.fightLoadPromise;
    this.fightLoadError = "";
    this.fightLoadPromise = this.assets.loadFightAssets((progress) => {
      this.fightLoadingProgress = progress;
      this.render();
    }).then((assets) => {
      this.fightAssetsReady = true;
      this.fightLoadingProgress = 1;
      this.buildStageCache();
      this.render();
      return assets;
    }).catch((error) => {
      this.fightLoadError = error?.message || String(error);
      this.phase = PHASE.SELECT;
      this.announce("Fight assets failed to load. Select versus to retry");
      console.warn("[GOTHTECHNOLOGY] Fight assets failed", error);
      return null;
    }).finally(() => {
      this.fightLoadPromise = null;
    });
    return this.fightLoadPromise;
  }

  get matchAssetsReady() {
    return this.motionAssetsReady && this.fightAssetsReady;
  }

  startRound() {
    this.roundTimer = ROUND_SECONDS;
    this.roundResultText = "";
    this.roundResultSubtext = "";
    this.rewardRoundTicks = 0;
    this.rewardMeaningfulActions = 0;
    this.projectiles = [];
    this.assists = [];
    this.effects = [];
    this.hitstop = 0;
    this.shake = 0;
    this.slowMo = 0;
    this.flash = 0;
    this.cpuDecisionTimer = 0;
    this.cpuDecision = {};
    this.cpuController.reset();
    this.trainingInputQueue = [];
    this.trainingReadout = null;
    this.fighters[0].resetRound(360, 1);
    this.fighters[1].resetRound(920, -1);
    if (this.training) {
      this.fighters[0].meter = 100;
      this.fighters[1].meter = 100;
    }
    this.phase = PHASE.FIGHT;
    this.syncMusicForPhase();
    this.roundMessageTimer = 0.72;
    this.emitRewardEvent("fighter.round_started", {
      roundNumber: this.roundNumber,
      playerHealth: Math.round(this.fighters[0].config.maxHealth),
      opponentHealth: Math.round(this.fighters[1].config.maxHealth)
    });
    this.announce(`Round ${this.roundNumber}`);
  }

  loop(time) {
    if (this.stopped) return;
    const rawDt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    const playbackRate = this.isReplay && this.phase === PHASE.FIGHT ? this.replaySpeed : 1;
    this.accumulator += rawDt * playbackRate;
    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < 5) {
      const dt = this.slowMo > 0 ? this.fixedStep * 0.55 : this.fixedStep;
      this.update(dt);
      this.accumulator -= this.fixedStep;
      steps += 1;
    }
    if (steps === 5) this.accumulator = 0;
    this.render();
    if (steps > 0) this.input.endFrame();
    this.raf = requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.input.pollGamepads?.();
    this.menuTransitionCooldown = Math.max(0, this.menuTransitionCooldown - dt);
    this.handleGlobalInput();
    this.parallax += dt;
    this.shake = Math.max(0, this.shake - dt * 44);
    this.slowMo = Math.max(0, this.slowMo - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.rewardStatusTimer = Math.max(0, this.rewardStatusTimer - dt);
    if (this.phase === PHASE.VERSUS) {
      if (!this.matchAssetsReady) return;
      this.roundMessageTimer -= dt;
      if (this.roundMessageTimer <= 0) this.startMatch(this.training);
      return;
    }
    if (this.phase !== PHASE.FIGHT) return;
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      return;
    }
    if (this.roundMessageTimer > 0) {
      this.roundMessageTimer = Math.max(0, this.roundMessageTimer - dt);
      return;
    }
    if (!this.training) this.roundTimer = Math.max(0, this.roundTimer - dt);
    else {
      for (const fighter of this.fighters) {
        fighter.health = Math.min(fighter.config.maxHealth, fighter.health + dt * 42);
        fighter.meter = Math.min(100, fighter.meter + dt * 6);
      }
    }

    this.faceFighters();
    const replayFrame = this.isReplay
      ? (this.replayPlayback[this.replayIndex] ?? { p1: {}, p2: {} })
      : null;
    let p1Actions = replayFrame ? { ...replayFrame.p1 } : this.input.actions(1);
    if (this.training && this.trainingInputDelayFrames > 0) {
      this.trainingInputQueue.push(p1Actions);
      p1Actions = this.trainingInputQueue.length > this.trainingInputDelayFrames
        ? this.trainingInputQueue.shift()
        : {};
    }
    this.captureInputLog(p1Actions);
    if (Object.values(p1Actions).some(Boolean)) this.playerEngaged = true;
    const p2Actions = replayFrame
      ? { ...replayFrame.p2 }
      : (this.training
        ? this.trainingDummyActions(dt, p1Actions)
        : (this.cpuEnabled ? this.cpuActions(dt) : this.input.actions(2)));
    if (this.isReplay) {
      this.replayIndex = Math.min(this.replayIndex + 1, this.replayPlayback.length);
    } else if (!this.training) {
      this.replayFrames.push({ p1: activeActions(p1Actions), p2: activeActions(p2Actions) });
    }

    this.fighters[0].update(dt, p1Actions, this.fighters[1], this);
    this.fighters[1].update(dt, p2Actions, this.fighters[0], this);

    resolveMelee(this.fighters[0], this.fighters[1], this);
    resolveMelee(this.fighters[1], this.fighters[0], this);

    this.projectiles.forEach((projectile) => projectile.update(dt, this));
    this.assists.forEach((assist) => assist.update(dt, this));
    this.effects.forEach((effect) => effect.update(dt, this));
    this.resolveProjectileClashes();
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.assists = this.assists.filter((a) => !a.dead);
    this.effects = this.effects.filter((e) => !e.dead);

    this.keepFightersSeparated();
    this.faceFighters();
    this.rewardRoundTicks += 1;
    this.rewardTotalTicks += 1;
    this.checkRoundEnd();
  }

  handleGlobalInput() {
    if (this.input.consume("ui.mute")) this.audio.toggleMute();
    if (this.input.consume("ui.debug")) this.debug = !this.debug;
    if (this.phase === PHASE.COMMERCIAL) {
      if (
        consumeMenuConfirm(this.input) ||
        consumeMenuBack(this.input) ||
        this.input.consume("ui.pause")
      ) this.finishCommercialBreak();
      return;
    }
    if (this.input.consume("ui.cpu")) this.cycleCpuMode();
    if (this.input.consume("ui.training")) this.training = !this.training;
    if (this.input.consume("ui.reset")) {
      if (this.training && this.phase === PHASE.FIGHT) this.resetTrainingPosition();
      else this.startMatch(this.training);
    }
    if (this.training && this.input.consume("ui.dummy")) this.cycleTrainingDummy();
    if (this.training && this.input.consume("ui.record")) this.startTrainingRecording();
    if (this.training && this.input.consume("ui.playback")) this.startTrainingPlayback();
    if (this.training && this.input.consume("ui.frameData")) this.showFrameData = !this.showFrameData;

    if (this.phase === PHASE.TITLE) {
      const titleActions = [
        () => this.openMode("versus"),
        () => this.openMode("arcade"),
        () => this.openMode("training"),
        () => this.openMode("replay"),
        () => this.openGameSelect(),
        () => this.openSettings()
      ];
      const layouts = [
        { x: 124, y: 552, w: 312, h: 46 },
        { x: 484, y: 552, w: 312, h: 46 },
        { x: 844, y: 552, w: 312, h: 46 },
        { x: 124, y: 610, w: 312, h: 46 },
        { x: 484, y: 610, w: 312, h: 46 },
        { x: 844, y: 610, w: 312, h: 46 }
      ];
      this.menuHitAreas = layouts.map((layout, index) => ({
        ...layout,
        action: () => {
          this.titleMenuIndex = index;
          titleActions[index]();
        }
      }));
      this.audio.startMusic("menu");
      const left = consumeAny(this.input, ["p1.left", "p2.left"]);
      const right = consumeAny(this.input, ["p1.right", "p2.right"]);
      const up = consumeAny(this.input, ["p1.up", "p2.up"]);
      const down = consumeAny(this.input, ["p1.down", "p2.down"]);
      if (left || right || up || down) {
        this.titleMenuIndex = moveGridIndex(this.titleMenuIndex, 3, titleActions.length, right ? 1 : left ? -1 : 0, down ? 1 : up ? -1 : 0);
        this.audio.beep("select");
      }
      if (consumeMenuConfirm(this.input)) titleActions[this.titleMenuIndex]();
      return;
    }

    if (this.phase === PHASE.GAME_SELECT) {
      this.menuHitAreas = [
        { x: 88, y: 154, w: 512, h: 396, action: () => { this.selectGame(0); this.launchSelectedGame(); } },
        { x: 680, y: 154, w: 512, h: 396, action: () => { this.selectGame(1); this.launchSelectedGame(); } },
        { x: 494, y: 596, w: 292, h: 54, action: () => { this.phase = PHASE.TITLE; this.syncMusicForPhase(); } }
      ];
      if (this.input.consume("p1.left") || this.input.consume("p2.left")) this.selectGame(0);
      if (this.input.consume("p1.right") || this.input.consume("p2.right")) this.selectGame(1);
      if (consumeMenuConfirm(this.input)) this.launchSelectedGame();
      if (consumeMenuBack(this.input)) {
        this.phase = PHASE.TITLE;
        this.syncMusicForPhase();
      }
      return;
    }

    if (this.phase === PHASE.REPLAY_SELECT) {
      const replays = this.getReplayLibrary();
      this.replaySlotIndex = Math.min(this.replaySlotIndex, Math.max(0, replays.length - 1));
      this.menuHitAreas = [
        ...replays.map((entry, index) => ({
          x: 188,
          y: 142 + index * 74,
          w: 904,
          h: 58,
          action: () => { this.replaySlotIndex = index; this.render(); }
        })),
        { x: 246, y: 590, w: 182, h: 54, action: () => this.startReplay(this.replaySlotIndex) },
        { x: 450, y: 590, w: 182, h: 54, action: () => this.exportReplay(this.replaySlotIndex) },
        { x: 654, y: 590, w: 182, h: 54, action: () => this.deleteReplay(this.replaySlotIndex) },
        { x: 858, y: 590, w: 182, h: 54, action: () => this.returnToTitle() }
      ];
      if (replays.length) {
        const up = consumeAny(this.input, ["p1.up", "p2.up"]);
        const down = consumeAny(this.input, ["p1.down", "p2.down"]);
        if (up || down) {
          this.replaySlotIndex = (this.replaySlotIndex + (down ? 1 : -1) + replays.length) % replays.length;
          this.audio.beep("select");
        }
        if (consumeMenuConfirm(this.input)) this.startReplay(this.replaySlotIndex);
        if (consumeAny(this.input, ["p1.heavyPunch", "p2.heavyPunch"])) this.exportReplay(this.replaySlotIndex);
        if (consumeAny(this.input, ["p1.heavyKick", "p2.heavyKick"])) this.deleteReplay(this.replaySlotIndex);
      }
      if (consumeMenuBack(this.input)) this.returnToTitle();
      return;
    }

    if (this.phase === PHASE.SELECT) {
      this.menuHitAreas = [
        { x: 352, y: 98, w: 272, h: 32, action: () => this.setSelectionTarget("p1") },
        { x: 656, y: 98, w: 272, h: 32, action: () => this.setSelectionTarget("p2") },
        ...ROSTER_CARD_LAYOUT.map((layout, index) => ({
          ...layout,
          action: () => this.selectCharacter(ROSTER_IDS[index])
        })),
        { x: 330, y: 570, w: 292, h: 52, action: () => this.cycleStage() },
        { x: 658, y: 570, w: 292, h: 52, action: () => this.startVersus() }
      ];
      if (this.input.consume("p1.up") || this.input.consume("p2.up")) this.setSelectionTarget("p1");
      if (this.input.consume("p1.down") || this.input.consume("p2.down")) this.setSelectionTarget("p2");
      if (
        this.input.consume("p1.left") ||
        this.input.consume("p1.right") ||
        this.input.consume("p2.left") ||
        this.input.consume("p2.right")
      ) {
        const delta = this.input.isDown("p1.left") || this.input.isDown("p2.left") ? -1 : 1;
        this.rosterIndex = (this.rosterIndex + delta + ROSTER_IDS.length) % ROSTER_IDS.length;
        this.selectCharacter(ROSTER_IDS[this.rosterIndex]);
      }
      const confirm = consumeMenuConfirm(this.input);
      if (confirm && this.menuTransitionCooldown <= 0) this.startVersus();
      if (consumeMenuBack(this.input)) {
        this.phase = PHASE.TITLE;
        this.syncMusicForPhase();
      }
      return;
    }

    this.menuHitAreas = [];
    if (this.phase === PHASE.PAUSE) {
      const pauseActions = [
        () => { this.phase = PHASE.FIGHT; this.input.clear(); this.announce("Fight resumed"); },
        () => this.openSettings(),
        () => this.startMatch(this.training),
        () => this.returnToTitle()
      ];
      const layouts = [
        { x: 454, y: 484, w: 172, h: 48 },
        { x: 654, y: 484, w: 172, h: 48 },
        { x: 454, y: 540, w: 172, h: 48 },
        { x: 654, y: 540, w: 172, h: 48 }
      ];
      this.menuHitAreas = layouts.map((layout, index) => ({
        ...layout,
        action: () => {
          this.pauseMenuIndex = index;
          pauseActions[index]();
        }
      }));
      const left = consumeAny(this.input, ["p1.left", "p2.left"]);
      const right = consumeAny(this.input, ["p1.right", "p2.right"]);
      const up = consumeAny(this.input, ["p1.up", "p2.up"]);
      const down = consumeAny(this.input, ["p1.down", "p2.down"]);
      if (left || right || up || down) {
        this.pauseMenuIndex = moveGridIndex(this.pauseMenuIndex, 2, pauseActions.length, right ? 1 : left ? -1 : 0, down ? 1 : up ? -1 : 0);
        this.audio.beep("select");
      }
      if (consumeMenuConfirm(this.input)) pauseActions[this.pauseMenuIndex]();
      if (this.phase === PHASE.PAUSE && consumeMenuBack(this.input)) pauseActions[0]();
    }
    if (this.input.consume("ui.pause")) {
      this.phase = this.phase === PHASE.PAUSE ? PHASE.FIGHT : PHASE.PAUSE;
      if (this.phase === PHASE.PAUSE) this.pauseMenuIndex = 0;
      this.audio.beep("select");
      this.announce(this.phase === PHASE.PAUSE ? "Game paused" : "Fight resumed");
    }
    if ((this.phase === PHASE.ROUND_END || this.phase === PHASE.MATCH_END) && consumeMenuConfirm(this.input)) {
      if (this.phase === PHASE.MATCH_END) {
        this.advanceAfterMatch();
      }
      else this.startRound();
    }
  }

  cycleTrainingDummy() {
    const modes = ["stand", "guard", "crouch", "jump", "guardAfterHit", "randomGuard", "throwTech", "wakeUp"];
    const index = modes.indexOf(this.trainingDummyMode);
    this.trainingDummyMode = modes[(index + 1) % modes.length];
    this.trainingPlaybackIndex = 0;
    this.announce(`Training dummy ${this.trainingDummyMode}`);
  }

  startTrainingRecording() {
    this.trainingDummyMode = "record";
    this.trainingRecording = [];
    this.trainingPlaybackIndex = 0;
    this.announce("Training recording started");
  }

  startTrainingPlayback() {
    if (!this.trainingRecording.length) {
      this.announce("No training recording available");
      return;
    }
    this.trainingDummyMode = "playback";
    this.trainingPlaybackIndex = 0;
    this.announce("Training playback started");
  }

  saveTrainingRecording() {
    if (!this.trainingRecording.length) {
      this.announce("No training recording to save");
      return;
    }
    writeStorage(TRAINING_RECORDING_KEY, { frames: this.trainingRecording });
    this.announce("Training recording saved");
  }

  loadTrainingRecording() {
    const saved = readStorage(TRAINING_RECORDING_KEY, { frames: [] });
    this.trainingRecording = Array.isArray(saved.frames) ? saved.frames.slice(0, 600) : [];
    this.trainingPlaybackIndex = 0;
    this.announce(this.trainingRecording.length ? "Training recording loaded" : "No saved training recording");
  }

  updateTrainingSettings(patch = {}) {
    Object.assign(this, patch);
    if ("trainingHitboxes" in patch) this.debug = Boolean(this.trainingHitboxes);
    this.trainingInputQueue = [];
    this.trainingPlaybackIndex = 0;
    this.lastAccessibleState = "";
    this.render();
  }

  trainingDummyActions(dt, playerActions) {
    this.trainingPatternTimer += dt;
    if (this.trainingDummyMode === "record") {
      if (this.trainingRecording.length < 600) this.trainingRecording.push({ ...playerActions });
      else this.trainingDummyMode = "stand";
      return {};
    }
    if (this.trainingDummyMode === "playback") {
      const actions = this.trainingRecording[this.trainingPlaybackIndex] ?? {};
      this.trainingPlaybackIndex = (this.trainingPlaybackIndex + 1) % this.trainingRecording.length;
      return { ...actions };
    }
    const dummy = this.fighters[1];
    const player = this.fighters[0];
    const away = player.x < dummy.x ? "right" : "left";
    const guardMode = this.trainingDummyMode === "guard" ? "always" : this.trainingGuardMode;
    const shouldGuard = guardMode === "always" ||
      (guardMode === "afterHit" && dummy.lastHitTimer > 0) ||
      (guardMode === "random" && Math.floor(this.trainingPatternTimer * 1.6) % 2 === 0) ||
      this.trainingDummyMode === "guardAfterHit" && dummy.lastHitTimer > 0 ||
      this.trainingDummyMode === "randomGuard" && Math.floor(this.trainingPatternTimer * 1.6) % 2 === 0;
    if (shouldGuard) {
      return { [away]: true, down: player.currentAttack?.data?.level === "low" };
    }
    if ((this.trainingThrowTech || this.trainingDummyMode === "throwTech") && player.currentAttack?.name === "throw") {
      return { throw: true };
    }
    if ((this.trainingWakeupAction !== "none" || this.trainingDummyMode === "wakeUp") && dummy.knockdown > 0 && dummy.knockdown < 0.18) {
      const action = this.trainingWakeupAction === "none" ? "lightPunch" : this.trainingWakeupAction;
      if (action === "block") return { [away]: true };
      return { [action]: true };
    }
    if (this.trainingDummyMode === "guard") {
      return this.fighters[0].x < this.fighters[1].x ? { right: true } : { left: true };
    }
    if (this.trainingDummyMode === "crouch") return { down: true };
    if (this.trainingDummyMode === "jump") {
      this.trainingJumpTimer = Math.max(0, this.trainingJumpTimer - dt);
      if (this.trainingJumpTimer <= 0) {
        this.trainingJumpTimer = 1.15;
        return { up: true };
      }
    }
    return {};
  }

  resetTrainingPosition() {
    this.projectiles = [];
    this.assists = [];
    this.effects = [];
    this.hitstop = 0;
    this.shake = 0;
    this.fighters[0].resetRound(410, 1);
    this.fighters[1].resetRound(870, -1);
    this.fighters.forEach((fighter) => {
      fighter.health = fighter.config.maxHealth;
      fighter.meter = 100;
    });
    this.inputLog = ["READY"];
    this.trainingReadout = null;
    this.trainingInputQueue = [];
    this.announce("Training position reset");
  }

  cpuActions(dt = 1 / 60) {
    if (!this.playerEngaged && this.roundTimer > ROUND_SECONDS - 3) return {};
    return this.cpuController.next(dt, {
      cpu: this.fighters[1],
      player: this.fighters[0],
      projectiles: this.projectiles,
      difficulty: this.cpuDifficulty,
      world: WORLD
    });
  }

  captureInputLog(actions) {
    const labels = [];
    if (actions.left) labels.push("L");
    if (actions.right) labels.push("R");
    if (actions.up) labels.push("UP");
    if (actions.down) labels.push("LOW");
    if (actions.lightPunch) labels.push("LP");
    if (actions.heavyPunch) labels.push("HP");
    if (actions.lightKick) labels.push("LK");
    if (actions.heavyKick) labels.push("HK");
    if (actions.special) labels.push("SP");
    if (actions.super) labels.push("MAX");
    if (actions.throw) labels.push("THR");
    if (actions.assist1) labels.push("A1");
    if (actions.assist2) labels.push("A2");
    if (actions.dash) labels.push("DASH");
    if (!labels.length) return;
    this.rewardMeaningfulActions += 1;
    this.inputLog.unshift(labels.join("+"));
    this.inputLog = this.inputLog.slice(0, 6);
  }

  recordCombatEvent(event = {}) {
    const player = this.fighters[0];
    if (event.attacker === player && event.damage) this.stats.damage += Math.max(0, Math.round(event.damage));
    if (event.type === "perfectBlock" && event.defender === player) this.stats.perfectBlocks += 1;
    if (event.type === "throwTech" && event.defender === player) this.stats.throwTechs += 1;
    writeStorage(STATS_KEY, this.stats);
  }

  getReplayLibrary() {
    if (Array.isArray(this.replayLibrary)) return this.replayLibrary;
    try {
      const saved = JSON.parse(window.localStorage?.getItem(REPLAY_KEY) || "null");
      if (Array.isArray(saved?.entries)) {
        this.replayLibrary = saved.entries.filter((entry) => Array.isArray(entry.frames) && entry.frames.length);
        return this.replayLibrary;
      }
      const legacy = JSON.parse(window.localStorage?.getItem(LEGACY_REPLAY_KEY) || "null");
      if (Array.isArray(legacy?.frames) && legacy.frames.length) {
        this.replayLibrary = [{ ...legacy, id: "legacy", savedAt: null, winnerId: null, stats: {} }];
        return this.replayLibrary;
      }
    } catch {
      // A corrupt replay library behaves like an empty one.
    }
    this.replayLibrary = [];
    return this.replayLibrary;
  }

  writeReplayLibrary(entries) {
    const library = entries.slice(0, 5);
    while (library.length) {
      try {
        window.localStorage?.setItem(REPLAY_KEY, JSON.stringify({ version: 2, entries: library }));
        this.replayLibrary = library;
        return library;
      } catch {
        library.pop();
      }
    }
    this.replayLibrary = [];
    return this.replayLibrary;
  }

  openReplaySelect() {
    this.phase = PHASE.REPLAY_SELECT;
    this.replaySlotIndex = 0;
    this.syncMusicForPhase();
    this.announce(this.getReplayLibrary().length ? "Replay vault opened" : "Replay vault is empty");
  }

  saveReplay() {
    if (!this.replayFrames.length || this.training || this.isReplay) return;
    const baseline = this.matchStatsStart ?? { damage: 0, perfectBlocks: 0, throwTechs: 0 };
    const entry = {
      id: `replay-${Date.now().toString(36)}`,
      savedAt: new Date().toISOString(),
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      winnerId: this.matchWinner?.id ?? null,
      stageIndex: this.stageIndex,
      mode: this.gameMode,
      frames: this.replayFrames,
      stats: {
        damage: Math.max(0, this.stats.damage - baseline.damage),
        perfectBlocks: Math.max(0, this.stats.perfectBlocks - baseline.perfectBlocks),
        throwTechs: Math.max(0, this.stats.throwTechs - baseline.throwTechs)
      }
    };
    this.writeReplayLibrary([entry, ...this.getReplayLibrary().filter((saved) => saved.id !== "legacy")]);
  }

  startReplay(index = this.replaySlotIndex) {
    const saved = this.getReplayLibrary()[index];
    if (!Array.isArray(saved?.frames) || !saved.frames.length) {
      this.announce("No completed match replay is saved");
      return;
    }
    this.gameMode = "replay";
    this.training = false;
    this.cpuEnabled = false;
    this.replaySpeed = 1;
    const savedPlayer1Id = saved.player1Id === "DETROIT_LENS" ? "DETROIT_LENS_NOIR" : saved.player1Id;
    const savedPlayer2Id = saved.player2Id === "DETROIT_LENS" ? "DETROIT_LENS_NOIR" : saved.player2Id;
    this.player1Id = FIGHTERS[savedPlayer1Id] ? savedPlayer1Id : "MASTER_EZRA";
    this.player2Id = FIGHTERS[savedPlayer2Id] ? savedPlayer2Id : "KALYX";
    this.stageIndex = Math.max(0, Math.min(STAGES.length - 1, Number(saved.stageIndex) || 0));
    this.replayPlayback = saved.frames;
    this.isReplay = true;
    this.createFighters();
    this.phase = PHASE.VERSUS;
    this.roundMessageTimer = 0.7;
    this.prepareCharacterMotions();
    this.prepareFightAssets();
    this.announce("Playing saved match replay");
  }

  deleteReplay(index = this.replaySlotIndex) {
    const replays = this.getReplayLibrary();
    if (!replays[index]) return;
    replays.splice(index, 1);
    this.writeReplayLibrary(replays.filter((entry) => entry.id !== "legacy"));
    this.replaySlotIndex = Math.min(index, Math.max(0, replays.length - 1));
    this.announce("Replay deleted");
    this.render();
  }

  exportReplay(index = this.replaySlotIndex) {
    const replay = this.getReplayLibrary()[index];
    if (!replay) return;
    const blob = new Blob([JSON.stringify({ version: 2, replay }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gothtechnology-replay-${replay.id || Date.now().toString(36)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.announce("Replay exported");
  }

  importReplay(payload) {
    const source = payload?.replay ?? payload;
    if (!source || !Array.isArray(source.frames) || !source.frames.length || source.frames.length > 72000) {
      this.announce("Replay import rejected: invalid or oversized match data");
      return false;
    }
    const normalizeFighterId = (id) => id === "DETROIT_LENS" ? "DETROIT_LENS_NOIR" : id;
    const player1Id = normalizeFighterId(source.player1Id);
    const player2Id = normalizeFighterId(source.player2Id);
    if (!FIGHTERS[player1Id] || !FIGHTERS[player2Id]) {
      this.announce("Replay import rejected: unknown fighter");
      return false;
    }
    const frames = source.frames.map((frame) => ({
      p1: activeActions(frame?.p1),
      p2: activeActions(frame?.p2)
    }));
    const entry = {
      id: `import-${Date.now().toString(36)}`,
      savedAt: new Date().toISOString(),
      player1Id,
      player2Id,
      winnerId: FIGHTERS[normalizeFighterId(source.winnerId)] ? normalizeFighterId(source.winnerId) : null,
      stageIndex: Math.max(0, Math.min(STAGES.length - 1, Number(source.stageIndex) || 0)),
      mode: "replay",
      frames,
      stats: source.stats && typeof source.stats === "object" ? source.stats : {}
    };
    this.writeReplayLibrary([entry, ...this.getReplayLibrary().filter((saved) => saved.id !== "legacy")]);
    this.replaySlotIndex = 0;
    this.announce("Replay imported into slot one");
    this.render();
    return true;
  }

  cycleReplaySpeed() {
    if (!this.isReplay) return;
    const speeds = [0.5, 1, 2];
    const index = speeds.indexOf(this.replaySpeed);
    this.replaySpeed = speeds[(index + 1) % speeds.length];
    this.announce(`Replay speed ${this.replaySpeed} times`);
  }

  stepReplayFrame() {
    if (!this.isReplay || this.phase !== PHASE.PAUSE) return;
    this.phase = PHASE.FIGHT;
    this.update(this.fixedStep);
    this.phase = PHASE.PAUSE;
    this.render();
    this.announce(`Replay frame ${this.replayIndex}`);
  }

  completeModeMatch(playerWon) {
    if (this.isReplay || this.gameMode === "replay" || this.training) return;
    this.stats.matches += 1;
    this.stats[playerWon ? "wins" : "losses"] += 1;
    this.modeCanContinue = false;
    this.modeComplete = false;
    if (this.gameMode === "arcade" && playerWon) {
      this.arcadeStage += 1;
      const routeLength = arcadeRouteFor(this.player1Id).length;
      if (this.arcadeStage >= routeLength) {
        this.stats.arcadeClears += 1;
        this.modeComplete = true;
        this.matchEndPrompt = "ARCADE CLEARED";
      } else {
        this.modeCanContinue = true;
        this.matchEndPrompt = "NEXT OPPONENT";
      }
    }
    writeStorage(STATS_KEY, this.stats);
    this.saveReplay();
  }

  advanceAfterMatch() {
    if (!this.modeCanContinue) {
      this.returnToTitle();
      return;
    }
    if (this.gameMode === "arcade") {
      this.startCommercialBreak();
      return;
    }
    this.prepareNextArcadeMatch();
  }

  startCommercialBreak() {
    if (this.phase === PHASE.COMMERCIAL || !this.modeCanContinue) return;
    this.commercialIndex = Math.max(0, this.arcadeStage - 1) % COMMERCIAL_URLS.length;
    this.phase = PHASE.COMMERCIAL;
    this.input.clear();
    this.audio.stopMusic();
    window.dispatchEvent(new CustomEvent("gothtechnology:commercial", {
      detail: {
        index: this.commercialIndex,
        url: COMMERCIAL_URLS[this.commercialIndex],
        nextLevel: this.arcadeStage + 1
      }
    }));
    this.announce(`Commercial break before Arcade level ${this.arcadeStage + 1}. Press A, B, Enter, or Escape to skip.`);
  }

  finishCommercialBreak() {
    if (this.phase !== PHASE.COMMERCIAL) return;
    window.dispatchEvent(new CustomEvent("gothtechnology:commercial-end"));
    this.prepareNextArcadeMatch();
  }

  prepareNextArcadeMatch() {
    this.modeCanContinue = false;
    const node = arcadeRouteFor(this.player1Id)[this.arcadeStage];
    this.player2Id = node?.opponentId ?? this.opponentForMode();
    this.stageIndex = node?.stageIndex ?? ((this.stageIndex + 1) % STAGES.length);
    this.cpuDifficulty = node?.difficulty ?? this.cpuDifficulty;
    this.createFighters();
    this.buildStageCache();
    this.phase = PHASE.VERSUS;
    this.roundMessageTimer = 0.85;
    this.prepareCharacterMotions();
    this.prepareFightAssets();
    this.syncMusicForPhase();
    this.announce(`${node?.label ?? "Next opponent"}: ${this.fighters[1]?.config.name ?? "fighter"}`);
  }

  keepFightersSeparated() {
    const [a, b] = this.fighters;
    if (a.throwState || b.throwState) return;
    const min = 126;
    const delta = b.x - a.x;
    if (delta < min) {
      const center = (a.x + b.x) / 2;
      const aMargin = a.config.stageMargin ?? 0;
      const bMargin = b.config.stageMargin ?? 0;
      const aMin = WORLD.left + aMargin;
      const aMax = WORLD.right - aMargin;
      const bMin = WORLD.left + bMargin;
      const bMax = WORLD.right - bMargin;
      a.x = clamp(center - min / 2, aMin, Math.min(aMax, bMax - min));
      b.x = clamp(a.x + min, Math.max(bMin, aMin + min), bMax);
      if (b.x - a.x < min) a.x = clamp(b.x - min, aMin, aMax);
      if (a.vx > 0) a.vx = Math.min(a.vx, 0);
      if (b.vx < 0) b.vx = Math.max(b.vx, 0);
    }
  }

  resolveProjectileClashes() {
    for (let i = 0; i < this.projectiles.length; i += 1) {
      const a = this.projectiles[i];
      if (a.dead) continue;
      for (let j = i + 1; j < this.projectiles.length; j += 1) {
        const b = this.projectiles[j];
        if (b.dead || a.owner.id === b.owner.id) continue;
        if (!rectsOverlap(a.rect, b.rect)) continue;
        const x = (a.x + b.x) / 2;
        const y = (a.y + b.y) / 2;
        a.dead = true;
        b.dead = true;
        a.spawnBurst?.(this, x - 18, y, true);
        b.spawnBurst?.(this, x + 18, y, true);
        this.shake = Math.max(this.shake, 7);
        this.hitstop = Math.max(this.hitstop, 0.035);
        this.audio.beep("block");
        return;
      }
    }
  }

  faceFighters() {
    const [a, b] = this.fighters;
    if (!a || !b) return;
    const direction = b.x >= a.x ? 1 : -1;
    if (!a.isKO) a.facing = direction;
    if (!b.isKO) b.facing = -direction;
  }

  checkRoundEnd() {
    if (this.phase !== PHASE.FIGHT) return;
    const [p1, p2] = this.fighters;
    if (this.training) return;
    if (p1.throwState || p2.throwState) return;
    const outcome = resolveRoundOutcome(p1.health, p2.health, this.roundTimer);
    if (!outcome) return;
    this.audio.beep("ko");
    const { winner, loser } = applyRoundOutcomeMotions(this.fighters, outcome);
    const winnerSide = outcome.draw ? "draw" : winner === p1 ? "player" : "opponent";
    this.emitRewardEvent("fighter.round_completed", {
      roundNumber: this.roundNumber,
      winnerSide,
      reason: outcome.reason,
      durationTicks: Math.round(this.rewardRoundTicks),
      playerHealthRemaining: Math.max(0, Math.round(p1.health)),
      opponentHealthRemaining: Math.max(0, Math.round(p2.health)),
      playerDamageDealt: Math.max(0, Math.round(p2.config.maxHealth - Math.max(0, p2.health))),
      playerDamageReceived: Math.max(0, Math.round(p1.config.maxHealth - Math.max(0, p1.health))),
      meaningfulActionCount: this.rewardMeaningfulActions
    }, { flush: true });

    if (outcome.draw) {
      this.roundResultText = outcome.reason === "double_KO" ? "DOUBLE KO" : "DRAW";
      this.roundResultSubtext = "ROUND REPLAY";
      this.roundNumber += 1;
      this.phase = PHASE.ROUND_END;
      this.announce(`${this.roundResultText}. Replay round`);
      return;
    }

    winner.roundWins += 1;
    this.roundResultText = outcome.reason === "timeout" ? "TIME UP" : "KO";
    this.roundResultSubtext = "NEXT ROUND";
    if (winner.roundWins >= this.roundsToWin) {
      this.matchWinner = winner;
      this.phase = PHASE.MATCH_END;
      this.audio.startMusic("menu");
      this.matchEndPrompt = "RETURN TO TITLE";
      this.completeModeMatch(winner === p1);
      this.emitRewardEvent("fighter.match_completed", {
        winningSide: winnerSide,
        playerRoundWins: p1.roundWins,
        opponentRoundWins: p2.roundWins,
        roundsPlayed: this.roundNumber,
        totalMatchTicks: Math.round(this.rewardTotalTicks),
        playerCharacter: this.player1Id,
        opponentCharacter: this.player2Id,
        cpuEnabled: this.cpuEnabled,
        trainingMode: this.training,
        debug: this.debug
      }, { finalize: true, idempotencyKey: this.rewardMatchKey });
    } else {
      this.roundNumber += 1;
      this.phase = PHASE.ROUND_END;
      this.announce(`${winner.config.name} wins round ${this.roundNumber - 1}`);
    }
  }

  syncMusicForPhase() {
    if ([PHASE.LOADING, PHASE.TITLE, PHASE.GAME_SELECT, PHASE.REPLAY_SELECT, PHASE.SELECT, PHASE.MATCH_END].includes(this.phase)) {
      this.audio.startMusic("menu");
      return;
    }
    if (this.phase === PHASE.FIGHT) {
      this.audio.startMusic("fight", { restart: true });
    }
  }

  spawnProjectile(owner, name) {
    const attack = owner.getAttackData(name) ?? ATTACKS[name];
    const manifestKey = owner.config.manifestKey;
    const isDetroitLens = manifestKey.startsWith("DETROIT_LENS");
    const isAmara = manifestKey === "AMARA_VALENTINE";
    if (isDetroitLens && name === "special") {
      this.projectiles.push(new BoerboelStrike({
        owner,
        x: owner.x - owner.facing * 72,
        y: owner.y,
        direction: owner.facing,
        attack,
        image: this.assets.images.detroitBoerboel
      }));
      this.audio.beep("special");
      return;
    }
    const kind = isDetroitLens && name === "super"
      ? "eye-laser"
      : isAmara
        ? (name === "super" ? "heartbreak-nova" : "heartline-pulse")
      : name === "super"
        ? "super"
        : manifestKey === "KALYX"
          ? "shadow-raven"
          : "arcane-owl";
    const handSockets = {
      KALYX: {
        special: { x: 132, y: -136 },
        super: { x: 140, y: -142 }
      },
      MASTER_EZRA: {
        special: { x: 126, y: -154 },
        super: { x: 138, y: -160 }
      },
      AMARA_VALENTINE: {
        special: { x: 124, y: -142 },
        super: { x: 108, y: -132 }
      },
      DETROIT_LENS: {
        super: { x: 114, y: -176 }
      }
    };
    const socketKey = isDetroitLens ? "DETROIT_LENS" : manifestKey;
    const socket = handSockets[socketKey]?.[name] ?? { x: 120, y: -140 };
    const spawnX = owner.x + owner.facing * socket.x;
    const spawnY = owner.y + socket.y;
    const image = manifestKey === "KALYX"
      ? this.assets.images[name === "super" ? "kalyxFireSlash" : "assistRaven"]
      : isDetroitLens
        ? this.assets.images.hitSpark
        : isAmara
          ? this.assets.images.ezraBlueBurst
          : this.assets.images[name === "super" ? "ezraOwlArc" : "assistOwl"];
    this.projectiles.push(new Projectile({
      owner,
      x: spawnX,
      y: spawnY,
      direction: owner.facing,
      attack,
      image,
      kind,
      color: manifestKey === "KALYX"
        ? "#f2a13d"
        : isDetroitLens
          ? (name === "super" ? "#ff2838" : "#e7c36a")
          : isAmara
            ? "#ff58bd"
            : "#9ed8ff"
    }));
    this.audio.beep(name === "super" ? "super" : "projectile");
  }

  spawnFighterVfx(owner, name, phase = "charge") {
    const manifestKey = owner.config.manifestKey;
    const isKalyx = manifestKey === "KALYX";
    const isDetroitLens = manifestKey.startsWith("DETROIT_LENS");
    const isAmara = manifestKey === "AMARA_VALENTINE";
    const superMove = name === "super";
    const skill = name === "skill";
    if (isAmara) {
      this.effects.push(new LovePulseEffect({
        owner: phase === "charge" ? owner : null,
        x: owner.x + owner.facing * (superMove ? 48 : 36),
        y: owner.y - (superMove ? 132 : 112),
        offsetX: superMove ? 48 : 36,
        offsetY: -(superMove ? 132 : 112),
        direction: owner.facing,
        duration: superMove ? 0.58 : (skill ? 0.4 : 0.34),
        scale: superMove ? 1.3 : (skill ? 0.9 : 0.72),
        burst: superMove || phase === "release"
      }));
      return;
    }
    if (isDetroitLens) {
      if (name === "special") return;
      if (skill && this.assets.images.detroitBoerboel) {
        this.effects.push(new AttachedSpriteEffect({
          owner,
          image: this.assets.images.detroitBoerboel,
          offsetX: -66,
          offsetY: 2,
          cellW: 192,
          cellH: 192,
          frames: 6,
          duration: 0.42,
          scale: 0.8,
          alpha: 0.95
        }));
        return;
      }
      const image = superMove ? this.assets.images.hitSpark : this.assets.images.smoke;
      if (!image) return;
      this.effects.push(new SpriteEffect({
        x: owner.x + owner.facing * (superMove ? 42 : -54),
        y: owner.y + (superMove ? -116 : 4),
        image,
        duration: superMove ? 0.38 : 0.24,
        scale: superMove ? 0.42 : 0.52,
        flip: owner.facing < 0,
        alpha: superMove ? 0.9 : (phase === "charge" ? 0.56 : 0.42)
      }));
      return;
    }
    if (name === "special") return;
    const image = skill
      ? (isKalyx ? this.assets.images.smoke : this.assets.images.blockShield)
      : (isKalyx
        ? this.assets.images[superMove ? "kalyxFireSlash" : "kalyxShadowClaw"]
        : this.assets.images[superMove ? "ezraOwlArc" : "ezraBlueBurst"]);
    if (!image) return;
    if (phase === "charge") {
      this.effects.push(new AttachedSpriteEffect({
        owner,
        offsetX: skill ? -18 : (superMove ? 22 : 56),
        offsetY: skill ? -42 : (superMove ? -54 : -92),
        image,
        duration: skill ? 0.34 : (superMove ? 0.48 : 0.3),
        scale: skill ? 0.56 : (superMove ? 0.62 : 0.42),
        alpha: skill ? 0.62 : 0.76
      }));
      return;
    }
    this.effects.push(new SpriteEffect({
      x: owner.x + owner.facing * (skill ? -28 : 92),
      y: owner.y + (skill ? 4 : -48),
      image,
      duration: skill ? 0.3 : (superMove ? 0.42 : 0.24),
      scale: skill ? 0.7 : (superMove ? 0.72 : 0.46),
      flip: owner.facing < 0,
      alpha: skill ? 0.66 : 0.84
    }));
  }

  spawnAssist(owner, slot) {
    const spec = ASSISTS[owner.id]?.[slot];
    if (!spec) return;
    owner.assistCooldowns[slot] = spec.cooldown;
    const img = this.assets.images[spec.imageKey];
    const handSpawn = spec.spawn === "hand";
    if (spec.motion) owner.setMotion(spec.motion, true);
    const assist = new AssistStrike({
      owner,
      x: handSpawn ? owner.x + owner.facing * (spec.xOffset ?? 104) : owner.x - owner.facing * 200,
      y: owner.y + spec.yOffset,
      direction: owner.facing,
      spec,
      image: img
    });
    this.assists.push(assist);
    this.audio.beep("special");
  }

  resolveIncomingHit(attacker, defender, attack, meta) {
    applyHit(attacker, defender, attack, this, meta);
  }

  render() {
    this.syncAccessibleState();
    const ctx = this.ctx;
    ctx.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (this.phase === PHASE.LOADING) {
      drawLoading(ctx, this.loadingProgress, this.loadingBackdrop);
      return;
    }

    if ([PHASE.TITLE, PHASE.GAME_SELECT, PHASE.REPLAY_SELECT, PHASE.SELECT, PHASE.VERSUS].includes(this.phase)) {
      this.drawBackground(ctx, true);
      if (this.phase === PHASE.TITLE) drawTitle(ctx, this);
      if (this.phase === PHASE.GAME_SELECT) drawGameSelect(ctx, this, GAME_SELECT_ITEMS);
      if (this.phase === PHASE.REPLAY_SELECT) drawReplaySelect(ctx, this);
      if (this.phase === PHASE.SELECT) drawCharacterSelect(ctx, this);
      if (this.phase === PHASE.VERSUS) drawVersus(ctx, this);
      return;
    }

    ctx.save();
    if (this.shake > 0 && !this.reducedMotion) {
      const shakeAmount = this.shake * (this.settings.shake ?? 1);
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * shakeAmount * 0.65;
      ctx.translate(shakeX, shakeY);
    }
    this.drawBackground(ctx, false);
    this.faceFighters();
    for (const assist of this.assists) assist.render(ctx);
    for (const projectile of this.projectiles) projectile.render(ctx);
    this.fighters[0].render(ctx, this.debug || this.trainingHitboxes);
    this.fighters[1].render(ctx, this.debug || this.trainingHitboxes);
    for (const effect of this.effects) effect.render(ctx);
    ctx.restore();
    drawFightHud(ctx, this);
    if (this.roundMessageTimer > 0) {
      drawRoundMessage(ctx, this.roundMessageTimer > 0.34 ? `ROUND ${this.roundNumber}` : "FIGHT", this.roundMessageTimer > 0.34 ? "READY" : "ENGAGE");
    }
    if (this.phase === PHASE.ROUND_END) {
      drawRoundMessage(ctx, this.roundResultText || "ROUND COMPLETE", this.roundResultSubtext || "NEXT ROUND");
    }
    if (this.phase === PHASE.MATCH_END) {
      if (this.modeComplete && this.gameMode === "arcade") {
        drawArcadeEnding(ctx, this);
      } else {
        const headline = `${this.matchWinner?.config.name ?? "FIGHTER"} WINS`;
        drawRoundMessage(ctx, headline, this.matchEndPrompt || "MATCH COMPLETE");
      }
    }
    if (this.phase === PHASE.PAUSE) drawPause(ctx, this);
    if (this.debug) drawDiagnostics(ctx, this);
    if (this.flash > 0 && !this.settings.reduceFlash) {
      ctx.save();
      ctx.globalAlpha = this.flash * 0.35;
      ctx.fillStyle = "#f8f1d4";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  syncAccessibleState() {
    const p1 = this.fighters[0];
    const p2 = this.fighters[1];
    const p1HealthBucket = p1 ? Math.round((p1.health / p1.config.maxHealth) * 10) : 0;
    const p2HealthBucket = p2 ? Math.round((p2.health / p2.config.maxHealth) * 10) : 0;
    const p1MeterBucket = p1 ? Math.round(p1.meter / 25) : 0;
    const state = [
      this.phase,
      this.player1Id,
      this.player2Id,
      this.selectTarget,
      this.titleMenuIndex,
      this.pauseMenuIndex,
      this.replaySlotIndex,
      this.getReplayLibrary().length,
      this.cpuEnabled,
      this.cpuDifficulty,
      this.training,
      this.trainingDummyMode,
      this.audio.muted,
      this.roundNumber,
      this.roundResultText,
      p1HealthBucket,
      p2HealthBucket,
      p1MeterBucket
    ].join("|");
    if (state === this.lastAccessibleState) return;
    this.lastAccessibleState = state;
    window.dispatchEvent(new CustomEvent("gothtechnology:state", {
      detail: {
        phase: this.phase,
        player1Id: this.player1Id,
        player2Id: this.player2Id,
        selectTarget: this.selectTarget,
        titleMenuIndex: this.titleMenuIndex,
        pauseMenuIndex: this.pauseMenuIndex,
        replaySlotIndex: this.replaySlotIndex,
        replayCount: this.getReplayLibrary().length,
        replaySpeed: this.replaySpeed,
        isReplay: this.isReplay,
        player1Name: this.fighters[0]?.config.name || "Player 1",
        player2Name: this.fighters[1]?.config.name || "Player 2",
        cpuEnabled: this.cpuEnabled,
        cpuDifficulty: this.cpuDifficulty,
        training: this.training,
        trainingDummyMode: this.trainingDummyMode,
        muted: this.audio.muted,
        roundNumber: this.roundNumber,
        roundResultText: this.roundResultText,
        player1Health: p1 ? Math.round((p1.health / p1.config.maxHealth) * 100) : 0,
        player2Health: p2 ? Math.round((p2.health / p2.config.maxHealth) * 100) : 0,
        player1Meter: p1 ? Math.round(p1.meter) : 0
      }
    }));
  }

  buildStageCache() {
    const layer = document.createElement("canvas");
    layer.width = CANVAS_WIDTH;
    layer.height = CANVAS_HEIGHT;
    const ctx = layer.getContext("2d", { alpha: false });
    const stage = STAGES[this.stageIndex] ?? STAGES[0];
    const background = this.assets.images[stage.backgroundKey] ?? this.assets.images.background;
    const { farTrees, ground } = this.assets.images;
    ctx.fillStyle = "#050403";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (background) ctx.drawImage(background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (farTrees && stage.legacyLayers) {
      ctx.globalAlpha = 0.14;
      ctx.drawImage(farTrees, 0, 72, CANVAS_WIDTH, 380);
      ctx.globalAlpha = 1;
    }
    const grade = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grade.addColorStop(0, stage.grade[0]);
    grade.addColorStop(0.42, stage.grade[1]);
    grade.addColorStop(0.76, "rgba(0,0,0,0.28)");
    grade.addColorStop(1, stage.grade[2]);
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "rgba(5, 4, 3, 0.22)";
    ctx.fillRect(0, GROUND_Y - 58, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y + 58);
    const groundShadow = ctx.createLinearGradient(0, GROUND_Y - 92, 0, GROUND_Y + 28);
    groundShadow.addColorStop(0, "rgba(0,0,0,0)");
    groundShadow.addColorStop(0.48, "rgba(18,15,12,0.22)");
    groundShadow.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = groundShadow;
    ctx.fillRect(0, GROUND_Y - 92, CANVAS_WIDTH, 128);
    if (ground && stage.legacyLayers) {
      for (let x = 0; x < CANVAS_WIDTH; x += 640) ctx.drawImage(ground, x, GROUND_Y - 54, 640, 214);
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(4, 3, 2, 0.62)";
      ctx.fillRect(0, GROUND_Y - 28, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y + 28);
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(242, 212, 143, 0.24)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 1);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y - 1);
    ctx.stroke();
    this.stageCache = layer;
  }

  drawBackground(ctx, menuMode) {
    ctx.fillStyle = "#050403";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (menuMode) {
      const menuBackdrop = this.phase === PHASE.TITLE
        ? this.assets?.images.titleBackdrop
        : this.assets?.images.menuBackdrop;
      if (menuBackdrop) ctx.drawImage(menuBackdrop, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const wash = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      wash.addColorStop(0, "rgba(0,0,0,0.7)");
      wash.addColorStop(0.48, "rgba(0,0,0,0.26)");
      wash.addColorStop(1, "rgba(0,0,0,0.78)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }

    if (this.stageCache) ctx.drawImage(this.stageCache, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const fog = this.assets?.images.fog;
    const stage = STAGES[this.stageIndex] ?? STAGES[0];
    if (fog) {
      const width = CANVAS_WIDTH * 1.14;
      const drift = this.reducedMotion ? 0 : (this.parallax * 18) % width;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = stage.fogAlpha;
      ctx.drawImage(fog, -drift, 150, width, 244);
      ctx.drawImage(fog, width - drift, 150, width, 244);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    for (const fighter of this.fighters) {
      ctx.beginPath();
      ctx.ellipse(fighter.x, GROUND_Y + 7, 78, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const embers = this.assets?.images.embers;
    if (embers) {
      const drift = this.reducedMotion ? 0 : (this.parallax * 24) % CANVAS_WIDTH;
      ctx.save();
      ctx.globalAlpha = stage.emberAlpha;
      ctx.drawImage(embers, -drift, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(embers, CANVAS_WIDTH - drift, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
    if (!stage.legacyLayers) {
      const motion = this.reducedMotion ? 0 : this.parallax * 52;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let index = 0; index < 4; index += 1) {
        const x = ((index * 360 + motion) % (CANVAS_WIDTH + 240)) - 120;
        const y = 430 + (index % 2) * 28;
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = index % 2 ? "#ff5368" : "#6be7ff";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fillRect(x, y, 18, 3);
        ctx.fillRect(x + 30, y, 18, 3);
      }
      ctx.restore();
    }
  }

}
