import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, ROUND_SECONDS } from "../config/constants.js";
import { drawSpriteFrame } from "../engine/assets.js?v=fighter-prop1";

const panel = (ctx, x, y, w, h, stroke = COLORS.gold) => {
  ctx.save();
  ctx.fillStyle = "rgba(4, 3, 3, 0.72)";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(216, 170, 69, 0.25)";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

export const drawBar = (ctx, x, y, w, h, pct, color, back = "rgba(255,255,255,0.12)", flip = false) => {
  ctx.save();
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  const fill = Math.max(0, Math.min(1, pct)) * w;
  const gx = flip ? x + w - fill : x;
  const grad = ctx.createLinearGradient(gx, y, gx + fill, y);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "#fff2ba");
  ctx.fillStyle = grad;
  ctx.fillRect(gx, y, fill, h);
  ctx.strokeStyle = "rgba(255, 226, 150, 0.56)";
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
};

export const drawFightHud = (ctx, game) => {
  const [p1, p2] = game.fighters;
  panel(ctx, 28, 24, 502, 112);
  panel(ctx, 750, 24, 502, 112, COLORS.blue);
  drawBar(ctx, 52, 54, 450, 22, p1.health / p1.config.maxHealth, "#d84332");
  drawBar(ctx, 778, 54, 450, 22, p2.health / p2.config.maxHealth, "#d84332", "rgba(255,255,255,0.12)", true);
  drawBar(ctx, 52, 92, 292, 14, p1.meter / 100, "#4bb7ff");
  drawBar(ctx, 936, 92, 292, 14, p2.meter / 100, "#4bb7ff", "rgba(255,255,255,0.12)", true);

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.white;
  ctx.font = "700 21px Georgia";
  ctx.textAlign = "left";
  ctx.fillText(p1.config.name, 52, 37);
  ctx.fillStyle = COLORS.gold;
  ctx.font = "700 13px system-ui";
  ctx.fillText(p1.config.title.toUpperCase(), 52, 121);
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.white;
  ctx.font = "700 21px Georgia";
  ctx.fillText(p2.config.name, 1228, 37);
  ctx.fillStyle = COLORS.blue;
  ctx.font = "700 13px system-ui";
  ctx.fillText(p2.config.title.toUpperCase(), 1228, 121);

  ctx.textAlign = "center";
  panel(ctx, 561, 18, 158, 98, COLORS.goldBright);
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "800 44px Georgia";
  ctx.fillText(String(Math.max(0, Math.ceil(game.roundTimer))).padStart(2, "0"), 640, 60);
  ctx.fillStyle = COLORS.white;
  ctx.font = "700 13px system-ui";
  ctx.fillText(`ROUND ${game.roundNumber}`, 640, 96);

  for (let i = 0; i < 2; i += 1) {
    ctx.fillStyle = i < p1.roundWins ? COLORS.goldBright : "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(370 + i * 22, 99, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i < p2.roundWins ? COLORS.blue : "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(910 - i * 22, 99, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 246, 211, 0.78)";
  ctx.font = "700 12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`P1 MOTION: ${p1.motion}`, 36, 160);
  ctx.textAlign = "right";
  ctx.fillText(`P2 MOTION: ${p2.motion}`, 1244, 160);

  if (p1.comboHits >= 2) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.goldBright;
    ctx.font = "800 28px Georgia";
    ctx.fillText(`${p1.comboHits} HIT COMBO`, 64, 208);
    ctx.font = "800 15px system-ui";
    ctx.fillText(`${Math.round(p1.comboDamage ?? 0)} DAMAGE`, 66, 232);
  }
  if (p2.comboHits >= 2) {
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.blue;
    ctx.font = "800 28px Georgia";
    ctx.fillText(`${p2.comboHits} HIT COMBO`, 1216, 208);
    ctx.font = "800 15px system-ui";
    ctx.fillText(`${Math.round(p2.comboDamage ?? 0)} DAMAGE`, 1214, 232);
  }

  ctx.fillStyle = "rgba(255, 246, 211, 0.72)";
  ctx.font = "700 12px system-ui";
  ctx.textAlign = "center";
  const mode = `${game.training ? "TRAINING" : "ARCADE"} ${game.cpuEnabled ? `CPU ${p2.config.name}` : "LOCAL 2P"} ${game.debug ? "DEBUG BOXES" : ""}`;
  ctx.fillText(mode, 640, 139);
  if (game.training) {
    panel(ctx, 468, 612, 344, 72, COLORS.blue);
    ctx.fillStyle = COLORS.white;
    ctx.font = "800 12px system-ui";
    ctx.fillText("TRAINING: T MODE  B HITBOXES  R RESET  C CPU", 640, 632);
    ctx.fillStyle = COLORS.goldBright;
    ctx.font = "900 15px system-ui";
    ctx.fillText(`INPUT ${game.inputLog?.slice(0, 5).join("  /  ") ?? "READY"}`, 640, 660);
  }
  ctx.restore();
};

export const drawTitle = (ctx, game) => {
  drawMenuCoverWash(ctx);
  ctx.save();
  ctx.textAlign = "center";
  const logo = game.assets?.images.logo;
  if (logo) {
    ctx.save();
    ctx.shadowColor = "rgba(255, 214, 109, 0.42)";
    ctx.shadowBlur = 28;
    ctx.drawImage(logo, 502, 34, 276, 276);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS.goldBright;
    ctx.shadowColor = COLORS.goldBright;
    ctx.shadowBlur = 18;
    ctx.font = "900 76px Georgia";
    ctx.fillText("LOTTO MIND LIVE", CANVAS_WIDTH / 2, 190);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = COLORS.blue;
  ctx.font = "700 20px system-ui";
  const leftName = game.player1Id === "MASTER_EZRA" ? "MASTER EZRA" : "KALYX";
  const rightName = game.player2Id === "MASTER_EZRA" ? "MASTER EZRA" : "KALYX";
  const cpuName = game.player2Id === "MASTER_EZRA" ? "EZRA" : "KALYX";
  ctx.fillText(`${leftName} VS ${rightName}`, CANVAS_WIDTH / 2, 314);
  drawMenuButton(ctx, 494, 338, 292, 54, "PICK FIGHTER");
  drawMenuButton(ctx, 494, 406, 292, 54, "TRAINING SELECT");
  drawMenuButton(ctx, 494, 474, 292, 54, "GAME SELECT");
  drawMenuButton(ctx, 494, 542, 292, 54, game.cpuEnabled ? `CPU ${cpuName}: ON` : `CPU ${cpuName}: OFF`);
  ctx.fillStyle = "rgba(255, 246, 211, 0.55)";
  ctx.font = "700 13px system-ui";
  ctx.fillText("ENTER starts fighter select  /  GAME SELECT opens the arcade shelf", CANVAS_WIDTH / 2, 650);
  ctx.restore();
};

export const drawGameSelect = (ctx, game, games) => {
  drawMenuCoverWash(ctx);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.white;
  ctx.font = "900 42px Georgia";
  ctx.fillText("GAME SELECT", 640, 88);
  ctx.fillStyle = COLORS.blue;
  ctx.font = "700 15px system-ui";
  ctx.fillText("CLICK A GAME OR PRESS LEFT / RIGHT, THEN ENTER", 640, 122);

  drawGameCard(ctx, 88, 154, 512, 396, games[0], game.gameSelectIndex === 0, "fighter");
  drawGameCard(ctx, 680, 154, 512, 396, games[1], game.gameSelectIndex === 1, "runGun");
  drawMenuButton(ctx, 494, 596, 292, 54, "BACK");
  ctx.restore();
};

const drawGameCard = (ctx, x, y, w, h, item, selected, variant) => {
  const stroke = selected ? COLORS.goldBright : variant === "runGun" ? COLORS.blue : COLORS.gold;
  panel(ctx, x, y, w, h, stroke);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 14, y + 14, w - 28, h - 112, 6);
  ctx.clip();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, variant === "runGun" ? "#080b12" : "#0b0808");
  grad.addColorStop(0.56, variant === "runGun" ? "#101922" : "#15110c");
  grad.addColorStop(1, "#020202");
  ctx.fillStyle = grad;
  ctx.fillRect(x + 14, y + 14, w - 28, h - 112);
  if (variant === "fighter") drawFighterGameArt(ctx, x, y, w, h);
  else drawRunGunGameArt(ctx, x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.76)";
  ctx.fillRect(x + 14, y + h - 96, w - 28, 78);
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "900 14px system-ui";
  ctx.fillText(item.badge, x + 32, y + h - 70);
  ctx.fillStyle = COLORS.white;
  ctx.font = "900 29px Georgia";
  ctx.fillText(item.title, x + 32, y + h - 42);
  ctx.fillStyle = selected ? COLORS.goldBright : "rgba(255, 246, 211, 0.72)";
  ctx.font = "700 13px system-ui";
  ctx.fillText(item.subtitle.toUpperCase(), x + 32, y + h - 20);
  if (selected) {
    ctx.strokeStyle = COLORS.goldBright;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
  }
  ctx.restore();
};

const drawFighterGameArt = (ctx, x, y, w, h) => {
  const baseY = y + 292;
  ctx.strokeStyle = "rgba(255, 214, 109, 0.2)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 20 + i * 68, y + 26);
    ctx.lineTo(x - 30 + i * 68, baseY + 4);
    ctx.stroke();
  }
  drawMenuFighterSilhouette(ctx, x + 176, baseY, -1, COLORS.goldBright);
  drawMenuFighterSilhouette(ctx, x + 336, baseY, 1, COLORS.blue);
};

const drawMenuFighterSilhouette = (ctx, x, y, facing, color) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -116, 42, 72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -198, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, -150);
  ctx.lineTo(94, -166);
  ctx.lineTo(102, -150);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, -52);
  ctx.lineTo(-44, 0);
  ctx.moveTo(24, -52);
  ctx.lineTo(58, 0);
  ctx.stroke();
  ctx.restore();
};

const drawRunGunGameArt = (ctx, x, y, w, h) => {
  const horizon = y + 116;
  ctx.fillStyle = "rgba(139, 212, 255, 0.14)";
  for (let i = 0; i < 8; i += 1) ctx.fillRect(x + 40 + i * 58, horizon + i % 2 * 12, 34, 120);
  ctx.fillStyle = "#15110c";
  ctx.fillRect(x + 14, y + 272, w - 28, 36);
  ctx.fillStyle = COLORS.gold;
  for (let i = 0; i < 12; i += 1) ctx.fillRect(x + 28 + i * 42, y + 286, 18, 4);
  ctx.save();
  ctx.translate(x + 170, y + 272);
  ctx.fillStyle = "#050403";
  ctx.strokeStyle = COLORS.goldBright;
  ctx.lineWidth = 3;
  ctx.fillRect(-28, -92, 48, 78);
  ctx.strokeRect(-28, -92, 48, 78);
  ctx.beginPath();
  ctx.arc(-4, -116, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = COLORS.blue;
  ctx.beginPath();
  ctx.moveTo(18, -72);
  ctx.lineTo(96, -82);
  ctx.stroke();
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(98, -88, 18, 10);
  ctx.restore();
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = "rgba(255, 214, 109, 0.9)";
    ctx.beginPath();
    ctx.arc(x + 326 + i * 46, y + 190 + i % 2 * 30, 15, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawLoading = (ctx, progress, backdrop = null) => {
  if (backdrop?.complete && backdrop.naturalWidth > 0) drawCoverImage(ctx, backdrop);
  else drawBackdropGrade(ctx);
  drawMenuCoverWash(ctx);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "900 48px Georgia";
  ctx.fillText("GOTHTECHNOLOGY", CANVAS_WIDTH / 2, 292);
  drawBar(ctx, 390, 348, 500, 16, progress, COLORS.goldBright);
  ctx.fillStyle = COLORS.blue;
  ctx.font = "700 15px system-ui";
  ctx.fillText("LOADING CUSTOM ASSETS", CANVAS_WIDTH / 2, 388);
  ctx.restore();
};

export const drawCharacterSelect = (ctx, game) => {
  drawBackdropGrade(ctx);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.white;
  ctx.font = "900 42px Georgia";
  ctx.fillText("CHARACTER SELECT", 640, 86);
  drawDossierCard(ctx, 90, 128, 500, 420, "KALYX", game.player1Id === "KALYX" ? "PLAYER 1 / shadow rushdown" : "PLAYER 2 / shadow rushdown", game.assets.images.dossierVespera, game.player1Id === "KALYX" ? COLORS.goldBright : COLORS.gold);
  drawDossierCard(ctx, 690, 128, 500, 420, "MASTER EZRA", game.player1Id === "MASTER_EZRA" ? "PLAYER 1 / blue control" : "PLAYER 2 / blue control", game.assets.images.dossierMalach, game.player1Id === "MASTER_EZRA" ? COLORS.goldBright : COLORS.blue);
  drawSelectBadge(ctx, game.player1Id === "KALYX" ? 340 : 940, 146, "P1");
  drawSelectBadge(ctx, game.player2Id === "KALYX" ? 340 : 940, 512, "P2");
  drawMenuButton(ctx, 494, 594, 292, 54, "VERSUS");
  ctx.fillStyle = "rgba(255, 246, 211, 0.58)";
  ctx.font = "700 13px system-ui";
  ctx.fillText("CLICK A CARD OR PRESS LEFT / RIGHT, THEN ENTER", 640, 652);
  ctx.fillText(game.cpuEnabled ? `${game.player2Id === "KALYX" ? "KALYX" : "MASTER EZRA"} CPU ENABLED` : "LOCAL TWO-PLAYER ENABLED", 640, 676);
  ctx.restore();
};

export const drawVersus = (ctx, game) => {
  drawBackdropGrade(ctx);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "900 44px Georgia";
  ctx.fillText("VERSUS", 640, 122);
  const [p1, p2] = game.fighters;
  drawFighterPortrait(ctx, p1, 360, 572, 1.5);
  drawFighterPortrait(ctx, p2, 920, 572, 1.45);
  ctx.fillStyle = COLORS.white;
  ctx.font = "900 34px Georgia";
  ctx.fillText(p1.config.name, 340, 210);
  ctx.fillText(p2.config.name, 920, 210);
  ctx.fillStyle = COLORS.blue;
  ctx.font = "700 18px system-ui";
  ctx.fillText("BEST OF THREE / 99 SECONDS", 640, 628);
  ctx.restore();
};

const drawSelectBadge = (ctx, x, y, label) => {
  ctx.save();
  ctx.fillStyle = "rgba(255, 214, 109, 0.96)";
  ctx.strokeStyle = "rgba(5, 4, 3, 0.92)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 32, y - 22, 64, 34, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#050403";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 18px system-ui";
  ctx.fillText(label, x, y - 5);
  ctx.restore();
};

export const drawPause = (ctx, game) => {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  panel(ctx, 364, 154, 552, 404, COLORS.goldBright);
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "900 42px Georgia";
  ctx.fillText("PAUSED", 640, 224);
  ctx.fillStyle = COLORS.white;
  ctx.font = "700 16px system-ui";
  ctx.fillText(game.training ? "TRAINING MODE" : "ARCADE MATCH", 640, 272);
  ctx.fillText(game.cpuEnabled ? `CPU ${game.fighters[1]?.config.name ?? "FIGHTER"}` : "LOCAL TWO-PLAYER", 640, 300);
  ctx.fillText(game.audio.muted ? "AUDIO MUTED" : "AUDIO ACTIVE", 640, 328);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 246, 211, 0.9)";
  ctx.font = "800 14px system-ui";
  const moves = [
    "MOVE: A/D or arrows    JUMP: W    CROUCH: S",
    "ATTACKS: LP J, HP U, LK K, HK I",
    "SPECIAL: L    SUPER: O    THROW: H",
    "ASSISTS: N / M    DASH: Shift or double tap",
    "CHAINS: light > heavy > special > super"
  ];
  moves.forEach((line, index) => ctx.fillText(line, 430, 374 + index * 28));
  ctx.restore();
};

export const drawRoundMessage = (ctx, text, subtext = "") => {
  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowColor = COLORS.goldBright;
  ctx.shadowBlur = 24;
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "900 74px Georgia";
  ctx.fillText(text, 640, 324);
  ctx.shadowBlur = 0;
  if (subtext) {
    ctx.fillStyle = COLORS.white;
    ctx.font = "700 22px system-ui";
    ctx.fillText(subtext, 640, 370);
  }
  ctx.restore();
};

export const drawMenuButton = (ctx, x, y, w, h, label) => {
  panel(ctx, x, y, w, h, COLORS.gold);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = "900 22px Georgia";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
};

const drawDossierCard = (ctx, x, y, w, h, name, subtitle, img, color) => {
  panel(ctx, x, y, w, h, color);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 14, y + 14, w - 28, h - 96, 6);
  ctx.clip();
  ctx.globalAlpha = 0.86;
  if (img) ctx.drawImage(img, x + 14, y - 20, w - 28, h + 70);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(x + 14, y + h - 82, w - 28, 64);
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "left";
  ctx.font = "900 28px Georgia";
  ctx.fillText(name, x + 32, y + h - 50);
  ctx.fillStyle = color;
  ctx.font = "700 14px system-ui";
  ctx.fillText(subtitle.toUpperCase(), x + 32, y + h - 25);
  ctx.restore();
};

const drawFighterPortrait = (ctx, fighter, x, y, scale) => {
  const anim = fighter.assets.animations[fighter.config.manifestKey]?.IDLE;
  if (anim) {
    const frame = Math.floor(performance.now() / 140) % anim.frames.length;
    drawSpriteFrame(ctx, anim, frame, x, y, {
      scale,
      flip: fighter.config.id === "MASTER_EZRA",
      alpha: 0.96
    });
    return frame;
  }
};

export const drawBackdropGrade = (ctx) => {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, "#090908");
  grad.addColorStop(0.52, "#11100d");
  grad.addColorStop(1, "#020202");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

const drawCoverImage = (ctx, image) => {
  const scale = Math.max(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (CANVAS_WIDTH - w) / 2, (CANVAS_HEIGHT - h) / 2, w, h);
};

const drawMenuCoverWash = (ctx) => {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, "rgba(0,0,0,0.38)");
  grad.addColorStop(0.42, "rgba(0,0,0,0.18)");
  grad.addColorStop(0.74, "rgba(0,0,0,0.42)");
  grad.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

export const drawDiagnostics = (ctx, game) => {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(16, 606, 370, 82);
  ctx.fillStyle = COLORS.blue;
  ctx.font = "700 12px ui-monospace, Consolas, monospace";
  ctx.textAlign = "left";
  const lines = [
    `phase=${game.phase} hitstop=${game.hitstop.toFixed(2)} projectiles=${game.projectiles.length} effects=${game.effects.length}`,
    `p1 hp=${Math.round(game.fighters[0].health)} meter=${Math.round(game.fighters[0].meter)} cd=${game.fighters[0].specialCooldown.toFixed(1)}`,
    `p2 hp=${Math.round(game.fighters[1].health)} meter=${Math.round(game.fighters[1].meter)} cd=${game.fighters[1].specialCooldown.toFixed(1)}`
  ];
  lines.forEach((line, i) => ctx.fillText(line, 28, 628 + i * 18));
  ctx.restore();
};
