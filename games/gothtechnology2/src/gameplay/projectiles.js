import { drawSheetFrame } from "../engine/assets.js?v=fighter-prop1";
import { rectsOverlap } from "../engine/math.js";
import { SpriteEffect } from "./effects.js";

const hexAlpha = (color, alpha) => {
  if (!color?.startsWith("#") || color.length !== 7) return color;
  return `${color}${Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0")}`;
};

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
    this.hitIds = new Set();
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
    this.trail.unshift({
      x: this.x,
      y: this.y + Math.sin(this.age * 14 + this.seed) * Math.min(18, this.radius * 0.32),
      age: this.age
    });
    this.trail.length = Math.min(this.trail.length, this.kind === "super" ? 12 : 8);
    this.x += this.direction * this.speed * dt;
    if (this.x < -140 || this.x > 1420 || this.age > 3.2) {
      this.spawnBurst(game, this.x, this.y, false);
      this.dead = true;
    }
    const target = game.fighters.find((fighter) => fighter.id !== this.owner.id);
    if (!target || target.isKO || this.hitIds.has(target.id)) return;
    if (rectsOverlap(this.rect, target.hurtbox)) {
      this.hitIds.add(target.id);
      game.resolveIncomingHit(this.owner, target, this.attack, {
        box: this.rect,
        projectile: true,
        level: this.attack.level ?? "mid",
        sourceName: this.kind
      });
      this.spawnBurst(game, target.x - this.direction * 34, this.y, true);
      this.dead = true;
    }
  }

  spawnBurst(game, x, y, impact = false) {
    if (this.burstDone || !game?.effects) return;
    this.burstDone = true;
    const image = this.owner.id === "KALYX"
      ? game.assets.images.kalyxShadowClaw
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

  render(ctx) {
    const frame = Math.floor(this.age * 18) % 8;
    const flip = this.direction < 0;
    const visualY = this.y + Math.sin(this.age * 14 + this.seed) * Math.min(18, this.radius * 0.26);
    this.renderTrail(ctx, visualY);

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

export class AssistStrike extends Projectile {
  constructor({ owner, x, y, direction, spec, image }) {
    super({
      owner,
      x,
      y,
      direction,
      image,
      kind: spec.name,
      color: owner.id === "KALYX" ? "#c08cff" : "#9ed8ff",
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
      const color = this.owner.id === "KALYX" ? "#9f62ff" : "#8bd4ff";
      const visualY = this.y + Math.sin(this.age * 12 + this.seed) * 18;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = this.trail.length - 1; i >= 0; i -= 1) {
        const p = this.trail[i];
        const t = 1 - i / Math.max(1, this.trail.length);
        ctx.globalAlpha = 0.06 + t * 0.22;
        ctx.fillStyle = this.owner.id === "KALYX" ? "rgba(110, 66, 210, 0.5)" : "rgba(139, 212, 255, 0.44)";
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 + t * 18;
        ctx.beginPath();
        ctx.ellipse(p.x - this.direction * 36, p.y + this.radius - 88, 94 * t, 24 * t, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = this.owner.id === "KALYX" ? "rgba(150, 88, 255, 0.22)" : "rgba(139, 212, 255, 0.2)";
      ctx.shadowColor = color;
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.ellipse(this.x - this.direction * 46, visualY + this.radius - 72, 138, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.owner.id === "KALYX" ? "rgba(202, 172, 255, 0.46)" : "rgba(255, 226, 146, 0.38)";
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
      ctx.shadowColor = this.owner.id === "KALYX" ? "rgba(156, 95, 255, 0.55)" : "rgba(139, 212, 255, 0.5)";
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
