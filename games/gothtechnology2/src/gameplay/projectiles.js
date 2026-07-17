import { drawSheetFrame } from "../engine/assets.js?v=heartline36-leash-wrist";
import { rectsOverlap } from "../engine/math.js?v=heartline36-leash-wrist";
import { LovePulseEffect, SpriteEffect } from "./effects.js?v=heartline36-leash-wrist";
import { sliceAttackForHit } from "./hits.js?v=heartline36-leash-wrist";

const hexAlpha = (color, alpha) => {
  if (!color?.startsWith("#") || color.length !== 7) return color;
  return `${color}${Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0")}`;
};

const fighterEffectColor = (owner, alpha = 1) => {
  const key = owner.config?.manifestKey;
  const color = key === "KALYX"
    ? "#9f62ff"
    : key?.startsWith("DETROIT_LENS")
      ? "#e7c36a"
      : key === "AMARA_VALENTINE"
        ? "#ff58bd"
        : "#8bd4ff";
  return alpha >= 1 ? color : hexAlpha(color, alpha);
};

const COMPANION_PROJECTILES = new Set(["shadow-raven", "arcane-owl"]);
const LOVE_PROJECTILES = new Set(["heartline-pulse", "heartbreak-nova"]);

export class Projectile {
  constructor({ owner, x, y, direction, attack, image, kind = "projectile", color = "#9ed8ff" }) {
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.attack = attack;
    this.image = image;
    this.kind = kind;
    this.color = color;
    this.speed = attack.speed ?? 520;
    this.radius = attack.radius ?? 34;
    this.age = 0;
    this.dead = false;
    this.hitCount = 0;
    this.hitCooldown = 0;
    this.trail = [];
    this.seed = Math.random() * Math.PI * 2;
    this.burstDone = false;
  }

  get rect() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      w: this.radius * 2,
      h: this.radius * 2
    };
  }

  update(dt, game) {
    this.age += dt;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    if (!COMPANION_PROJECTILES.has(this.kind)) {
      this.trail.unshift({
        x: this.x,
        y: this.y + Math.sin(this.age * 14 + this.seed) * Math.min(18, this.radius * 0.32),
        age: this.age
      });
      this.trail.length = Math.min(this.trail.length, this.kind === "super" || this.kind === "heartbreak-nova" ? 12 : 8);
    }
    this.x += this.direction * this.speed * dt;
    if (this.x < -140 || this.x > 1420 || this.age > 3.2) {
      this.spawnBurst(game, this.x, this.y, false);
      this.dead = true;
    }
    const target = game.fighters.find((fighter) => fighter.id !== this.owner.id);
    if (!target || target.isKO || this.hitCooldown > 0) return;
    if (rectsOverlap(this.rect, target.hurtbox)) {
      const maxHits = Math.max(1, Math.floor(this.attack.multiHit ?? 1));
      this.hitCount += 1;
      game.resolveIncomingHit(this.owner, target, sliceAttackForHit(this.attack, this.hitCount), {
        box: this.rect,
        projectile: true,
        level: this.attack.level ?? "mid",
        sourceName: this.kind === "eye-laser" || this.kind === "heartbreak-nova"
          ? "super"
          : this.kind,
        hitIndex: this.hitCount,
        maxHits
      });
      if (this.hitCount >= maxHits) {
        this.spawnBurst(game, target.x - this.direction * 34, this.y, true);
        this.dead = true;
      } else {
        this.hitCooldown = this.attack.hitInterval ?? 0.075;
        if (LOVE_PROJECTILES.has(this.kind)) {
          game.effects.push(new LovePulseEffect({
            x: target.x - this.direction * 24,
            y: this.y,
            duration: 0.22,
            scale: Math.max(0.5, this.radius / 90),
            direction: this.direction,
            burst: true
          }));
        } else {
          game.effects.push(new SpriteEffect({
            x: target.x - this.direction * 24,
            y: this.y + this.radius * 0.7,
            image: this.image,
            duration: 0.18,
            scale: Math.max(0.3, this.radius / 120),
            flip: this.direction < 0,
            alpha: 0.62
          }));
        }
      }
    }
  }

  spawnBurst(game, x, y, impact = false) {
    if (this.burstDone || !game?.effects) return;
    this.burstDone = true;
    const manifestKey = this.owner.config?.manifestKey;
    if (manifestKey === "AMARA_VALENTINE") {
      game.effects.push(new LovePulseEffect({
        x,
        y,
        duration: impact ? 0.42 : 0.28,
        scale: (this.radius / 74) * (impact ? 1.1 : 0.72),
        direction: this.direction,
        burst: impact
      }));
      return;
    }
    const image = manifestKey === "KALYX"
      ? game.assets.images.kalyxShadowClaw
      : manifestKey?.startsWith("DETROIT_LENS")
        ? game.assets.images.hitSpark
        : game.assets.images.ezraBlueBurst;
    game.effects.push(new SpriteEffect({
      x,
      y: y + this.radius * 0.75,
      image,
      duration: impact ? 0.34 : 0.24,
      scale: (this.radius / 72) * (impact ? 0.98 : 0.62),
      flip: this.direction < 0,
      alpha: impact ? 0.92 : 0.52
    }));
  }

  renderTrail(ctx, visualY) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = this.trail.length - 1; i >= 0; i -= 1) {
      const p = this.trail[i];
      const t = 1 - i / Math.max(1, this.trail.length);
      const w = this.radius * (0.34 + t * 0.72);
      const h = this.radius * (0.12 + t * 0.2);
      ctx.globalAlpha = 0.08 + t * 0.28;
      ctx.fillStyle = hexAlpha(this.color, 0.28 + t * 0.42);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12 + t * 22;
      ctx.beginPath();
      ctx.ellipse(p.x - this.direction * this.radius * 0.65, p.y, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = hexAlpha(this.color, 0.68);
    ctx.lineWidth = Math.max(2, this.radius * 0.08);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(this.x - this.direction * this.radius * 3.25, visualY);
    ctx.quadraticCurveTo(
      this.x - this.direction * this.radius * 1.75,
      visualY + Math.sin(this.age * 18 + this.seed) * this.radius * 0.3,
      this.x + this.direction * this.radius * 0.28,
      visualY
    );
    ctx.stroke();
    ctx.restore();
  }

  renderEyeLaser(ctx, visualY) {
    const length = this.radius * 7.4;
    const startX = this.x - this.direction * length;
    const endX = this.x + this.direction * this.radius * 0.9;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(startX, visualY, endX, visualY);
    beam.addColorStop(0, "rgba(90, 0, 0, 0)");
    beam.addColorStop(0.38, "rgba(210, 24, 32, 0.4)");
    beam.addColorStop(0.82, "rgba(255, 48, 54, 0.96)");
    beam.addColorStop(1, "rgba(255, 245, 220, 1)");
    ctx.strokeStyle = beam;
    ctx.lineCap = "round";
    ctx.lineWidth = this.radius * (0.32 + Math.sin(this.age * 46) * 0.05);
    ctx.shadowColor = "#ff2838";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(startX, visualY);
    ctx.lineTo(endX, visualY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 246, 226, 0.95)";
    ctx.lineWidth = Math.max(2, this.radius * 0.09);
    ctx.beginPath();
    ctx.moveTo(startX + this.direction * length * 0.34, visualY);
    ctx.lineTo(endX, visualY);
    ctx.stroke();
    ctx.restore();
  }

  renderLoveProjectile(ctx, visualY) {
    const superMove = this.kind === "heartbreak-nova";
    const pulse = 1 + Math.sin(this.age * (superMove ? 18 : 24)) * 0.08;
    const size = this.radius * (superMove ? 0.62 : 0.52) * pulse;
    ctx.save();
    ctx.translate(this.x, visualY);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "#ff3cad";
    ctx.shadowBlur = superMove ? 38 : 24;
    ctx.fillStyle = superMove ? "rgba(255, 88, 184, 0.9)" : "rgba(255, 116, 202, 0.92)";
    ctx.beginPath();
    ctx.moveTo(0, size * 0.38);
    ctx.bezierCurveTo(-size * 0.9, -size * 0.2, -size * 0.5, -size, 0, -size * 0.5);
    ctx.bezierCurveTo(size * 0.5, -size, size * 0.9, -size * 0.2, 0, size * 0.38);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 235, 247, 0.95)";
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.stroke();
    for (let ring = 0; ring < (superMove ? 3 : 2); ring += 1) {
      ctx.globalAlpha = 0.5 - ring * 0.12;
      ctx.beginPath();
      ctx.arc(0, 0, size * (1.45 + ring * 0.52 + Math.sin(this.age * 11 + ring) * 0.08), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  render(ctx) {
    if (COMPANION_PROJECTILES.has(this.kind)) {
      const frame = Math.floor(this.age * 14) % 6;
      const visualY = this.y + Math.sin(this.age * 13 + this.seed) * 8;
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18;
      drawSheetFrame(ctx, this.image, frame, 256, 256, this.x, visualY + this.radius * 1.45, {
        scale: this.kind === "shadow-raven" ? 0.68 : 0.72,
        flip: this.direction < 0,
        alpha: 1
      });
      ctx.restore();
      return;
    }
    const frame = Math.floor(this.age * 18) % 8;
    const flip = this.direction < 0;
    const visualY = this.y + Math.sin(this.age * 14 + this.seed) * Math.min(18, this.radius * 0.26);
    if (this.kind === "eye-laser") {
      this.renderEyeLaser(ctx, visualY);
      return;
    }
    this.renderTrail(ctx, visualY);
    if (LOVE_PROJECTILES.has(this.kind)) {
      this.renderLoveProjectile(ctx, visualY);
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const trail = ctx.createLinearGradient(this.x - this.direction * this.radius * 3.2, visualY, this.x, visualY);
    trail.addColorStop(0, "rgba(0, 0, 0, 0)");
    trail.addColorStop(0.42, hexAlpha(this.color, 0.25));
    trail.addColorStop(1, hexAlpha(this.color, 0.82));
    ctx.fillStyle = trail;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.ellipse(this.x - this.direction * this.radius * 1.2, visualY, this.radius * 2.25, this.radius * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.kind === "super" ? 34 : 24;
    const drewSprite = drawSheetFrame(ctx, this.image, frame, 256, 256, this.x, visualY + this.radius, {
      scale: (this.radius / 62) * (this.kind === "super" ? 1.08 : 0.96),
      flip,
      alpha: 0.98
    });
    ctx.restore();

    if (!drewSprite) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.ellipse(this.x, visualY, this.radius * 1.4, this.radius * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 246, 211, 0.72)";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(this.x + this.direction * this.radius * 0.45, visualY - this.radius * 0.05, this.radius * 0.22, this.radius * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 246, 211, 0.6)";
    ctx.lineWidth = Math.max(1.5, this.radius * 0.035);
    ctx.beginPath();
    ctx.moveTo(this.x - this.direction * this.radius * 0.15, visualY - this.radius * 0.42);
    ctx.lineTo(this.x + this.direction * this.radius * 0.78, visualY);
    ctx.lineTo(this.x - this.direction * this.radius * 0.16, visualY + this.radius * 0.42);
    ctx.stroke();
    ctx.restore();
  }
}

const BOERBOEL_PHASES = {
  summon: { row: 0, duration: 0.24, frameRate: 12 },
  run: { row: 1, duration: Infinity, frameRate: 14 },
  attack: { row: 2, duration: 0.46, frameRate: 13 },
  recover: { row: 3, duration: 0.44, frameRate: 12 }
};

export class BoerboelStrike extends Projectile {
  constructor({ owner, x, y, direction, attack, image }) {
    super({ owner, x, y, direction, attack, image, kind: "boerboel-rush", color: "#c88946" });
    this.phase = "summon";
    this.phaseAge = 0;
    this.hitApplied = false;
    this.speed = attack.speed ?? 760;
    this.radius = attack.radius ?? 66;
  }

  get rect() {
    return {
      x: this.x - 82,
      y: this.y - 112,
      w: 164,
      h: 108
    };
  }

  setPhase(phase) {
    this.phase = phase;
    this.phaseAge = 0;
  }

  update(dt, game) {
    this.age += dt;
    this.phaseAge += dt;
    const target = game.fighters.find((fighter) => fighter.id !== this.owner.id);

    if (this.phase === "summon") {
      if (this.phaseAge >= BOERBOEL_PHASES.summon.duration) this.setPhase("run");
      return;
    }

    if (this.phase === "run") {
      this.x += this.direction * this.speed * dt;
      const distance = target ? this.direction * (target.x - this.x) : Infinity;
      if (target && distance <= 126 && distance >= -76) {
        this.x = target.x - this.direction * 94;
        this.setPhase("attack");
        return;
      }
      if (this.x < -160 || this.x > 1440 || this.age > 2.4) this.setPhase("recover");
      return;
    }

    if (this.phase === "attack") {
      if (!this.hitApplied && this.phaseAge >= 0.15) {
        this.hitApplied = true;
        if (target && !target.isKO && rectsOverlap(this.rect, target.hurtbox)) {
          game.resolveIncomingHit(this.owner, target, this.attack, {
            box: this.rect,
            projectile: false,
            level: this.attack.level ?? "mid",
            sourceName: "boerboelRush",
            hitIndex: 1,
            maxHits: 1
          });
          game.effects.push(new SpriteEffect({
            x: target.x - this.direction * 24,
            y: target.y - 78,
            image: game.assets.images.hitSpark,
            duration: 0.26,
            scale: 0.46,
            flip: this.direction < 0,
            alpha: 0.86
          }));
        }
      }
      if (this.phaseAge >= BOERBOEL_PHASES.attack.duration) this.setPhase("recover");
      return;
    }

    this.x += this.direction * this.speed * 0.42 * dt;
    if (this.phaseAge >= BOERBOEL_PHASES.recover.duration) this.dead = true;
  }

  render(ctx) {
    if (!this.image) return;
    const layout = BOERBOEL_PHASES[this.phase];
    const frame = this.phase === "run"
      ? Math.floor(this.phaseAge * layout.frameRate) % 6
      : Math.min(5, Math.floor((this.phaseAge / layout.duration) * 6));
    const alpha = this.phase === "recover"
      ? Math.max(0, 1 - this.phaseAge / layout.duration)
      : 1;
    const scale = 0.86;

    ctx.save();
    ctx.globalAlpha = 0.34 * alpha;
    ctx.fillStyle = "#050403";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 5, 74, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y + 3);
    if (this.direction < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      this.image,
      frame * 192,
      layout.row * 192,
      192,
      192,
      -96 * scale,
      -192 * scale,
      192 * scale,
      192 * scale
    );
    ctx.restore();
  }
}

export class AssistStrike extends Projectile {
  constructor({ owner, x, y, direction, spec, image }) {
    super({
      owner,
      x,
      y,
      direction,
      image,
      kind: spec.render === "lovePulse" ? "heartline-pulse" : spec.name,
      color: fighterEffectColor(owner),
      attack: {
        damage: spec.damage,
        chip: 6,
        meter: 8,
        speed: spec.speed || 0,
        radius: Math.max(spec.hitbox.w, spec.hitbox.h) / 2,
        stun: 0.3,
        blockstun: 0.24,
        knockback: 280,
        level: "mid"
      }
    });
    this.spec = spec;
    this.startX = x;
  }

  update(dt, game) {
    if (this.spec.shield) {
      this.age += dt;
      this.owner.shieldTimer = Math.max(this.owner.shieldTimer, 0.5);
      if (this.age > 0.72) this.dead = true;
      return;
    }
    super.update(dt, game);
  }

  renderHandFireball(ctx) {
    const radius = this.radius;
    const visualY = this.y + Math.sin(this.age * 16 + this.seed) * Math.min(10, radius * 0.2);
    const color = "#8bd4ff";
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = this.trail.length - 1; i >= 0; i -= 1) {
      const p = this.trail[i];
      const t = 1 - i / Math.max(1, this.trail.length);
      ctx.globalAlpha = 0.05 + t * 0.15;
      ctx.fillStyle = `rgba(80, 188, 255, ${0.08 + t * 0.16})`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 + t * 20;
      ctx.beginPath();
      ctx.ellipse(
        p.x - this.direction * radius * (0.4 + t * 0.85),
        p.y,
        radius * (0.22 + t * 0.5),
        radius * (0.08 + t * 0.18),
        -0.08 * this.direction,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const glow = ctx.createRadialGradient(
      this.x + this.direction * radius * 0.22,
      visualY - radius * 0.08,
      radius * 0.08,
      this.x,
      visualY,
      radius * 1.34
    );
    glow.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    glow.addColorStop(0.22, "rgba(193, 242, 255, 0.94)");
    glow.addColorStop(0.58, "rgba(63, 170, 255, 0.52)");
    glow.addColorStop(1, "rgba(15, 54, 112, 0)");
    ctx.fillStyle = glow;
    ctx.shadowColor = color;
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.ellipse(this.x, visualY, radius * 0.98, radius * 0.9, 0.05 * this.direction, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 235, 166, 0.62)";
    ctx.lineWidth = Math.max(2, radius * 0.06);
    ctx.beginPath();
    ctx.moveTo(this.x - this.direction * radius * 1.28, visualY - radius * 0.4);
    ctx.quadraticCurveTo(
      this.x - this.direction * radius * 0.12,
      visualY - radius * 0.9,
      this.x + this.direction * radius * 0.86,
      visualY - radius * 0.08
    );
    ctx.quadraticCurveTo(
      this.x - this.direction * radius * 0.1,
      visualY + radius * 0.86,
      this.x - this.direction * radius * 1.16,
      visualY + radius * 0.34
    );
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.direction * radius * 0.36,
      visualY - radius * 0.16,
      radius * 0.24,
      radius * 0.13,
      -0.18 * this.direction,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  render(ctx) {
    if (this.spec.render === "handFireball") {
      this.renderHandFireball(ctx);
      return;
    }
    if (this.spec.sheet && this.image) {
      const layout = this.spec.sheet;
      const frame = Math.floor(this.age * (layout.frameRate ?? 10)) % (layout.frames ?? 4);
      const sx = (layout.sourceX ?? 0) + frame * layout.cellWidth;
      const sy = (layout.sourceY ?? 0) + (layout.row ?? 0) * layout.cellHeight;
      const scale = layout.visualScale ?? this.radius / 96;
      const flip = this.direction < 0;
      const color = fighterEffectColor(this.owner);
      const visualY = this.y + Math.sin(this.age * 12 + this.seed) * 18;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = this.trail.length - 1; i >= 0; i -= 1) {
        const p = this.trail[i];
        const t = 1 - i / Math.max(1, this.trail.length);
        ctx.globalAlpha = 0.06 + t * 0.22;
        ctx.fillStyle = fighterEffectColor(this.owner, 0.44);
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 + t * 18;
        ctx.beginPath();
        ctx.ellipse(p.x - this.direction * 36, p.y + this.radius - 88, 94 * t, 24 * t, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = fighterEffectColor(this.owner, 0.22);
      ctx.shadowColor = color;
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.ellipse(this.x - this.direction * 46, visualY + this.radius - 72, 138, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fighterEffectColor(this.owner, 0.46);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x - this.direction * 156, visualY + this.radius - 96);
      ctx.lineTo(this.x - this.direction * 48, visualY + this.radius - 76);
      ctx.lineTo(this.x + this.direction * 72, visualY + this.radius - 108);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(this.x, visualY + this.radius);
      if (flip) ctx.scale(-1, 1);
      ctx.globalAlpha = 0.96;
      ctx.shadowColor = fighterEffectColor(this.owner, 0.55);
      ctx.shadowBlur = 22;
      ctx.drawImage(
        this.image,
        sx,
        sy,
        layout.cellWidth,
        layout.cellHeight,
        (-layout.cellWidth * scale) / 2,
        -layout.cellHeight * scale,
        layout.cellWidth * scale,
        layout.cellHeight * scale
      );
      ctx.restore();
      return;
    }
    super.render(ctx);
  }
}
