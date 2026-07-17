import { GRAVITY, GROUND_Y, WORLD } from "../config/constants.js?v=heartline36-leash-wrist";
import { ATTACKS } from "../config/moves.js?v=heartline36-leash-wrist";
import { drawSpriteFrame } from "../engine/assets.js?v=heartline36-leash-wrist";
import { approach, clamp, makeRect } from "../engine/math.js?v=heartline36-leash-wrist";
import { attackIntentFromActions, resolveCancelAttack } from "./commands.js?v=heartline36-leash-wrist";
import { SpriteEffect } from "./effects.js?v=heartline36-leash-wrist";

const MOTION_LOCKS = new Set([
  "LIGHT_PUNCH",
  "HEAVY_PUNCH",
  "LIGHT_KICK",
  "HEAVY_KICK",
  "AIR_ATTACK",
  "CROUCH_ATTACK",
  "COMBO_1",
  "COMBO_2",
  "SPECIAL_START",
  "SPECIAL_PROJECTILE",
  "SPECIAL_RECOVER",
  "SUPER_CHARGE",
  "SUPER_RELEASE",
  "THROW_GRAB",
  "THROW_FINISH",
  "HURT_LIGHT",
  "HURT_HEAVY",
  "KNOCKDOWN",
  "GET_UP",
  "LANDING",
  "TAUNT",
  "VICTORY",
  "DEFEAT"
]);

const MOTION_PLAYBACK_ONCE = new Set([
  ...MOTION_LOCKS,
  "JUMP_START",
  "JUMP_RISE",
  "JUMP_PEAK",
  "JUMP_FALL"
]);

const tuneAttackTiming = (data, feel = {}) => {
  const startupScale = feel.attackStartupScale ?? 1;
  const recoveryScale = feel.attackRecoveryScale ?? 1;
  const activeScale = feel.attackActiveScale ?? 1;
  const tuned = { ...data };
  if (typeof data.startup === "number") tuned.startup = Math.max(0.035, data.startup * startupScale);
  if (typeof data.recovery === "number") tuned.recovery = Math.max(0.06, data.recovery * recoveryScale);
  if (Array.isArray(data.active)) {
    const activeStart = Math.max(0.035, data.active[0] * startupScale);
    const activeLength = Math.max(0.055, (data.active[1] - data.active[0]) * activeScale);
    tuned.active = [activeStart, activeStart + activeLength];
  }
  return tuned;
};

const CANCEL_CHAINS = {
  lightPunch: new Set(["heavyPunch", "lightKick", "heavyKick", "special", "super"]),
  lightKick: new Set(["heavyPunch", "heavyKick", "special", "super"]),
  heavyPunch: new Set(["special", "super"]),
  heavyKick: new Set(["special", "super"]),
  crouchAttack: new Set(["special", "super"]),
  combo1: new Set(["heavyKick", "combo2", "special", "super"]),
  combo2: new Set(["special", "super"])
};

export class Fighter {
  constructor({ id, slot, config, assets, x, facing }) {
    this.id = id;
    this.slot = slot;
    this.config = config;
    this.assets = assets;
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = config.maxHealth;
    this.meter = 0;
    this.roundWins = 0;
    this.comboHits = 0;
    this.comboDamage = 0;
    this.comboTimer = 0;
    this.motion = "IDLE";
    this.motionElapsed = 0;
    this.currentAttack = null;
    this.hitstun = 0;
    this.blockstun = 0;
    this.knockdown = 0;
    this.invulnerable = 0;
    this.specialCooldown = 0;
    this.superCooldown = 0;
    this.assistCooldowns = { assist1: 0, assist2: 0 };
    this.pendingProjectile = null;
    this.shieldTimer = 0;
    this.guardTapTimer = 0;
    this.guardFlash = 0;
    this.throwTechTimer = 0;
    this.wasGuarding = false;
    this.lastActions = {};
    this.moveHold = 0;
    this.lastMoveDir = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashRecoveryTimer = 0;
    this.dashForward = true;
    this.dashDir = facing;
    this.characterSkillCooldown = 0;
    this.parryTimer = 0;
    this.charmedTimer = 0;
    this.airDashAvailable = true;
    this.lastHitTimer = 0;
    this.landingLag = 0;
    this.jumpStartTimer = 0;
    this.attackBuffer = null;
    this.throwState = null;
    this.isKO = false;
  }

  resetRound(x, facing) {
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = this.config.maxHealth;
    this.meter = Math.max(0, Math.min(this.meter, 100));
    this.comboHits = 0;
    this.comboDamage = 0;
    this.comboTimer = 0;
    this.currentAttack = null;
    this.hitstun = 0;
    this.blockstun = 0;
    this.knockdown = 0;
    this.invulnerable = 1.2;
    this.pendingProjectile = null;
    this.isKO = false;
    this.guardTapTimer = 0;
    this.guardFlash = 0;
    this.throwTechTimer = 0;
    this.wasGuarding = false;
    this.moveHold = 0;
    this.lastMoveDir = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashRecoveryTimer = 0;
    this.dashForward = true;
    this.dashDir = facing;
    this.characterSkillCooldown = 0;
    this.parryTimer = 0;
    this.charmedTimer = 0;
    this.airDashAvailable = true;
    this.lastHitTimer = 0;
    this.landingLag = 0;
    this.jumpStartTimer = 0;
    this.attackBuffer = null;
    this.throwState = null;
    this.setMotion("READY_STANCE", true);
  }

  get grounded() {
    return this.y >= GROUND_Y - 0.5;
  }

  get crouching() {
    return this.lastActions.down && this.grounded;
  }

  get hurtbox() {
    const frameIndex = this.getMotionFrameIndex();
    const authored = this.currentAttack?.data?.hurtboxesByFrame?.[frameIndex];
    let profile = authored;
    if (!profile && ["KNOCKDOWN", "DEFEAT"].includes(this.motion)) profile = { w: 158, h: 54, offsetY: 2 };
    if (!profile && ["CROUCH_IDLE", "CROUCH_WALK", "CROUCH_ATTACK", "BLOCK_LOW"].includes(this.motion)) profile = { w: 88, h: 116 };
    if (!profile && ["JUMP_START", "JUMP_RISE", "JUMP_PEAK", "JUMP_FALL", "AIR_ATTACK"].includes(this.motion)) profile = { w: 78, h: 158 };
    if (!profile && ["HURT_LIGHT", "HURT_HEAVY"].includes(this.motion)) profile = { w: 86, h: 162 };
    profile ??= { w: 76, h: 178 };
    return makeRect(
      this.x + this.facing * (profile.offsetX ?? 0),
      this.y + (profile.offsetY ?? 0),
      profile.w,
      profile.h
    );
  }

  get activeAnimation() {
    return this.assets.animations[this.config.manifestKey]?.[this.displayMotion] ?? this.assets.animations[this.config.manifestKey]?.IDLE;
  }

  get displayMotion() {
    return this.config.motionRemap?.[this.motion] ?? this.motion;
  }

  setMotion(motion, force = false) {
    if (!force && this.motion === motion) return;
    this.motion = motion;
    this.motionElapsed = 0;
  }

  getMotionPlaybackDuration(motion = this.motion) {
    const displayMotion = this.config.motionRemap?.[motion] ?? motion;
    const animation = this.assets.animations[this.config.manifestKey]?.[displayMotion];
    if (!animation?.frames?.length) return 0.18;
    const order = animation.playbackOrder?.length
      ? animation.playbackOrder
      : animation.frames.map((_, index) => index);
    const duration = order.reduce((sum, frameIndex) => sum + (animation.frames[frameIndex]?.duration_ms ?? 85), 0) / 1000;
    const timeScale = this.config.motionTimeScales?.[motion] ?? this.config.motionTimeScale ?? 1;
    return this.config.motionDurations?.[motion] ?? duration / timeScale;
  }

  getMotionFrameIndex(motion = this.motion, elapsed = this.motionElapsed) {
    const displayMotion = this.config.motionRemap?.[motion] ?? motion;
    const animation = this.assets.animations[this.config.manifestKey]?.[displayMotion];
    if (!animation?.frames?.length) return 0;
    const order = animation.playbackOrder?.length
      ? animation.playbackOrder
      : animation.frames.map((_, index) => index);
    const sourceDuration = order.reduce((sum, frameIndex) => sum + (animation.frames[frameIndex]?.duration_ms ?? 85), 0) / 1000;
    const playbackDuration = Math.max(0.001, this.getMotionPlaybackDuration(motion));
    const loops = !MOTION_PLAYBACK_ONCE.has(motion) || motion === "VICTORY";
    const playbackTime = loops ? elapsed % playbackDuration : Math.min(elapsed, playbackDuration - 0.001);
    const sourceTime = (playbackTime / playbackDuration) * sourceDuration;
    let accumulated = 0;
    for (const frameIndex of order) {
      accumulated += (animation.frames[frameIndex]?.duration_ms ?? 85) / 1000;
      if (sourceTime <= accumulated) return frameIndex;
    }
    return order[order.length - 1] ?? 0;
  }

  isMotionPlaybackLocked() {
    return !this.currentAttack && MOTION_LOCKS.has(this.motion) && this.motionElapsed < this.getMotionPlaybackDuration();
  }

  getAttackData(name) {
    const base = ATTACKS[name];
    if (!base) return null;
    return tuneAttackTiming({ ...base, ...(this.config.attackOverrides?.[name] ?? {}) }, this.config.feel);
  }

  beginAttack(name, game) {
    const data = this.getAttackData(name);
    if (!data || this.currentAttack || this.hitstun || this.blockstun || this.knockdown || this.isKO) return false;
    if (name === "special" && this.specialCooldown > 0) return false;
    if (name === "super" && (this.superCooldown > 0 || this.meter < data.cost)) return false;
    if (name === "super") {
      this.meter -= data.cost;
      game.audio.beep("super");
      game.flash = 0.45;
    }
    if (name === "special") this.specialCooldown = data.cooldown;
    if (name === "super") this.superCooldown = data.cooldown;
    const activeEnd = data.active?.[1] ?? data.startup + 0.18;
    const baseDuration = activeEnd + (data.recovery ?? 0.25);
    const motionDuration = this.getMotionPlaybackDuration(data.motion);
    const spawnAt = data.startMotion
      ? Math.max(data.startup ?? 0, this.getMotionPlaybackDuration(data.startMotion))
      : (data.startup ?? 0);
    const finishAt = data.finishMotion
      ? Math.max(activeEnd, motionDuration)
      : activeEnd;
    let duration = Math.max(baseDuration, data.startMotion ? spawnAt + motionDuration : motionDuration);
    if (data.finishMotion) duration = Math.max(duration, finishAt + this.getMotionPlaybackDuration(data.finishMotion));
    this.currentAttack = {
      name,
      data,
      elapsed: 0,
      duration,
      spawnAt,
      finishAt,
      hitCounts: new Map(),
      lastHitAt: new Map(),
      spawned: false,
      finishStarted: false
    };
    this.setMotion(data.motion, true);
    if (data.startMotion) this.setMotion(data.startMotion, true);
    if (name === "special" || name === "super") game.spawnFighterVfx?.(this, name, "charge");
    return true;
  }

  canCancelInto(nextAttack) {
    if (!this.currentAttack || !nextAttack) return false;
    const chain = CANCEL_CHAINS[this.currentAttack.name];
    if (!chain?.has(nextAttack)) return false;
    const data = this.currentAttack.data;
    const activeStart = data.active?.[0] ?? data.startup ?? 0.08;
    return this.currentAttack.elapsed >= Math.max(0.035, activeStart * 0.72);
  }

  cancelInto(name, game) {
    if (!this.canCancelInto(name)) return false;
    const resolvedName = resolveCancelAttack(this.currentAttack.name, name);
    this.currentAttack = null;
    this.attackBuffer = null;
    this.meter = Math.min(100, this.meter + 2);
    return this.beginAttack(resolvedName, game);
  }

  useAssist(slot, game) {
    if (this.assistCooldowns[slot] > 0 || this.isKO || this.knockdown) return;
    game.spawnAssist(this, slot);
  }

  useCharacterSkill(opponent, game) {
    const cost = this.config.skillCost ?? 20;
    if (
      this.characterSkillCooldown > 0 ||
      this.meter < cost ||
      !this.grounded ||
      this.currentAttack ||
      this.hitstun ||
      this.blockstun ||
      this.knockdown ||
      this.isKO
    ) return false;

    this.meter -= cost;
    this.characterSkillCooldown = this.config.skillCooldown ?? 1;
    if (this.config.archetype === "rushdown") {
      const direction = opponent.x >= this.x ? 1 : -1;
      const margin = this.config.stageMargin ?? 0;
      this.x = clamp(opponent.x + direction * 92, WORLD.left + margin, WORLD.right - margin);
      this.vx = direction * this.config.speed * 0.42;
      this.invulnerable = Math.max(this.invulnerable, 0.22);
      this.dashDir = direction;
      this.dashForward = true;
      this.dashRecoveryTimer = 0.1;
      this.setMotion("DASH_FORWARD", true);
      game.spawnFighterVfx?.(this, "skill", "release");
      game.audio.beep("dash");
    } else if (this.config.archetype === "heartline") {
      this.parryTimer = 0.32;
      this.shieldTimer = Math.max(this.shieldTimer, this.parryTimer);
      this.setMotion("SPECIAL_START", true);
      game.spawnFighterVfx?.(this, "skill", "charge");
      game.audio.beep("block");
    } else if (this.config.archetype === "precision") {
      this.invulnerable = Math.max(this.invulnerable, 0.16);
      this.setMotion("SPECIAL_START", true);
      game.spawnFighterVfx?.(this, "skill", "charge");
      const direction = opponent.x >= this.x ? 1 : -1;
      const inFront = direction === this.facing;
      if (inFront && Math.abs(opponent.x - this.x) <= 340) {
        game.resolveIncomingHit?.(this, opponent, {
          damage: 30,
          chip: 8,
          meter: 5,
          stun: 0.31,
          blockstun: 0.24,
          recovery: 0.16,
          knockback: 110,
          level: "mid"
        }, {
          box: { x: this.x + this.facing * 120 - 110, y: this.y - 220, w: 220, h: 190 },
          projectile: false,
          level: "mid",
          sourceName: "guardianIntercept",
          hitIndex: 1,
          maxHits: 1
        });
      }
      game.audio.beep("special");
    } else {
      this.parryTimer = 0.36;
      this.shieldTimer = Math.max(this.shieldTimer, this.parryTimer);
      this.setMotion("BLOCK_HIGH", true);
      game.spawnFighterVfx?.(this, "skill", "charge");
      game.audio.beep("block");
    }
    return true;
  }

  readAttackIntent(actions) {
    return attackIntentFromActions({ ...actions, grounded: this.grounded });
  }

  getAttackBox() {
    const attack = this.currentAttack?.data;
    if (!attack) return null;
    const frameIndex = this.getMotionFrameIndex();
    if (attack.activeFrames?.length && !attack.activeFrames.includes(frameIndex)) return null;
    const profile = attack.frameBoxes?.[frameIndex] ?? {};
    const width = profile.w ?? attack.width ?? 90;
    const height = profile.h ?? attack.height ?? 70;
    const x = this.x + this.facing * (profile.forward ?? attack.reach ?? 90);
    return {
      x: x - width / 2,
      y: this.y + (profile.y ?? attack.y ?? -120) - height / 2,
      w: width,
      h: height
    };
  }

  beginThrown(attacker, { damage, knockback }) {
    this.health = Math.max(0, this.health - damage);
    this.currentAttack = null;
    this.attackBuffer = null;
    this.hitstun = 0;
    this.blockstun = 0;
    this.knockdown = 0;
    this.vx = 0;
    this.vy = 0;
    this.throwState = { attacker, knockback: Math.abs(knockback), finishing: false };
    this.invulnerable = Math.max(this.invulnerable, 1.2);
    this.setMotion("HURT_HEAVY", true);
  }

  updateThrownState() {
    const state = this.throwState;
    if (!state) return false;
    const attackState = state.attacker.currentAttack;
    if (!attackState || attackState.name !== "throw") {
      const direction = state.attacker.facing;
      this.throwState = null;
      this.x = state.attacker.x + direction * 82;
      this.y = GROUND_Y - 2;
      this.vx = direction * state.knockback;
      this.vy = -180;
      if (this.health <= 0) {
        this.isKO = true;
        this.knockdown = 10;
        this.setMotion("DEFEAT", true);
      } else {
        this.knockdown = 0.92;
        this.setMotion("KNOCKDOWN", true);
      }
      return false;
    }

    this.facing = -state.attacker.facing;
    this.x = state.attacker.x + state.attacker.facing * 52;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    if (attackState.finishStarted && !state.finishing) {
      state.finishing = true;
      this.setMotion("KNOCKDOWN", true);
    }
    return true;
  }

  takeHit({ damage, stun, knockback, attackName, blocked, chipOnly, perfectBlock }) {
    this.throwState = null;
    this.comboTimer = 0;
    if (blocked) {
      this.blockstun = stun;
      this.health = Math.max(1, this.health - damage);
      this.vx += knockback;
      this.guardFlash = perfectBlock ? 0.28 : 0.16;
      this.setMotion(this.crouching ? "BLOCK_LOW" : "BLOCK_HIGH", true);
      return;
    }
    this.health = Math.max(0, this.health - damage);
    this.lastHitTimer = 0.7;
    this.hitstun = stun;
    this.invulnerable = Math.max(this.invulnerable, 0.04);
    this.vx += knockback;
    this.setMotion(damage > 72 || attackName === "super" ? "HURT_HEAVY" : "HURT_LIGHT", true);
    if (damage >= 110 || this.health <= 0) {
      this.knockdown = this.health <= 0 ? 10 : 0.92;
      this.setMotion(this.health <= 0 ? "DEFEAT" : "KNOCKDOWN", true);
    }
    if (chipOnly) this.setMotion("BLOCK_HIGH", true);
  }

  update(dt, actions, opponent, game) {
    const wasGrounded = this.grounded;
    const wasDashing = this.dashTimer > 0;
    this.lastActions = actions;
    this.motionElapsed += dt;
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.superCooldown = Math.max(0, this.superCooldown - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashRecoveryTimer = Math.max(0, this.dashRecoveryTimer - dt);
    this.characterSkillCooldown = Math.max(0, this.characterSkillCooldown - dt);
    this.parryTimer = Math.max(0, this.parryTimer - dt);
    this.charmedTimer = Math.max(0, this.charmedTimer - dt);
    this.lastHitTimer = Math.max(0, this.lastHitTimer - dt);
    this.landingLag = Math.max(0, this.landingLag - dt);
    this.jumpStartTimer = Math.max(0, this.jumpStartTimer - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hitstun = Math.max(0, this.hitstun - dt);
    this.blockstun = Math.max(0, this.blockstun - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.guardTapTimer = Math.max(0, this.guardTapTimer - dt);
    this.guardFlash = Math.max(0, this.guardFlash - dt);
    this.throwTechTimer = Math.max(0, this.throwTechTimer - dt);
    if (wasDashing && this.dashTimer === 0) {
      this.dashRecoveryTimer = Math.max(this.dashRecoveryTimer, this.config.feel?.dashRecovery ?? 0.1);
      if (this.grounded) this.setMotion("READY_STANCE", true);
    }
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) {
      this.comboHits = 0;
      this.comboDamage = 0;
    }
    for (const key of Object.keys(this.assistCooldowns)) {
      this.assistCooldowns[key] = Math.max(0, this.assistCooldowns[key] - dt);
    }
    if (this.attackBuffer) {
      this.attackBuffer.time -= dt;
      if (this.attackBuffer.time <= 0) this.attackBuffer = null;
    }

    if (!this.isKO && this.health <= 0 && !this.throwState) {
      this.isKO = true;
      this.currentAttack = null;
      this.setMotion("DEFEAT", true);
    }

    if (this.updateThrownState()) return;

    const faceDelta = opponent.x - this.x;
    if (Math.abs(faceDelta) > 12) this.facing = faceDelta > 0 ? 1 : -1;
    const holdingBack = opponent.x > this.x ? actions.left : actions.right;
    const guarding = Boolean(holdingBack || (actions.down && this.grounded) || this.shieldTimer > 0);
    if (guarding && !this.wasGuarding) this.guardTapTimer = this.config.guardTapWindow ?? 0.13;
    this.wasGuarding = guarding;
    if (actions.throw) this.throwTechTimer = 0.18;

    if (this.knockdown > 0 && !this.isKO) {
      this.knockdown = Math.max(0, this.knockdown - dt);
      if (this.knockdown === 0) {
        this.invulnerable = 0.7;
        this.setMotion("GET_UP", true);
      }
    }

    const hardLocked = this.isKO || this.hitstun > 0 || this.blockstun > 0 || this.knockdown > 0 || this.parryTimer > 0;
    const motionLocked = this.isMotionPlaybackLocked();
    const locked = hardLocked || motionLocked;
    const usedSkill = !hardLocked && actions.down && actions.special && this.useCharacterSkill(opponent, game);
    const combatActions = usedSkill ? { ...actions, special: false } : actions;
    const attackIntent = !hardLocked ? this.readAttackIntent(combatActions) : null;
    if (attackIntent && (this.currentAttack || this.landingLag > 0 || motionLocked)) {
      this.attackBuffer = { name: attackIntent, time: this.config.feel?.inputBuffer ?? 0.12 };
    }
    if (!locked && attackIntent && this.currentAttack && this.cancelInto(attackIntent, game)) {
      // Cancel handled before the current attack advances this frame.
    }
    if (!locked) {
      if (actions.assist1) this.useAssist("assist1", game);
      if (actions.assist2) this.useAssist("assist2", game);
      if (actions.taunt) {
        this.currentAttack = {
          name: "taunt",
          data: { motion: "TAUNT" },
          elapsed: 0,
          duration: this.getMotionPlaybackDuration("TAUNT"),
          hitCounts: new Map(),
          lastHitAt: new Map()
        };
        this.meter = Math.min(100, this.meter + 4);
        this.setMotion("TAUNT", true);
      } else if (!this.currentAttack) {
        const buffered = this.attackBuffer?.name;
        const nextAttack = attackIntent ?? buffered;
        if (nextAttack && this.beginAttack(nextAttack, game)) this.attackBuffer = null;
      }
    }

    if (this.currentAttack) {
      this.currentAttack.elapsed += dt;
      const { name, data } = this.currentAttack;
      if ((name === "special" || name === "super") && !this.currentAttack.spawned && this.currentAttack.elapsed >= this.currentAttack.spawnAt) {
        this.currentAttack.spawned = true;
        this.setMotion(data.motion, true);
        game.spawnProjectile(this, name);
        game.spawnFighterVfx?.(this, name, "release");
      }
      if (data.finishMotion && !this.currentAttack.finishStarted && this.currentAttack.elapsed >= this.currentAttack.finishAt) {
        this.currentAttack.finishStarted = true;
        this.setMotion(data.finishMotion, true);
      }
      if (this.currentAttack.elapsed >= this.currentAttack.duration) {
        if (data.recoverMotion) this.setMotion(data.recoverMotion, true);
        this.currentAttack = null;
      }
    }

    const dashing = this.dashTimer > 0;
    const stateLocked = hardLocked || this.isMotionPlaybackLocked();
    const canMove = !stateLocked && !this.currentAttack && this.landingLag <= 0 && this.dashRecoveryTimer <= 0 && !dashing;
    const charmMoveScale = this.charmedTimer > 0 ? (this.config.charmMoveScale ?? 0.82) : 1;
    let desired = 0;
    const left = actions.left ? -1 : 0;
    const right = actions.right ? 1 : 0;
    desired = left + right;
    if (dashing) {
      this.vx = approach(this.vx, 0, dt * (this.config.feel?.dashBrake ?? 900));
      this.setMotion(this.dashForward ? "DASH_FORWARD" : "DASH_BACK");
    } else if (canMove) {
      if (desired !== 0 && desired === this.lastMoveDir) this.moveHold += dt;
      else this.moveHold = 0;
      this.lastMoveDir = desired;
      if (actions.up && this.grounded) {
        this.vy = this.config.jumpVelocity;
        this.vx += desired * this.config.speed * 0.36 * charmMoveScale;
        this.y -= 1;
        this.setMotion("JUMP_START", true);
        this.jumpStartTimer = this.config.motionDurations?.JUMP_START ?? 0.12;
        this.airDashAvailable = true;
        game.audio.beep("jump");
      }
      if (actions.dash && !this.grounded && this.config.airDash && this.airDashAvailable && this.dashCooldown <= 0) {
        const airDirection = desired || this.facing;
        this.airDashAvailable = false;
        this.dashForward = airDirection === this.facing;
        this.dashDir = airDirection;
        this.dashTimer = 0.18;
        this.dashCooldown = 0.38;
        this.vx = airDirection * this.config.dashSpeed * 0.72 * charmMoveScale;
        this.vy = 0;
        this.setMotion(this.dashForward ? "DASH_FORWARD" : "DASH_BACK", true);
        game.spawnFighterVfx?.(this, "skill", "release");
        game.audio.beep("dash");
      } else if (actions.dash && desired !== 0 && this.grounded && this.dashCooldown <= 0) {
        const movingForward = desired === this.facing;
        this.dashForward = movingForward;
        this.dashDir = desired;
        this.dashTimer = this.config.motionDurations?.[movingForward ? "DASH_FORWARD" : "DASH_BACK"] ?? (movingForward ? 0.28 : 0.32);
        this.dashCooldown = movingForward ? 0.42 : 0.5;
        this.vx = desired * this.config.dashSpeed * (movingForward ? 1 : 0.78) * charmMoveScale;
        if (!movingForward) {
          this.vy = Math.min(this.vy, -165);
          this.y -= 1;
        }
        this.setMotion(movingForward ? "DASH_FORWARD" : "DASH_BACK", true);
        game.audio.beep("dash");
        game.effects.push(new SpriteEffect({
          x: this.x - desired * 28,
          y: this.y + 22,
          image: game.assets.images.dust,
          frames: 8,
          duration: 0.3,
          scale: 0.72,
          flip: desired < 0,
          alpha: 0.58
        }));
      } else if (!this.grounded && desired !== 0) {
        this.vx = approach(this.vx, desired * this.config.speed * 0.86 * charmMoveScale, dt * (this.config.feel?.airAccel ?? 760));
      } else if (desired !== 0) {
        const movingForward = desired === this.facing;
        if (actions.down && this.grounded) {
          const crouchSpeed = this.config.speed * (this.config.feel?.crouchWalkScale ?? 0.4) * charmMoveScale;
          this.vx = approach(this.vx, desired * crouchSpeed, dt * (this.config.feel?.groundAccel ?? 2300));
          this.setMotion("CROUCH_WALK");
        } else {
          const running = this.moveHold >= (this.config.feel?.runThreshold ?? 0.28);
          const targetSpeed = (running ? this.config.runSpeed : this.config.speed) * charmMoveScale;
          this.vx = approach(this.vx, desired * targetSpeed, dt * (this.config.feel?.groundAccel ?? 2300));
          this.setMotion(movingForward
            ? (running ? "RUN_FORWARD" : "WALK_FORWARD")
            : (running ? "RUN_BACK" : "WALK_BACK"));
        }
      } else {
        this.moveHold = 0;
        this.lastMoveDir = 0;
        this.vx = approach(this.vx, 0, dt * (this.config.feel?.groundDecel ?? 2000));
      }

      const away = opponent.x > this.x ? actions.left : actions.right;
      const guardThreat = away && opponent.currentAttack && Math.abs(opponent.x - this.x) <= (opponent.currentAttack.data.reach ?? 90) + 140;
      if (guardThreat) {
        this.setMotion(actions.down ? "BLOCK_LOW" : "BLOCK_HIGH");
      } else if (actions.down && this.grounded && desired === 0) {
        this.setMotion("CROUCH_IDLE");
      } else if (
        Math.abs(this.vx) < 10 &&
        this.grounded &&
        (!MOTION_LOCKS.has(this.motion) || (!this.currentAttack && this.motionElapsed >= this.getMotionPlaybackDuration()))
      ) {
        this.setMotion("IDLE");
      }
    } else {
      this.vx = approach(this.vx, 0, dt * 1500);
    }

    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const stageMargin = this.config.stageMargin ?? 0;
    const minX = WORLD.left + stageMargin;
    const maxX = WORLD.right - stageMargin;
    this.x = clamp(this.x, minX, maxX);
    if ((this.x <= minX && this.vx < 0) || (this.x >= maxX && this.vx > 0)) this.vx = 0;
    if (this.y >= GROUND_Y) {
      if (!wasGrounded) {
        const landedDuringAirAttack = this.motion === "AIR_ATTACK"
          || this.currentAttack?.data?.motion === "AIR_ATTACK";
        if (landedDuringAirAttack) {
          this.currentAttack = null;
          this.attackBuffer = null;
        }
        if (!hardLocked) {
          this.setMotion("LANDING", true);
          this.landingLag = this.config.feel?.landingLag ?? 0.04;
          this.airDashAvailable = true;
          game.effects.push(new SpriteEffect({
            x: this.x,
            y: GROUND_Y + 18,
            image: game.assets.images.dust,
            frames: 8,
            duration: 0.34,
            scale: 0.78,
            flip: this.vx < 0,
            alpha: 0.52
          }));
        }
      }
      this.y = GROUND_Y;
      this.vy = 0;
    } else if (this.jumpStartTimer <= 0 && !stateLocked && !this.currentAttack && this.dashTimer <= 0) {
      if (this.vy < -90) this.setMotion("JUMP_RISE");
      else if (this.vy > 90) this.setMotion("JUMP_FALL");
      else this.setMotion("JUMP_PEAK");
    }
  }

  isBlocking(incomingLevel, attacker) {
    if (this.currentAttack || this.hitstun || this.knockdown || this.isKO) return false;
    if (this.shieldTimer > 0) return true;
    const away = attacker.x > this.x ? this.lastActions.left : this.lastActions.right;
    if (!away) return false;
    if (incomingLevel === "throw") return false;
    if (incomingLevel === "low") return Boolean(this.lastActions.down);
    if (incomingLevel === "high") return !this.lastActions.down;
    return true;
  }

  render(ctx, debug = false) {
    const anim = this.activeAnimation;
    const frameIndex = this.getMotionFrameIndex();
    const bodyAlpha = this.invulnerable > 0 && !this.isKO
      ? 0.9 + 0.1 * Math.abs(Math.sin(this.invulnerable * 20))
      : 1;
    const sourceFacing = anim?.sourceFacing ?? this.config.spriteFacing ?? 1;
    const flipSprite = this.facing !== sourceFacing;
    const motionScale = this.config.motionScaleOverrides?.[this.motion] ?? 1;
    const drawScale = (this.config.stableScale ?? this.config.scale) * motionScale;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    if (this.dashTimer > 0) {
      drawSpriteFrame(ctx, anim, frameIndex, this.x - this.dashDir * 32, this.y + 14, {
        scale: drawScale,
        flip: flipSprite,
        alpha: 0.24,
        composite: "source-over",
        filter: this.config.renderFilter ?? "none"
      });
    }
    const drewPrimary = drawSpriteFrame(ctx, anim, frameIndex, this.x, this.y + 14, {
      scale: drawScale,
      flip: flipSprite,
      alpha: bodyAlpha,
      composite: "source-over",
      filter: this.config.renderFilter ?? "none"
    });
    if (!drewPrimary && this.assets.animations[this.config.manifestKey]?.READY_STANCE) {
      drawSpriteFrame(ctx, this.assets.animations[this.config.manifestKey].READY_STANCE, 0, this.x, this.y + 14, {
        scale: drawScale,
        flip: flipSprite,
        alpha: 1,
        composite: "source-over",
        filter: this.config.renderFilter ?? "none"
      });
    }
    ctx.restore();

    if (this.charmedTimer > 0 && !this.isKO) {
      const pulse = 1 + Math.sin(this.charmedTimer * 18) * 0.08;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255, 96, 190, 0.82)";
      ctx.shadowColor = "#ff58bd";
      ctx.shadowBlur = 12;
      for (let index = 0; index < 3; index += 1) {
        const angle = this.charmedTimer * 5 + index * Math.PI * 2 / 3;
        const x = this.x + Math.cos(angle) * 34;
        const y = this.y - 176 + Math.sin(angle) * 9;
        const size = (6 + index) * pulse;
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.38);
        ctx.bezierCurveTo(x - size, y - size * 0.2, x - size * 0.5, y - size, x, y - size * 0.5);
        ctx.bezierCurveTo(x + size * 0.5, y - size, x + size, y - size * 0.2, x, y + size * 0.38);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.shieldTimer > 0) {
      const heartlineShield = this.config.archetype === "heartline";
      ctx.save();
      ctx.strokeStyle = heartlineShield ? "rgba(255, 104, 194, 0.82)" : "rgba(158, 216, 255, 0.72)";
      ctx.lineWidth = 3;
      ctx.shadowColor = heartlineShield ? "#ff58bd" : "#9ed8ff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 105, 58, 92, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.guardFlash > 0 && !this.isKO) {
      const t = Math.min(1, this.guardFlash / 0.28);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.12 + t * 0.28;
      ctx.strokeStyle = this.id === "MASTER_EZRA" ? "rgba(139, 212, 255, 0.9)" : "rgba(255, 214, 109, 0.86)";
      ctx.lineWidth = 2 + t * 3;
      ctx.shadowColor = this.id === "MASTER_EZRA" ? "#8bd4ff" : "#ffd66d";
      ctx.shadowBlur = 14 + t * 16;
      ctx.beginPath();
      ctx.ellipse(this.x - this.facing * 18, this.y - 104, 52 + t * 16, 84 + t * 18, -0.1 * this.facing, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (debug) {
      const hurt = this.hurtbox;
      ctx.save();
      ctx.strokeStyle = "rgba(95, 205, 255, 0.85)";
      ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
      const attack = this.getAttackBox();
      if (attack) {
        ctx.strokeStyle = "rgba(255, 214, 109, 0.9)";
        ctx.strokeRect(attack.x, attack.y, attack.w, attack.h);
      }
      ctx.restore();
    }
  }
}
