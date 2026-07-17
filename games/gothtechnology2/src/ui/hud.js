import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, ROUND_SECONDS } from "../config/constants.js?v=heartline36-leash-wrist";
import { FIGHTERS } from "../config/assets.js?v=heartline36-leash-wrist";
import { GAME_MODES, ROSTER_CARD_LAYOUT, ROSTER_IDS, STAGES } from "../config/content.js?v=heartline36-leash-wrist";
import { drawSpriteFrame } from "../engine/assets.js?v=heartline36-leash-wrist";

const FUTURE = {
  cyan: "#67e8ff",
  red: "#ff405d",
  amber: "#ffc857",
  white: "#eefaff",
  muted: "#78909c",
  line: "rgba(103, 232, 255, 0.18)",
  panel: "rgba(4, 10, 15, 0.94)"
};

const HUD_FONT = '"Arial Narrow", "Segoe UI", system-ui, sans-serif';
const HUD_MONO = 'Consolas, "Courier New", monospace';

const angularPath = (ctx, x, y, w, h, cut = 14) => {
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
};

const drawAngularPanel = (ctx, x, y, w, h, fill, stroke, lineWidth = 1.5, cut = 14) => {
  ctx.save();
  angularPath(ctx, x, y, w, h, cut);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
};

const drawFutureBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = "#020509";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const field = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  field.addColorStop(0, "rgba(255, 64, 93, 0.1)");
  field.addColorStop(0.36, "rgba(5, 12, 18, 0.18)");
  field.addColorStop(0.68, "rgba(5, 12, 18, 0.18)");
  field.addColorStop(1, "rgba(103, 232, 255, 0.1)");
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = FUTURE.line;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  for (let y = 1; y < CANVAS_HEIGHT; y += 4) ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  ctx.fillStyle = FUTURE.red;
  ctx.fillRect(0, 0, 4, CANVAS_HEIGHT);
  ctx.fillStyle = FUTURE.cyan;
  ctx.fillRect(CANVAS_WIDTH - 4, 0, 4, CANVAS_HEIGHT);
  ctx.restore();
};

const drawFutureButton = (ctx, x, y, w, h, kicker, label, tone, background = null) => {
  if (background?.complete && background.naturalWidth > 0) {
    ctx.save();
    angularPath(ctx, x, y, w, h, 12);
    ctx.clip();
    drawCoverImage(ctx, background, x, y, w, h);
    ctx.fillStyle = "rgba(2, 8, 12, 0.68)";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  drawAngularPanel(ctx, x, y, w, h, background ? "rgba(3, 9, 13, 0.44)" : "rgba(3, 9, 13, 0.96)", tone, 2, 12);
  ctx.save();
  ctx.fillStyle = tone;
  ctx.fillRect(x + 16, y + 13, 4, h - 26);
  ctx.textAlign = "left";
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.fillText(kicker, x + 34, y + 21);
  ctx.fillStyle = FUTURE.white;
  let fontSize = 20;
  ctx.font = `900 ${fontSize}px ${HUD_FONT}`;
  while (fontSize > 13 && ctx.measureText(label).width > w - 58) {
    fontSize -= 1;
    ctx.font = `900 ${fontSize}px ${HUD_FONT}`;
  }
  ctx.fillText(label, x + 34, y + 46);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.moveTo(x + w - 28, y + h / 2 - 8);
  ctx.lineTo(x + w - 18, y + h / 2);
  ctx.lineTo(x + w - 28, y + h / 2 + 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawSelectionTarget = (ctx, x, y, w, h, role, fighterName, active, tone) => {
  drawAngularPanel(
    ctx,
    x,
    y,
    w,
    h,
    active ? "rgba(7, 25, 32, 0.98)" : "rgba(2, 8, 12, 0.88)",
    active ? tone : "rgba(126, 160, 174, 0.42)",
    active ? 2 : 1,
    8
  );
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = active ? tone : FUTURE.muted;
  ctx.font = `900 11px ${HUD_MONO}`;
  ctx.fillText(role, x + 16, y + h / 2);
  ctx.fillStyle = active ? FUTURE.white : "rgba(238, 250, 255, 0.66)";
  let fontSize = 12;
  ctx.font = `900 ${fontSize}px ${HUD_FONT}`;
  while (fontSize > 9 && ctx.measureText(fighterName).width > w - 92) {
    fontSize -= 1;
    ctx.font = `900 ${fontSize}px ${HUD_FONT}`;
  }
  ctx.fillText(fighterName, x + 76, y + h / 2);
  ctx.fillStyle = active ? tone : FUTURE.muted;
  ctx.fillRect(x + w - 28, y + h / 2 - 1, 12, 2);
  ctx.restore();
};

const drawTitleAction = (ctx, x, y, w, h, index, label, tone, selected = false) => {
  drawAngularPanel(ctx, x, y, w, h, selected ? "rgba(10, 27, 35, 0.97)" : "rgba(2, 8, 12, 0.84)", selected ? FUTURE.white : tone, selected ? 3 : 1.5, 10);
  ctx.save();
  ctx.fillStyle = tone;
  ctx.fillRect(x + 14, y + 10, 3, h - 20);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.fillText(index, x + 28, y + h / 2);
  ctx.fillStyle = selected ? tone : FUTURE.white;
  ctx.font = `900 18px ${HUD_FONT}`;
  ctx.fillText(label, x + 68, y + h / 2);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.moveTo(x + w - 28, y + h / 2 - 6);
  ctx.lineTo(x + w - 18, y + h / 2);
  ctx.lineTo(x + w - 28, y + h / 2 + 6);
  ctx.closePath();
  ctx.fill();
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

const drawFutureCombatBar = (ctx, x, y, w, h, pct, tone, flip = false) => {
  const fill = Math.max(0, Math.min(1, pct)) * w;
  ctx.save();
  ctx.fillStyle = "rgba(238, 250, 255, 0.1)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tone;
  ctx.fillRect(flip ? x + w - fill : x, y, fill, h);
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(flip ? x + w - fill : x, y, fill, 2);
  ctx.strokeStyle = "rgba(126, 160, 174, 0.6)";
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
};

export const drawFightHud = (ctx, game) => {
  const [p1, p2] = game.fighters;
  if (!p1 || !p2) return;
  const hudScale = Math.max(0.8, Math.min(1.3, Number(game.settings?.hudScale) || 1));
  const geometryScale = Math.min(1, hudScale);
  const typeScale = hudScale > 1 ? hudScale : 1;
  ctx.save();
  if (geometryScale !== 1) {
    ctx.translate(CANVAS_WIDTH / 2, 0);
    ctx.scale(geometryScale, geometryScale);
    ctx.translate(-CANVAS_WIDTH / 2, 0);
  }
  if (game.settings?.highContrast) {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(16, 8, CANVAS_WIDTH - 32, 154);
  }

  drawAngularPanel(ctx, 24, 16, 500, 116, "rgba(2, 8, 12, 0.9)", FUTURE.cyan, 2, 12);
  drawAngularPanel(ctx, 756, 16, 500, 116, "rgba(2, 8, 12, 0.9)", FUTURE.red, 2, 12);
  drawFutureCombatBar(ctx, 48, 50, 448, 20, p1.health / p1.config.maxHealth, "#ff5b57");
  drawFutureCombatBar(ctx, 784, 50, 448, 20, p2.health / p2.config.maxHealth, "#ff5b57", true);
  drawFutureCombatBar(ctx, 48, 92, 304, 10, p1.meter / 100, FUTURE.cyan);
  drawFutureCombatBar(ctx, 928, 92, 304, 10, p2.meter / 100, FUTURE.red, true);

  ctx.textBaseline = "middle";
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 ${Math.round(19 * typeScale)}px ${HUD_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(p1.config.name, 48, 35);
  ctx.textAlign = "right";
  ctx.fillText(p2.config.name, 1232, 35);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 ${Math.round(10 * typeScale)}px ${HUD_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(`${Math.ceil(p1.health)} HP`, 48, 80);
  ctx.fillStyle = FUTURE.cyan;
  ctx.fillText(`DRIVE ${Math.round(p1.meter)}%`, 48, 116);
  ctx.textAlign = "right";
  ctx.fillStyle = FUTURE.muted;
  ctx.fillText(`${Math.ceil(p2.health)} HP`, 1232, 80);
  ctx.fillStyle = FUTURE.red;
  ctx.fillText(`DRIVE ${Math.round(p2.meter)}%`, 1232, 116);

  drawAngularPanel(ctx, 548, 12, 184, 112, "rgba(2, 8, 12, 0.96)", FUTURE.amber, 2, 12);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.amber;
  ctx.font = `900 ${Math.round(42 * typeScale)}px ${HUD_FONT}`;
  ctx.fillText(String(Math.max(0, Math.ceil(game.roundTimer))).padStart(2, "0"), 640, 52);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 ${Math.round(11 * typeScale)}px ${HUD_MONO}`;
  ctx.fillText(`ROUND ${game.roundNumber}`, 640, 82);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 ${Math.round(9 * typeScale)}px ${HUD_MONO}`;
  ctx.fillText(game.isReplay ? `REPLAY ${game.replaySpeed}X` : STAGES[game.stageIndex].name, 640, 103);

  for (let index = 0; index < 2; index += 1) {
    ctx.fillStyle = index < p1.roundWins ? FUTURE.cyan : "rgba(238,250,255,0.18)";
    ctx.fillRect(374 + index * 18, 94, 12, 8);
    ctx.fillStyle = index < p2.roundWins ? FUTURE.red : "rgba(238,250,255,0.18)";
    ctx.fillRect(894 - index * 18, 94, 12, 8);
  }

  const modeLabel = game.gameMode === "arcade"
    ? `ARCADE NODE ${Math.min(game.arcadeStage + 1, 5)}/5`
    : (game.training ? "TRAINING GRID" : game.isReplay ? "REPLAY FEED" : (game.cpuEnabled ? `VERSUS CPU ${game.cpuDifficulty.toUpperCase()}` : "LOCAL VERSUS"));
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 ${Math.round(10 * typeScale)}px ${HUD_MONO}`;
  ctx.fillText(`${modeLabel} // ${p1.config.title.toUpperCase()} // ${p2.config.title.toUpperCase()}`, 640, 146);

  if (game.debug) {
    ctx.fillStyle = FUTURE.white;
    ctx.textAlign = "left";
    ctx.fillText(`P1 ${p1.motion} F${p1.getMotionFrameIndex()}`, 28, 170);
    ctx.textAlign = "right";
    ctx.fillText(`P2 ${p2.motion} F${p2.getMotionFrameIndex()}`, 1252, 170);
  } else if (game.rewardStatusTimer > 0 && game.rewardStatus) {
    ctx.fillStyle = FUTURE.cyan;
    ctx.fillText(game.rewardStatus, 640, 170);
  }

  if (game.training) {
    drawAngularPanel(ctx, 390, 604, 500, 90, "rgba(2, 8, 12, 0.92)", FUTURE.cyan, 1.5, 10);
    ctx.fillStyle = FUTURE.muted;
    ctx.font = `800 9px ${HUD_MONO}`;
    ctx.fillText(`${game.trainingDummyMode.toUpperCase()} // ${game.trainingGuardMode.toUpperCase()} // ${game.trainingRecording.length ? `REC ${game.trainingRecording.length}F` : "INPUT READY"}`, 640, 626);
    const attack = p1.currentAttack?.data;
    ctx.fillStyle = FUTURE.white;
    ctx.font = `900 10px ${HUD_MONO}`;
    ctx.fillText(attack ? `START ${attack.startup?.toFixed(2) ?? "-"}  ACTIVE ${attack.active?.map((value) => value.toFixed(2)).join("-") ?? "-"}  REC ${attack.recovery?.toFixed(2) ?? "-"}` : "NEUTRAL FRAME DATA", 640, 651);
    if (game.trainingReadout) {
      const readout = game.trainingReadout;
      ctx.fillStyle = readout.outcome === "hit" ? "#8ff0a4" : FUTURE.amber;
      ctx.fillText(`${readout.outcome.toUpperCase()} // ADV ${readout.advantageFrames >= 0 ? "+" : ""}${readout.advantageFrames}F // DAMAGE ${Math.round(readout.damage)} // SCALE ${Math.round(readout.comboScale * 100)}%`, 640, 676);
    }
  }
  ctx.restore();
};

export const drawTitle = (ctx, game) => {
  ctx.save();
  ctx.fillStyle = "rgba(2, 7, 11, 0.82)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, 126);
  ctx.fillStyle = FUTURE.red;
  ctx.fillRect(28, 30, 280, 2);
  ctx.fillStyle = FUTURE.cyan;
  ctx.fillRect(972, 30, 280, 2);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("LM-84 // DETROIT COMBAT NETWORK", 28, 22);
  ctx.textAlign = "right";
  ctx.fillText("4 FIGHTERS // 6 ARENAS // LINK READY", 1252, 22);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.white;
  ctx.shadowColor = "rgba(103, 232, 255, 0.42)";
  ctx.shadowBlur = 18;
  ctx.font = `900 54px ${HUD_FONT}`;
  ctx.fillText("GOTHTECHNOLOGY", CANVAS_WIDTH / 2, 78);
  ctx.shadowBlur = 0;
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 12px ${HUD_MONO}`;
  ctx.fillText("MOTOR CITY COMBAT PROTOCOL", CANVAS_WIDTH / 2, 106);

  const footer = ctx.createLinearGradient(0, 504, 0, CANVAS_HEIGHT);
  footer.addColorStop(0, "rgba(2, 7, 11, 0)");
  footer.addColorStop(0.2, "rgba(2, 7, 11, 0.82)");
  footer.addColorStop(1, "rgba(2, 7, 11, 0.96)");
  ctx.fillStyle = footer;
  ctx.fillRect(0, 504, CANVAS_WIDTH, 216);
  drawTitleAction(ctx, 124, 552, 312, 46, "01", "VERSUS", FUTURE.red, game.titleMenuIndex === 0);
  drawTitleAction(ctx, 484, 552, 312, 46, "02", "ARCADE", FUTURE.amber, game.titleMenuIndex === 1);
  drawTitleAction(ctx, 844, 552, 312, 46, "03", "TRAINING", FUTURE.cyan, game.titleMenuIndex === 2);
  drawTitleAction(ctx, 124, 610, 312, 46, "04", "REPLAY", FUTURE.cyan, game.titleMenuIndex === 3);
  drawTitleAction(ctx, 484, 610, 312, 46, "05", "GAME SELECT", FUTURE.amber, game.titleMenuIndex === 4);
  drawTitleAction(ctx, 844, 610, 312, 46, "06", "SETTINGS", FUTURE.red, game.titleMenuIndex === 5);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `700 10px ${HUD_MONO}`;
  const cpuLabel = game.cpuEnabled ? `CPU ${game.cpuDifficulty.toUpperCase()}` : "LOCAL 2P";
  ctx.fillText(`${cpuLabel} // ${game.stats.matches} MATCHES // ${game.stats.wins} WINS // ${game.stats.arcadeClears} ARCADE CLEARS // ENTER TO DEPLOY`, CANVAS_WIDTH / 2, 692);
  ctx.restore();
};

export const drawGameSelect = (ctx, game, games) => {
  drawFutureBackdrop(ctx);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("LM-84 // ENTERTAINMENT NETWORK", 34, 34);
  ctx.textAlign = "right";
  ctx.fillText("2 DEPLOYABLE TITLES // LINK READY", 1246, 34);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 42px ${HUD_FONT}`;
  ctx.fillText("GAME GRID", 640, 82);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 12px ${HUD_MONO}`;
  ctx.fillText("SELECT SOFTWARE // LEFT-RIGHT NAVIGATE // A OR ENTER DEPLOYS", 640, 112);

  drawGameCard(ctx, 88, 154, 512, 396, games[0], game.gameSelectIndex === 0, "fighter", game.assets?.images?.[games[0].imageKey]);
  drawGameCard(ctx, 680, 154, 512, 396, games[1], game.gameSelectIndex === 1, "runGun", game.assets?.images?.[games[1].imageKey]);
  drawFutureButton(ctx, 494, 596, 292, 54, "SYSTEM", "BACK", FUTURE.cyan);
  ctx.restore();
};

const drawGameCard = (ctx, x, y, w, h, item, selected, variant, titleArt) => {
  const stroke = selected ? FUTURE.white : variant === "runGun" ? FUTURE.cyan : FUTURE.red;
  drawAngularPanel(ctx, x, y, w, h, FUTURE.panel, stroke, selected ? 3 : 1.5, 16);
  const artX = x + 14;
  const artY = y + 14;
  const artW = w - 28;
  const artH = h - 112;
  ctx.save();
  angularPath(ctx, artX, artY, artW, artH, 10);
  ctx.clip();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, variant === "runGun" ? "#080b12" : "#0b0808");
  grad.addColorStop(0.56, variant === "runGun" ? "#101922" : "#15110c");
  grad.addColorStop(1, "#020202");
  ctx.fillStyle = grad;
  ctx.fillRect(artX, artY, artW, artH);
  if (titleArt?.complete && titleArt.naturalWidth > 0) {
    drawCoverImage(ctx, titleArt, artX, artY, artW, artH);
    const imageGrade = ctx.createLinearGradient(artX, artY, artX, artY + artH);
    imageGrade.addColorStop(0, "rgba(0,0,0,0.04)");
    imageGrade.addColorStop(0.72, "rgba(0,0,0,0.02)");
    imageGrade.addColorStop(1, "rgba(0,0,0,0.48)");
    ctx.fillStyle = imageGrade;
    ctx.fillRect(artX, artY, artW, artH);
  } else if (variant === "fighter") {
    drawFighterGameArt(ctx, x, y, w, h);
  } else {
    drawRunGunGameArt(ctx, x, y, w, h);
  }
  if (selected) {
    drawAngularPanel(ctx, artX + 14, artY + 14, 108, 28, "rgba(2,8,12,0.9)", FUTURE.white, 1.5, 6);
    ctx.fillStyle = stroke;
    ctx.font = `900 11px ${HUD_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("LINKED", artX + 68, artY + 33);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(2,7,11,0.96)";
  ctx.fillRect(x + 14, y + h - 96, w - 28, 78);
  ctx.textAlign = "left";
  ctx.fillStyle = stroke;
  ctx.font = `900 11px ${HUD_MONO}`;
  ctx.fillText(item.badge, x + 32, y + h - 70);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 27px ${HUD_FONT}`;
  ctx.fillText(item.title, x + 32, y + h - 42);
  ctx.fillStyle = selected ? stroke : FUTURE.muted;
  ctx.font = `800 11px ${HUD_MONO}`;
  ctx.fillText(item.subtitle.toUpperCase(), x + 32, y + h - 20);
  if (selected) {
    ctx.fillStyle = stroke;
    ctx.fillRect(x + 14, y + h - 96, 4, 78);
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
  else drawFutureBackdrop(ctx);
  ctx.fillStyle = "rgba(1, 5, 9, 0.76)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.save();
  ctx.textAlign = "center";
  drawAngularPanel(ctx, 340, 252, 600, 208, "rgba(2, 8, 12, 0.94)", FUTURE.cyan, 2, 18);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 43px ${HUD_FONT}`;
  ctx.fillText("GOTHTECHNOLOGY", CANVAS_WIDTH / 2, 322);
  drawBar(ctx, 390, 360, 500, 12, progress, FUTURE.red);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 12px ${HUD_MONO}`;
  ctx.fillText(`BOOTING DETROIT COMBAT GRID // ${Math.round(progress * 100)}%`, CANVAS_WIDTH / 2, 406);
  ctx.restore();
};

export const drawCharacterSelect = (ctx, game) => {
  drawFutureBackdrop(ctx);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(3, 8, 12, 0.92)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, 122);
  ctx.fillStyle = FUTURE.red;
  ctx.fillRect(32, 40, 292, 2);
  ctx.fillStyle = FUTURE.cyan;
  ctx.fillRect(956, 40, 292, 2);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 11px ${HUD_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("LM-84 // COMBAT NETWORK", 32, 28);
  ctx.textAlign = "right";
  ctx.fillText(`ARENA ${String(game.stageIndex + 1).padStart(2, "0")} // DETROIT GRID`, 1248, 28);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 38px ${HUD_FONT}`;
  ctx.fillText("FIGHTER LINK", 640, 58);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 13px ${HUD_MONO}`;
  ctx.fillText(`${GAME_MODES[game.gameMode]?.label || "VERSUS"} PROTOCOL // SELECT COMBATANT`, 640, 88);
  const opponentRole = game.training ? "DUMMY" : (game.cpuEnabled ? "CPU" : "P2");
  drawSelectionTarget(ctx, 352, 98, 272, 32, "P1", FIGHTERS[game.player1Id].name, game.selectTarget !== "p2", FUTURE.cyan);
  drawSelectionTarget(ctx, 656, 98, 272, 32, opponentRole, FIGHTERS[game.player2Id].name, game.selectTarget === "p2", FUTURE.red);
  for (const [index, layout] of ROSTER_CARD_LAYOUT.entries()) {
    const characterId = ROSTER_IDS[index];
    const config = FIGHTERS[characterId];
    const { x, y, w, h } = layout;
    const color = config.palette;
    const preview = { assets: game.assets, config };
    const selected = game.player1Id === characterId;
    const opponent = game.player2Id === characterId;
    drawCharacterCard(ctx, x, y, w, h, preview, config.name, config.title, selected, opponent, color, index);
    if (selected) drawSelectBadge(ctx, x + 48, y + 36, "P1", FUTURE.cyan);
    if (opponent) drawSelectBadge(ctx, x + w - 52, y + 36, game.training ? "DUMMY" : (game.cpuEnabled ? "CPU" : "P2"), FUTURE.red);
  }
  const selectedStage = STAGES[game.stageIndex];
  drawFutureButton(ctx, 330, 568, 292, 64, `ARENA ${String(game.stageIndex + 1).padStart(2, "0")}/${String(STAGES.length).padStart(2, "0")}`, selectedStage.name, FUTURE.amber, game.assets?.images?.[selectedStage.backgroundKey]);
  drawFutureButton(ctx, 658, 568, 292, 64, "MATCH COMMAND", "ENGAGE", FUTURE.red);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `700 11px ${HUD_MONO}`;
  ctx.textAlign = "center";
  ctx.fillText(`${game.selectTarget === "p2" ? opponentRole : "P1"} TARGET // CLICK FIGHTER // UP-DOWN SWITCH TARGET // ENTER TO DEPLOY`, 640, 658);
  if (game.motionLoadError || game.fightLoadError) {
    ctx.fillStyle = FUTURE.red;
    ctx.fillText("LINK FAILURE // SELECT VERSUS TO RETRY", 640, 687);
  } else if (!game.matchAssetsReady) {
    const progress = Math.round(((game.motionLoadingProgress + game.fightLoadingProgress) / 2) * 100);
    ctx.fillStyle = FUTURE.cyan;
    ctx.fillText(`SYNCING COMBAT ASSETS // ${progress}%`, 640, 687);
  } else {
    ctx.fillStyle = FUTURE.white;
    ctx.fillText(game.training ? "TRAINING TARGET ONLINE" : (game.cpuEnabled ? `HOSTILE LINK // ${FIGHTERS[game.player2Id].name} // ${game.cpuDifficulty.toUpperCase()}` : "LOCAL DUEL LINK // TWO CONTROLLERS READY"), 640, 687);
  }
  ctx.restore();
};

export const drawVersus = (ctx, game) => {
  drawFutureBackdrop(ctx);
  ctx.save();
  ctx.textAlign = "center";
  const [p1, p2] = game.fighters;
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("LM-84 // MATCH HANDSHAKE", 34, 34);
  ctx.textAlign = "right";
  ctx.fillText(`${STAGES[game.stageIndex].name} // SECURE LINK`, 1246, 34);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 42px ${HUD_FONT}`;
  ctx.fillText("COMBAT LINK", 640, 86);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 12px ${HUD_MONO}`;
  ctx.fillText(game.gameMode === "arcade" ? `ARCADE NODE ${game.arcadeStage + 1}/5` : "VERSUS PROTOCOL", 640, 112);

  drawAngularPanel(ctx, 84, 146, 432, 410, "rgba(3, 10, 15, 0.95)", FUTURE.cyan, 2.5, 18);
  drawAngularPanel(ctx, 764, 146, 432, 410, "rgba(3, 10, 15, 0.95)", FUTURE.red, 2.5, 18);
  drawFighterPortrait(ctx, p1, 300, 478, 1.45);
  drawFighterPortrait(ctx, p2, 980, 478, 1.42);
  ctx.fillStyle = "rgba(2, 7, 11, 0.94)";
  ctx.fillRect(96, 454, 408, 88);
  ctx.fillRect(776, 454, 408, 88);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.fillText("PLAYER ONE // LINKED", 300, 476);
  ctx.fillText(game.cpuEnabled ? `CPU ${game.cpuDifficulty.toUpperCase()} // HOSTILE` : "PLAYER TWO // LINKED", 980, 476);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 27px ${HUD_FONT}`;
  ctx.fillText(p1.config.name, 300, 510);
  ctx.fillText(p2.config.name, 980, 510);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.fillText(p1.config.title.toUpperCase(), 300, 534);
  ctx.fillStyle = FUTURE.red;
  ctx.fillText(p2.config.title.toUpperCase(), 980, 534);

  drawAngularPanel(ctx, 568, 248, 144, 144, "rgba(2, 8, 12, 0.98)", FUTURE.amber, 2, 20);
  ctx.fillStyle = FUTURE.amber;
  ctx.font = `900 48px ${HUD_FONT}`;
  ctx.fillText("VS", 640, 316);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 9px ${HUD_MONO}`;
  ctx.fillText("BEST OF 3", 640, 350);

  if (!game.matchAssetsReady) {
    const percent = Math.round(((game.motionLoadingProgress + game.fightLoadingProgress) / 2) * 100);
    drawFutureCombatBar(ctx, 390, 610, 500, 10, percent / 100, FUTURE.cyan);
    ctx.fillStyle = FUTURE.cyan;
    ctx.font = `800 11px ${HUD_MONO}`;
    ctx.fillText(`SYNCING COMBAT ASSETS // ${percent}%`, 640, 590);
  } else {
    ctx.fillStyle = FUTURE.white;
    ctx.font = `900 12px ${HUD_MONO}`;
    ctx.fillText("COMBATANTS VERIFIED // 99 SECOND CLOCK // DEPLOYING", 640, 610);
  }
  ctx.restore();
};

export const drawReplaySelect = (ctx, game) => {
  drawFutureBackdrop(ctx);
  const replays = game.getReplayLibrary();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("LM-84 // COMBAT ARCHIVE", 34, 34);
  ctx.textAlign = "right";
  ctx.fillText(`${replays.length}/5 SLOTS OCCUPIED`, 1246, 34);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 42px ${HUD_FONT}`;
  ctx.fillText("REPLAY VAULT", 640, 82);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 11px ${HUD_MONO}`;
  ctx.fillText("UP-DOWN SELECT // A PLAY // X EXPORT // Y DELETE", 640, 112);

  if (!replays.length) {
    drawAngularPanel(ctx, 248, 212, 784, 246, "rgba(2,8,12,0.92)", FUTURE.muted, 1.5, 18);
    ctx.fillStyle = FUTURE.muted;
    ctx.font = `900 22px ${HUD_FONT}`;
    ctx.fillText("NO COMBAT DATA RECORDED", 640, 322);
    ctx.font = `800 11px ${HUD_MONO}`;
    ctx.fillText("COMPLETE A VERSUS OR ARCADE MATCH TO CREATE A REPLAY", 640, 358);
  } else {
    replays.forEach((replay, index) => {
      const selected = index === game.replaySlotIndex;
      const y = 142 + index * 74;
      const tone = selected ? FUTURE.cyan : "rgba(126,160,174,0.46)";
      drawAngularPanel(ctx, 188, y, 904, 58, selected ? "rgba(7,25,32,0.97)" : "rgba(2,8,12,0.9)", tone, selected ? 2.5 : 1, 10);
      const p1Name = FIGHTERS[replay.player1Id]?.name ?? replay.player1Id ?? "FIGHTER";
      const p2Name = FIGHTERS[replay.player2Id]?.name ?? replay.player2Id ?? "FIGHTER";
      const date = replay.savedAt ? new Date(replay.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase() : "LEGACY";
      ctx.textAlign = "left";
      ctx.fillStyle = selected ? FUTURE.white : "rgba(238,250,255,0.74)";
      ctx.font = `900 16px ${HUD_FONT}`;
      ctx.fillText(`${p1Name}  //  ${p2Name}`, 220, y + 25);
      ctx.fillStyle = tone;
      ctx.font = `800 9px ${HUD_MONO}`;
      ctx.fillText(`${date} // ${STAGES[replay.stageIndex ?? 0]?.name ?? "UNKNOWN ARENA"} // ${replay.frames.length} FRAMES`, 220, y + 45);
      ctx.textAlign = "right";
      ctx.fillStyle = replay.winnerId === replay.player1Id ? FUTURE.cyan : replay.winnerId === replay.player2Id ? FUTURE.red : FUTURE.muted;
      ctx.fillText(replay.winnerId ? `WINNER ${FIGHTERS[replay.winnerId]?.name ?? replay.winnerId}` : "RESULT UNKNOWN", 1060, y + 35);
    });
  }

  drawFutureButton(ctx, 246, 590, 182, 54, "ARCHIVE", "PLAY", FUTURE.cyan);
  drawFutureButton(ctx, 450, 590, 182, 54, "FILE", "EXPORT", FUTURE.amber);
  drawFutureButton(ctx, 654, 590, 182, 54, "REMOVE", "DELETE", FUTURE.red);
  drawFutureButton(ctx, 858, 590, 182, 54, "SYSTEM", "BACK", FUTURE.cyan);
  ctx.restore();
};

const drawSelectBadge = (ctx, x, y, label, tone = FUTURE.cyan) => {
  ctx.save();
  const width = label.length > 3 ? 88 : 58;
  drawAngularPanel(ctx, x - width / 2, y - 20, width, 30, "rgba(2, 7, 11, 0.98)", tone, 2, 7);
  ctx.fillStyle = tone;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 13px ${HUD_MONO}`;
  ctx.fillText(label, x, y - 5);
  ctx.restore();
};

export const drawPause = (ctx, game) => {
  ctx.save();
  ctx.fillStyle = "rgba(0, 3, 6, 0.78)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawAngularPanel(ctx, 344, 112, 592, 516, "rgba(2, 8, 12, 0.97)", FUTURE.cyan, 2, 22);
  ctx.fillStyle = FUTURE.red;
  ctx.fillRect(366, 132, 180, 3);
  ctx.fillStyle = FUTURE.cyan;
  ctx.fillRect(734, 132, 180, 3);
  ctx.textAlign = "center";
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 42px ${HUD_FONT}`;
  ctx.fillText("PAUSED", 640, 178);
  ctx.fillStyle = FUTURE.cyan;
  ctx.font = `800 13px ${HUD_MONO}`;
  ctx.fillText(`${GAME_MODES[game.gameMode]?.label ?? "VERSUS"} PROTOCOL`, 640, 218);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `800 14px ${HUD_FONT}`;
  ctx.fillText(game.training ? `DUMMY ${game.trainingDummyMode.toUpperCase()}` : (game.cpuEnabled ? `CPU ${game.cpuDifficulty.toUpperCase()} ${game.fighters[1]?.config.name ?? "FIGHTER"}` : "LOCAL TWO-PLAYER / GAMEPADS READY"), 640, 250);
  ctx.fillStyle = game.audio.muted ? FUTURE.red : FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.fillText(game.isReplay ? `REPLAY ${game.replaySpeed}X // FRAME ${game.replayIndex}/${game.replayPlayback.length}` : (game.audio.muted ? "AUDIO MUTED" : "AUDIO ACTIVE"), 640, 278);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(238, 250, 255, 0.82)";
  ctx.font = `800 12px ${HUD_MONO}`;
  const moves = [
    "P1 MOVE: A/D    JUMP: W    CROUCH: S",
    "STRIKES: J / U / K / I    SPECIAL: L    SUPER: O",
    "THROW: H    ASSISTS: N / M    DASH: SHIFT    TAUNT: Y",
    game.cpuEnabled ? "GAMEPAD 1 READY    CONTROLS OPENS KEY REMAPPING" : "P2: ARROWS + RIGHT-SIDE KEYS OR GAMEPAD 2",
    "P OR ESC RESUMES    LIGHT > HEAVY > SPECIAL > SUPER"
  ];
  moves.forEach((line, index) => ctx.fillText(line, 414, 326 + index * 27));
  const pauseLabels = ["RESUME", "CONTROLS", "RESTART", "TITLE"];
  const pauseLayouts = [[454, 484], [654, 484], [454, 540], [654, 540]];
  pauseLayouts.forEach(([x, y], index) => {
    const selected = index === game.pauseMenuIndex;
    drawAngularPanel(ctx, x, y, 172, 48, selected ? "rgba(7, 25, 32, 0.98)" : "rgba(2, 8, 12, 0.92)", selected ? FUTURE.cyan : "rgba(120, 144, 156, 0.6)", selected ? 2.5 : 1, 9);
    ctx.fillStyle = selected ? FUTURE.white : FUTURE.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 14px ${HUD_FONT}`;
    ctx.fillText(pauseLabels[index], x + 86, y + 24);
  });
  ctx.restore();
};

export const drawRoundMessage = (ctx, text, subtext = "") => {
  ctx.save();
  ctx.fillStyle = "rgba(1, 5, 9, 0.62)";
  ctx.fillRect(0, 244, CANVAS_WIDTH, 168);
  ctx.fillStyle = FUTURE.red;
  ctx.fillRect(0, 244, 340, 3);
  ctx.fillStyle = FUTURE.cyan;
  ctx.fillRect(940, 409, 340, 3);
  ctx.textAlign = "center";
  ctx.shadowColor = FUTURE.cyan;
  ctx.shadowBlur = 20;
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 70px ${HUD_FONT}`;
  ctx.fillText(text, 640, 324);
  ctx.shadowBlur = 0;
  if (subtext) {
    ctx.fillStyle = FUTURE.cyan;
    ctx.font = `800 16px ${HUD_MONO}`;
    ctx.fillText(subtext, 640, 370);
  }
  ctx.restore();
};

const ARCADE_ENDINGS = {
  KALYX: ["THE SHADOW BREAKS", "Kalyx leaves the Central grid free of its last hunter."],
  MASTER_EZRA: ["THE BLUE HOUR", "Ezra seals the breach and returns Detroit's sky to silence."],
  DETROIT_LENS_NOIR: ["MIDNIGHT DEVELOPED", "Detroit Lens Noir captures the truth and guards the city beyond the frame."],
  AMARA_VALENTINE: ["LOVE HOLDS THE LINE", "Amara turns the Heartline outward, binding the city together instead of breaking it."]
};

export const drawArcadeEnding = (ctx, game) => {
  const config = FIGHTERS[game.player1Id] ?? FIGHTERS.KALYX;
  const [headline, detail] = ARCADE_ENDINGS[game.player1Id] ?? ["DETROIT SECURED", "The combat grid is silent."];
  ctx.save();
  ctx.fillStyle = "rgba(1, 4, 8, 0.88)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawAngularPanel(ctx, 78, 82, 1124, 552, "rgba(3, 9, 14, 0.96)", config.palette, 2.5, 20);
  ctx.fillStyle = config.palette;
  ctx.fillRect(104, 112, 6, 470);
  drawRosterPortrait(ctx, { assets: game.assets, config }, 322, 574, 1.55);
  ctx.textAlign = "left";
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 12px ${HUD_MONO}`;
  ctx.fillText("ARCADE FINALE // CENTRAL TERMINUS SECURED", 500, 156);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `900 48px ${HUD_FONT}`;
  ctx.fillText(headline, 500, 238);
  ctx.fillStyle = config.palette;
  ctx.font = `900 22px ${HUD_FONT}`;
  ctx.fillText(config.name, 500, 286);
  ctx.fillStyle = FUTURE.white;
  ctx.font = `700 18px ${HUD_MONO}`;
  const words = detail.split(" ");
  let line = "";
  let y = 346;
  for (const word of words) {
    const next = `${line}${line ? " " : ""}${word}`;
    if (ctx.measureText(next).width > 620 && line) {
      ctx.fillText(line, 500, y);
      line = word;
      y += 32;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, 500, y);
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 11px ${HUD_MONO}`;
  ctx.fillText("PRESS ENTER OR A TO RETURN TO THE COMBAT NETWORK", 500, 552);
  ctx.restore();
};

const drawCharacterCard = (ctx, x, y, w, h, fighter, name, subtitle, selected, opponent, color, index) => {
  const tone = selected ? FUTURE.cyan : (opponent ? FUTURE.red : "rgba(126, 160, 174, 0.58)");
  drawAngularPanel(ctx, x, y, w, h, FUTURE.panel, tone, selected || opponent ? 2.5 : 1.25, 16);
  ctx.save();
  angularPath(ctx, x + 8, y + 8, w - 16, h - 100, 11);
  ctx.clip();
  const grade = ctx.createLinearGradient(x, y, x, y + h);
  grade.addColorStop(0, selected ? "#0b2029" : (opponent ? "#210b12" : "#081017"));
  grade.addColorStop(0.56, "#060b10");
  grade.addColorStop(1, "#020407");
  ctx.fillStyle = grade;
  ctx.fillRect(x + 8, y + 8, w - 16, h - 100);
  ctx.strokeStyle = "rgba(103, 232, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let gx = x + 24; gx < x + w - 12; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, y + 8);
    ctx.lineTo(gx, y + h - 92);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let sy = y + 12; sy < y + h - 94; sy += 6) ctx.fillRect(x + 8, sy, w - 16, 1);
  ctx.fillStyle = selected ? "rgba(103, 232, 255, 0.12)" : (opponent ? "rgba(255, 64, 93, 0.1)" : "rgba(255,255,255,0.035)");
  ctx.fillRect(x + 8, y + h - 110, w - 16, 18);
  if (fighter) drawRosterPortrait(ctx, fighter, x + w / 2, y + h - 92, 0.82);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 10, 0.98)";
  ctx.fillRect(x + 1, y + h - 94, w - 2, 93);
  ctx.fillStyle = tone;
  ctx.fillRect(x + 18, y + h - 83, 4, 62);
  ctx.textAlign = "left";
  ctx.fillStyle = FUTURE.muted;
  ctx.font = `800 10px ${HUD_MONO}`;
  ctx.fillText(`FTR-${String(index + 1).padStart(2, "0")} // ${selected ? "LINKED" : (opponent ? "HOSTILE" : "STANDBY")}`, x + 34, y + h - 70);
  ctx.fillStyle = FUTURE.white;
  let nameSize = 22;
  ctx.font = `900 ${nameSize}px ${HUD_FONT}`;
  while (nameSize > 15 && ctx.measureText(name).width > w - 54) {
    nameSize -= 1;
    ctx.font = `900 ${nameSize}px ${HUD_FONT}`;
  }
  ctx.fillText(name, x + 34, y + h - 43);
  ctx.fillStyle = color;
  ctx.font = `800 11px ${HUD_MONO}`;
  ctx.fillText(subtitle.toUpperCase(), x + 34, y + h - 22);
  ctx.fillStyle = tone;
  ctx.fillRect(x + w - 48, y + h - 34, 26, 3);
  ctx.restore();
};

const drawFighterPortrait = (ctx, fighter, x, y, scale) => {
  const anim = fighter.assets.animations[fighter.config.manifestKey]?.IDLE;
  if (anim) {
    const frame = Math.floor(performance.now() / 140) % anim.frames.length;
    drawSpriteFrame(ctx, anim, frame, x, y, {
      scale,
      flip: fighter.config.manifestKey === "MASTER_EZRA",
      alpha: 0.96,
      filter: fighter.config.renderFilter ?? "none"
    });
    return frame;
  }
  const portrait = fighter.assets.images[fighter.config.rosterPortraitKey];
  if (portrait?.naturalWidth > 0) {
    const width = portrait.naturalWidth * scale;
    const height = portrait.naturalHeight * scale;
    ctx.drawImage(portrait, x - width / 2, y - height, width, height);
  }
};

const drawRosterPortrait = (ctx, fighter, x, y, scale) => {
  const portrait = fighter.assets.images[fighter.config.rosterPortraitKey];
  if (portrait?.naturalWidth > 0) {
    const width = portrait.naturalWidth * scale;
    const height = portrait.naturalHeight * scale;
    ctx.drawImage(portrait, x - width / 2, y - height, width, height);
    return;
  }
  drawFighterPortrait(ctx, fighter, x, y, scale);
};

const drawCoverImage = (ctx, image, x = 0, y = 0, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) => {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
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
