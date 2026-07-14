import { ASSET_URLS, FIGHTERS } from "../config/assets.js?v=motion-atlas4-repaired";
import { ASSISTS, ATTACKS } from "../config/moves.js?v=fighter-prop2";
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, GROUND_Y, PHASE, ROUND_SECONDS, WORLD } from "../config/constants.js";
import { AssetLoader, drawSheetFrame } from "../engine/assets.js?v=motion-atlas4-repaired";
import { WebAudioBus } from "../engine/audio.js?v=fighter-prop2";
import { InputManager } from "../engine/input.js?v=motion-atlas4-repaired";
import { clamp, rectsOverlap } from "../engine/math.js";
import { applyHit, resolveMelee } from "../gameplay/combat.js?v=fighter-prop2";
import { SpriteEffect } from "../gameplay/effects.js";
import { Fighter } from "../gameplay/fighter.js?v=motion-atlas4-repaired";
import { AssistStrike, Projectile } from "../gameplay/projectiles.js?v=fighter-prop2";
import { applyRoundOutcomeMotions, resolveRoundOutcome } from "../gameplay/rounds.js";
import {
  drawCharacterSelect,
  drawDiagnostics,
  drawFightHud,
  drawGameSelect,
  drawLoading,
  drawPause,
  drawRoundMessage,
  drawTitle,
  drawVersus
} from "../ui/hud.js?v=motion-atlas4-repaired";

const GAME_SELECT_ITEMS = [
  {
    id: "gothtechnology",
    title: "GOTHTECHNOLOGY",
    subtitle: "KALYX vs MASTER EZRA 1v1 arcade fighter",
    badge: "FIGHTER"
  },
  {
    id: "shadow-ops",
    title: "SHADOW OPS",
    subtitle: "Original run-and-gun side scroller prototype",
    badge: "RUN + GUN",
    href: "../shadow-ops-canvas/index.html"
  }
];

export class GothTechnologyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.input = new InputManager(window);
    this.audio = new WebAudioBus(ASSET_URLS.music, ASSET_URLS.fightMusic);
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
    this.cpuEnabled = true;
    this.training = false;
    this.player1Id = "MASTER_EZRA";
    this.player2Id = "KALYX";
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
    this.gameSelectIndex = 0;
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
    this.audio.preloadMusic();
    this.audio.startMusic("menu");
    this.bindPointer();
  }

  async boot() {
    this.audio.startMusic("menu");
    this.assets = await new AssetLoader((progress) => {
      this.loadingProgress = progress;
      this.render();
    }).load();
    if (this.stopped) return;
    this.createFighters();
    this.phase = PHASE.TITLE;
    this.syncMusicForPhase();
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

  returnToTitle() {
    this.phase = PHASE.TITLE;
    this.matchWinner = null;
    this.syncMusicForPhase();
    this.announce("Title menu");
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
        this.returnToTitle();
        return;
      }
      const hit = this.menuHitAreas.find((area) => x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h);
      if (hit) hit.action();
      else if (this.phase === PHASE.TITLE) this.openCharacterSelect(false);
      else if (this.phase === PHASE.SELECT) this.startVersus();
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
    this.player1Id = id;
    this.player2Id = id === "KALYX" ? "MASTER_EZRA" : "KALYX";
    this.createFighters();
    this.prepareCharacterMotions();
    this.audio.beep("select");
  }

  openCharacterSelect(training = false) {
    this.training = training;
    this.phase = PHASE.SELECT;
    this.createFighters();
    this.prepareCharacterMotions();
    this.syncMusicForPhase();
    this.audio.beep("select");
  }

  openGameSelect() {
    this.phase = PHASE.GAME_SELECT;
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
    this.audio.beep("select");
    this.announce(`${this.fighters[0]?.config.name ?? "Player 1"} versus ${this.fighters[1]?.config.name ?? "Player 2"}`);
  }

  startMatch(training = this.training) {
    this.training = training;
    this.startRewardSession();
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
    if (this.motionAssetsReady) return Promise.resolve(this.assets);
    if (this.motionLoadPromise) return this.motionLoadPromise;
    this.motionLoadError = "";
    this.motionLoadPromise = this.assets.loadCharacterMotions(
      [this.player1Id, this.player2Id],
      (progress) => {
        this.motionLoadingProgress = progress;
        this.render();
      }
    ).then((assets) => {
      this.motionAssetsReady = true;
      this.motionLoadingProgress = 1;
      this.createFighters();
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
    return this.motionLoadPromise;
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
    this.accumulator += rawDt;
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
    this.handleGlobalInput();
    this.parallax += dt;
    this.shake = Math.max(0, this.shake - dt * 44);
    this.slowMo = Math.max(0, this.slowMo - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.rewardStatusTimer = Math.max(0, this.rewardStatusTimer - dt);
    if (this.phase === PHASE.VERSUS) {
      if (!this.motionAssetsReady) return;
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
    const p1Actions = this.input.actions(1);
    this.captureInputLog(p1Actions);
    if (Object.values(p1Actions).some(Boolean)) this.playerEngaged = true;
    const p2Actions = this.cpuEnabled ? this.cpuActions(dt) : this.input.actions(2);

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
    if (this.input.consume("ui.cpu")) this.cpuEnabled = !this.cpuEnabled;
    if (this.input.consume("ui.training")) this.training = !this.training;
    if (this.input.consume("ui.reset")) this.startMatch(this.training);

    if (this.phase === PHASE.TITLE) {
      this.menuHitAreas = [
        { x: 494, y: 318, w: 292, h: 48, action: () => this.openCharacterSelect(false) },
        { x: 494, y: 376, w: 292, h: 48, action: () => this.openCharacterSelect(true) },
        { x: 494, y: 434, w: 292, h: 48, action: () => this.openGameSelect() },
        { x: 494, y: 492, w: 292, h: 48, action: () => { this.cpuEnabled = !this.cpuEnabled; this.lastAccessibleState = ""; } },
        { x: 494, y: 550, w: 292, h: 48, action: () => this.openSettings() }
      ];
      this.audio.startMusic("menu");
      if (this.input.consume("ui.confirm")) this.openCharacterSelect(false);
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
      if (this.input.consume("ui.confirm")) this.launchSelectedGame();
      if (this.input.consume("ui.back")) {
        this.phase = PHASE.TITLE;
        this.syncMusicForPhase();
      }
      return;
    }

    if (this.phase === PHASE.SELECT) {
      this.menuHitAreas = [
        { x: 90, y: 128, w: 500, h: 420, action: () => this.selectPlayer1("KALYX") },
        { x: 690, y: 128, w: 500, h: 420, action: () => this.selectPlayer1("MASTER_EZRA") },
        { x: 494, y: 570, w: 292, h: 52, action: () => this.startVersus() }
      ];
      if (
        this.input.consume("p1.left") ||
        this.input.consume("p1.right") ||
        this.input.consume("p2.left") ||
        this.input.consume("p2.right")
      ) {
        this.selectPlayer1(this.player1Id === "KALYX" ? "MASTER_EZRA" : "KALYX");
      }
      if (this.input.consume("ui.confirm")) this.startVersus();
      if (this.input.consume("ui.back")) {
        this.phase = PHASE.TITLE;
        this.syncMusicForPhase();
      }
      return;
    }

    this.menuHitAreas = [];
    if (this.phase === PHASE.PAUSE) {
      this.menuHitAreas = [
        { x: 454, y: 484, w: 172, h: 48, action: () => { this.phase = PHASE.FIGHT; this.announce("Fight resumed"); } },
        { x: 654, y: 484, w: 172, h: 48, action: () => this.openSettings() },
        { x: 454, y: 540, w: 172, h: 48, action: () => this.startMatch(this.training) },
        { x: 654, y: 540, w: 172, h: 48, action: () => this.returnToTitle() }
      ];
    }
    if (this.input.consume("ui.pause")) {
      this.phase = this.phase === PHASE.PAUSE ? PHASE.FIGHT : PHASE.PAUSE;
      this.audio.beep("select");
      this.announce(this.phase === PHASE.PAUSE ? "Game paused" : "Fight resumed");
    }
    if ((this.phase === PHASE.ROUND_END || this.phase === PHASE.MATCH_END) && this.input.consume("ui.confirm")) {
      if (this.phase === PHASE.MATCH_END) {
        this.returnToTitle();
      }
      else this.startRound();
    }
    if (this.phase === PHASE.PAUSE && this.input.consume("ui.back")) this.phase = PHASE.FIGHT;
  }

  cpuActions(dt = 1 / 60) {
    const cpu = this.fighters[1];
    const player = this.fighters[0];
    const dist = player.x - cpu.x;
    const abs = Math.abs(dist);
    const actions = {};
    if (cpu.isKO || (!this.playerEngaged && this.roundTimer > ROUND_SECONDS - 12)) return actions;

    this.cpuDecisionTimer = Math.max(0, this.cpuDecisionTimer - dt);
    if (this.cpuDecisionTimer > 0) {
      return { ...this.cpuDecision };
    }

    const toward = dist > 0 ? "right" : "left";
    const away = dist > 0 ? "left" : "right";
    const margin = cpu.config.stageMargin ?? 0;
    const minX = WORLD.left + margin;
    const maxX = WORLD.right - margin;
    const nearLeftEdge = cpu.x <= minX + 18;
    const nearRightEdge = cpu.x >= maxX - 18;
    const holdMin = 188;
    const holdMax = 342;
    const playerAttacking = Boolean(player.currentAttack);
    const cpuCanAct = !cpu.currentAttack && !cpu.hitstun && !cpu.blockstun && !cpu.knockdown;
    const incomingProjectile = this.projectiles.find((projectile) => (
      projectile.owner.id !== cpu.id &&
      !projectile.dead &&
      Math.sign(cpu.x - projectile.x) === projectile.direction &&
      Math.abs(cpu.x - projectile.x) < 390 &&
      Math.abs(projectile.y - (cpu.y - 122)) < 118
    ));

    if (nearLeftEdge) actions.right = true;
    else if (nearRightEdge) actions.left = true;
    else if (abs > holdMax) actions[toward] = true;
    else if (abs < holdMin) actions[away] = true;

    if (incomingProjectile) {
      actions[away] = true;
      if (Math.random() < 0.68) actions.down = true;
      if (cpuCanAct && Math.abs(cpu.x - incomingProjectile.x) > 240 && Math.random() < 0.28) actions.up = true;
      if (cpuCanAct && abs > 280 && Math.random() < 0.18) actions.special = true;
      this.cpuDecision = { ...actions };
      this.cpuDecisionTimer = 0.08 + Math.random() * 0.06;
      return actions;
    }

    const playerWhiffing = player.currentAttack && player.currentAttack.elapsed > (player.currentAttack.data?.active?.[1] ?? 0.14);
    if (cpuCanAct && playerWhiffing && abs < 190 && Math.random() < 0.42) {
      if (abs > 118) actions[toward] = true;
      actions.heavyPunch = Math.random() < 0.56;
      actions.lightKick = !actions.heavyPunch;
    }

    if (playerAttacking && abs < 210) {
      if (Math.random() < 0.58) {
        if (away === "left" && !nearLeftEdge) actions.left = true;
        if (away === "right" && !nearRightEdge) actions.right = true;
        if (player.currentAttack?.data?.level === "low") actions.down = true;
      }
      if (cpuCanAct && abs < 120 && Math.random() < 0.14) actions.lightKick = true;
    }
    if (player.lastActions?.down && Math.random() < 0.16) actions.down = true;
    if (cpuCanAct && abs > 260 && Math.random() < 0.1) actions.special = true;
    if (cpuCanAct && cpu.meter >= 100 && abs > 175 && Math.random() < 0.06) actions.super = true;
    if (cpuCanAct && abs < 115 && Math.random() < 0.2) actions.lightKick = true;
    if (cpuCanAct && abs < 175 && Math.random() < 0.16) actions.heavyPunch = true;
    if (cpuCanAct && abs < 82 && Math.random() < 0.12) actions.throw = true;
    if (cpuCanAct && abs > 180 && abs < 440 && cpu.assistCooldowns.assist1 <= 0 && Math.random() < 0.04) actions.assist1 = true;
    if (cpuCanAct && abs < 230 && cpu.assistCooldowns.assist2 <= 0 && Math.random() < 0.035) actions.assist2 = true;
    this.cpuDecision = { ...actions };
    this.cpuDecisionTimer = 0.16 + Math.random() * 0.08;
    return actions;
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

  keepFightersSeparated() {
    const [a, b] = this.fighters;
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
    const [p1, p2] = this.fighters;
    if (this.training) return;
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
    if (winner.roundWins >= 2) {
      this.matchWinner = winner;
      this.phase = PHASE.MATCH_END;
      this.audio.startMusic("menu");
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
    if ([PHASE.LOADING, PHASE.TITLE, PHASE.GAME_SELECT, PHASE.SELECT, PHASE.MATCH_END].includes(this.phase)) {
      this.audio.startMusic("menu");
      return;
    }
    if (this.phase === PHASE.FIGHT) {
      this.audio.startMusic("fight", { restart: true });
    }
  }

  spawnProjectile(owner, name) {
    const attack = ATTACKS[name];
    const kind = name === "super" ? "super" : "special";
    const handSockets = {
      KALYX: {
        special: { x: 132, y: -136 },
        super: { x: 140, y: -142 }
      },
      MASTER_EZRA: {
        special: { x: 126, y: -154 },
        super: { x: 138, y: -160 }
      }
    };
    const socket = handSockets[owner.id]?.[kind] ?? { x: 120, y: -140 };
    const spawnX = owner.x + owner.facing * socket.x;
    const spawnY = owner.y + socket.y;
    const image = owner.id === "KALYX"
      ? this.assets.images[name === "super" ? "kalyxFireSlash" : "kalyxShadowClaw"]
      : this.assets.images[name === "super" ? "ezraOwlArc" : "ezraBlueBurst"];
    this.projectiles.push(new Projectile({
      owner,
      x: spawnX,
      y: spawnY,
      direction: owner.facing,
      attack,
      image,
      kind: name,
      color: owner.id === "KALYX" ? "#f2a13d" : "#9ed8ff"
    }));
    const effectScale = name === "super" ? 0.82 : 0.52;
    this.effects.push(new SpriteEffect({
      x: spawnX - owner.facing * 10,
      y: spawnY + 128 * effectScale,
      image: owner.id === "KALYX" ? this.assets.images.kalyxFireSlash : this.assets.images.ezraBlueBurst,
      duration: 0.38,
      scale: effectScale,
      flip: owner.facing < 0
    }));
    this.audio.beep(name === "super" ? "super" : "projectile");
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
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (this.phase === PHASE.LOADING) {
      drawLoading(ctx, this.loadingProgress, this.loadingBackdrop);
      return;
    }

    if ([PHASE.TITLE, PHASE.GAME_SELECT, PHASE.SELECT, PHASE.VERSUS].includes(this.phase)) {
      this.drawBackground(ctx, true);
      if (this.phase === PHASE.TITLE) drawTitle(ctx, this);
      if (this.phase === PHASE.GAME_SELECT) drawGameSelect(ctx, this, GAME_SELECT_ITEMS);
      if (this.phase === PHASE.SELECT) drawCharacterSelect(ctx, this);
      if (this.phase === PHASE.VERSUS) drawVersus(ctx, this);
      return;
    }

    ctx.save();
    if (this.shake > 0) {
      const shakeX = (Math.random() - 0.5) * this.shake;
      const shakeY = (Math.random() - 0.5) * this.shake * 0.65;
      ctx.translate(shakeX, shakeY);
    }
    this.drawBackground(ctx, false);
    this.faceFighters();
    for (const assist of this.assists) assist.render(ctx);
    for (const projectile of this.projectiles) projectile.render(ctx);
    this.fighters[0].render(ctx, this.debug);
    this.fighters[1].render(ctx, this.debug);
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
      drawRoundMessage(ctx, `${this.matchWinner?.config.name ?? "FIGHTER"} WINS`, "MATCH COMPLETE");
    }
    if (this.phase === PHASE.PAUSE) drawPause(ctx, this);
    if (this.debug) drawDiagnostics(ctx, this);
    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = this.flash * 0.35;
      ctx.fillStyle = "#f8f1d4";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  syncAccessibleState() {
    const state = [
      this.phase,
      this.player1Id,
      this.player2Id,
      this.cpuEnabled,
      this.training,
      this.audio.muted,
      this.roundNumber,
      this.roundResultText
    ].join("|");
    if (state === this.lastAccessibleState) return;
    this.lastAccessibleState = state;
    window.dispatchEvent(new CustomEvent("gothtechnology:state", {
      detail: {
        phase: this.phase,
        player1Id: this.player1Id,
        player2Id: this.player2Id,
        player1Name: this.fighters[0]?.config.name || "Player 1",
        player2Name: this.fighters[1]?.config.name || "Player 2",
        cpuEnabled: this.cpuEnabled,
        training: this.training,
        muted: this.audio.muted,
        roundNumber: this.roundNumber,
        roundResultText: this.roundResultText
      }
    }));
  }

  drawBackground(ctx, menuMode) {
    ctx.fillStyle = "#050403";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const titleBackdrop = this.assets?.images.titleBackdrop;
    const bg = menuMode && titleBackdrop ? titleBackdrop : this.assets?.images.background;
    const trees = this.assets?.images.farTrees;
    const fog = this.assets?.images.fog;
    const embers = this.assets?.images.embers;
    const ground = this.assets?.images.ground;
    const groundBandTop = GROUND_Y - 58;
    const groundTileTop = GROUND_Y - 54;
    const groundTileHeight = 214;
    if (bg) ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (trees) {
      const x = -((this.parallax * 10) % CANVAS_WIDTH);
      ctx.globalAlpha = menuMode ? 0.22 : 0.14;
      ctx.drawImage(trees, x, 72, CANVAS_WIDTH, 380);
      ctx.drawImage(trees, x + CANVAS_WIDTH, 72, CANVAS_WIDTH, 380);
      ctx.globalAlpha = 1;
    }
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, "rgba(0,0,0,0.74)");
    grad.addColorStop(0.35, menuMode ? "rgba(0,0,0,0.56)" : "rgba(0,0,0,0.16)");
    grad.addColorStop(0.76, "rgba(0,0,0,0.28)");
    grad.addColorStop(1, "rgba(0,0,0,0.76)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (fog) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const fogLayers = [
        { speed: 11, y: 88, h: 214, alpha: menuMode ? 0.22 : 0.16, scale: 1.14 },
        { speed: 24, y: 154, h: 284, alpha: menuMode ? 0.36 : 0.28, scale: 1 },
        { speed: -15, y: 234, h: 172, alpha: menuMode ? 0.18 : 0.2, scale: 1.28 }
      ];
      for (const layer of fogLayers) {
        const width = CANVAS_WIDTH * layer.scale;
        const drift = ((this.parallax * layer.speed) % width + width) % width;
        const x = -drift;
        ctx.globalAlpha = layer.alpha;
        ctx.drawImage(fog, x, layer.y, width, layer.h);
        ctx.drawImage(fog, x + width, layer.y, width, layer.h);
      }
      const time = this.parallax;
      for (let i = 0; i < 12; i += 1) {
        const x = ((i * 127 + time * (18 + (i % 3) * 8)) % (CANVAS_WIDTH + 180)) - 90;
        const y = 152 + (i % 5) * 36 + Math.sin(time * 0.8 + i) * 12;
        const r = 84 + (i % 4) * 34;
        const wisp = ctx.createRadialGradient(x, y, 0, x, y, r);
        wisp.addColorStop(0, menuMode ? "rgba(210, 222, 220, 0.09)" : "rgba(210, 226, 226, 0.075)");
        wisp.addColorStop(0.5, "rgba(140, 164, 166, 0.035)");
        wisp.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = wisp;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.7, r * 0.34, Math.sin(i) * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.fillStyle = "rgba(5, 4, 3, 0.22)";
    ctx.fillRect(0, groundBandTop, CANVAS_WIDTH, CANVAS_HEIGHT - groundBandTop);
    const groundShadow = ctx.createLinearGradient(0, GROUND_Y - 92, 0, GROUND_Y + 28);
    groundShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
    groundShadow.addColorStop(0.42, "rgba(18, 15, 12, 0.18)");
    groundShadow.addColorStop(0.75, "rgba(7, 5, 4, 0.5)");
    groundShadow.addColorStop(1, "rgba(0, 0, 0, 0.9)");
    ctx.fillStyle = groundShadow;
    ctx.fillRect(0, GROUND_Y - 92, CANVAS_WIDTH, 128);
    if (ground) {
      const tileW = 640;
      for (let x = -((this.parallax * 28) % tileW); x < CANVAS_WIDTH + tileW; x += tileW) {
        ctx.drawImage(ground, x, groundTileTop, tileW, groundTileHeight);
      }
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      const soil = ctx.createLinearGradient(0, GROUND_Y - 34, 0, CANVAS_HEIGHT);
      soil.addColorStop(0, "rgba(58, 48, 38, 0.18)");
      soil.addColorStop(0.34, "rgba(18, 13, 9, 0.48)");
      soil.addColorStop(1, "rgba(0, 0, 0, 0.82)");
      ctx.fillStyle = soil;
      ctx.fillRect(0, GROUND_Y - 34, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y + 34);
      ctx.restore();
    } else {
      ctx.fillStyle = "#11100d";
      ctx.fillRect(0, groundBandTop, CANVAS_WIDTH, CANVAS_HEIGHT - groundBandTop);
    }
    if (!menuMode) {
      ctx.save();
      for (const fighter of this.fighters) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
        ctx.beginPath();
        ctx.ellipse(fighter.x, GROUND_Y + 6, 82, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(216, 170, 69, 0.08)";
        ctx.beginPath();
        ctx.ellipse(fighter.x + fighter.facing * 10, GROUND_Y + 4, 46, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(180, 154, 110, 0.18)";
      for (let i = 0; i < 22; i += 1) {
        const x = (i * 79 + 37) % CANVAS_WIDTH;
        const y = GROUND_Y + 8 + (i % 5) * 19;
        ctx.beginPath();
        ctx.ellipse(x, y, 4 + (i % 4) * 2, 1.4 + (i % 3), (i * 0.7) % Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (embers) {
      const x = -((this.parallax * 36) % CANVAS_WIDTH);
      ctx.globalAlpha = 0.26;
      ctx.drawImage(embers, x, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(embers, x + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
    const lip = ctx.createLinearGradient(0, GROUND_Y - 3, CANVAS_WIDTH, GROUND_Y - 3);
    lip.addColorStop(0, "rgba(72, 58, 36, 0.1)");
    lip.addColorStop(0.5, "rgba(242, 212, 143, 0.28)");
    lip.addColorStop(1, "rgba(62, 50, 32, 0.1)");
    ctx.strokeStyle = lip;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 1);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y - 1);
    ctx.stroke();
  }

}
