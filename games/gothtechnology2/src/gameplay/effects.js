import { drawSheetFrame } from "../engine/assets.js?v=heartline36-leash-wrist";

export class SpriteEffect {
  constructor({ x, y, image, cellW = 256, cellH = 256, frames = 8, duration = 0.42, scale = 1, flip = false, alpha = 1 }) {
    this.x = x;
    this.y = y;
    this.image = image;
    this.cellW = cellW;
    this.cellH = cellH;
    this.frames = frames;
    this.duration = duration;
    this.scale = scale;
    this.flip = flip;
    this.alpha = alpha;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.dead = this.age >= this.duration;
  }

  render(ctx) {
    const t = Math.min(0.999, this.age / this.duration);
    const frame = Math.floor(t * this.frames);
    if (!drawSheetFrame(ctx, this.image, frame, this.cellW, this.cellH, this.x, this.y, {
      scale: this.scale,
      flip: this.flip,
      alpha: this.alpha * (1 - Math.max(0, t - 0.72) / 0.28)
    })) {
      ctx.save();
      ctx.globalAlpha = this.alpha * (1 - t);
      ctx.fillStyle = "#ffd66d";
      ctx.beginPath();
      ctx.arc(this.x, this.y - 70, 18 + 38 * t, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export class AttachedSpriteEffect extends SpriteEffect {
  constructor({ owner, offsetX = 0, offsetY = -120, ...options }) {
    super({ x: owner.x, y: owner.y, ...options });
    this.owner = owner;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  update(dt) {
    this.x = this.owner.x + this.owner.facing * this.offsetX;
    this.y = this.owner.y + this.offsetY;
    this.flip = this.owner.facing < 0;
    super.update(dt);
  }
}

const heartPath = (ctx, size) => {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.34);
  ctx.bezierCurveTo(-size * 0.82, -size * 0.18, -size * 0.48, -size, 0, -size * 0.52);
  ctx.bezierCurveTo(size * 0.48, -size, size * 0.82, -size * 0.18, 0, size * 0.34);
  ctx.closePath();
};

export class LovePulseEffect {
  constructor({ x = 0, y = 0, owner = null, offsetX = 42, offsetY = -126, duration = 0.48, scale = 1, direction = 1, burst = false }) {
    this.x = x;
    this.y = y;
    this.owner = owner;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.duration = duration;
    this.scale = scale;
    this.direction = direction;
    this.burst = burst;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    if (this.owner) {
      this.x = this.owner.x + this.owner.facing * this.offsetX;
      this.y = this.owner.y + this.offsetY;
      this.direction = this.owner.facing;
    }
    this.dead = this.age >= this.duration;
  }

  render(ctx) {
    const t = Math.min(1, this.age / this.duration);
    const ease = 1 - (1 - t) ** 3;
    const alpha = Math.max(0, 1 - t);
    const radius = (30 + ease * (this.burst ? 118 : 72)) * this.scale;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = "#ff69c8";
    ctx.lineWidth = Math.max(2, 6 * (1 - t));
    ctx.shadowColor = "#ff3cad";
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 3; index += 1) {
      const phase = t * 2.4 + index * 0.72;
      const x = this.direction * (18 + phase * 36) * this.scale;
      const y = Math.sin(phase * 3.2) * 18 * this.scale - index * 10;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.direction * (0.12 - t * 0.18));
      ctx.fillStyle = index === 1 ? "#ffd2e7" : "#ff4fb8";
      heartPath(ctx, (13 + index * 3) * this.scale * (0.75 + alpha * 0.35));
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

export class FloatingText {
  constructor(text, x, y, color = "#ffd66d") {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.y -= dt * 42;
    this.dead = this.age > 0.8;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = 1 - this.age / 0.8;
    ctx.fillStyle = this.color;
    ctx.font = "700 24px Georgia";
    ctx.textAlign = "center";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
