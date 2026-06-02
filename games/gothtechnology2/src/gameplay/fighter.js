import { GRAVITY, GROUND_Y, WORLD } from "../config/constants.js";
import { ATTACKS } from "../config/moves.js?v=fighter-prop1";
import { drawSpriteFrame } from "../engine/assets.js?v=fighter-prop1";
import { approach, clamp, makeRect } from "../engine/math.js";
import { SpriteEffect } from "./effects.js";

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
  "TAUNT",
  "VICTORY",
  "DEFEAT"
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
  combo1: new Set(["combo2", "special", "super"]),
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
    this.dashForward = true;
    this.dashDir = facing;
    this.landingLag = 0;
    this.attackBuffer = null;
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
    this.dashForward = true;
    this.dashDir = facing;
    this.landingLag = 0;
    this.attackBuffer = null;
    this.setMotion("READY_STANCE", true);
  }

  get grounded() {
    return this.y >= GROUND_Y - 0.5;
  }

  get crouching() {
    return this.lastActions.down && this.grounded;
  }

  get hurtbox() {
    const h = this.crouching || this.motion === "BLOCK_LOW" ? 118 : 178;
    return makeRect(this.x, this.y, 76, h);
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
    const duration = (data.active?.[1] ?? data.startup + 0.18) + (data.recovery ?? 0.25);
    this.currentAttack = {
      name,
      data,
      elapsed: 0,
      duration,
      hitTargets: new Set(),
      spawned: false
    };
    this.setMotion(data.motion, true);
    if (data.startMotion) this.setMotion(data.startMotion, true);
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
    this.currentAttack = null;
    this.attackBuffer = null;
    this.meter = Math.min(100, this.meter + 2);
    return this.beginAttack(name, game);
  }

  useAssist(slot, game) {
    if (this.assistCooldowns[slot] > 0 || this.isKO || this.knockdown) return;
    game.spawnAssist(this, slot);
  }

  readAttackIntent(actions) {
    if (actions.throw) return "throw";
    if (actions.super) return "super";
    if (actions.special) return "special";
    if (actions.heavyPunch) return "heavyPunch";
    if (actions.heavyKick) return "heavyKick";
    if (actions.lightPunch && actions.down) return "crouchAttack";
    if (actions.lightKick && !this.grounded) return "airAttack";
    if (actions.lightPunch && actions.lightKick) return "combo2";
    if (actions.lightPunch) return "lightPunch";
    if (actions.lightKick) return "lightKick";
    return null;
  }

  getAttackBox() {
    const attack = this.currentAttack?.data;
    if (!attack) return null;
    const x = this.x + this.facing * (attack.reach ?? 90);
    return {
      x: x - (attack.width ?? 90) / 2,
      y: this.y + (attack.y ?? -120) - (attack.height ?? 70) / 2,
      w: attack.width ?? 90,
      h: attack.height ?? 70
    };
  }

  takeHit({ damage, stun, knockback, attackName, blocked, chipOnly, perfectBlock }) {
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
    this.lastActions = actions;
    this.motionElapsed += dt;
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.superCooldown = Math.max(0, this.superCooldown - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.landingLag = Math.max(0, this.landingLag - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hitstun = Math.max(0, this.hitstun - dt);
    this.blockstun = Math.max(0, this.blockstun - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.guardTapTimer = Math.max(0, this.guardTapTimer - dt);
    this.guardFlash = Math.max(0, this.guardFlash - dt);
    this.throwTechTimer = Math.max(0, this.throwTechTimer - dt);
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

    if (!this.isKO && this.health <= 0) {
      this.isKO = true;
      this.currentAttack = null;
      this.setMotion("DEFEAT", true);
    }

    const faceDelta = opponent.x - this.x;
    if (Math.abs(faceDelta) > 12) this.facing = faceDelta > 0 ? 1 : -1;
    const holdingBack = opponent.x > this.x ? actions.left : actions.right;
    const guarding = Boolean(holdingBack || (actions.down && this.grounded) || this.shieldTimer > 0);
    if (guarding && !this.wasGuarding) this.guardTapTimer = 0.13;
    this.wasGuarding = guarding;
    if (actions.throw) this.throwTechTimer = 0.18;

    if (this.knockdown > 0 && !this.isKO) {
      this.knockdown = Math.max(0, this.knockdown - dt);
      if (this.knockdown === 0) {
        this.invulnerable = 0.7;
        this.setMotion("GET_UP", true);
      }
    }

    const locked = this.isKO || this.hitstun > 0 || this.blockstun > 0 || this.knockdown > 0;
    const attackIntent = !locked ? this.readAttackIntent(actions) : null;
    if (attackIntent && (this.currentAttack || this.landingLag > 0)) {
      this.attackBuffer = { name: attackIntent, time: this.config.feel?.inputBuffer ?? 0.12 };
    }
    if (!locked && attackIntent && this.currentAttack && this.cancelInto(attackIntent, game)) {
      // Cancel handled before the current attack advances this frame.
    }
    if (!locked) {
      if (actions.assist1) this.useAssist("assist1", game);
      if (actions.assist2) this.useAssist("assist2", game);
      if (actions.taunt) {
        this.currentAttack = { name: "taunt", data: { motion: "TAUNT" }, elapsed: 0, duration: 0.82, hitTargets: new Set() };
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
      if ((name === "special" || name === "super") && !this.currentAttack.spawned && this.currentAttack.elapsed >= data.startup) {
        this.currentAttack.spawned = true;
        this.setMotion(data.motion, true);
        game.spawnProjectile(this, name);
      }
      if (this.currentAttack.elapsed >= this.currentAttack.duration) {
        if (data.recoverMotion) this.setMotion(data.recoverMotion, true);
        this.currentAttack = null;
      }
    }

    const dashing = this.dashTimer > 0;
    const canMove = !locked && !this.currentAttack && this.landingLag <= 0 && !dashing;
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
        this.vx += desired * this.config.speed * 0.36;
        this.y -= 1;
        this.setMotion("JUMP_START", true);
        game.audio.beep("jump");
      }
      if (actions.dash && desired !== 0 && this.grounded && this.dashCooldown <= 0) {
        const movingForward = desired === this.facing;
        this.dashForward = movingForward;
        this.dashDir = desired;
        this.dashTimer = movingForward ? 0.16 : 0.22;
        this.dashCooldown = movingForward ? 0.34 : 0.44;
        this.vx = desired * this.config.dashSpeed * (movingForward ? 1 : 0.78);
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
        this.vx = approach(this.vx, desired * this.config.speed * 0.86, dt * (this.config.feel?.airAccel ?? 760));
      } else if (desired !== 0) {
        const movingForward = desired === this.facing;
        this.vx = approach(this.vx, desired * this.config.speed, dt * (this.config.feel?.groundAccel ?? 2300));
        this.setMotion(movingForward ? "WALK_FORWARD" : "WALK_BACK");
      } else {
        this.moveHold = 0;
        this.lastMoveDir = 0;
        this.vx = approach(this.vx, 0, dt * (this.config.feel?.groundDecel ?? 2000));
      }

      const away = opponent.x > this.x ? actions.left : actions.right;
      if (away && desired === 0) {
        this.setMotion(actions.down ? "BLOCK_LOW" : "BLOCK_HIGH");
      } else if (actions.down && this.grounded) {
        this.setMotion("CROUCH_IDLE");
      } else if (
        Math.abs(this.vx) < 10 &&
        this.grounded &&
        (!MOTION_LOCKS.has(this.motion) || (!this.currentAttack && this.motionElapsed > 0.18))
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
      if (!wasGrounded && !this.currentAttack && !locked) {
        this.setMotion("LANDING", true);
        this.landingLag = this.config.feel?.landingLag ?? 0.04;
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
      this.y = GROUND_Y;
      this.vy = 0;
    } else if (!locked && !this.currentAttack) {
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
    let frameIndex = 0;
    const steadyMotions = new Set(["IDLE", "READY_STANCE", "BLOCK_HIGH", "BLOCK_LOW", "CROUCH_IDLE"]);
    if (anim?.frames?.length && !steadyMotions.has(this.motion)) {
      const animTimeScale = this.config.motionTimeScale ?? 1;
      const duration = anim.frames.reduce((sum, frame) => sum + (frame.duration_ms ?? 85), 0) / 1000;
      const loop = !MOTION_LOCKS.has(this.motion) || this.motion === "DEFEAT" || this.motion === "VICTORY";
      const scaledMotionTime = this.motionElapsed * animTimeScale;
      const time = loop ? scaledMotionTime % duration : Math.min(scaledMotionTime, duration - 0.001);
      let acc = 0;
      for (let i = 0; i < anim.frames.length; i += 1) {
        acc += (anim.frames[i].duration_ms ?? 85) / 1000;
        if (time <= acc) {
          frameIndex = i;
          break;
        }
      }
    }
    const bodyAlpha = 1;
    const sourceFacing = anim?.sourceFacing ?? this.config.spriteFacing ?? 1;
    const flipSprite = this.facing !== sourceFacing;
    const drawScale = this.config.stableScale ?? this.config.scale;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    const depthColor = this.id === "MASTER_EZRA" ? "rgba(118, 170, 255, 0.22)" : "rgba(216, 170, 69, 0.22)";
    const warmRim = this.id === "MASTER_EZRA" ? "rgba(255, 220, 142, 0.12)" : "rgba(255, 198, 92, 0.12)";
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.x + this.facing * -10, GROUND_Y + 10, 74 * drawScale / this.config.scale, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (this.dashTimer > 0) {
      drawSpriteFrame(ctx, anim, frameIndex, this.x - this.dashDir * 32, this.y + 14, {
        scale: drawScale,
        flip: flipSprite,
        alpha: 0.24,
        composite: "source-over"
      });
    }
    const extraDepthPasses = this.config.extraDepthPasses ?? false;
    if (extraDepthPasses) {
      drawSpriteFrame(ctx, anim, frameIndex, this.x - this.facing * 10, this.y + 20, {
        scale: drawScale * 1.018,
        flip: flipSprite,
        alpha: 0.28,
        composite: "source-over",
        filter: "brightness(0) blur(2px)"
      });
      drawSpriteFrame(ctx, anim, frameIndex, this.x + this.facing * 5, this.y + 10, {
        scale: drawScale * 1.01,
        flip: flipSprite,
        alpha: 0.16,
        composite: "screen",
        filter: "brightness(1.7) saturate(1.18)"
      });
    }
    const drewPrimary = drawSpriteFrame(ctx, anim, frameIndex, this.x, this.y + 14, {
      scale: drawScale,
      flip: flipSprite,
      alpha: bodyAlpha,
      composite: "source-over",
      underpaint: true,
      underpaintScale: 1,
      underpaintAlpha: this.id === "MASTER_EZRA" ? 0.56 : 0.6,
      filter: this.config.spriteFilter ?? (extraDepthPasses ? "contrast(1.08) saturate(0.96) drop-shadow(0 9px 7px rgba(0, 0, 0, 0.46))" : "contrast(1.06) saturate(0.96)")
    });
    if (!drewPrimary && this.assets.animations[this.config.manifestKey]?.READY_STANCE) {
      drawSpriteFrame(ctx, this.assets.animations[this.config.manifestKey].READY_STANCE, 0, this.x, this.y + 14, {
        scale: this.config.scale,
        flip: flipSprite,
        alpha: 1,
        composite: "source-over",
        underpaint: true,
        underpaintAlpha: 0.55
      });
    }
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const bodyGlow = ctx.createLinearGradient(this.x - 58, this.y - 188, this.x + 66, this.y - 42);
    bodyGlow.addColorStop(0, depthColor);
    bodyGlow.addColorStop(0.56, "rgba(255,255,255,0)");
    bodyGlow.addColorStop(1, warmRim);
    ctx.fillStyle = bodyGlow;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.ellipse(this.x + this.facing * -12, this.y - 102, 58, 92, -0.12 * this.facing, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    if (this.invulnerable > 0 && !this.isKO) {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(this.invulnerable * 24);
      ctx.strokeStyle = this.id === "MASTER_EZRA" ? "rgba(139, 212, 255, 0.72)" : "rgba(216, 170, 69, 0.64)";
      ctx.lineWidth = 2;
      ctx.shadowColor = this.id === "MASTER_EZRA" ? "#8bd4ff" : "#d8aa45";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 98, 58, 88, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.shieldTimer > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(158, 216, 255, 0.72)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#9ed8ff";
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
