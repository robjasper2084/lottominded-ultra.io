import { drawSheetFrame } from "../engine/assets.js";

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
