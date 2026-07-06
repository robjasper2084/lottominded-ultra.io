import { STR } from "../strings.js?v=fullscreen-button-1";
import { createForgeReadout } from "./numberForge.js?v=number-forge-1";

const WORLD = { w: 1280, h: 720 };
const STEP = 1 / 60;
const DPR_CAP = 1.5;
const MAX_FRAME_STEPS = 5;
const MAX_LIGHTS = 8;
const PARTICLE_LIMIT = 240;
const RING_PARTICLE_LIMIT = 268;
const TAU = Math.PI * 2;
const PLAYER_MAX_SPEED = 318;
const PLAYER_ACCEL_RATE = 12.5;
const PLAYER_BRAKE_RATE = 7.4;
const PLAYER_TURN_RATE = 15.5;
const WELL_GRAVITY_RADIUS = 430;
const WELL_CAPTURE_RADIUS = 112;
const WELL_ACTIVATION_RADIUS = 124;
const WELL_EVENT_RADIUS = 38;
const WELL_CORE_RADIUS = 19;
const WELL_PLAYER_DANGER_RADIUS = 58;

const COLORS = {
  cyan: "#29f7ff",
  cyanSoft: "#29f7ff",
  lime: "#b8ff42",
  magenta: "#ff2daa",
  orange: "#ffdf75",
  flame: "#ff8a2a",
  ember: "#ff4a24",
  heatBlue: "#7df7ff",
  red: "#ff3c57",
  yellow: "#fff56a",
  white: "#f6fbff",
  violet: "#8e44ff",
  gold: "#d4af37",
  ink: "#05070d"
};

const PLAYER_COLORS = [COLORS.cyan, COLORS.magenta, COLORS.lime, COLORS.orange];
const PLAYER_SPAWNS = [
  { x: WORLD.w * 0.5, y: WORLD.h * 0.5, angle: -Math.PI / 2 },
  { x: WORLD.w * 0.44, y: WORLD.h * 0.55, angle: -Math.PI / 2 },
  { x: WORLD.w * 0.56, y: WORLD.h * 0.55, angle: -Math.PI / 2 },
  { x: WORLD.w * 0.5, y: WORLD.h * 0.43, angle: -Math.PI / 2 }
];
const PLAYER_KEYS = [
  {
    move: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS" },
    aim: { left: "KeyJ", right: "KeyL", up: "KeyI", down: "KeyK" },
    bomb: "Space"
  },
  {
    move: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" },
    aim: { left: "Numpad4", right: "Numpad6", up: "Numpad8", down: "Numpad5" },
    bomb: "Numpad0"
  }
];

const LEVELS = [
  { name: "Signal Wake", quota: 12, max: 7, interval: 1.0, wells: 0, pull: 0, mix: [["wanderer", 8], ["seeker", 2]] },
  { name: "Pink Static", quota: 18, max: 9, interval: 0.86, wells: 0, pull: 0, mix: [["wanderer", 5], ["seeker", 5]] },
  { name: "Gravity Bloom", quota: 22, max: 10, interval: 0.82, wells: 1, pull: 160, mix: [["wanderer", 5], ["seeker", 4], ["splitter", 1]] },
  { name: "Gold Break", quota: 28, max: 12, interval: 0.76, wells: 1, pull: 180, mix: [["wanderer", 4], ["seeker", 4], ["splitter", 3]] },
  { name: "Needle Lane", quota: 32, max: 14, interval: 0.7, wells: 1, pull: 190, mix: [["wanderer", 3], ["seeker", 4], ["splitter", 2], ["lancer", 2]] },
  { name: "Mayfly Crown", quota: 46, max: 20, interval: 0.66, wells: 2, pull: 205, mix: [["wanderer", 3], ["seeker", 4], ["splitter", 2], ["mayfly", 5]] },
  { name: "Red Geometry", quota: 52, max: 22, interval: 0.58, wells: 2, pull: 220, mix: [["seeker", 5], ["splitter", 3], ["lancer", 3], ["mayfly", 4]] },
  { name: "Crush Field", quota: 60, max: 25, interval: 0.52, wells: 3, pull: 240, mix: [["wanderer", 2], ["seeker", 5], ["splitter", 3], ["lancer", 4], ["mayfly", 5]] },
  { name: "Blue Collapse", quota: 70, max: 28, interval: 0.46, wells: 3, pull: 260, mix: [["seeker", 6], ["splitter", 3], ["lancer", 4], ["mayfly", 7]] },
  { name: "Ninefold Static", quota: 84, max: 32, interval: 0.4, wells: 4, pull: 285, mix: [["wanderer", 2], ["seeker", 6], ["splitter", 4], ["lancer", 5], ["mayfly", 8]] },
  { name: "White Ring", quota: 96, max: 34, interval: 0.36, wells: 4, pull: 310, mix: [["seeker", 7], ["splitter", 5], ["lancer", 6], ["mayfly", 9]] },
  { name: "Last Well", quota: 112, max: 38, interval: 0.32, wells: 5, pull: 340, mix: [["wanderer", 2], ["seeker", 7], ["splitter", 5], ["lancer", 7], ["mayfly", 10]] }
];

const ENEMY = {
  wanderer: { r: 15, hp: 1, speed: 108, score: 110, color: COLORS.lime },
  seeker: { r: 17, hp: 1, speed: 148, score: 160, color: COLORS.magenta },
  splitter: { r: 20, hp: 2, speed: 92, score: 260, color: COLORS.orange },
  lancer: { r: 18, hp: 2, speed: 90, score: 330, color: COLORS.red },
  mayfly: { r: 8, hp: 1, speed: 228, score: 80, color: COLORS.yellow }
};

const ASSETS = {
  marquee: "../assets/2084/branding/marquee-gameplay-keyart.png",
  icon: "../assets/2084/branding/app-icon.png",
  atlas: "../assets/2084/sprites/sprite-atlas.png",
  parallaxFar: "../assets/2084/parallax/far.webp",
  parallaxMid: "../assets/2084/parallax/mid.webp",
  parallaxNear: "../assets/2084/parallax/near.webp",
  glow: "../assets/2084/vfx/glow-disc.png",
  lightRay: "../assets/2084/vfx/light-ray.png",
  forgeCore: "../assets/2084/number-forge/forge-core-atlas.png",
  spriteBase: "../assets/2084/sprites/"
};

const ATLAS = {
  "bomb-pulse": { x: 0, y: 0, w: 512, h: 512 },
  "enemy-grunt": { x: 512, y: 0, w: 512, h: 512 },
  "enemy-spinner": { x: 1024, y: 0, w: 512, h: 512 },
  "enemy-wanderer": { x: 1536, y: 0, w: 512, h: 512 },
  "gravity-well": { x: 0, y: 512, w: 512, h: 512 },
  missile: { x: 512, y: 512, w: 512, h: 512 },
  player: { x: 1024, y: 512, w: 512, h: 512 }
};

const SPRITE_FOR_ENEMY = {
  wanderer: "enemy-wanderer",
  seeker: "enemy-grunt",
  splitter: "enemy-spinner",
  lancer: "enemy-grunt",
  mayfly: "enemy-spinner"
};
const SPRITE_PAIR_NAMES = ["bomb-pulse", "enemy-grunt", "enemy-spinner", "enemy-wanderer", "gravity-well", "missile", "player"];

const PLAYER_VARIANTS = [
  { name: "arrow", sx: 1.05, sy: 0.92, wing: 1, glyph: "dot" },
  { name: "scythe", sx: 0.95, sy: 1.08, wing: 2, glyph: "dash" },
  { name: "kite", sx: 1.12, sy: 1.02, wing: 3, glyph: "tri" },
  { name: "comet", sx: 0.88, sy: 1.18, wing: 4, glyph: "ring" }
];

const GL_IMAGES = {
  atlas: loadImage(ASSETS.atlas),
  parallaxFar: null,
  parallaxMid: null,
  parallaxNear: null,
  glow: null,
  lightRay: null,
  forgeCore: null,
  sprites: {}
};
const GAMEPLAY_IMAGE_PATHS = {
  parallaxFar: ASSETS.parallaxFar,
  parallaxMid: ASSETS.parallaxMid,
  parallaxNear: ASSETS.parallaxNear,
  glow: ASSETS.glow,
  lightRay: ASSETS.lightRay,
  forgeCore: ASSETS.forgeCore
};
let gameplayImagesQueued = false;
let spritePairsQueued = false;
let visualPrewarmScheduled = false;

const COLOR_VEC_CACHE = new Map();
const AUDIO_BASE_PATH = "../assets/audio/";
const AUDIO_WAV_BASE_PATH = `${AUDIO_BASE_PATH}wav/`;
const HUD_UPDATE_INTERVAL = 100;
const LOW_POWER_MEDIA = window.matchMedia("(pointer: coarse), (max-width: 820px)");

function audioAssetPaths(file) {
  const fileName = String(file || "");
  const basePath = `${AUDIO_BASE_PATH}${fileName}`;
  if (!fileName.toLowerCase().endsWith(".wav")) return [basePath];
  return [basePath, `${AUDIO_WAV_BASE_PATH}${fileName}`];
}

function runWhenIdle(callback, timeout = 800) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }
  window.setTimeout(callback, timeout);
}

const AUDIO = {
  startupMusic: { file: "startup-untitled-7.mp3", volume: 0.42, loop: true },
  gameMusic: { file: "digital-static-cover.mp3", volume: 0.34, loop: true },
  ambient: { file: "backgroundnoiseloop.wav", volume: 0.14, loop: true },
  wellHum: { file: "gravitywellhumloop.wav", volume: 0.12, loop: true },
  bomb: { file: "bomb.wav", volume: 0.58 },
  hit1: { file: "enemyhit.wav", volume: 0.28 },
  hit2: { file: "enemyhit.wav", volume: 0.28 },
  spawn1: { file: "enemyspawn1.wav", volume: 0.22 },
  spawn2: { file: "enemyspawn2.wav", volume: 0.22 },
  spawn3: { file: "enemyspawn3.wav", volume: 0.22 },
  spawn4: { file: "enemyspawn4.wav", volume: 0.22 },
  spawn5: { file: "enemyspawn5.wav", volume: 0.22 },
  spawn6: { file: "enemyspawn6.wav", volume: 0.22 },
  extraBomb: { file: "extrabomb.wav", volume: 0.35 },
  extraLife: { file: "extralife.wav", volume: 0.36 },
  gameOver: { file: "gameover.wav", volume: 0.4 },
  wellAlert: { file: "gravitywellalert.wav", volume: 0.3 },
  wellDestroyed: { file: "gravitywelldestroyed.wav", volume: 0.42 },
  wellExplode: { file: "gravitywellexplode.wav", volume: 0.45 },
  wellHit: { file: "gravitywellhit.wav", volume: 0.28 },
  level: { file: "levelchange.wav", volume: 0.42 },
  mayflies: { file: "mayflies.wav", volume: 0.22 },
  wall: { file: "missilehitwall.wav", volume: 0.18 },
  multiplier: { file: "multiplieradvance.wav", volume: 0.28 },
  menuSelect: { file: "menuselect.wav", volume: 0.24 },
  playerDead: { file: "playerdead.wav", volume: 0.38 },
  playerFire1: { file: "playerfire1.wav", volume: 0.18 },
  playerFire2: { file: "playerfire2.wav", volume: 0.18 },
  playerFire3: { file: "playerfire3.wav", volume: 0.18 },
  playerHit: { file: "playerhit.wav", volume: 0.32 },
  playerSpawn: { file: "playerspawn.wav", volume: 0.26 },
  playerThrust: { file: "playerthrust.wav", volume: 0.16, loop: true },
  repulsor: { file: "repulsor.wav", volume: 0.28 },
  shieldsDown: { file: "sheildsdown.wav", volume: 0.3 }
};
const RUN_AUDIO_PRELOAD = [
  "gameMusic",
  "ambient",
  "playerThrust",
  "level",
  "spawn1",
  "spawn2",
  "spawn3",
  "spawn4",
  "spawn5",
  "spawn6",
  "hit1",
  "hit2",
  "playerFire1",
  "playerFire2",
  "playerFire3",
  "bomb",
  "playerHit",
  "playerSpawn",
  "wall",
  "repulsor",
  "multiplier",
  "wellAlert",
  "wellHum"
];

const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const MUTE_STORAGE_KEY = "2084-static-wav-muted-v2";
const LEGACY_MUTE_STORAGE_KEYS = ["2084-static-wav-muted", "2084-static-wars-muted"];

class StaticWarsRenderer {
  constructor(targetCanvas) {
    this.canvas = targetCanvas;
    this.gl = targetCanvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: true
    }) || targetCanvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: true
    });
    if (!this.gl) throw new Error("WebGL/OpenGL renderer unavailable");

    this.contextLost = false;
    targetCanvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.contextLost = true;
    });
    targetCanvas.addEventListener("webglcontextrestored", () => {
      location.reload();
    });

    this.isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && this.gl instanceof WebGL2RenderingContext;
    this.view = { cssW: 1, cssH: 1, dpr: 1, x: 0, y: 0, w: 1, h: 1, scale: 1, camX: 0, camY: 0 };
    this.shakeX = 0;
    this.shakeY = 0;
    this.solidData = [];
    this.textureData = [];
    this.litData = [];
    this.textures = new Map();
    this.currentTexture = null;
    this.currentLit = null;
    this.lights = [];
    this.blendMode = "";
    this.solidProgram = this.createProgram(SOLID_VERTEX_SHADER, SOLID_FRAGMENT_SHADER);
    this.textureProgram = this.createProgram(TEXTURE_VERTEX_SHADER, TEXTURE_FRAGMENT_SHADER);
    this.litProgram = this.createProgram(LIT_VERTEX_SHADER, LIT_FRAGMENT_SHADER);
    this.solidBuffer = this.gl.createBuffer();
    this.textureBuffer = this.gl.createBuffer();
    this.litBuffer = this.gl.createBuffer();
    this.initProgramLayout();
  }

  initProgramLayout() {
    const gl = this.gl;
    this.solidLayout = {
      position: gl.getAttribLocation(this.solidProgram, "a_position"),
      color: gl.getAttribLocation(this.solidProgram, "a_color")
    };
    this.textureLayout = {
      position: gl.getAttribLocation(this.textureProgram, "a_position"),
      uv: gl.getAttribLocation(this.textureProgram, "a_uv"),
      color: gl.getAttribLocation(this.textureProgram, "a_color"),
      sampler: gl.getUniformLocation(this.textureProgram, "u_sampler")
    };
    this.litLayout = {
      position: gl.getAttribLocation(this.litProgram, "a_position"),
      world: gl.getAttribLocation(this.litProgram, "a_world"),
      uv: gl.getAttribLocation(this.litProgram, "a_uv"),
      color: gl.getAttribLocation(this.litProgram, "a_color"),
      diffuse: gl.getUniformLocation(this.litProgram, "u_diffuse"),
      normal: gl.getUniformLocation(this.litProgram, "u_normal"),
      lightCount: gl.getUniformLocation(this.litProgram, "u_lightCount"),
      lights: gl.getUniformLocation(this.litProgram, "u_lights"),
      lightColors: gl.getUniformLocation(this.litProgram, "u_lightColors"),
      ambient: gl.getUniformLocation(this.litProgram, "u_ambient"),
      normalStrength: gl.getUniformLocation(this.litProgram, "u_normalStrength")
    };
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    this.setBlend("normal");
  }

  isContextLost() {
    return this.contextLost || Boolean(this.gl.isContextLost?.());
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const vertex = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Could not link WebGL program");
    }
    return program;
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Could not compile WebGL shader");
    }
    return shader;
  }

  resize() {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  beginFrame(nextView, shakeX, shakeY) {
    if (this.isContextLost()) return false;
    this.view = { ...nextView };
    this.shakeX = shakeX;
    this.shakeY = shakeY;
    this.solidData.length = 0;
    this.textureData.length = 0;
    this.litData.length = 0;
    this.currentTexture = null;
    this.currentLit = null;
    const gl = this.gl;
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0.015, 0.022, 0.045, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return true;
  }

  setLights(lights) {
    this.lights = lights.slice(0, MAX_LIGHTS);
  }

  setWorldClip(enabled) {
    this.flush();
    const gl = this.gl;
    if (!enabled) {
      gl.disable(gl.SCISSOR_TEST);
      return;
    }
    const x = Math.max(0, Math.floor(this.view.x * this.view.dpr));
    const y = Math.max(0, Math.floor((this.view.cssH - this.view.y - this.view.h) * this.view.dpr));
    const w = Math.max(1, Math.floor(this.view.w * this.view.dpr));
    const h = Math.max(1, Math.floor(this.view.h * this.view.dpr));
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
  }

  setBlend(mode) {
    if (mode === this.blendMode) return;
    this.flush();
    this.blendMode = mode;
    const gl = this.gl;
    if (mode === "add") gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  screenToClip(x, y) {
    return [
      (x / this.view.cssW) * 2 - 1,
      1 - (y / this.view.cssH) * 2
    ];
  }

  worldToScreen(x, y) {
    return {
      x: this.view.x + this.shakeX + (x - this.view.camX) * this.view.scale,
      y: this.view.y + this.shakeY + (y - this.view.camY) * this.view.scale
    };
  }

  worldToClip(x, y) {
    const screen = this.worldToScreen(x, y);
    return this.screenToClip(screen.x, screen.y);
  }

  pushSolidClip(x, y, color) {
    if (this.textureData.length) this.flushTexture();
    if (this.litData.length) this.flushLit();
    this.solidData.push(x, y, color[0], color[1], color[2], color[3]);
  }

  drawScreenRect(x, y, w, h, color, alpha = 1) {
    const c = colorVec(color, alpha);
    const p0 = this.screenToClip(x, y);
    const p1 = this.screenToClip(x + w, y);
    const p2 = this.screenToClip(x + w, y + h);
    const p3 = this.screenToClip(x, y + h);
    this.pushSolidClip(p0[0], p0[1], c);
    this.pushSolidClip(p1[0], p1[1], c);
    this.pushSolidClip(p2[0], p2[1], c);
    this.pushSolidClip(p0[0], p0[1], c);
    this.pushSolidClip(p2[0], p2[1], c);
    this.pushSolidClip(p3[0], p3[1], c);
  }

  drawScreenLine(x1, y1, x2, y2, width, color, alpha = 1) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;
    const nx = (-dy / len) * width * 0.5;
    const ny = (dx / len) * width * 0.5;
    const c = colorVec(color, alpha);
    const p0 = this.screenToClip(x1 + nx, y1 + ny);
    const p1 = this.screenToClip(x2 + nx, y2 + ny);
    const p2 = this.screenToClip(x2 - nx, y2 - ny);
    const p3 = this.screenToClip(x1 - nx, y1 - ny);
    this.pushSolidClip(p0[0], p0[1], c);
    this.pushSolidClip(p1[0], p1[1], c);
    this.pushSolidClip(p2[0], p2[1], c);
    this.pushSolidClip(p0[0], p0[1], c);
    this.pushSolidClip(p2[0], p2[1], c);
    this.pushSolidClip(p3[0], p3[1], c);
  }

  drawWorldRect(x, y, w, h, color, alpha = 1) {
    this.drawWorldPolygon([
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h }
    ], color, alpha);
  }

  drawWorldPolygon(points, color, alpha = 1) {
    if (points.length < 3) return;
    const c = colorVec(color, alpha);
    const first = this.worldToClip(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i += 1) {
      const b = this.worldToClip(points[i].x, points[i].y);
      const d = this.worldToClip(points[i + 1].x, points[i + 1].y);
      this.pushSolidClip(first[0], first[1], c);
      this.pushSolidClip(b[0], b[1], c);
      this.pushSolidClip(d[0], d[1], c);
    }
  }

  drawWorldLine(x1, y1, x2, y2, width, color, alpha = 1) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;
    const nx = (-dy / len) * width * 0.5;
    const ny = (dx / len) * width * 0.5;
    this.drawWorldPolygon([
      { x: x1 + nx, y: y1 + ny },
      { x: x2 + nx, y: y2 + ny },
      { x: x2 - nx, y: y2 - ny },
      { x: x1 - nx, y: y1 - ny }
    ], color, alpha);
  }

  drawWorldCircle(x, y, radius, color, alpha = 1, segments = 32) {
    const points = [];
    for (let i = 0; i < segments; i += 1) {
      const a = (i / segments) * TAU;
      points.push({ x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius });
    }
    this.drawWorldPolygon(points, color, alpha);
  }

  drawWorldRing(x, y, radius, width, color, alpha = 1, segments = 64) {
    let prev = { x: x + radius, y };
    for (let i = 1; i <= segments; i += 1) {
      const a = (i / segments) * TAU;
      const next = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
      this.drawWorldLine(prev.x, prev.y, next.x, next.y, width, color, alpha);
      prev = next;
    }
  }

  drawWorldArc(x, y, radius, start, end, width, color, alpha = 1, segments = 36) {
    let prev = { x: x + Math.cos(start) * radius, y: y + Math.sin(start) * radius };
    for (let i = 1; i <= segments; i += 1) {
      const t = i / segments;
      const a = start + (end - start) * t;
      const next = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
      this.drawWorldLine(prev.x, prev.y, next.x, next.y, width, color, alpha);
      prev = next;
    }
  }

  drawScreenImage(image, x, y, w, h, alpha = 1, options = {}) {
    if (!imageReady(image)) return false;
    this.pushTextureQuad(image, [
      this.screenToClip(x, y),
      this.screenToClip(x + w, y),
      this.screenToClip(x + w, y + h),
      this.screenToClip(x, y + h)
    ], options.u0 ?? 0, options.v0 ?? 0, options.u1 ?? 1, options.v1 ?? 1, colorVec(options.color ?? COLORS.white, alpha), options.repeat === true);
    return true;
  }

  drawWorldImage(image, x, y, w, h, angle = 0, alpha = 1, options = {}) {
    if (!imageReady(image)) return false;
    const hw = w * 0.5;
    const hh = h * 0.5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ].map((p) => this.worldToClip(x + p.x * cos - p.y * sin, y + p.x * sin + p.y * cos));
    this.pushTextureQuad(image, corners, options.u0 ?? 0, options.v0 ?? 0, options.u1 ?? 1, options.v1 ?? 1, colorVec(options.color ?? COLORS.white, alpha), options.repeat === true);
    return true;
  }

  drawLitWorldImage(pair, x, y, w, h, angle = 0, alpha = 1, options = {}) {
    if (!pair || !imageReady(pair.diffuse) || !imageReady(pair.normal)) return false;
    const hw = w * 0.5;
    const hh = h * 0.5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const local = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];
    const corners = local.map((p) => {
      const wx = x + p.x * cos - p.y * sin;
      const wy = y + p.x * sin + p.y * cos;
      return { clip: this.worldToClip(wx, wy), world: [wx, wy] };
    });
    this.pushLitQuad(pair, corners, colorVec(options.color ?? COLORS.white, alpha), options.normalStrength ?? 0.85);
    return true;
  }

  drawAtlas(name, x, y, w, h, angle = 0, color = COLORS.white, alpha = 1) {
    const frame = ATLAS[name];
    if (!frame || !imageReady(GL_IMAGES.atlas)) return false;
    const iw = GL_IMAGES.atlas.naturalWidth || GL_IMAGES.atlas.width;
    const ih = GL_IMAGES.atlas.naturalHeight || GL_IMAGES.atlas.height;
    return this.drawWorldImage(GL_IMAGES.atlas, x, y, w, h, angle, alpha, {
      color,
      u0: frame.x / iw,
      v0: frame.y / ih,
      u1: (frame.x + frame.w) / iw,
      v1: (frame.y + frame.h) / ih
    });
  }

  pushTextureQuad(image, corners, u0, v0, u1, v1, color, repeat) {
    if (this.solidData.length) this.flushSolid();
    if (this.litData.length) this.flushLit();
    const texture = this.textureFor(image, repeat);
    if (this.currentTexture !== texture) {
      this.flushTexture();
      this.currentTexture = texture;
    }
    const verts = [
      [corners[0], u0, v0],
      [corners[1], u1, v0],
      [corners[2], u1, v1],
      [corners[0], u0, v0],
      [corners[2], u1, v1],
      [corners[3], u0, v1]
    ];
    for (const [pos, u, v] of verts) {
      this.textureData.push(pos[0], pos[1], u, v, color[0], color[1], color[2], color[3]);
    }
  }

  pushLitQuad(pair, corners, color, normalStrength) {
    if (this.solidData.length) this.flushSolid();
    if (this.textureData.length) this.flushTexture();
    const lit = {
      diffuse: this.textureFor(pair.diffuse, false),
      normal: this.textureFor(pair.normal, false),
      normalStrength
    };
    const key = `${pair.diffuse.src}|${pair.normal.src}|${normalStrength}`;
    if (!this.currentLit || this.currentLit.key !== key) {
      this.flushLit();
      this.currentLit = { ...lit, key };
    }
    const verts = [
      [corners[0], 0, 0],
      [corners[1], 1, 0],
      [corners[2], 1, 1],
      [corners[0], 0, 0],
      [corners[2], 1, 1],
      [corners[3], 0, 1]
    ];
    for (const [corner, u, v] of verts) {
      this.litData.push(corner.clip[0], corner.clip[1], corner.world[0], corner.world[1], u, v, color[0], color[1], color[2], color[3]);
    }
  }

  textureFor(image, repeat) {
    const gl = this.gl;
    const key = `${image.src}|${repeat ? "repeat" : "clamp"}`;
    if (this.textures.has(key)) return this.textures.get(key);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const canRepeat = repeat && (this.isWebGL2 || (isPowerOfTwo(image.naturalWidth) && isPowerOfTwo(image.naturalHeight)));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, canRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, canRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    this.textures.set(key, texture);
    return texture;
  }

  flush() {
    if (this.isContextLost()) {
      this.solidData.length = 0;
      this.textureData.length = 0;
      this.litData.length = 0;
      return;
    }
    this.flushSolid();
    this.flushTexture();
    this.flushLit();
  }

  flushSolid() {
    if (!this.solidData.length || this.isContextLost()) return;
    const gl = this.gl;
    gl.useProgram(this.solidProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.solidBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.solidData), gl.DYNAMIC_DRAW);
    const stride = 6 * 4;
    gl.enableVertexAttribArray(this.solidLayout.position);
    gl.vertexAttribPointer(this.solidLayout.position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.solidLayout.color);
    gl.vertexAttribPointer(this.solidLayout.color, 4, gl.FLOAT, false, stride, 2 * 4);
    gl.drawArrays(gl.TRIANGLES, 0, this.solidData.length / 6);
    this.solidData.length = 0;
  }

  flushTexture() {
    if (!this.textureData.length || !this.currentTexture || this.isContextLost()) return;
    const gl = this.gl;
    gl.useProgram(this.textureProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
    gl.uniform1i(this.textureLayout.sampler, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureData), gl.DYNAMIC_DRAW);
    const stride = 8 * 4;
    gl.enableVertexAttribArray(this.textureLayout.position);
    gl.vertexAttribPointer(this.textureLayout.position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.textureLayout.uv);
    gl.vertexAttribPointer(this.textureLayout.uv, 2, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(this.textureLayout.color);
    gl.vertexAttribPointer(this.textureLayout.color, 4, gl.FLOAT, false, stride, 4 * 4);
    gl.drawArrays(gl.TRIANGLES, 0, this.textureData.length / 8);
    this.textureData.length = 0;
  }

  flushLit() {
    if (!this.litData.length || !this.currentLit || this.isContextLost()) return;
    const gl = this.gl;
    gl.useProgram(this.litProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentLit.diffuse);
    gl.uniform1i(this.litLayout.diffuse, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.currentLit.normal);
    gl.uniform1i(this.litLayout.normal, 1);
    if (this.litLayout.lightCount !== null) gl.uniform1i(this.litLayout.lightCount, this.lights.length);
    gl.uniform1f(this.litLayout.ambient, 0.48);
    gl.uniform1f(this.litLayout.normalStrength, this.currentLit.normalStrength);

    const packedLights = new Float32Array(MAX_LIGHTS * 4);
    const packedColors = new Float32Array(MAX_LIGHTS * 3);
    for (let i = 0; i < MAX_LIGHTS; i += 1) {
      const light = this.lights[i];
      if (!light) continue;
      packedLights[i * 4] = light.x;
      packedLights[i * 4 + 1] = light.y;
      packedLights[i * 4 + 2] = light.radius;
      packedLights[i * 4 + 3] = light.intensity;
      const color = colorVec(light.color ?? COLORS.white, 1);
      packedColors[i * 3] = color[0];
      packedColors[i * 3 + 1] = color[1];
      packedColors[i * 3 + 2] = color[2];
    }
    gl.uniform4fv(this.litLayout.lights, packedLights);
    gl.uniform3fv(this.litLayout.lightColors, packedColors);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.litBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.litData), gl.DYNAMIC_DRAW);
    const stride = 10 * 4;
    gl.enableVertexAttribArray(this.litLayout.position);
    gl.vertexAttribPointer(this.litLayout.position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.litLayout.world);
    gl.vertexAttribPointer(this.litLayout.world, 2, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(this.litLayout.uv);
    gl.vertexAttribPointer(this.litLayout.uv, 2, gl.FLOAT, false, stride, 4 * 4);
    gl.enableVertexAttribArray(this.litLayout.color);
    gl.vertexAttribPointer(this.litLayout.color, 4, gl.FLOAT, false, stride, 6 * 4);
    gl.drawArrays(gl.TRIANGLES, 0, this.litData.length / 10);
    this.litData.length = 0;
  }
}

const SOLID_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec4 a_color;
varying vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_color = a_color;
}`;

const SOLID_FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;
void main() {
  gl_FragColor = v_color;
}`;

const TEXTURE_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_uv;
attribute vec4 a_color;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_uv;
  v_color = a_color;
}`;

const TEXTURE_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_sampler;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  vec4 tex = texture2D(u_sampler, v_uv);
  gl_FragColor = tex * v_color;
}`;

const LIT_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_world;
attribute vec2 a_uv;
attribute vec4 a_color;
varying vec2 v_world;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_world = a_world;
  v_uv = a_uv;
  v_color = a_color;
}`;

const LIT_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_diffuse;
uniform sampler2D u_normal;
uniform vec4 u_lights[8];
uniform vec3 u_lightColors[8];
uniform float u_ambient;
uniform float u_normalStrength;
varying vec2 v_world;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  vec4 base = texture2D(u_diffuse, v_uv) * v_color;
  if (base.a < 0.01) discard;

  vec3 normal = texture2D(u_normal, v_uv).xyz * 2.0 - 1.0;
  normal.xy *= u_normalStrength;
  normal = normalize(normal);

  vec3 light = vec3(u_ambient);
  for (int i = 0; i < 8; i++) {
    vec4 l = u_lights[i];
    float radius = max(l.z, 1.0);
    vec2 delta = l.xy - v_world;
    float dist = length(delta);
    float fade = clamp(1.0 - dist / radius, 0.0, 1.0);
    fade = fade * fade * (3.0 - 2.0 * fade);
    vec3 dir = normalize(vec3(delta / radius * 1.35, 0.72));
    float lambert = max(dot(normal, dir), 0.0);
    float bevel = pow(max(1.0 - normal.z, 0.0), 2.0) * 0.18;
    light += u_lightColors[i] * (0.12 + lambert * 1.35 + bevel) * fade * l.w;
  }

  vec3 emissive = base.rgb * 0.44;
  gl_FragColor = vec4(base.rgb * light + emissive, base.a);
}`;

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const renderer = new StaticWarsRenderer(canvas);
const hud = {
  score: $("scoreValue"),
  level: $("levelValue"),
  objective: $("objectiveValue"),
  lives: $("livesValue"),
  bombs: $("bombsValue"),
  multiplier: $("multiplierValue"),
  status: $("statusText"),
  best: $("bestText")
};
const shell = $("shell");
const overlay = $("overlay");
const overlayTitle = $("overlayTitle");
const overlayCopy = $("overlayCopy");
const overlayStats = $("overlayStats");
const bannerText = $("bannerText");
const fxLayer = $("fxLayer");
const forgeUi = {
  startup: {
    label: $("startupForgeLabel"),
    line: $("startupForgeLine"),
    note: $("startupForgeNote"),
    panel: $("startupForge")
  },
  hud: {
    label: $("forgeHudLabel"),
    line: $("forgeHudLine"),
    note: $("forgeHudNote"),
    panel: $("forgeHud")
  }
};
const forgeHudClose = $("forgeHudClose");
const forgeToggleAction = $("forgeToggleAction");
const playerChooser = $("playerChooser");
const primaryAction = $("primaryAction");
const homeAction = $("homeAction");
const soundAction = $("soundAction");
const pauseAction = $("pauseAction");
const bombAction = $("bombAction");
const controlsHint = $("controlsHint");
const touchMarks = $("touchMarks");
const touchMoveZone = touchMarks?.querySelector(".left-zone");
const touchAimZone = touchMarks?.querySelector(".right-zone");
const devEl = $("dev");
let selectedPlayerCount = loadPlayerCount();
let forgeHudDismissed = false;

document.title = STR.title;
for (const node of document.querySelectorAll("[data-label]")) {
  const key = node.getAttribute("data-label");
  node.textContent = STR[key] ?? "";
}
pauseAction.textContent = "II";
pauseAction.setAttribute("aria-label", STR.pauseButton);
pauseAction.setAttribute("title", `${STR.pauseButton} (P or Esc)`);
bombAction.setAttribute("aria-label", STR.bombButton);
bombAction.setAttribute("title", `${STR.bombButton} (Space)`);
forgeHudClose.textContent = "X";
forgeHudClose.setAttribute("aria-label", STR.forgeClose);
forgeHudClose.setAttribute("title", STR.forgeClose);
forgeToggleAction.textContent = STR.forgeToggle;
forgeToggleAction.setAttribute("aria-label", STR.forgeShow);
forgeToggleAction.setAttribute("title", STR.forgeShow);
controlsHint.textContent = STR.controlsHint;
buildPlayerChooser();

class Rng {
  constructor(seed) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  range(min, max) {
    return min + (max - min) * this.next();
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  chance(value) {
    return this.next() < value;
  }

  pickWeighted(items) {
    let total = 0;
    for (const item of items) total += item[1];
    let roll = this.range(0, total);
    for (const item of items) {
      roll -= item[1];
      if (roll <= 0) return item[0];
    }
    return items[items.length - 1][0];
  }
}

function createForgeState(playerCount = selectedPlayerCount, note = STR.forgeStartupNote, salt = 0) {
  const readout = createForgeReadout({ players: playerCount, salt });
  return {
    label: STR.forgeTitle,
    line: readout.text,
    note,
    pulse: 0,
    worldPulses: []
  };
}

function refreshForge(note = STR.forgeRunNote, salt = 0, pulse = true) {
  if (!state?.forge) return;
  const readout = createForgeReadout({
    score: state.score,
    levelIndex: state.levelIndex,
    killed: state.killed,
    multiplier: state.team.multiplier,
    players: state.playerCount,
    salt
  });
  state.forge.label = STR.forgeTitle;
  state.forge.line = readout.text;
  state.forge.note = note;
  if (pulse) state.forge.pulse = 0.62;
}

function pushForgePulse(x, y, color, note, salt = 0) {
  if (!state?.forge) return;
  refreshForge(note, salt, true);
  state.forge.worldPulses.push({
    x,
    y,
    color,
    age: 0,
    life: 0.9,
    maxLife: 0.9,
    seed: salt
  });
  if (state.forge.worldPulses.length > 8) state.forge.worldPulses.shift();
}

function updateForge(dt) {
  if (!state?.forge) return;
  state.forge.pulse = Math.max(0, state.forge.pulse - dt);
  for (const pulse of state.forge.worldPulses) {
    pulse.age += dt;
    pulse.life -= dt;
    if (pulse.life <= 0) pulse.dead = true;
  }
  compact(state.forge.worldPulses);
}

function updateForgePanels() {
  if (!state?.forge) return;
  const hot = state.forge.pulse > 0;
  for (const panel of [forgeUi.startup, forgeUi.hud]) {
    panel.label.textContent = state.forge.label;
    if (panel.renderedLine !== state.forge.line) {
      renderForgeRows(panel.line, state.forge.line);
      panel.renderedLine = state.forge.line;
    }
    panel.note.textContent = state.forge.note;
    panel.panel.classList.toggle("is-hot", hot);
  }
  const forgeAllowed = state.status === "running" || state.status === "paused";
  const hudVisible = forgeAllowed && !forgeHudDismissed;
  forgeUi.hud.panel.hidden = !hudVisible;
  setControlAvailability(forgeHudClose, hudVisible);
  const toggleVisible = forgeAllowed && forgeHudDismissed;
  setControlAvailability(forgeToggleAction, toggleVisible, { hide: true });
  setRegionAvailability(forgeUi.startup.panel, false, { hide: true });
}

function renderForgeRows(node, text) {
  const rows = text.split("\n").map((line) => {
    const row = document.createElement("span");
    row.className = "forge-row";
    const separator = line.indexOf(":");
    if (separator === -1) {
      const value = document.createElement("em");
      value.textContent = line;
      row.append(value);
      return row;
    }

    const label = document.createElement("b");
    label.textContent = line.slice(0, separator);
    const value = document.createElement("em");
    value.textContent = line.slice(separator + 1).trim();
    row.append(label, value);
    return row;
  });
  node.replaceChildren(...rows);
}

function setControlAvailability(control, active, options = {}) {
  if (!control) return;
  if (options.hide) control.hidden = !active;
  control.disabled = !active;
  control.tabIndex = active ? 0 : -1;
  control.setAttribute("aria-hidden", String(!active));
}

function setRegionAvailability(region, active, options = {}) {
  if (!region) return;
  if (options.hide) region.hidden = !active;
  region.inert = !active;
  region.setAttribute("aria-hidden", String(!active));
}

function setElementAvailability(element, active, options = {}) {
  if (!element) return;
  if (options.hide) element.hidden = !active;
  element.setAttribute("aria-hidden", String(!active));
}

const bus = {
  muted: loadMuted(),
  unlocked: false,
  context: null,
  masterGain: null,
  limiter: null,
  categoryGains: new Map(),
  nodes: new Map(),
  loops: new Map(),
  lastPlay: new Map(),
  backgroundLoadScheduled: false,

  init() {
    for (const [id, data] of Object.entries(AUDIO)) {
      const urls = audioAssetPaths(data.file).map((file) => new URL(file, import.meta.url).href);
      this.nodes.set(id, { data, url: urls[0], urls, buffer: null, loading: null, error: null });
    }
    window.__staticWavAudio = this;
  },

  ensureContext() {
    if (!AudioContextCtor) return null;
    if (!this.context) this.context = new AudioContextCtor();
    this.ensureMixer();
    return this.context;
  },

  ensureMixer() {
    const context = this.context;
    if (!context || this.masterGain) return;
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.95;
    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -7;
    this.limiter.knee.value = 18;
    this.limiter.ratio.value = 8;
    this.limiter.attack.value = 0.004;
    this.limiter.release.value = 0.16;
    this.masterGain.connect(this.limiter);
    this.limiter.connect(context.destination);
    for (const category of ["music", "ambience", "engine", "ui", "sfx"]) {
      const gain = context.createGain();
      gain.gain.value = this.categoryVolume(category);
      gain.connect(this.masterGain);
      this.categoryGains.set(category, gain);
    }
  },

  categoryVolume(category) {
    if (category === "music") return 0.68;
    if (category === "ambience") return 0.7;
    if (category === "engine") return 0.72;
    if (category === "ui") return 0.86;
    return 1;
  },

  audioCategory(id) {
    if (id === "startupMusic" || id === "gameMusic") return "music";
    if (id === "ambient" || id === "wellHum") return "ambience";
    if (id === "playerThrust") return "engine";
    if (id === "menuSelect") return "ui";
    return "sfx";
  },

  outputFor(id) {
    const context = this.context;
    if (!context) return null;
    this.ensureMixer();
    return this.categoryGains.get(this.audioCategory(id)) ?? this.masterGain ?? context.destination;
  },

  async unlock(options = {}) {
    const context = this.ensureContext();
    const firstUnlock = !this.unlocked;
    this.unlocked = true;
    if (context && context.state !== "running") {
      await context.resume().catch(() => {});
    }
    this.primeContext();
    if (options.refreshLoops !== false) this.refreshLoops();
    if (options.preloadMenuMusic) this.ensureStartupMusic();
    if (firstUnlock && options.allowBackgroundLoad !== false) this.scheduleBackgroundLoad();
    updateOverlay();
  },

  primeContext() {
    const context = this.context;
    if (!context || context.state !== "running") return;
    const source = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0.00001;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.stop(context.currentTime + 0.035);
  },

  scheduleBackgroundLoad() {
    if (this.backgroundLoadScheduled) return;
    this.backgroundLoadScheduled = true;
    const delay = LOW_POWER_MEDIA.matches ? 2200 : 1200;
    const batchSize = LOW_POWER_MEDIA.matches ? 1 : 2;
    window.setTimeout(() => {
      if (state?.status === "running") {
        this.backgroundLoadScheduled = false;
        return;
      }
      this.loadAll({ batchSize });
    }, delay);
  },

  loadAll(options = {}) {
    const batchSize = Math.max(1, Number(options.batchSize) || 2);
    const pending = [...this.nodes.keys()].filter((id) => {
      const record = this.nodes.get(id);
      return record && !record.buffer && !record.loading;
    });
    const pump = () => {
      for (const id of pending.splice(0, batchSize)) this.loadBuffer(id);
      if (pending.length) runWhenIdle(pump, 700);
    };
    runWhenIdle(pump, 500);
  },

  loadBuffer(id) {
    const record = this.nodes.get(id);
    const context = this.ensureContext();
    if (!record || !context) return Promise.resolve(null);
    if (record.buffer) return Promise.resolve(record.buffer);
    if (record.loading) return record.loading;
    record.loading = this.fetchAudioBuffer(record, id)
      .then((arrayBuffer) => this.decode(arrayBuffer))
      .then((buffer) => {
        record.buffer = buffer;
        record.error = null;
        if (record.data.loop && this.unlocked && !this.muted) queueMicrotask(() => this.refreshLoops());
        return buffer;
      })
      .catch((error) => {
        record.error = error;
        return null;
      });
    return record.loading;
  },

  async fetchAudioBuffer(record, id) {
    let lastError = null;
    for (const url of record.urls || [record.url]) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Audio ${id} failed: ${response.status}`);
        record.url = url;
        return await response.arrayBuffer();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error(`Audio ${id} failed`);
  },

  decode(arrayBuffer) {
    const context = this.context;
    if (!context) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const result = context.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
      if (result && typeof result.then === "function") result.then(resolve, reject);
    });
  },

  startLoop(id) {
    if (this.loops.has(id)) return;
    const record = this.nodes.get(id);
    const context = this.context;
    if (!record || !context || context.state !== "running") return;
    const targetVolume = this.loopVolume(id, record);
    if (targetVolume <= 0.001) return;
    this.loadBuffer(id).then((buffer) => {
      if (!buffer || this.muted || !this.unlocked || this.loops.has(id) || context.state !== "running") return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(this.outputFor(id));
      source.start();
      const loop = { source, gain };
      this.loops.set(id, loop);
      this.setLoopGain(loop, this.loopVolume(id, record), 0.22);
      source.onended = () => {
        if (this.loops.get(id)?.source === source) this.loops.delete(id);
      };
    });
  },

  ensureStartupMusic() {
    if (this.muted || !this.unlocked || typeof state === "undefined" || state.status !== "menu") return;
    const context = this.context;
    if (!context || context.state !== "running") return;
    this.loadBuffer("startupMusic").then((buffer) => {
      if (!buffer || this.muted || !this.unlocked || state.status !== "menu") return;
      if (!this.loops.has("startupMusic")) this.startLoop("startupMusic");
      this.refreshLoops();
    });
  },

  setLoopGain(loop, target, glide = 0.28) {
    if (Math.abs((loop.targetGain ?? -999) - target) < 0.012) return;
    loop.targetGain = target;
    const context = this.context;
    if (!context) {
      loop.gain.gain.value = target;
      return;
    }
    loop.gain.gain.cancelScheduledValues(context.currentTime);
    loop.gain.gain.setTargetAtTime(target, context.currentTime, glide);
  },

  loopVolume(id, record) {
    const mode = typeof state === "undefined" ? "menu" : state.status;
    if (id === "startupMusic") {
      return mode === "menu" ? record.data.volume : 0;
    }
    if (id === "gameMusic") {
      if (mode === "running") return record.data.volume * 0.725;
      if (mode === "paused") return record.data.volume * 0.36;
      if (mode === "gameover" || mode === "victory") return record.data.volume * 0.28;
      return 0;
    }
    if (id === "ambient") {
      if (mode === "running") return record.data.volume * 0.58;
      if (mode === "paused") return record.data.volume * 0.42;
      return record.data.volume * 0.64;
    }
    if (id === "wellHum") {
      const wellCount = typeof state === "undefined" ? 0 : state.wells?.length ?? 0;
      if (mode !== "running" || wellCount <= 0) return 0;
      return record.data.volume * clamp(0.42 + wellCount * 0.18, 0.42, 0.9);
    }
    if (id === "playerThrust") {
      if (mode !== "running") return 0;
      return record.data.volume * clamp(state.thrustMix ?? 0, 0, 1);
    }
    return record.data.volume;
  },

  stopLoop(id) {
    const loop = this.loops.get(id);
    if (!loop) return;
    this.loops.delete(id);
    try {
      loop.source.stop();
    } catch {
      // Already stopped by the browser.
    }
    loop.source.disconnect();
    loop.gain.disconnect();
  },

  stopLoops() {
    for (const id of [...this.loops.keys()]) this.stopLoop(id);
  },

  unlockSync() {
    this.unlocked = true;
    this.refreshLoops();
  },

  setMuted(value) {
    this.muted = value;
    saveMuted(value);
    this.refreshLoops();
    updateOverlay();
  },

  toggle() {
    const wasMuted = this.muted;
    this.setMuted(!this.muted);
    if (wasMuted) {
      this.unlock();
      this.play("menuSelect", 0.08);
    }
  },

  play(id, cooldown = 0.04) {
    if (!this.unlocked || this.muted) return;
    const record = this.nodes.get(id);
    if (!record) return;
    const now = performance.now() / 1000;
    const last = this.lastPlay.get(id) ?? -999;
    if (now - last < cooldown) return;
    this.lastPlay.set(id, now);
    this.loadBuffer(id).then((buffer) => {
      const context = this.context;
      if (!buffer || !context || this.muted || !this.unlocked || context.state !== "running") return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = record.data.volume;
      source.connect(gain);
      gain.connect(this.outputFor(id));
      source.start();
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
    });
  },

  playRandom(ids, cooldown = 0.04) {
    if (!ids.length) return;
    const id = ids[Math.floor(Math.random() * ids.length)];
    this.play(id, cooldown);
  },

  refreshLoops() {
    for (const [id, { data }] of this.nodes.entries()) {
      if (!data.loop) continue;
      if (!this.unlocked || this.muted) {
        this.stopLoop(id);
        continue;
      }
      const record = this.nodes.get(id);
      const loop = this.loops.get(id);
      const target = this.loopVolume(id, record);
      if (loop) this.setLoopGain(loop, target);
      else if (target > 0.001) this.startLoop(id);
    }
  },

  refreshActiveLoopLevels(ids) {
    if (!this.unlocked || this.muted) return;
    for (const id of ids) {
      const record = this.nodes.get(id);
      if (!record?.data.loop) continue;
      const target = this.loopVolume(id, record);
      const loop = this.loops.get(id);
      if (loop) this.setLoopGain(loop, target);
      else if (target > 0.01) this.startLoop(id);
    }
  },

  status() {
    return {
      muted: this.muted,
      unlocked: this.unlocked,
      context: this.context?.state ?? "none",
      mixer: {
        master: this.masterGain?.gain.value ?? null,
        categories: Object.fromEntries([...this.categoryGains.entries()].map(([id, gain]) => [id, gain.gain.value]))
      },
      loaded: [...this.nodes.entries()].filter(([, record]) => record.buffer).map(([id]) => id),
      loops: [...this.loops.keys()],
      errors: [...this.nodes.entries()].filter(([, record]) => record.error).map(([id, record]) => [id, String(record.error)])
    };
  }
};

bus.init();

const view = {
  x: 0,
  y: 0,
  w: WORLD.w,
  h: WORLD.h,
  scale: 1,
  dpr: 1,
  cssW: 1,
  cssH: 1,
  camX: 0,
  camY: 0,
  camW: WORLD.w,
  camH: WORLD.h,
  cameraMode: false
};
const input = {
  keys: new Set(),
  mouse: { x: WORLD.w / 2, y: WORLD.h / 2, down: false, active: false },
  pointers: new Map(),
  moveTouch: null,
  aimTouch: null,
  moveVector: { x: 0, y: 0 },
  aimVector: null,
  aimPoint: null,
  bombQueued: new Set(),
  padBombHeld: [false, false, false, false],
  padPauseHeld: false
};
const touchCapable = Boolean(navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches);
shell.dataset.touch = touchCapable ? "true" : "false";

let state = createState();
let lastFrame = performance.now();
let accumulator = 0;
let fpsFrames = 0;
let fpsAt = lastFrame;
let fps = 0;
let pausedByBlur = false;
let staticFrameDirty = true;
let lastHudUpdate = 0;
let startPending = false;
const devEnabled = new URLSearchParams(location.search).has("dev");

if (devEnabled) devEl.style.display = "block";

resize();
updateOverlay();
updateHud();
requestAnimationFrame(frame);
scheduleVisualPrewarm();

addEventListener("resize", resize);
addEventListener("orientationchange", resize);
function armAudioFromGesture(event) {
  if (event?.target?.closest?.("#playerChooser, #primaryAction")) return;
  bus.unlock();
}

addEventListener("pointerdown", armAudioFromGesture, { passive: true });
addEventListener("keydown", armAudioFromGesture);
addEventListener("touchmove", (event) => {
  if (event.target?.closest?.("#shell")) event.preventDefault();
}, { passive: false });
addEventListener("gesturestart", (event) => event.preventDefault?.(), { passive: false });
addEventListener("blur", () => {
  pausedByBlur = true;
  if (state.status === "running") setPaused(true);
});
addEventListener("focus", () => {
  pausedByBlur = false;
  lastFrame = performance.now();
});

addEventListener("keydown", (event) => {
  if (event.code === "Enter" && !event.repeat) {
    event.preventDefault();
    primary();
    return;
  }
  if ((event.code === "KeyP" || event.code === "Escape") && !event.repeat) {
    event.preventDefault();
    togglePause();
    return;
  }
  if (event.code === "KeyM" && !event.repeat) {
    event.preventDefault();
    bus.toggle();
    return;
  }
  const bombPlayer = bombPlayerForCode(event.code);
  if (bombPlayer !== -1 && !event.repeat) {
    event.preventDefault();
    input.bombQueued.add(bombPlayer);
  }
  if (isBoundKey(event.code)) {
    input.keys.add(event.code);
    event.preventDefault();
  }
});

addEventListener("keyup", (event) => {
  input.keys.delete(event.code);
});

canvas.addEventListener("pointerdown", (event) => {
  if (state.status !== "running") return;
  try {
    canvas.setPointerCapture?.(event.pointerId);
  } catch {
    // Some mobile browsers can reject capture during fast multi-touch changes.
  }
  const world = eventToWorld(event);
  if (event.pointerType === "mouse" || event.pointerType === "pen") {
    input.mouse.down = event.button === 0;
    input.mouse.active = true;
    input.mouse.x = world.x;
    input.mouse.y = world.y;
  } else {
    const role = event.clientX < innerWidth * 0.48 && input.moveTouch === null ? "move" : "aim";
    const touch = {
      role,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      world
    };
    input.pointers.set(event.pointerId, touch);
    if (role === "move") input.moveTouch = event.pointerId;
    else {
      input.aimTouch = event.pointerId;
      input.aimPoint = world;
    }
    updateTouchVectors();
  }
  event.preventDefault();
}, { passive: false });

canvas.addEventListener("pointermove", (event) => {
  const world = eventToWorld(event);
  if (event.pointerType === "mouse" || event.pointerType === "pen") {
    input.mouse.x = world.x;
    input.mouse.y = world.y;
    input.mouse.active = true;
    return;
  }
  const touch = input.pointers.get(event.pointerId);
  if (!touch) return;
  touch.x = event.clientX;
  touch.y = event.clientY;
  touch.world = world;
  if (touch.role === "aim") input.aimPoint = world;
  updateTouchVectors();
  event.preventDefault();
}, { passive: false });

canvas.addEventListener("pointerup", endPointer, { passive: false });
canvas.addEventListener("pointercancel", endPointer, { passive: false });
canvas.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "mouse") input.mouse.down = false;
});

primaryAction.addEventListener("click", primary);
homeAction.addEventListener("click", returnHome);
soundAction.addEventListener("click", () => {
  if (state.status === "menu" && !bus.muted && !bus.loops.has("startupMusic")) {
    bus.unlock({ preloadMenuMusic: true });
    bus.ensureStartupMusic();
    return;
  }
  bus.toggle();
});
pauseAction.addEventListener("click", togglePause);
forgeHudClose.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  forgeHudDismissed = true;
  updateForgePanels();
});
forgeToggleAction.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  forgeHudDismissed = false;
  updateForgePanels();
});
bombAction.addEventListener("pointerdown", (event) => {
  input.bombQueued.add(0);
  event.preventDefault();
  event.stopPropagation();
}, { passive: false });

function buildPlayerChooser() {
  if (playerChooser.childElementCount === 4) {
    syncPlayerChooser();
    return;
  }
  playerChooser.replaceChildren();
  for (let count = 1; count <= 4; count += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.playerCount = String(count);
    button.textContent = STR[`playerOption${count}`];
    button.style.setProperty("--pilot-color", PLAYER_COLORS[count - 1] ?? COLORS.cyan);
    button.addEventListener("click", () => {
      selectedPlayerCount = count;
      savePlayerCount(count);
      bus.play("menuSelect", 0.08);
      if (state?.status === "menu") {
        state.playerCount = count;
        state.forge = createForgeState(count, STR.forgeStartupNote, count * 0x2084);
        updateForgePanels();
      }
      syncPlayerChooser();
      requestStaticFrame();
    });
    playerChooser.append(button);
  }
  syncPlayerChooser();
}

function syncPlayerChooser() {
  for (const button of playerChooser.querySelectorAll("button[data-player-count]")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.playerCount) === selectedPlayerCount));
  }
}

function bombPlayerForCode(code) {
  for (let i = 0; i < PLAYER_KEYS.length; i += 1) {
    if (PLAYER_KEYS[i].bomb === code) return i;
  }
  return -1;
}

function createState() {
  const rng = new Rng(0x0f9e42);
  const playerCount = selectedPlayerCount;
  const players = Array.from({ length: playerCount }, (_, index) => makePlayer(index, playerCount));
  return {
    status: "menu",
    rng,
    time: 0,
    runTime: 0,
    score: 0,
    best: loadBest(),
    playerCount,
    players,
    team: {
      lives: 2 + playerCount,
      bombs: 1 + playerCount,
      multiplier: 1
    },
    levelIndex: 0,
    spawned: 0,
    killed: 0,
    player: players[0],
    bullets: [],
    enemies: [],
    wells: [],
    particles: [],
    pickups: [],
    shake: 0,
    spawnTimer: 0,
    transitionTimer: 0,
    banner: { text: "", timer: 0 },
    nextBomb: 65000,
    nextLife: 125000,
    gridOffset: 0,
    bombWave: 0,
    bombOrigin: { x: WORLD.w / 2, y: WORLD.h / 2, color: COLORS.magenta },
    thrustMix: 0,
    forge: createForgeState(playerCount, STR.forgeStartupNote, playerCount * 0x2084),
    entitiesDrawn: 0
  };
}

function makePlayer(index, count = 1) {
  const spawn = PLAYER_SPAWNS[index] ?? PLAYER_SPAWNS[0];
  const offset = (index - (count - 1) / 2) * 34;
  return {
    id: index,
    label: `${index + 1}P`,
    color: PLAYER_COLORS[index] ?? COLORS.cyan,
    x: clamp(spawn.x + offset, 48, WORLD.w - 48),
    y: clamp(spawn.y + Math.abs(offset) * 0.25, 48, WORLD.h - 48),
    vx: 0,
    vy: 0,
    r: 15,
    invuln: 0,
    respawn: 0,
    shotTimer: 0,
    angle: spawn.angle,
    lastAim: { x: 0, y: -1 },
    active: true
  };
}

function startRun() {
  forgeHudDismissed = true;
  state = createState();
  state.status = "running";
  beginLevel(0);
  bus.unlock({ refreshLoops: false, allowBackgroundLoad: false });
  window.setTimeout(() => bus.refreshLoops(), LOW_POWER_MEDIA.matches ? 1200 : 250);
  refreshForge(STR.forgeStartNote, 0x2084, true);
  queueGameplayImageLoad();
  queueSpritePairLoad();
  hideOverlay();
  updateHud();
}

async function primary() {
  if (startPending) return;
  if (state.status === "menu" || state.status === "gameover" || state.status === "victory") {
    startPending = true;
    updateOverlay();
    try {
      await Promise.race([
        bus.unlock({ refreshLoops: false, allowBackgroundLoad: false }),
        new Promise((resolve) => window.setTimeout(resolve, 700))
      ]);
      await ensureStartupAssetsReady();
    } catch {
      // Slow or unsupported media should never trap the player on the launch button.
    } finally {
      startPending = false;
      startRun();
    }
  } else if (state.status === "paused") {
    bus.unlock();
    setPaused(false);
  }
}

function returnHome() {
  bus.unlock();
  clearTouchInput();
  input.bombQueued.clear();
  input.mouse.down = false;
  forgeHudDismissed = false;
  state = createState();
  state.status = "menu";
  bus.play("menuSelect", 0.08);
  bus.refreshLoops();
  bus.ensureStartupMusic();
  updateOverlay();
  updateHud();
  lastFrame = performance.now();
}

function togglePause() {
  if (state.status === "running") setPaused(true);
  else if (state.status === "paused") setPaused(false);
}

function setPaused(value) {
  if (value && state.status === "running") {
    clearTouchInput();
    state.status = "paused";
    bus.refreshLoops();
    updateOverlay();
    updateHud();
  } else if (!value && state.status === "paused") {
    clearTouchInput();
    state.status = "running";
    bus.refreshLoops();
    hideOverlay();
    updateHud();
    lastFrame = performance.now();
  }
}

function beginLevel(index) {
  state.levelIndex = index;
  state.spawned = 0;
  state.killed = 0;
  state.spawnTimer = 0.7;
  state.transitionTimer = 0;
  state.banner = { text: `${STR.level} ${index + 1}`, timer: 1.8 };
  state.wells.length = 0;
  const profile = currentLevel();
  for (let i = 0; i < profile.wells; i += 1) spawnWell();
  bus.refreshLoops();
  refreshForge(STR.forgeRunNote, 0x4000 + index, true);
  bus.play("level", 0.6);
  if (profile.wells > 0) bus.play("wellAlert", 0.6);
}

function currentLevel() {
  return LEVELS[Math.min(state.levelIndex, LEVELS.length - 1)];
}

function requestStaticFrame() {
  staticFrameDirty = true;
}

function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min(0.08, (now - lastFrame) / 1000);
  lastFrame = now;

  if (state.status === "running" && !pausedByBlur) {
    accumulator += delta;
    let steps = 0;
    const commands = collectCommands();
    while (accumulator >= STEP && steps < MAX_FRAME_STEPS) {
      update(STEP, commands);
      accumulator -= STEP;
      steps += 1;
    }
    if (steps === MAX_FRAME_STEPS) accumulator = 0;
    render(accumulator / STEP);
    if (now - lastHudUpdate >= HUD_UPDATE_INTERVAL) {
      updateHud();
      lastHudUpdate = now;
    }
  } else if (staticFrameDirty) {
    accumulator = 0;
    render(0);
    updateHud();
    lastHudUpdate = now;
    staticFrameDirty = false;
  }
  updateDev(now);
}

function update(dt, commands) {
  state.time += dt;
  state.runTime += dt;
  state.gridOffset = 0;
  state.shake = Math.max(0, state.shake - dt * 9);
  state.bombWave = Math.max(0, state.bombWave - dt * 1.6);
  state.banner.timer = Math.max(0, state.banner.timer - dt);
  updateForge(dt);
  for (const player of state.players) {
    player.invuln = Math.max(0, player.invuln - dt);
    player.respawn = Math.max(0, player.respawn - dt);
    player.shotTimer = Math.max(0, player.shotTimer - dt);
  }

  updatePlayers(dt, commands);
  updateAudioMix(commands, dt);
  updateWells(dt);
  updateSpawning(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updatePickups(dt);
  updateParticles(dt);
  resolveCollisions();
  updateWellAbsorption();
  checkProgression(dt);
}

function updatePlayers(dt, commands) {
  for (const player of state.players) {
    if (!player.active) continue;
    const command = commands[player.id] ?? emptyCommand();
    const moveAmount = Math.hypot(command.move.x, command.move.y);
    const targetVx = command.move.x * PLAYER_MAX_SPEED;
    const targetVy = command.move.y * PLAYER_MAX_SPEED;
    const response = smoothStep(moveAmount > 0.001 ? PLAYER_ACCEL_RATE : PLAYER_BRAKE_RATE, dt);
    player.vx += (targetVx - player.vx) * response;
    player.vy += (targetVy - player.vy) * response;
    applyGravity(player, dt, 0.85);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 28, WORLD.w - 28);
    player.y = clamp(player.y, 28, WORLD.h - 28);

    if (command.aim) {
      player.lastAim = command.aim;
      player.angle = turnTowardAngle(player.angle, Math.atan2(command.aim.y, command.aim.x), PLAYER_TURN_RATE, dt);
    }
    if (command.fire && player.shotTimer <= 0) {
      fireBullet(player, player.lastAim);
      player.shotTimer = Math.max(0.065, 0.115 - state.levelIndex * 0.004);
    }
    if (command.bomb) triggerBomb(player);
  }
}

function updateAudioMix(commands, dt) {
  let thrustTarget = 0;
  for (const player of state.players) {
    if (!player.active) continue;
    const command = commands[player.id] ?? emptyCommand();
    const move = command.move ? Math.hypot(command.move.x, command.move.y) : 0;
    const drift = Math.hypot(player.vx, player.vy) / PLAYER_MAX_SPEED;
    thrustTarget = Math.max(thrustTarget, move, drift * 0.45);
  }
  state.thrustMix += (clamp(thrustTarget, 0, 1) - state.thrustMix) * clamp(dt * 8.5, 0, 1);
  if (bus.unlocked) bus.refreshActiveLoopLevels(["playerThrust", "wellHum"]);
}

function updateWells(dt) {
  const profile = currentLevel();
  for (const well of state.wells) {
    well.age += dt;
    well.spawn -= dt;
    well.sinkPulse = Math.max(0, (well.sinkPulse ?? 0) - dt * 3.2);
    well.suction = isWellSuctionActive(well)
      ? clamp((well.suction ?? 0) + dt * 1.85, 0, 1)
      : 0;
    if (well.spawn <= 0 && state.spawned < profile.quota && state.enemies.length < profile.max + 4) {
      const type = state.rng.chance(0.25) ? "mayfly" : state.rng.pickWeighted(profile.mix);
      spawnEnemy(type, well.x + state.rng.range(-46, 46), well.y + state.rng.range(-46, 46));
      well.spawn = state.rng.range(2.3, 4.6);
    }
  }
}

function updateSpawning(dt) {
  const profile = currentLevel();
  if (state.spawned >= profile.quota || state.enemies.length >= profile.max) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const burst = state.rng.chance(0.12 + state.levelIndex * 0.012) ? 2 : 1;
    for (let i = 0; i < burst && state.spawned < profile.quota && state.enemies.length < profile.max; i += 1) {
      spawnEnemy(state.rng.pickWeighted(profile.mix));
    }
    state.spawnTimer = profile.interval * state.rng.range(0.72, 1.22);
  }
}

function updateBullets(dt) {
  for (const bullet of state.bullets) {
    applyGravity(bullet, dt, 0.34);
    bullet.age += dt;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (bullet.x < -30 || bullet.x > WORLD.w + 30 || bullet.y < -30 || bullet.y > WORLD.h + 30 || bullet.life <= 0) {
      bullet.dead = true;
    }
  }
  compact(state.bullets);
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    enemy.age += dt;
    enemy.flash = Math.max(0, enemy.flash - dt * 8);
    const player = nearestPlayer(enemy.x, enemy.y) ?? state.player;
    const toPlayer = normalize(player.x - enemy.x, player.y - enemy.y);
    const spec = ENEMY[enemy.type];
    if (enemy.type === "wanderer") {
      enemy.turn += dt * state.rng.range(-0.5, 0.5);
      enemy.vx += (Math.cos(enemy.turn) * spec.speed * 0.45 + toPlayer.x * spec.speed * 0.35 - enemy.vx) * dt * 1.8;
      enemy.vy += (Math.sin(enemy.turn) * spec.speed * 0.45 + toPlayer.y * spec.speed * 0.35 - enemy.vy) * dt * 1.8;
    } else if (enemy.type === "seeker") {
      enemy.vx += (toPlayer.x * spec.speed - enemy.vx) * dt * 2.8;
      enemy.vy += (toPlayer.y * spec.speed - enemy.vy) * dt * 2.8;
    } else if (enemy.type === "splitter") {
      enemy.vx += (toPlayer.x * spec.speed + Math.sin(enemy.age * 3) * 38 - enemy.vx) * dt * 1.7;
      enemy.vy += (toPlayer.y * spec.speed + Math.cos(enemy.age * 2.4) * 38 - enemy.vy) * dt * 1.7;
    } else if (enemy.type === "lancer") {
      enemy.charge -= dt;
      if (enemy.charge <= 0) {
        enemy.charge = state.rng.range(1.4, 2.4);
        enemy.chargeTime = 0.42;
        enemy.chargeVector = toPlayer;
      }
      if (enemy.chargeTime > 0) {
        enemy.chargeTime -= dt;
        enemy.vx += (enemy.chargeVector.x * 380 - enemy.vx) * dt * 5;
        enemy.vy += (enemy.chargeVector.y * 380 - enemy.vy) * dt * 5;
      } else {
        enemy.vx += (toPlayer.x * spec.speed - enemy.vx) * dt * 1.2;
        enemy.vy += (toPlayer.y * spec.speed - enemy.vy) * dt * 1.2;
      }
    } else {
      enemy.vx += (toPlayer.x * spec.speed + Math.sin(enemy.age * 9 + enemy.seed) * 90 - enemy.vx) * dt * 3.8;
      enemy.vy += (toPlayer.y * spec.speed + Math.cos(enemy.age * 8 + enemy.seed) * 90 - enemy.vy) * dt * 3.8;
    }

    applyGravity(enemy, dt, 0.58);
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    bounceInArena(enemy, spec.r);
  }
  compact(state.enemies);
}

function updatePickups(dt) {
  for (const pickup of state.pickups) {
    pickup.age += dt;
    pickup.life -= dt;
    applyGravity(pickup, dt, 0.48);
    const player = nearestPlayer(pickup.x, pickup.y);
    if (player) {
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 140) {
        const pull = (1 - d / 140) * 560;
        pickup.vx += (dx / d) * pull * dt;
        pickup.vy += (dy / d) * pull * dt;
      }
    }
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;
    pickup.vx *= 0.985;
    pickup.vy *= 0.985;
    if (pickup.life <= 0) pickup.dead = true;
  }
  compact(state.pickups);
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.age += dt;
    p.life -= dt;
    applyGravity(p, dt, 0.14);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= p.drag;
    p.vy *= p.drag;
    if (p.life <= 0) p.dead = true;
  }
  compact(state.particles);
  if (state.particles.length > RING_PARTICLE_LIMIT) state.particles.splice(0, state.particles.length - RING_PARTICLE_LIMIT);
}

function resolveCollisions() {
  for (const bullet of state.bullets) {
    for (const enemy of state.enemies) {
      if (enemy.dead || bullet.dead) continue;
      if (distance2(bullet, enemy) <= (bullet.r + ENEMY[enemy.type].r) ** 2) {
        bullet.dead = true;
        damageEnemy(enemy, 1);
      }
    }
    for (const well of state.wells) {
      if (well.dead || bullet.dead) continue;
      if (distance2(bullet, well) <= (bullet.r + well.r) ** 2) {
        bullet.dead = true;
        damageWell(well, 1);
      }
    }
  }
  compact(state.bullets);
  compact(state.enemies);
  compact(state.wells);

  for (const pickup of state.pickups) {
    for (const player of state.players) {
      if (!player.active) continue;
      if (distance2(player, pickup) <= (player.r + pickup.r) ** 2) {
        collectPickup(pickup);
        break;
      }
    }
  }
  compact(state.pickups);

  for (const player of state.players) {
    if (!player.active || player.invuln > 0) continue;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (distance2(player, enemy) <= (player.r + ENEMY[enemy.type].r) ** 2) {
        neutralizeEnemyForProgress(enemy);
        hurtPlayer(player);
        break;
      }
    }
  }
  compact(state.enemies);
}

function updateWellAbsorption() {
  if (state.wells.length === 0) return;
  let absorbedMatter = false;

  for (const well of state.wells) {
    if (well.dead) continue;

    for (const bullet of state.bullets) {
      if (bullet.dead) continue;
      const active = isWellSuctionActive(well);
      const baseRadius = active ? WELL_CAPTURE_RADIUS : WELL_ACTIVATION_RADIUS;
      const limit = baseRadius + bullet.r + (well.sinkPulse ?? 0) * 22;
      if (distance2(bullet, well) <= limit ** 2) {
        bullet.dead = true;
        blackHoleSwallow(well, bullet, bullet.color ?? COLORS.flame, 4);
        damageWell(well, 1);
        absorbedMatter = true;
        if (well.dead) break;
      }
    }

    if (!isWellSuctionActive(well) || well.dead) continue;

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const spec = ENEMY[enemy.type];
      const limit = WELL_CAPTURE_RADIUS + spec.r * 0.9 + (well.sinkPulse ?? 0) * 26;
      if (distance2(enemy, well) <= limit ** 2) {
        blackHoleSwallow(well, enemy, spec.color, enemy.type === "mayfly" ? 7 : 14);
        killEnemy(enemy, true);
        state.shake = Math.max(state.shake, enemy.type === "mayfly" ? 0.14 : 0.24);
        absorbedMatter = true;
      }
    }

    for (const pickup of state.pickups) {
      if (pickup.dead) continue;
      const limit = WELL_CAPTURE_RADIUS + pickup.r + (well.sinkPulse ?? 0) * 22;
      if (distance2(pickup, well) <= limit ** 2) {
        pickup.dead = true;
        blackHoleSwallow(well, pickup, COLORS.lime, 10);
        absorbedMatter = true;
      }
    }

    for (const player of state.players) {
      if (!player.active || player.invuln > 0) continue;
      const limit = WELL_PLAYER_DANGER_RADIUS + player.r;
      if (distance2(player, well) <= limit ** 2) {
        blackHoleSwallow(well, player, player.color, 28);
        addRing(well.x, well.y, player.color, 42, 260);
        well.sinkPulse = 1;
        state.shake = Math.max(state.shake, 1.35);
        hurtPlayer(player);
        absorbedMatter = true;
      }
    }
  }

  if (absorbedMatter) bus.play("repulsor", 0.07);
  compact(state.bullets);
  compact(state.enemies);
  compact(state.pickups);
}

function checkProgression(dt) {
  if (state.transitionTimer > 0) {
    state.transitionTimer -= dt;
    if (state.transitionTimer <= 0) {
      if (state.levelIndex + 1 >= LEVELS.length) finishRun("victory");
      else beginLevel(state.levelIndex + 1);
    }
    return;
  }
  const profile = currentLevel();
  compact(state.enemies);
  compact(state.wells);
  const liveEnemies = state.enemies.filter((enemy) => !enemy.dead).length;
  const liveWells = state.wells.filter((well) => !well.dead).length;
  const quotaSpent = state.spawned >= profile.quota;
  if (quotaSpent && liveEnemies === 0 && liveWells === 0 && state.killed < profile.quota) {
    state.killed = profile.quota;
  }
  const cleared = quotaSpent && state.killed >= profile.quota && liveEnemies === 0 && liveWells === 0;
  if (cleared) {
    state.transitionTimer = 2.1;
    state.banner = { text: STR.cleared, timer: 1.8 };
    state.score += (state.levelIndex + 1) * 1000 * state.team.multiplier;
    state.shake = 0.7;
    bus.play("level", 1);
    addRing(WORLD.w / 2, WORLD.h / 2, COLORS.cyan, 60, 420);
    pushForgePulse(WORLD.w / 2, WORLD.h / 2, COLORS.cyan, STR.forgeClearNote, 0x7000 + state.levelIndex);
    checkRewards();
  }
}

function neutralizeEnemyForProgress(enemy) {
  if (!enemy || enemy.dead) return false;
  enemy.dead = true;
  state.killed += 1;
  return true;
}

function fireBullet(player, dir) {
  const spread = state.team.multiplier >= 6 ? 0.045 : 0;
  const shots = state.team.multiplier >= 8 ? [-spread, 0, spread] : [0];
  const nextSide = -(player.shotSide ?? 1);
  player.shotSide = nextSide;
  for (let shotIndex = 0; shotIndex < shots.length; shotIndex += 1) {
    const turn = shots[shotIndex];
    const x = dir.x * Math.cos(turn) - dir.y * Math.sin(turn);
    const y = dir.x * Math.sin(turn) + dir.y * Math.cos(turn);
    const side = { x: -y, y: x };
    const lane = shots.length === 1 ? nextSide : shotIndex - (shots.length - 1) * 0.5;
    const cannonOffset = lane * 8;
    state.bullets.push({
      x: player.x + x * 26 + side.x * cannonOffset,
      y: player.y + y * 26 + side.y * cannonOffset,
      vx: x * 760 + player.vx * 0.18,
      vy: y * 760 + player.vy * 0.18,
      r: 5,
      age: 0,
      life: 1.15,
      maxLife: 1.15,
      owner: player.id,
      color: player.color,
      cannonLane: lane
    });
  }
  bus.playRandom(["playerFire1", "playerFire2", "playerFire3"], 0.045);
}

function triggerBomb(player) {
  if (state.team.bombs <= 0) return;
  state.team.bombs -= 1;
  state.bombWave = 1;
  state.bombOrigin = { x: player.x, y: player.y, color: player.color };
  state.shake = 1.4;
  bus.play("bomb", 0.25);
  for (const enemy of state.enemies) damageEnemy(enemy, 9, true);
  for (const well of state.wells) damageWell(well, 8);
  compact(state.enemies);
  compact(state.wells);
  for (let i = 0; i < 90; i += 1) {
    const a = state.rng.range(0, TAU);
    const speed = state.rng.range(180, 720);
    addParticle(player.x, player.y, Math.cos(a) * speed, Math.sin(a) * speed, state.rng.chance(0.5) ? player.color : COLORS.magenta, state.rng.range(0.28, 0.72), state.rng.range(2, 5), 0.978);
  }
}

function spawnEnemy(type, forcedX, forcedY) {
  const spec = ENEMY[type];
  const edge = state.rng.int(0, 3);
  let x = forcedX;
  let y = forcedY;
  if (x === undefined || y === undefined) {
    if (edge === 0) { x = state.rng.range(40, WORLD.w - 40); y = -30; }
    if (edge === 1) { x = WORLD.w + 30; y = state.rng.range(40, WORLD.h - 40); }
    if (edge === 2) { x = state.rng.range(40, WORLD.w - 40); y = WORLD.h + 30; }
    if (edge === 3) { x = -30; y = state.rng.range(40, WORLD.h - 40); }
  }
  const enemy = {
    type,
    x: clamp(x, 20, WORLD.w - 20),
    y: clamp(y, 20, WORLD.h - 20),
    vx: state.rng.range(-80, 80),
    vy: state.rng.range(-80, 80),
    hp: spec.hp,
    age: 0,
    seed: state.rng.range(0, TAU),
    turn: state.rng.range(0, TAU),
    charge: state.rng.range(0.7, 2.0),
    chargeTime: 0,
    chargeVector: { x: 0, y: 0 },
    flash: 0
  };
  state.enemies.push(enemy);
  state.spawned += 1;
  if (type === "mayfly") bus.play("mayflies", 0.35);
  else bus.playRandom(["spawn1", "spawn2", "spawn3", "spawn4", "spawn5", "spawn6"], 0.08);
  for (let i = 0; i < 10; i += 1) {
    const a = state.rng.range(0, TAU);
    addParticle(enemy.x, enemy.y, Math.cos(a) * state.rng.range(40, 160), Math.sin(a) * state.rng.range(40, 160), spec.color, 0.38, 2.3, 0.975);
  }
}

function spawnWell() {
  const margin = 150;
  let x = margin;
  let y = margin;
  for (let tries = 0; tries < 40; tries += 1) {
    x = state.rng.range(margin, WORLD.w - margin);
    y = state.rng.range(margin, WORLD.h - margin);
    const nearest = nearestPlayer(x, y);
    if (!nearest || Math.hypot(x - nearest.x, y - nearest.y) > 260) break;
  }
  state.wells.push({
    x,
    y,
    vx: 0,
    vy: 0,
    r: 45,
    hp: 9 + state.levelIndex * 2,
    maxHp: 9 + state.levelIndex * 2,
    age: state.rng.range(0, TAU),
    spawn: state.rng.range(2.0, 4.2),
    flash: 0,
    sinkPulse: 0,
    active: false,
    suction: 0
  });
}

function damageEnemy(enemy, damage, bomb = false) {
  enemy.hp -= damage;
  enemy.flash = 1;
  addParticle(enemy.x, enemy.y, state.rng.range(-60, 60), state.rng.range(-60, 60), ENEMY[enemy.type].color, 0.2, 3.3, 0.96);
  if (enemy.hp <= 0) killEnemy(enemy, bomb);
  else bus.playRandom(["hit1", "hit2"], 0.035);
}

function killEnemy(enemy, bomb = false) {
  if (enemy.dead) return;
  enemy.dead = true;
  const spec = ENEMY[enemy.type];
  state.killed += 1;
  const points = spec.score * state.team.multiplier;
  state.score += points;
  spawnScorePop(enemy.x, enemy.y, `+${formatNumber(points)}`, spec.color);
  if (!bomb && (state.killed % 6 === 0 || state.rng.chance(0.12))) spawnPickup(enemy.x, enemy.y);
  if (enemy.type === "splitter" && !bomb) {
    for (let i = 0; i < 3; i += 1) spawnEnemy("mayfly", enemy.x + state.rng.range(-22, 22), enemy.y + state.rng.range(-22, 22));
  }
  burst(enemy.x, enemy.y, spec.color, enemy.type === "mayfly" ? 10 : 22);
  bus.playRandom(["hit1", "hit2"], 0.035);
  checkRewards();
}

function damageWell(well, damage) {
  activateWellSuction(well);
  well.hp -= damage;
  well.flash = 1;
  state.shake = Math.max(state.shake, 0.25);
  bus.play("wellHit", 0.12);
  burst(well.x, well.y, COLORS.violet, 8);
  if (well.hp <= 0) {
    well.dead = true;
    bus.refreshLoops();
    const points = 1800 * state.team.multiplier;
    state.score += points;
    spawnScorePop(well.x, well.y - 32, `+${formatNumber(points)}`, COLORS.gold);
    state.team.multiplier = Math.min(9, state.team.multiplier + 1);
    addRing(well.x, well.y, COLORS.violet, 80, 300);
    burst(well.x, well.y, COLORS.cyan, 46);
    pushForgePulse(well.x, well.y, COLORS.violet, STR.forgeWellNote, 0x5000 + state.levelIndex + state.killed);
    bus.play("wellDestroyed", 0.2);
    bus.play("wellExplode", 0.25);
  }
  checkRewards();
}

function isWellSuctionActive(well) {
  return well?.active === true && !well.dead;
}

function activateWellSuction(well, boost = 0.62) {
  if (!well || well.dead) return;
  const wasActive = isWellSuctionActive(well);
  well.active = true;
  well.suction = Math.max(well.suction ?? 0, boost);
  well.sinkPulse = Math.min(1, (well.sinkPulse ?? 0) + (wasActive ? 0.16 : 0.42));
  if (!wasActive) {
    state.shake = Math.max(state.shake, 0.5);
    addRing(well.x, well.y, COLORS.magenta, WELL_ACTIVATION_RADIUS, 340);
  }
}

function spawnPickup(x, y) {
  const a = state.rng.range(0, TAU);
  state.pickups.push({
    x,
    y,
    vx: Math.cos(a) * state.rng.range(50, 150),
    vy: Math.sin(a) * state.rng.range(50, 150),
    r: 10,
    age: 0,
    life: 8
  });
}

function collectPickup(pickup) {
  pickup.dead = true;
  state.team.multiplier = Math.min(9, state.team.multiplier + 1);
  const points = 250 * state.team.multiplier;
  state.score += points;
  spawnScorePop(pickup.x, pickup.y, `+${formatNumber(points)}  x${state.team.multiplier}`, COLORS.lime);
  bus.play("multiplier", 0.08);
  burst(pickup.x, pickup.y, COLORS.lime, 14);
  pushForgePulse(pickup.x, pickup.y, COLORS.lime, STR.forgePickupNote, 0x3000 + state.team.multiplier + state.killed);
  checkRewards();
}

function checkRewards() {
  if (state.score >= state.nextBomb) {
    state.nextBomb += 65000;
    state.team.bombs = Math.min(9, state.team.bombs + 1);
    bus.play("extraBomb", 0.2);
  }
  if (state.score >= state.nextLife) {
    state.nextLife += 125000;
    state.team.lives = Math.min(9, state.team.lives + 1);
    bus.play("extraLife", 0.2);
  }
}

function hurtPlayer(player) {
  state.team.lives -= 1;
  state.team.multiplier = 1;
  state.shake = 1.2;
  state.bombWave = 0.75;
  state.bombOrigin = { x: player.x, y: player.y, color: COLORS.white };
  burst(player.x, player.y, COLORS.white, 52);
  bus.play("playerHit", 0.16);
  if (state.team.lives <= 0) {
    bus.play("playerDead", 0.16);
    finishRun("gameover");
    return;
  }
  const spawn = PLAYER_SPAWNS[player.id] ?? PLAYER_SPAWNS[0];
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.invuln = 2.1;
  player.respawn = 0.55;
  state.enemies = state.enemies.filter((enemy) => {
    const keep = Math.hypot(enemy.x - player.x, enemy.y - player.y) > 130;
    if (!keep) neutralizeEnemyForProgress(enemy);
    return keep;
  });
  bus.play("playerSpawn", 0.3);
}

function finishRun(status) {
  clearTouchInput();
  state.status = status;
  state.best = Math.max(state.best, state.score);
  saveBest(state.best);
  state.banner.timer = 0;
  bus.refreshLoops();
  if (status === "gameover") bus.play("gameOver", 0.4);
  else bus.play("level", 0.4);
  updateOverlay();
}

function collectCommands() {
  const commands = Array.from({ length: state.playerCount }, (_, id) => commandForKeyboard(id));
  applyGamepads(commands);
  if (commands[0]) applyPointerInput(commands[0]);
  applyTouchSquadInput(commands);
  applySquadFallback(commands);
  for (const id of input.bombQueued) {
    if (commands[id]) commands[id].bomb = true;
  }
  input.bombQueued.clear();
  return commands;
}

function commandForKeyboard(id) {
  const config = PLAYER_KEYS[id];
  const command = emptyCommand();
  if (!config) return command;
  const move = { x: 0, y: 0 };
  const aimKey = { x: 0, y: 0 };
  if (input.keys.has(config.move.left)) move.x -= 1;
  if (input.keys.has(config.move.right)) move.x += 1;
  if (input.keys.has(config.move.up)) move.y -= 1;
  if (input.keys.has(config.move.down)) move.y += 1;
  if (input.keys.has(config.aim.left)) aimKey.x -= 1;
  if (input.keys.has(config.aim.right)) aimKey.x += 1;
  if (input.keys.has(config.aim.up)) aimKey.y -= 1;
  if (input.keys.has(config.aim.down)) aimKey.y += 1;
  command.move = normalize(move.x, move.y) ?? { x: 0, y: 0 };
  command.aim = normalize(aimKey.x, aimKey.y);
  command.fire = Boolean(command.aim);
  return command;
}

function applyPointerInput(command) {
  command.move = normalize(command.move.x + input.moveVector.x, command.move.y + input.moveVector.y) ?? { x: 0, y: 0 };

  if (input.aimVector) {
    command.aim = input.aimVector;
    command.fire = true;
  } else if (input.aimPoint) {
    command.aim = normalize(input.aimPoint.x - state.players[0].x, input.aimPoint.y - state.players[0].y);
    command.fire = true;
  } else if (input.mouse.active) {
    const mouseAim = normalize(input.mouse.x - state.players[0].x, input.mouse.y - state.players[0].y);
    if (mouseAim) command.aim = mouseAim;
    command.fire = command.fire || input.mouse.down;
  }
}

function applyTouchSquadInput(commands) {
  if (!input.aimVector && input.moveTouch === null && input.aimTouch === null) return;
  if (commands.length <= 1) return;
  const leader = state.players[0];
  if (!leader) return;
  for (let i = 1; i < commands.length; i += 1) {
    const player = state.players[i];
    const command = commands[i];
    if (!player || !command) continue;
    const slot = squadTouchSlot(i, commands.length);
    const dx = leader.x + slot.x - player.x;
    const dy = leader.y + slot.y - player.y;
    const distance = Math.hypot(dx, dy);
    const follow = distance > 20 ? normalize(dx, dy) : input.moveVector;
    if (follow) command.move = normalize(command.move.x + follow.x, command.move.y + follow.y) ?? { x: 0, y: 0 };
    if (input.aimVector) {
      command.aim = input.aimVector;
      command.fire = true;
    }
  }
}

function applySquadFallback(commands) {
  if (commands.length <= PLAYER_KEYS.length) return;
  const leader = state.players[0];
  const leadCommand = commands[0];
  if (!leader || !leadCommand) return;
  for (let i = PLAYER_KEYS.length; i < commands.length; i += 1) {
    const player = state.players[i];
    const command = commands[i];
    if (!player || !command || hasCommandInput(command)) continue;
    const slot = squadTouchSlot(i, commands.length);
    const dx = leader.x + slot.x - player.x;
    const dy = leader.y + slot.y - player.y;
    const follow = Math.hypot(dx, dy) > 16 ? normalize(dx, dy) : null;
    if (follow) command.move = follow;
    if (leadCommand.fire || leadCommand.aim) {
      command.aim = leadCommand.aim ?? leader.lastAim;
      command.fire = leadCommand.fire;
    }
  }
}

function hasCommandInput(command) {
  return Math.hypot(command.move.x, command.move.y) > 0.001 || Boolean(command.aim || command.fire || command.bomb);
}

function squadTouchSlot(index, count) {
  const spread = 44;
  const row = Math.floor((index - 1) / 2);
  const side = index % 2 === 1 ? -1 : 1;
  return {
    x: side * spread * (1 + row * 0.35),
    y: 42 + row * 32 + Math.max(0, count - 2) * 4
  };
}

function emptyCommand() {
  return { move: { x: 0, y: 0 }, aim: null, fire: false, bomb: false };
}

function clearTouchInput() {
  input.pointers.clear();
  input.moveTouch = null;
  input.aimTouch = null;
  input.moveVector.x = 0;
  input.moveVector.y = 0;
  input.aimPoint = null;
  input.aimVector = null;
  updateTouchUi();
}

function applyGamepads(commands) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (let index = 0; index < pads.length; index += 1) {
    const pad = pads[index];
    if (!pad) continue;
    const playerIndex = Math.min(index, commands.length - 1);
    const command = commands[playerIndex];
    if (!command) continue;
    const lx = deadzone(pad.axes[0] ?? 0);
    const ly = deadzone(pad.axes[1] ?? 0);
    command.move = normalize(command.move.x + lx, command.move.y + ly) ?? { x: 0, y: 0 };
    const rx = deadzone(pad.axes[2] ?? 0);
    const ry = deadzone(pad.axes[3] ?? 0);
    if (Math.hypot(rx, ry) > 0) {
      command.aim = normalize(rx, ry);
      command.fire = true;
    }
    const bombDown = Boolean(pad.buttons[1]?.pressed || pad.buttons[2]?.pressed);
    if (bombDown && !input.padBombHeld[playerIndex]) command.bomb = true;
    input.padBombHeld[playerIndex] = bombDown;
    const pauseDown = Boolean(pad.buttons[9]?.pressed);
    if (pauseDown && !input.padPauseHeld) togglePause();
    input.padPauseHeld = pauseDown;
  }
}

function isBoundKey(code) {
  for (const config of PLAYER_KEYS) {
    if (Object.values(config.move).includes(code) || Object.values(config.aim).includes(code) || config.bomb === code) return true;
  }
  return false;
}

function endPointer(event) {
  if (event.pointerType === "mouse" || event.pointerType === "pen") {
    input.mouse.down = false;
    return;
  }
  const touch = input.pointers.get(event.pointerId);
  if (!touch) return;
  if (input.moveTouch === event.pointerId) input.moveTouch = null;
  if (input.aimTouch === event.pointerId) {
    input.aimTouch = null;
    input.aimPoint = null;
    input.aimVector = null;
  }
  input.pointers.delete(event.pointerId);
  updateTouchVectors();
  event.preventDefault();
}

function updateTouchVectors() {
  const touch = input.moveTouch !== null ? input.pointers.get(input.moveTouch) : null;
  if (!touch) {
    input.moveVector.x = 0;
    input.moveVector.y = 0;
  } else {
    const dx = touch.x - touch.startX;
    const dy = touch.y - touch.startY;
    const len = Math.hypot(dx, dy);
    const cap = 62;
    input.moveVector.x = len > 0 ? clamp(dx / cap, -1, 1) : 0;
    input.moveVector.y = len > 0 ? clamp(dy / cap, -1, 1) : 0;
    const mag = Math.hypot(input.moveVector.x, input.moveVector.y);
    if (mag > 1) {
      input.moveVector.x /= mag;
      input.moveVector.y /= mag;
    }
  }
  const aimTouch = input.aimTouch !== null ? input.pointers.get(input.aimTouch) : null;
  if (!aimTouch) {
    input.aimPoint = null;
    input.aimVector = null;
  } else {
    const dx = aimTouch.x - aimTouch.startX;
    const dy = aimTouch.y - aimTouch.startY;
    const stickAim = Math.hypot(dx, dy) > 8 ? normalize(dx, dy) : null;
    const worldAim = pointInsideArena(aimTouch.x, aimTouch.y)
      ? normalize(aimTouch.world.x - state.players[0].x, aimTouch.world.y - state.players[0].y)
      : null;
    input.aimPoint = null;
    input.aimVector = stickAim ?? worldAim ?? state.players[0]?.lastAim ?? { x: 0, y: -1 };
  }
  updateTouchUi();
}

function pointInsideArena(x, y) {
  return x >= view.x && x <= view.x + view.w && y >= view.y && y <= view.y + view.h;
}

function updateTouchUi() {
  if (!touchMarks) return;
  updateTouchZone(touchMoveZone, input.moveTouch !== null, input.moveVector);
  updateTouchZone(touchAimZone, input.aimTouch !== null, input.aimVector ?? { x: 0, y: 0 });
}

function updateTouchZone(zone, active, vector) {
  if (!zone) return;
  zone.classList.toggle("is-active", active);
  zone.style.setProperty("--stick-x", `${clamp(vector.x, -1, 1) * 34}px`);
  zone.style.setProperty("--stick-y", `${clamp(vector.y, -1, 1) * 34}px`);
}

function eventToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const sx = event.clientX - rect.left;
  const sy = event.clientY - rect.top;
  return {
    x: clamp(view.camX + (sx - view.x) / view.scale, 0, WORLD.w),
    y: clamp(view.camY + (sy - view.y) / view.scale, 0, WORLD.h)
  };
}

function applyGravity(body, dt, factor) {
  const profile = currentLevel();
  if (profile.pull <= 0 || state.wells.length === 0) return;
  for (const well of state.wells) {
    if (!isWellSuctionActive(well)) continue;
    const dx = well.x - body.x;
    const dy = well.y - body.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > WELL_GRAVITY_RADIUS) continue;
    const t = 1 - clamp(dist / WELL_GRAVITY_RADIUS, 0, 1);
    const capture = 1 - clamp(dist / WELL_CAPTURE_RADIUS, 0, 1);
    const suction = clamp(well.suction ?? 0, 0.25, 1);
    const sink = (well.sinkPulse ?? 0) * suction;
    const pull = profile.pull * factor * suction * (0.18 + t * t * (2.85 + sink * 0.8) + capture * capture * 8.2);
    const swirl = pull * (0.38 + t * 0.76 + capture * 1.15 + sink * 0.32);
    const nx = dx / dist;
    const ny = dy / dist;
    body.vx += (nx * pull - ny * swirl) * dt;
    body.vy += (ny * pull + nx * swirl) * dt;
    if (capture > 0) {
      const drag = clamp(1 - dt * factor * (1.15 + capture * 3.85), 0.58, 1);
      body.vx *= drag;
      body.vy *= drag;
    }
  }
}

function blackHoleSwallow(well, body, color, count) {
  const dx = well.x - body.x;
  const dy = well.y - body.y;
  const angle = Math.atan2(dy, dx);
  well.sinkPulse = Math.min(1, (well.sinkPulse ?? 0) + 0.22);
  for (let i = 0; i < count; i += 1) {
    const a = angle + state.rng.range(-0.62, 0.62);
    const speed = state.rng.range(130, 380);
    addParticle(
      body.x + state.rng.range(-6, 6),
      body.y + state.rng.range(-6, 6),
      Math.cos(a) * speed,
      Math.sin(a) * speed,
      color,
      state.rng.range(0.18, 0.44),
      state.rng.range(1.7, 4.8),
      0.986
    );
  }
}

function nearestPlayer(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const player of state.players) {
    if (!player.active) continue;
    const d = distance2({ x, y }, player);
    if (d < bestD) {
      bestD = d;
      best = player;
    }
  }
  return best;
}

function teamCenter() {
  let x = 0;
  let y = 0;
  let count = 0;
  for (const player of state.players) {
    if (!player.active) continue;
    x += player.x;
    y += player.y;
    count += 1;
  }
  return count ? { x: x / count, y: y / count } : { x: WORLD.w / 2, y: WORLD.h / 2 };
}

function bounceInArena(body, r) {
  if (body.x < r) { body.x = r; body.vx = Math.abs(body.vx) * 0.85; }
  if (body.x > WORLD.w - r) { body.x = WORLD.w - r; body.vx = -Math.abs(body.vx) * 0.85; }
  if (body.y < r) { body.y = r; body.vy = Math.abs(body.vy) * 0.85; }
  if (body.y > WORLD.h - r) { body.y = WORLD.h - r; body.vy = -Math.abs(body.vy) * 0.85; }
}

function burst(x, y, color, count) {
  const budget = Math.max(0, PARTICLE_LIMIT - state.particles.length);
  const burstCount = Math.min(count, budget);
  for (let i = 0; i < burstCount; i += 1) {
    const a = state.rng.range(0, TAU);
    const speed = state.rng.range(45, 300);
    addParticle(x, y, Math.cos(a) * speed, Math.sin(a) * speed, color, state.rng.range(0.22, 0.58), state.rng.range(1.8, 4.5), 0.975);
  }
}

function addRing(x, y, color, radius, speed) {
  if (state.particles.length >= RING_PARTICLE_LIMIT) return;
  state.particles.push({ x, y, vx: 0, vy: 0, color, life: 0.72, maxLife: 0.72, age: 0, size: radius, ring: true, speed, drag: 1 });
}

function addParticle(x, y, vx, vy, color, life, size, drag) {
  if (state.particles.length >= PARTICLE_LIMIT) return;
  state.particles.push({ x, y, vx, vy, color, life, maxLife: life, age: 0, size, drag });
}

function buildLights() {
  const lights = [];
  for (const player of state.players) {
    if (!player.active) continue;
    lights.push({ x: player.x, y: player.y, radius: 240, intensity: 0.72, color: player.color });
  }
  for (const well of state.wells) {
    const sink = well.sinkPulse ?? 0;
    lights.push({
      x: well.x,
      y: well.y,
      radius: WELL_GRAVITY_RADIUS + 28 + sink * 88,
      intensity: 0.88 + sink * 0.5 + Math.sin(state.time * 5 + well.age) * 0.12,
      color: well.flash > 0 ? COLORS.white : COLORS.violet
    });
  }
  const bulletStride = Math.max(1, Math.ceil(state.bullets.length / 4));
  for (let i = 0; i < state.bullets.length && lights.length < MAX_LIGHTS - 1; i += bulletStride) {
    const bullet = state.bullets[i];
    const flicker = 0.88 + Math.sin((bullet.age ?? 0) * 42 + bullet.x * 0.03) * 0.12;
    lights.push({ x: bullet.x, y: bullet.y, radius: 176, intensity: 0.62 * flicker, color: COLORS.flame });
  }
  if (state.bombWave > 0) {
    const p = state.bombOrigin ?? state.player;
    lights.unshift({ x: p.x, y: p.y, radius: 540, intensity: 1.2 * state.bombWave, color: p.color ?? COLORS.magenta });
  }
  for (const pulse of state.forge?.worldPulses ?? []) {
    if (lights.length >= MAX_LIGHTS) break;
    const t = clamp(pulse.life / pulse.maxLife, 0, 1);
    lights.push({ x: pulse.x, y: pulse.y, radius: 210, intensity: 0.55 * t, color: pulse.color });
  }
  return lights.slice(0, MAX_LIGHTS);
}

function spawnScorePop(x, y, text, color) {
  if (!fxLayer || state.status === "menu") return;
  while (fxLayer.children.length > 28) fxLayer.firstElementChild?.remove();
  const point = worldToUiPoint(x, y);
  const node = document.createElement("div");
  node.className = "score-pop";
  node.textContent = text;
  node.style.left = `${point.x}px`;
  node.style.top = `${point.y}px`;
  node.style.color = color;
  fxLayer.append(node);
  window.setTimeout(() => node.remove(), 760);
}

function worldToUiPoint(x, y) {
  return {
    x: view.x + (x - view.camX) * view.scale,
    y: view.y + (y - view.camY) * view.scale
  };
}

function render() {
  state.entitiesDrawn = 0;
  updateCamera();
  const shake = state.shake > 0 ? state.shake * 7 : 0;
  const sx = shake ? state.rng.range(-shake, shake) : 0;
  const sy = shake ? state.rng.range(-shake, shake) : 0;

  if (!renderer.beginFrame(view, sx, sy)) {
    bannerText.hidden = false;
    bannerText.textContent = "Renderer paused. Reloading will restore the signal.";
    return;
  }
  renderer.setLights(buildLights());
  drawBackdrop();
  renderer.setWorldClip(true);
  drawArena();
  drawWells();
  drawPickups();
  drawForgePulses();
  drawBullets();
  drawEnemies();
  drawPlayers();
  drawParticles();
  drawBombWave();
  renderer.setWorldClip(false);
  drawLetterbox();
  renderer.flush();
  drawBanner();
}

function drawBackdrop() {
  renderer.setBlend("normal");
  renderer.drawScreenRect(0, 0, view.cssW, view.cssH, COLORS.ink, 1);
  renderer.drawScreenImage(GL_IMAGES.parallaxFar, view.x, view.y, view.w, view.h, 0.62, {
    repeat: true,
    u0: 0,
    v0: 0,
    u1: 1,
    v1: 1
  });
  renderer.drawScreenImage(GL_IMAGES.parallaxMid, view.x, view.y, view.w, view.h, 0.44, {
    repeat: true,
    u0: 0,
    v0: 0,
    u1: 1,
    v1: 1
  });
  renderer.setBlend("add");
  renderer.drawScreenImage(GL_IMAGES.parallaxNear, view.x, view.y, view.w, view.h, 0.22, {
    repeat: true,
    u0: 0,
    v0: 0,
    u1: 1,
    v1: 1
  });
  drawDepthAtmosphere();
  renderer.setBlend("normal");
}

function drawDepthAtmosphere() {
  const scanY = ((state.time * 18) % 22) - 22;
  for (let y = scanY; y < view.cssH; y += 22) {
    renderer.drawScreenRect(view.x, y, view.w, 1, COLORS.cyan, 0.026);
  }
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const y = view.y + view.h * (0.34 + t * 0.55);
    const h = 18 + t * 24;
    const alpha = 0.035 + t * 0.025;
    renderer.drawScreenRect(view.x, y + Math.sin(state.time * 0.5 + i) * 9, view.w, h, i % 2 ? COLORS.violet : COLORS.cyan, alpha);
  }
  renderer.drawScreenImage(GL_IMAGES.lightRay, view.x + view.w * 0.04, view.y + view.h * 0.5, view.w * 0.92, view.h * 0.34, 0.055, { color: COLORS.cyan });
}

function drawArena() {
  renderer.drawWorldRect(0, 0, WORLD.w, WORLD.h, COLORS.ink, 0.52);
  drawCircuitSilhouette();
  renderer.setBlend("add");
  drawStaticArenaGrid();
  renderer.drawWorldLine(2, 2, WORLD.w - 2, 2, 3, COLORS.gold, 0.28);
  renderer.drawWorldLine(WORLD.w - 2, 2, WORLD.w - 2, WORLD.h - 2, 3, COLORS.cyan, 0.42);
  renderer.drawWorldLine(WORLD.w - 2, WORLD.h - 2, 2, WORLD.h - 2, 3, COLORS.gold, 0.28);
  renderer.drawWorldLine(2, WORLD.h - 2, 2, 2, 3, COLORS.cyan, 0.42);
  renderer.setBlend("normal");
}

function drawStaticArenaGrid() {
  const left = view.x;
  const top = view.y;
  const right = view.x + view.w;
  const bottom = view.y + view.h;
  const centerX = left + view.w * 0.5;
  const horizon = top + view.h * 0.46;
  renderer.drawScreenRect(left, top, view.w, view.h, COLORS.cyan, 0.012);
  for (let x = left; x <= right + 1; x += Math.max(34, view.w / 18)) {
    renderer.drawScreenLine(x, top, x, bottom, 4.4, COLORS.cyan, 0.022);
    renderer.drawScreenLine(x, top, x, bottom, 1.2, COLORS.cyan, 0.14);
  }
  for (let y = top; y <= bottom + 1; y += Math.max(28, view.h / 14)) {
    const depth = clamp((y - horizon) / Math.max(1, bottom - horizon), 0, 1);
    renderer.drawScreenLine(left, y, right, y, 3.2 + depth * 2.4, depth > 0.76 ? COLORS.gold : COLORS.cyan, 0.08 + depth * 0.16);
  }
  for (let i = -8; i <= 8; i += 1) {
    const targetX = centerX + i * (view.w / 8);
    const color = i % 2 === 0 ? COLORS.magenta : COLORS.violet;
    renderer.drawScreenLine(centerX, horizon, targetX, bottom, 1.1, color, 0.08);
  }
  renderer.drawScreenLine(left + 8, bottom - view.h * 0.12, right - 8, bottom - view.h * 0.12, 4.2, COLORS.gold, 0.18);
  renderer.drawScreenLine(left + view.w * 0.08, bottom, centerX, horizon, 2.4, COLORS.cyan, 0.12);
  renderer.drawScreenLine(right - view.w * 0.08, bottom, centerX, horizon, 2.4, COLORS.gold, 0.1);
}

function drawCircuitSilhouette() {
  renderer.setBlend("normal");
  const baseY = WORLD.h * 0.66;
  for (let i = 0; i < 14; i += 1) {
    const x = (i * 113) % (WORLD.w + 160) - 80;
    const h = 38 + ((i * 37) % 78);
    renderer.drawWorldRect(x, baseY - h, 34 + (i % 4) * 16, h, COLORS.ink, 0.28);
    renderer.drawWorldLine(x, baseY - h, x + 80, baseY - h - 18, 1.2, COLORS.violet, 0.08);
  }
  renderer.setBlend("add");
  for (let i = 0; i < 7; i += 1) {
    const y = WORLD.h * (0.73 + i * 0.032);
    renderer.drawWorldLine(36, y, WORLD.w - 36, y, 1.4, i % 2 ? COLORS.gold : COLORS.cyan, 0.06);
  }
}

function drawWells() {
  for (const well of state.wells) {
    const pulse = 0.5 + Math.sin(state.time * 4 + well.age) * 0.5;
    const active = isWellSuctionActive(well);
    const suction = active ? clamp(well.suction ?? 0, 0, 1) : 0;
    const sink = (well.sinkPulse ?? 0) * (0.4 + suction * 0.6);
    const danger = active ? 0.42 + suction * 0.58 : 0.18;
    const spin = well.age + state.time * (0.62 + danger * 1.95 + sink * 1.65);
    const color = well.flash > 0 ? COLORS.white : COLORS.violet;
    renderer.setBlend("add");
    renderer.drawWorldImage(GL_IMAGES.glow, well.x, well.y, WELL_GRAVITY_RADIUS * 1.16 + pulse * 36 + sink * 82, WELL_GRAVITY_RADIUS * 1.16 + pulse * 36 + sink * 82, 0, 0.025 + danger * 0.08 + sink * 0.1, { color: COLORS.violet });
    renderer.drawWorldImage(GL_IMAGES.glow, well.x, well.y, 304 + pulse * 58 + sink * 54, 304 + pulse * 58 + sink * 54, 0, 0.1 + danger * 0.2 + sink * 0.12, { color: COLORS.violet });
    renderer.drawWorldImage(GL_IMAGES.glow, well.x, well.y, 188 + pulse * 24 + sink * 30, 188 + pulse * 24 + sink * 30, 0, 0.1 + danger * 0.16 + sink * 0.08, { color: COLORS.cyan });
    renderer.drawWorldRing(well.x, well.y, WELL_GRAVITY_RADIUS + pulse * 10, 1.2, COLORS.violet, 0.012 + danger * 0.05 + sink * 0.04, 96);
    renderer.drawWorldRing(well.x, well.y, WELL_CAPTURE_RADIUS + pulse * 7 + sink * 18, 2.1 + sink * 1.2, COLORS.magenta, 0.08 + danger * 0.22 + sink * 0.22, 72);
    renderer.drawWorldRing(well.x, well.y, 118 + pulse * 18 + sink * 14, 3.2 + sink * 1.4, color, 0.18 + danger * 0.28 + sink * 0.28);
    renderer.drawWorldRing(well.x, well.y, WELL_EVENT_RADIUS + 11 + pulse * 5 + sink * 10, 2.6 + sink * 2.2, COLORS.gold, 0.34 + sink * 0.34, 28);
    renderer.setBlend("normal");
    renderer.drawWorldCircle(well.x, well.y, 62 + pulse * 3 + sink * 9, COLORS.ink, 0.62 + sink * 0.16, 42);
    if (!renderer.drawLitWorldImage(GL_IMAGES.sprites["gravity-well"], well.x, well.y, 112 + pulse * 8 + sink * 8, 112 + pulse * 8 + sink * 8, spin, well.flash > 0 ? 1 : 0.94, { normalStrength: 1.05 + sink * 0.18 })) {
      renderer.drawAtlas("gravity-well", well.x, well.y, 112 + pulse * 8 + sink * 8, 112 + pulse * 8 + sink * 8, spin, COLORS.white, well.flash > 0 ? 1 : 0.92);
    }
    renderer.setBlend("add");
    for (let i = 0; i < 5; i += 1) {
      const radius = WELL_CORE_RADIUS + 17 + i * 10 + pulse * 4 + sink * 7;
      const start = spin + i * 1.18;
      const end = start + Math.PI * (0.92 + i * 0.13);
      renderer.drawWorldArc(well.x, well.y, radius, start, end, 2.4 + i * 0.3 + sink * 1.1, i % 2 ? COLORS.cyan : COLORS.violet, 0.76 + sink * 0.2);
    }
    renderer.drawWorldCircle(well.x, well.y, WELL_EVENT_RADIUS + pulse * 3 + sink * 7, COLORS.ink, 0.34 + sink * 0.25, 42);
    renderer.drawWorldRing(well.x, well.y, WELL_EVENT_RADIUS + pulse * 4 + sink * 8, 3 + sink * 2, COLORS.cyan, 0.48 + sink * 0.28, 44);
    renderer.drawWorldCircle(well.x, well.y, WELL_CORE_RADIUS + pulse * 4 + sink * 5, COLORS.ink, 0.86, 32);
    renderer.drawWorldCircle(well.x, well.y, 8 + pulse * 3 + sink * 5, COLORS.white, 0.12 + sink * 0.2, 24);

    const health = clamp(well.hp / well.maxHp, 0, 1);
    renderer.drawWorldRect(well.x - 32, well.y + 58, 64, 4, COLORS.white, 0.16);
    renderer.drawWorldRect(well.x - 32, well.y + 58, 64 * health, 4, COLORS.cyan, 0.88);
    renderer.setBlend("normal");
    state.entitiesDrawn += 1;
  }
}

function drawPickups() {
  renderer.setBlend("add");
  for (const pickup of state.pickups) {
    const s = 1 + Math.sin(pickup.age * 8) * 0.16;
    renderer.drawWorldImage(GL_IMAGES.glow, pickup.x, pickup.y, 66 * s, 66 * s, pickup.age, 0.24, { color: COLORS.lime });
    renderer.drawWorldImage(GL_IMAGES.glow, pickup.x, pickup.y, 34 * s, 34 * s, -pickup.age, 0.18, { color: COLORS.gold });
    drawRotatedPoly(pickup.x, pickup.y, pickup.age * 3, [
      { x: 0, y: -12 * s },
      { x: 10 * s, y: 0 },
      { x: 0, y: 12 * s },
      { x: -10 * s, y: 0 }
    ], COLORS.lime, 0.38);
    renderer.drawWorldRing(pickup.x, pickup.y, 13 * s, 1.4, COLORS.lime, 0.76, 4);
    state.entitiesDrawn += 1;
  }
  renderer.setBlend("normal");
}

function drawForgePulses() {
  if (!state.forge?.worldPulses.length) return;
  renderer.setBlend("add");
  for (const pulse of state.forge.worldPulses) {
    const t = clamp(pulse.life / pulse.maxLife, 0, 1);
    const open = 1 - t;
    const size = 72 + open * 112;
    const wobble = Math.sin(state.time * 8 + pulse.seed) * 0.08;
    renderer.drawWorldImage(GL_IMAGES.glow, pulse.x, pulse.y, size * 1.5, size * 1.5, 0, t * 0.22, { color: pulse.color });
    renderer.drawWorldImage(GL_IMAGES.forgeCore, pulse.x, pulse.y, size, size, state.time * 0.28 + wobble, t * 0.46, { color: pulse.color });
    renderer.drawWorldRing(pulse.x, pulse.y, 34 + open * 82, 2.4 + open * 4, pulse.color, t * 0.72, 40);
    renderer.drawWorldRing(pulse.x, pulse.y, 58 + open * 124, 1.2, COLORS.gold, t * 0.42, 8);
    state.entitiesDrawn += 1;
  }
  renderer.setBlend("normal");
}

function drawBullets() {
  renderer.setBlend("add");
  for (const bullet of state.bullets) {
    const v = normalize(bullet.vx, bullet.vy) ?? { x: 1, y: 0 };
    const side = { x: -v.y, y: v.x };
    const playerTint = bullet.color ?? COLORS.cyan;
    const angle = Math.atan2(v.y, v.x);
    const age = bullet.age ?? 0;
    const life = clamp(bullet.life / (bullet.maxLife ?? 1.15), 0, 1);
    const flicker = 0.84 + Math.sin(age * 54 + bullet.x * 0.025) * 0.16;
    const pulse = 0.88 + Math.sin(age * 31) * 0.12;
    const headX = bullet.x + v.x * 11;
    const headY = bullet.y + v.y * 11;
    const tailX = bullet.x - v.x * 42;
    const tailY = bullet.y - v.y * 42;
    const battleshipGlow = life * flicker;

    renderer.drawWorldImage(GL_IMAGES.glow, bullet.x - v.x * 8, bullet.y - v.y * 8, 128 * pulse, 82 * pulse, angle, 0.24 * flicker * life, { color: COLORS.flame });
    renderer.drawWorldImage(GL_IMAGES.glow, bullet.x - v.x * 2, bullet.y - v.y * 2, 78 * pulse, 48 * pulse, angle, 0.3 * life, { color: COLORS.orange });
    renderer.drawWorldImage(GL_IMAGES.glow, headX, headY, 42 * pulse, 34 * pulse, angle, 0.28 * flicker, { color: COLORS.heatBlue });
    renderer.drawWorldImage(GL_IMAGES.glow, bullet.x - v.x * 18, bullet.y - v.y * 18, 118 * pulse, 32 * pulse, angle, 0.16 * battleshipGlow, { color: playerTint });
    renderer.drawWorldLine(tailX - side.x * 7, tailY - side.y * 7, bullet.x + v.x * 17 - side.x * 2, bullet.y + v.y * 17 - side.y * 2, 3.4, COLORS.cyan, 0.35 * battleshipGlow);
    renderer.drawWorldLine(tailX + side.x * 7, tailY + side.y * 7, bullet.x + v.x * 17 + side.x * 2, bullet.y + v.y * 17 + side.y * 2, 3.4, COLORS.gold, 0.34 * battleshipGlow);
    renderer.drawWorldRing(bullet.x - v.x * 4, bullet.y - v.y * 4, 9.2 * pulse, 1.7, playerTint, 0.58 * battleshipGlow, 18);
    renderer.drawWorldLine(tailX, tailY, bullet.x + v.x * 18, bullet.y + v.y * 18, 12, COLORS.flame, 0.22 * flicker);
    renderer.drawWorldLine(bullet.x - v.x * 34, bullet.y - v.y * 34, bullet.x + v.x * 20, bullet.y + v.y * 20, 7.2, COLORS.orange, 0.52 * flicker);
    renderer.drawWorldLine(bullet.x - v.x * 22, bullet.y - v.y * 22, bullet.x + v.x * 18, bullet.y + v.y * 18, 4.4, COLORS.ember, 0.66);
    renderer.drawWorldLine(bullet.x - v.x * 9, bullet.y - v.y * 9, bullet.x + v.x * 15, bullet.y + v.y * 15, 2, COLORS.white, 0.95);
    renderer.drawWorldLine(
      bullet.x - v.x * 30 + side.x * 4,
      bullet.y - v.y * 30 + side.y * 4,
      bullet.x - v.x * 11 + side.x * 1.5,
      bullet.y - v.y * 11 + side.y * 1.5,
      1.6,
      COLORS.gold,
      0.34 * flicker
    );
    renderer.drawWorldLine(
      bullet.x - v.x * 28 - side.x * 3.5,
      bullet.y - v.y * 28 - side.y * 3.5,
      bullet.x - v.x * 13 - side.x,
      bullet.y - v.y * 13 - side.y,
      1.2,
      playerTint,
      0.28
    );
    if (!renderer.drawLitWorldImage(GL_IMAGES.sprites.missile, bullet.x, bullet.y, 52, 28, angle, 0.92, { color: COLORS.orange, normalStrength: 1.14 })) {
      renderer.drawAtlas("missile", bullet.x, bullet.y, 46, 24, angle, COLORS.orange, 0.88);
    }
    renderer.drawWorldCircle(headX, headY, bullet.r + 2.4, COLORS.white, 0.72, 14);
    renderer.drawWorldCircle(bullet.x - v.x * 4, bullet.y - v.y * 4, bullet.r + 4.5, COLORS.flame, 0.34 * flicker, 14);
  }
  renderer.setBlend("normal");
  state.entitiesDrawn += state.bullets.length;
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    const spec = ENEMY[enemy.type];
    const color = enemy.flash > 0 ? COLORS.white : spec.color;
    const angle = enemy.age * (enemy.type === "lancer" ? 1.8 : 2.6) + enemy.seed;
    const scale = enemy.type === "mayfly" ? 2.9 : enemy.type === "lancer" ? 4.4 : 3.45;
    const sprite = SPRITE_FOR_ENEMY[enemy.type] ?? "enemy-grunt";
    renderer.setBlend("add");
    renderer.drawWorldImage(GL_IMAGES.glow, enemy.x, enemy.y, spec.r * scale * 1.72, spec.r * scale * 1.72, angle, enemy.type === "mayfly" ? 0.14 : 0.22, { color });
    renderer.drawWorldImage(GL_IMAGES.glow, enemy.x, enemy.y, spec.r * scale * 0.92, spec.r * scale * 0.92, -angle, enemy.flash > 0 ? 0.24 : 0.1, { color: COLORS.white });
    renderer.setBlend("normal");
    drawEnemyPlate(enemy, spec, color, angle);
    if (!renderer.drawLitWorldImage(GL_IMAGES.sprites[sprite], enemy.x, enemy.y, spec.r * scale, spec.r * scale, angle, enemy.flash > 0 ? 1 : 0.96, { color, normalStrength: enemy.type === "mayfly" ? 0.72 : 1.12 })) {
      renderer.drawAtlas(sprite, enemy.x, enemy.y, spec.r * scale, spec.r * scale, angle, COLORS.white, enemy.flash > 0 ? 1 : 0.94);
    }
    renderer.setBlend("add");
    renderer.drawWorldRing(enemy.x, enemy.y, spec.r * (enemy.type === "mayfly" ? 1.45 : 1.92), enemy.type === "mayfly" ? 1.2 : 2.6, color, enemy.type === "mayfly" ? 0.54 : 0.72, enemy.type === "splitter" ? 4 : 34);
    renderer.drawWorldRing(enemy.x, enemy.y, spec.r * (enemy.type === "mayfly" ? 0.9 : 1.2), 1.2, COLORS.white, enemy.flash > 0 ? 0.8 : 0.22, 20);
    if (enemy.type === "wanderer") drawDiamond(enemy, spec.r, color);
    else if (enemy.type === "seeker") drawTriangle(enemy, spec.r + 2, color, angle);
    else if (enemy.type === "splitter") drawSquare(enemy, spec.r, color, angle);
    else if (enemy.type === "lancer") drawLancer(enemy, color);
    else drawMayfly(enemy, spec.r, color);
    renderer.setBlend("normal");
    state.entitiesDrawn += 1;
  }
}

function drawEnemyPlate(enemy, spec, color, angle) {
  const darkRadius = spec.r * (enemy.type === "mayfly" ? 1.75 : 2.2);
  const flash = enemy.flash > 0 ? 1 : 0;
  const edgeSegments = enemy.type === "splitter" ? 4 : enemy.type === "mayfly" ? 14 : 20;
  renderer.drawWorldCircle(enemy.x + 2, enemy.y + 5, darkRadius + (enemy.type === "mayfly" ? 2 : 5), COLORS.ink, enemy.type === "mayfly" ? 0.68 : 0.82, 34);
  renderer.drawWorldRing(enemy.x, enemy.y, darkRadius + 2, enemy.type === "mayfly" ? 2 : 3.2, COLORS.white, flash ? 0.72 : 0.24, edgeSegments);
  renderer.drawWorldRing(enemy.x, enemy.y, darkRadius - 2, enemy.type === "mayfly" ? 1.6 : 2.4, color, enemy.type === "mayfly" ? 0.76 : 0.9, edgeSegments);
  renderer.setBlend("add");
  if (enemy.type === "lancer") {
    const v = normalize(enemy.vx, enemy.vy) ?? { x: Math.cos(angle), y: Math.sin(angle) };
    renderer.drawWorldLine(enemy.x - v.x * 44, enemy.y - v.y * 44, enemy.x + v.x * 52, enemy.y + v.y * 52, enemy.chargeTime > 0 ? 6 : 3.6, color, enemy.chargeTime > 0 ? 0.72 : 0.32);
  } else if (enemy.type === "splitter") {
    renderer.drawWorldRing(enemy.x, enemy.y, spec.r * 2.35, 1.2, COLORS.gold, 0.34, 4);
  } else if (enemy.type === "seeker") {
    const nose = rotatePoint(spec.r * 2.1, 0, angle, enemy.x, enemy.y);
    renderer.drawWorldLine(enemy.x, enemy.y, nose.x, nose.y, 2.4, COLORS.white, 0.42);
  } else if (enemy.type === "mayfly") {
    renderer.drawWorldLine(enemy.x - spec.r * 2.2, enemy.y, enemy.x + spec.r * 2.2, enemy.y, 1.6, COLORS.white, 0.26);
  } else {
    renderer.drawWorldRing(enemy.x, enemy.y, spec.r * 2.12, 1.4, COLORS.cyan, 0.22, 4);
  }
  renderer.setBlend("normal");
}

function drawDiamond(enemy, r, color) {
  drawRotatedOutline(enemy.x, enemy.y, enemy.age * 2.6 + enemy.seed, [
    { x: 0, y: -r },
    { x: r, y: 0 },
    { x: 0, y: r },
    { x: -r, y: 0 }
  ], color, 2.4, 0.76, true);
}

function drawTriangle(enemy, r, color, angle) {
  drawRotatedOutline(enemy.x, enemy.y, angle, [
    { x: r, y: 0 },
    { x: -r * 0.72, y: -r * 0.82 },
    { x: -r * 0.42, y: 0 },
    { x: -r * 0.72, y: r * 0.82 }
  ], color, 2.6, 0.74, true);
}

function drawSquare(enemy, r, color, angle) {
  drawRotatedOutline(enemy.x, enemy.y, angle, [
    { x: -r, y: -r },
    { x: r, y: -r },
    { x: r, y: r },
    { x: -r, y: r }
  ], color, 2.6, 0.7, true);
  const a = rotatePoint(-r, 0, angle, enemy.x, enemy.y);
  const b = rotatePoint(r, 0, angle, enemy.x, enemy.y);
  const c = rotatePoint(0, -r, angle, enemy.x, enemy.y);
  const d = rotatePoint(0, r, angle, enemy.x, enemy.y);
  renderer.drawWorldLine(a.x, a.y, b.x, b.y, 2, color, 0.56);
  renderer.drawWorldLine(c.x, c.y, d.x, d.y, 2, color, 0.56);
}

function drawLancer(enemy, color) {
  const charge = enemy.chargeTime > 0 ? 1 : 0;
  const angle = Math.atan2(enemy.vy, enemy.vx);
  const tail = rotatePoint(-30, 0, angle, enemy.x, enemy.y);
  const nose = rotatePoint(34, 0, angle, enemy.x, enemy.y);
  renderer.drawWorldLine(tail.x, tail.y, nose.x, nose.y, charge ? 5 : 3, color, charge ? 0.96 : 0.74);
  drawRotatedOutline(enemy.x, enemy.y, angle, [
    { x: 34, y: 0 },
    { x: 15, y: -12 },
    { x: 18, y: 0 },
    { x: 15, y: 12 }
  ], color, 2, 0.7, true);
}

function drawMayfly(enemy, r, color) {
  renderer.drawWorldCircle(enemy.x, enemy.y, r, color, 0.38, 18);
  renderer.drawWorldRing(enemy.x, enemy.y, r + 2, 1.3, color, 0.8, 18);
  renderer.drawWorldLine(enemy.x - r - 6, enemy.y, enemy.x + r + 6, enemy.y, 1.4, color, 0.72);
}

function drawPlayers() {
  if (state.status === "menu") return;
  for (const p of state.players) {
    if (!p.active) continue;
    const blink = p.invuln > 0 && Math.floor(state.time * 14) % 2 === 0;
    const alpha = blink ? 0.38 : 1;
    const speed = Math.hypot(p.vx, p.vy);
    const thrust = clamp(speed / 260, 0, 1);
    const shotWindow = Math.max(0.065, 0.115 - state.levelIndex * 0.004);
    const fireFlash = p.shotTimer > 0 ? clamp(p.shotTimer / shotWindow, 0, 1) : 0;
    renderer.setBlend("add");
    renderer.drawWorldImage(GL_IMAGES.glow, p.x, p.y, 112, 112, p.angle, 0.22 * alpha, { color: p.color });
    renderer.drawWorldImage(GL_IMAGES.glow, p.x, p.y, 58, 58, -p.angle, 0.1 * alpha, { color: COLORS.white });
    if (thrust > 0.05) drawPlayerEngineTrail(p, thrust, alpha);
    renderer.setBlend("normal");
    const variant = PLAYER_VARIANTS[p.id % PLAYER_VARIANTS.length];
    renderer.drawWorldCircle(p.x + 2, p.y + 5, 31, COLORS.ink, 0.48 * alpha, 34);
    if (!renderer.drawLitWorldImage(GL_IMAGES.sprites.player, p.x, p.y, 62 * variant.sx, 62 * variant.sy, p.angle, alpha, { color: p.color, normalStrength: 1.18 })) {
      renderer.drawAtlas("player", p.x, p.y, 60 * variant.sx, 60 * variant.sy, p.angle, COLORS.white, alpha);
    }
    drawLottoMindBattleshipHull(p, variant, alpha);
    renderer.setBlend("add");
    drawPlayerVariant(p, variant, alpha);
    drawLottoMindBattleshipLights(p, variant, alpha, fireFlash);
    renderer.drawWorldArc(p.x, p.y, 26 + Math.sin(state.time * 8 + p.id) * 2, -0.9 + p.angle, 0.9 + p.angle, 2.2, p.color, 0.92 * alpha);
    renderer.setBlend("normal");
    state.entitiesDrawn += 1;
  }
}

function drawLottoMindBattleshipHull(player, variant, alpha) {
  const wing = 18 + variant.wing * 2.4;
  const hull = [
    { x: 37, y: 0 },
    { x: 18, y: -10 },
    { x: -2, y: -wing },
    { x: -34, y: -14 },
    { x: -28, y: -5 },
    { x: -38, y: 0 },
    { x: -28, y: 5 },
    { x: -34, y: 14 },
    { x: -2, y: wing },
    { x: 18, y: 10 }
  ];
  drawRotatedPoly(player.x, player.y, player.angle, hull, COLORS.ink, 0.58 * alpha);
  drawRotatedOutline(player.x, player.y, player.angle, hull, COLORS.white, 2.6, 0.58 * alpha, false);
  drawRotatedOutline(player.x, player.y, player.angle, hull, player.color, 1.4, 0.7 * alpha, false);
  drawRotatedLine(player.x, player.y, player.angle, -24, -7, 18, -4, 1.5, COLORS.gold, 0.36 * alpha);
  drawRotatedLine(player.x, player.y, player.angle, -24, 7, 18, 4, 1.5, COLORS.gold, 0.36 * alpha);
  drawRotatedLine(player.x, player.y, player.angle, -8, 0, 30, 0, 1.8, COLORS.white, 0.24 * alpha);
}

function drawLottoMindBattleshipLights(player, variant, alpha, fireFlash) {
  const cannonY = 12 + variant.wing * 1.4;
  const fire = clamp(fireFlash, 0, 1);
  const flicker = 0.82 + Math.sin(state.time * 72 + player.id * 2.8) * 0.18;
  const bridge = rotatePoint(2, 0, player.angle, player.x, player.y);
  const nose = rotatePoint(36, 0, player.angle, player.x, player.y);

  renderer.drawWorldRing(bridge.x, bridge.y, 12, 1.8, COLORS.gold, 0.56 * alpha, 18);
  renderer.drawWorldCircle(bridge.x, bridge.y, 7.2, COLORS.ink, 0.42 * alpha, 18);
  renderer.drawWorldCircle(bridge.x, bridge.y, 4.5, player.color, 0.54 * alpha, 16);
  drawRotatedLine(player.x, player.y, player.angle, -3, 6, 8, -6, 2.4, COLORS.magenta, 0.82 * alpha);
  drawRotatedLine(player.x, player.y, player.angle, 2, 7, 13, -6, 1.8, COLORS.cyan, 0.82 * alpha);
  for (let i = 0; i < 4; i += 1) {
    const port = rotatePoint(-16 + i * 6, -18, player.angle, player.x, player.y);
    renderer.drawWorldCircle(port.x, port.y, 1.8, i % 2 ? COLORS.cyan : COLORS.gold, 0.62 * alpha, 8);
  }

  renderer.drawWorldImage(GL_IMAGES.glow, nose.x, nose.y, 46 + fire * 22, 32 + fire * 16, player.angle, (0.12 + fire * 0.22) * alpha, { color: COLORS.heatBlue });
  renderer.drawWorldCircle(nose.x, nose.y, 3.5 + fire * 2, COLORS.white, (0.46 + fire * 0.34) * alpha, 12);

  for (const sideSign of [-1, 1]) {
    const color = sideSign < 0 ? COLORS.cyan : COLORS.gold;
    drawRotatedLine(player.x, player.y, player.angle, 3, sideSign * cannonY, 40, sideSign * (cannonY * 0.7), 4.2, COLORS.ink, 0.46 * alpha);
    drawRotatedLine(player.x, player.y, player.angle, 8, sideSign * cannonY, 39, sideSign * (cannonY * 0.7), 2.5, color, 0.78 * alpha);
    const muzzle = rotatePoint(43, sideSign * (cannonY * 0.68), player.angle, player.x, player.y);
    renderer.drawWorldCircle(muzzle.x, muzzle.y, 3.2 + fire * 4, COLORS.white, (0.34 + fire * 0.46) * alpha, 12);
    renderer.drawWorldImage(GL_IMAGES.glow, muzzle.x, muzzle.y, 34 + fire * 42, 22 + fire * 22, player.angle, (0.12 + fire * 0.2) * flicker * alpha, { color });
    if (fire > 0.05) {
      drawRotatedLine(player.x, player.y, player.angle, 42, sideSign * (cannonY * 0.68), 82 + fire * 18, sideSign * (cannonY * 0.34), 8 * fire, color, 0.24 * fire * alpha);
      drawRotatedLine(player.x, player.y, player.angle, 42, sideSign * (cannonY * 0.68), 68 + fire * 16, sideSign * (cannonY * 0.44), 3.4 * fire, COLORS.white, 0.5 * fire * alpha);
    }
  }
}

function drawPlayerEngineTrail(player, thrust, alpha) {
  const flicker = Math.sin(state.time * 48 + player.id * 7.3) * 0.5 + Math.sin(state.time * 83 + player.id * 2.1) * 0.5;
  const plume = 52 + thrust * 42 + flicker * 8;
  const width = 11 + thrust * 8 + Math.abs(flicker) * 2;
  const center = rotatePoint(-32 - plume * 0.38, flicker * 1.5, player.angle, player.x, player.y);
  const alphaScale = alpha * (0.62 + thrust * 0.38);

  renderer.drawWorldImage(GL_IMAGES.glow, center.x, center.y, plume * 1.52, width * 4.2, player.angle, 0.13 * alphaScale, { color: COLORS.flame });
  renderer.drawWorldImage(GL_IMAGES.glow, center.x, center.y, plume * 1.08, width * 2.65, player.angle, 0.1 * alphaScale, { color: player.color });

  drawThrusterFlame(player, plume, width, COLORS.ember, 0.28 * alphaScale, flicker * 3.4, 1);
  drawThrusterFlame(player, plume * 0.82, width * 0.68, COLORS.flame, 0.48 * alphaScale, -flicker * 2.1, 0.78);
  drawThrusterFlame(player, plume * 0.58, width * 0.38, COLORS.orange, 0.66 * alphaScale, flicker * 1.3, 0.54);
  drawThrusterFlame(player, plume * 0.36, width * 0.16, COLORS.white, 0.86 * alphaScale, -flicker * 0.8, 0.32);

  const nozzle = rotatePoint(-27, 0, player.angle, player.x, player.y);
  renderer.drawWorldImage(GL_IMAGES.glow, nozzle.x, nozzle.y, 34 + thrust * 12, 24 + thrust * 8, player.angle, 0.24 * alphaScale, { color: COLORS.heatBlue });
  renderer.drawWorldCircle(nozzle.x, nozzle.y, 4.5 + thrust * 1.5, COLORS.white, 0.58 * alphaScale, 12);

  for (let i = 0; i < 4; i += 1) {
    const t = (i + 1) / 5;
    const side = i % 2 === 0 ? -1 : 1;
    const drift = Math.sin(state.time * (10 + i * 3) + player.id + i) * 4;
    const ember = rotatePoint(-34 - plume * t, side * (width * 0.22 + t * width * 0.28) + drift, player.angle, player.x, player.y);
    const emberSize = (2.2 + thrust * 2.6) * (1 - t * 0.28);
    renderer.drawWorldCircle(ember.x, ember.y, emberSize, i === 1 ? COLORS.orange : COLORS.flame, (0.42 - t * 0.14) * alphaScale, 10);
  }
}

function drawThrusterFlame(player, length, width, color, alpha, wobble, taper) {
  const tip = -30 - length;
  const shoulder = -28 - length * 0.16;
  const neck = -25;
  drawRotatedPoly(player.x, player.y, player.angle, [
    { x: neck, y: -width * 0.34 },
    { x: shoulder, y: -width },
    { x: tip, y: wobble },
    { x: shoulder, y: width * 0.88 },
    { x: neck, y: width * 0.3 }
  ], color, alpha);
  const coreTip = -30 - length * taper;
  renderer.drawWorldLine(
    rotatePoint(neck, 0, player.angle, player.x, player.y).x,
    rotatePoint(neck, 0, player.angle, player.x, player.y).y,
    rotatePoint(coreTip, wobble * 0.45, player.angle, player.x, player.y).x,
    rotatePoint(coreTip, wobble * 0.45, player.angle, player.x, player.y).y,
    Math.max(1.2, width * 0.24),
    color,
    Math.min(0.9, alpha * 1.18)
  );
}

function drawPlayerVariant(player, variant, alpha) {
  const common = [
    { x: 25, y: 0 },
    { x: -15, y: -15 },
    { x: -8, y: 0 },
    { x: -15, y: 15 }
  ];
  const shapes = {
    arrow: common,
    scythe: [
      { x: 25, y: 0 },
      { x: -12, y: -18 },
      { x: -19, y: -6 },
      { x: -7, y: 0 },
      { x: -19, y: 6 },
      { x: -12, y: 18 }
    ],
    kite: [
      { x: 27, y: 0 },
      { x: -5, y: -20 },
      { x: -20, y: 0 },
      { x: -5, y: 20 }
    ],
    comet: [
      { x: 24, y: 0 },
      { x: -8, y: -13 },
      { x: -23, y: -8 },
      { x: -12, y: 0 },
      { x: -23, y: 8 },
      { x: -8, y: 13 }
    ]
  };
  drawRotatedOutline(player.x, player.y, player.angle, shapes[variant.name] ?? common, COLORS.white, 2.6, 0.86 * alpha, true);
  const left = rotatePoint(-20, -variant.wing * 4, player.angle, player.x, player.y);
  const right = rotatePoint(-20, variant.wing * 4, player.angle, player.x, player.y);
  const tail = rotatePoint(-34 - variant.wing * 2, 0, player.angle, player.x, player.y);
  renderer.drawWorldLine(tail.x, tail.y, left.x, left.y, 2.2, player.color, 0.78 * alpha);
  renderer.drawWorldLine(tail.x, tail.y, right.x, right.y, 2.2, player.color, 0.78 * alpha);

  const markX = player.x - player.id * 3;
  const markY = player.y + 34;
  if (variant.glyph === "ring") {
    renderer.drawWorldRing(markX, markY, 5, 1.6, player.color, 0.9 * alpha, 18);
  } else if (variant.glyph === "tri") {
    drawRotatedOutline(markX, markY, 0, [{ x: 0, y: -5 }, { x: 5, y: 4 }, { x: -5, y: 4 }], player.color, 1.6, 0.9 * alpha, false);
  } else if (variant.glyph === "dash") {
    renderer.drawWorldLine(markX - 7, markY, markX + 7, markY, 2, player.color, 0.9 * alpha);
    renderer.drawWorldLine(markX - 7, markY + 5, markX + 7, markY + 5, 2, player.color, 0.65 * alpha);
  } else {
    for (let i = 0; i <= player.id; i += 1) {
      renderer.drawWorldCircle(player.x - player.id * 3 + i * 6, player.y + 34, 2.4, player.color, 0.9 * alpha, 10);
    }
  }
}

function drawParticles() {
  renderer.setBlend("add");
  for (const p of state.particles) {
    const t = clamp(p.life / p.maxLife, 0, 1);
    if (p.ring) {
      renderer.drawWorldImage(GL_IMAGES.glow, p.x, p.y, (p.size + (1 - t) * p.speed) * 2.6, (p.size + (1 - t) * p.speed) * 2.6, 0, t * 0.08, { color: p.color });
      renderer.drawWorldRing(p.x, p.y, p.size + (1 - t) * p.speed, 3.6, p.color, t * 0.9);
      renderer.drawWorldRing(p.x, p.y, p.size * 0.55 + (1 - t) * p.speed * 0.45, 1.2, COLORS.white, t * 0.28);
    } else {
      renderer.drawWorldImage(GL_IMAGES.glow, p.x, p.y, p.size * (8 + t * 8), p.size * (8 + t * 8), 0, t * 0.06, { color: p.color });
      renderer.drawWorldCircle(p.x, p.y, p.size * (0.7 + t), p.color, t * 0.68, 12);
      renderer.drawWorldCircle(p.x, p.y, Math.max(1.4, p.size * 0.38), COLORS.white, t * 0.22, 10);
    }
  }
  renderer.setBlend("normal");
}

function drawBombWave() {
  if (state.bombWave <= 0) return;
  const p = state.bombOrigin ?? state.player;
  const radius = (1 - state.bombWave) * 820 + 60;
  renderer.setBlend("add");
  if (!renderer.drawLitWorldImage(GL_IMAGES.sprites["bomb-pulse"], p.x, p.y, radius * 2.1, radius * 2.1, state.time * 0.35, state.bombWave * 0.28, { color: p.color ?? COLORS.magenta, normalStrength: 0.9 })) {
    renderer.drawAtlas("bomb-pulse", p.x, p.y, radius * 2.1, radius * 2.1, state.time * 0.35, p.color ?? COLORS.magenta, state.bombWave * 0.22);
  }
  renderer.drawWorldImage(GL_IMAGES.glow, p.x, p.y, radius * 2.7, radius * 2.7, 0, state.bombWave * 0.12, { color: p.color ?? COLORS.magenta });
  renderer.drawWorldRing(p.x, p.y, radius, 7.5, p.color ?? COLORS.magenta, state.bombWave);
  renderer.drawWorldRing(p.x, p.y, radius * 0.72, 2.4, COLORS.white, state.bombWave * 0.28);
  renderer.setBlend("normal");
}

function drawBanner() {
  const bannerLive = state.banner.timer > 0;
  const transitionLive = state.transitionTimer > 0;
  if (!bannerLive && !transitionLive) {
    bannerText.hidden = true;
    return;
  }
  const text = bannerLive ? state.banner.text : STR.cleared;
  bannerText.hidden = false;
  bannerText.textContent = text;
  bannerText.style.opacity = String(bannerLive ? clamp(state.banner.timer / 0.5, 0, 1) : clamp(state.transitionTimer / 0.4, 0, 1));
}

function drawLetterbox() {
  renderer.setBlend("normal");
  if (view.x > 0) {
    renderer.drawScreenRect(0, 0, view.x, view.cssH, COLORS.ink, 0.86);
    renderer.drawScreenRect(view.x + view.w, 0, view.x + 2, view.cssH, COLORS.ink, 0.86);
  }
  if (view.y > 0) {
    renderer.drawScreenRect(0, 0, view.cssW, view.y, COLORS.ink, 0.86);
    renderer.drawScreenRect(0, view.y + view.h, view.cssW, view.y + 2, COLORS.ink, 0.86);
  }
}

function updateHud() {
  hud.score.textContent = formatNumber(state.score);
  hud.level.textContent = String(Math.min(state.levelIndex + 1, LEVELS.length));
  const profile = currentLevel();
  let liveEnemies = 0;
  let liveWells = 0;
  for (const enemy of state.enemies) {
    if (!enemy.dead) liveEnemies += 1;
  }
  for (const well of state.wells) {
    if (!well.dead) liveWells += 1;
  }
  const remaining = Math.max(0, profile.quota - state.killed, liveEnemies) + liveWells;
  hud.objective.textContent = String(remaining);
  hud.lives.textContent = String(state.team.lives);
  hud.bombs.textContent = String(state.team.bombs);
  hud.multiplier.textContent = `${STR.multiplier}${state.team.multiplier}`;
  hud.status.textContent = state.status === "running" ? `${currentLevel().name} - ${state.playerCount}P` : statusText();
  hud.best.textContent = `${STR.best}: ${formatNumber(state.best)}`;
  setControlAvailability(pauseAction, state.status === "running" || state.status === "paused", { hide: true });
  setControlAvailability(bombAction, state.status === "running", { hide: true });
  updateForgePanels();
}

function statusText() {
  if (state.status === "paused") return STR.paused;
  if (state.status === "gameover") return STR.gameOver;
  if (state.status === "victory") return STR.victory;
  return STR.runReady;
}

function updateOverlay() {
  requestStaticFrame();
  soundAction.textContent = bus.muted ? STR.soundOff : STR.soundOn;
  soundAction.setAttribute("aria-label", STR.muteButton);
  soundAction.setAttribute("aria-pressed", String(!bus.muted));
  soundAction.title = bus.muted ? "Sound is off. Click to turn sound on." : "Sound is on. Click to mute.";
  if (state.status === "running") {
    hideOverlay();
    return;
  }
  setRegionAvailability(overlay, true, { hide: true });
  shell.dataset.mode = state.status;
  overlay.dataset.state = state.status;
  const menu = state.status === "menu";
  overlay.setAttribute("aria-labelledby", menu ? "menuTitle" : "overlayTitle");
  overlayTitle.hidden = menu;
  overlayCopy.hidden = menu;
  overlayTitle.textContent = menu ? STR.presenter : statusText();
  overlayCopy.textContent = state.status === "paused" ? STR.overlayPaused :
    state.status === "gameover" ? STR.overlayGameOver :
      state.status === "victory" ? STR.overlayVictory : STR.overlayReady;
  primaryAction.textContent = startPending ? STR.loading :
    state.status === "paused" ? STR.resume :
    state.status === "menu" ? STR.startButton : STR.restart;
  primaryAction.setAttribute("aria-label", primaryAction.textContent);
  setControlAvailability(primaryAction, true);
  primaryAction.disabled = startPending;
  primaryAction.tabIndex = startPending ? -1 : 0;
  if (startPending) primaryAction.setAttribute("aria-busy", "true");
  else primaryAction.removeAttribute("aria-busy");
  setControlAvailability(soundAction, true);
  homeAction.textContent = STR.selectPilots;
  homeAction.setAttribute("aria-label", STR.selectPilots);
  setControlAvailability(homeAction, state.status === "gameover" || state.status === "victory", { hide: true });

  setElementAvailability(controlsHint, menu, { hide: true });
  setRegionAvailability(playerChooser, menu, { hide: true });
  if (menu) buildPlayerChooser();
  if (menu && bus.unlocked && !bus.muted) bus.ensureStartupMusic();

  const showingStats = state.status === "gameover" || state.status === "victory";
  setElementAvailability(overlayStats, showingStats, { hide: true });
  if (showingStats) {
    overlayStats.textContent = `${STR.finalScore}: ${formatNumber(state.score)}  /  ${STR.players}: ${state.playerCount}  /  ${STR.level}: ${Math.min(state.levelIndex + 1, LEVELS.length)}`;
  } else {
    overlayStats.textContent = "";
  }
  updateForgePanels();
}

function hideOverlay() {
  setRegionAvailability(overlay, false, { hide: true });
  overlay.dataset.state = "running";
  shell.dataset.mode = "running";
}

function updateDev(now) {
  fpsFrames += 1;
  if (now - fpsAt >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsAt));
    fpsFrames = 0;
    fpsAt = now;
  }
  if (!devEnabled) return;
  devEl.textContent = `${STR.devLabel} ${fps} fps | e ${state.enemies.length} | b ${state.bullets.length} | p ${state.particles.length} | d ${state.entitiesDrawn}`;
}

function resize() {
  view.cssW = Math.max(1, innerWidth);
  view.cssH = Math.max(1, innerHeight);
  view.dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
  canvas.width = Math.floor(view.cssW * view.dpr);
  canvas.height = Math.floor(view.cssH * view.dpr);
  renderer.resize();
  const portraitPlay = view.cssW <= 720 && view.cssH > view.cssW * 1.22;
  view.cameraMode = portraitPlay;
  if (portraitPlay) {
    view.w = view.cssW;
    view.h = Math.min(view.cssH * 0.54, view.cssW * 1.18);
    view.x = 0;
    view.y = Math.max(128, Math.min(view.cssH * 0.25, view.cssH - view.h - 190));
    view.camH = WORLD.h;
    view.camW = view.camH * (view.w / view.h);
    view.scale = view.h / view.camH;
  } else {
    const scale = Math.min(view.cssW / WORLD.w, view.cssH / WORLD.h);
    view.scale = scale;
    view.w = WORLD.w * scale;
    view.h = WORLD.h * scale;
    view.x = (view.cssW - view.w) / 2;
    view.y = (view.cssH - view.h) / 2;
    view.camW = WORLD.w;
    view.camH = WORLD.h;
    view.camX = 0;
    view.camY = 0;
  }
  syncArenaCssVars();
  requestStaticFrame();
}

function syncArenaCssVars() {
  shell.style.setProperty("--arena-left", `${view.x}px`);
  shell.style.setProperty("--arena-top", `${view.y}px`);
  shell.style.setProperty("--arena-right", `${view.x + view.w}px`);
  shell.style.setProperty("--arena-bottom", `${view.y + view.h}px`);
  shell.style.setProperty("--arena-width", `${view.w}px`);
  shell.style.setProperty("--arena-height", `${view.h}px`);
  shell.dataset.forgeDock = view.y >= 130 ? "full" : "tight";
}

function updateCamera() {
  if (!view.cameraMode) {
    view.camX = 0;
    view.camY = 0;
    return;
  }
  const center = teamCenter();
  view.camX = clamp(center.x - view.camW / 2, 0, WORLD.w - view.camW);
  view.camY = clamp(center.y - view.camH / 2, 0, WORLD.h - view.camH);
}

function loadImage(path) {
  const image = new Image();
  image.decoding = "async";
  image.src = new URL(path, import.meta.url).href;
  return image;
}

function scheduleVisualPrewarm() {
  if (visualPrewarmScheduled) return;
  visualPrewarmScheduled = true;
  window.setTimeout(() => {
    queueGameplayImageLoad({ initialDelay: 0, stepDelay: LOW_POWER_MEDIA.matches ? 360 : 160 });
    queueSpritePairLoad({ initialDelay: LOW_POWER_MEDIA.matches ? 900 : 360, stepDelay: LOW_POWER_MEDIA.matches ? 420 : 190 });
  }, LOW_POWER_MEDIA.matches ? 1800 : 700);
}

function ensureVisualAssetsReady() {
  loadMissingVisualAssetsNow();
  const timeout = LOW_POWER_MEDIA.matches ? 9000 : 5000;
  const started = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (visualAssetsReady() || performance.now() - started >= timeout) {
        if (visualAssetsReady()) prewarmVisualTextures();
        resolve(visualAssetsReady());
        return;
      }
      window.setTimeout(tick, 90);
    };
    tick();
  });
}

function ensureStartupAssetsReady() {
  const timeout = LOW_POWER_MEDIA.matches ? 5200 : 3200;
  return Promise.race([
    Promise.allSettled([ensureVisualAssetsReady(), ensureRunAudioReady()]),
    new Promise((resolve) => window.setTimeout(() => resolve([]), timeout))
  ]);
}

function ensureRunAudioReady() {
  if (bus.muted) return Promise.resolve([]);
  const timeout = LOW_POWER_MEDIA.matches ? 4500 : 2400;
  return Promise.race([
    Promise.allSettled(RUN_AUDIO_PRELOAD.map((id) => bus.loadBuffer(id))),
    new Promise((resolve) => window.setTimeout(() => resolve([]), timeout))
  ]);
}

function visualAssetsReady() {
  const gameplayReady = Object.keys(GAMEPLAY_IMAGE_PATHS).every((key) => imageReady(GL_IMAGES[key]));
  const spritesReady = SPRITE_PAIR_NAMES.every((name) => {
    const pair = GL_IMAGES.sprites[name];
    return imageReady(pair?.diffuse) && imageReady(pair?.normal);
  });
  return imageReady(GL_IMAGES.atlas) && gameplayReady && spritesReady;
}

function prewarmVisualTextures() {
  renderer.textureFor(GL_IMAGES.atlas, false);
  renderer.textureFor(GL_IMAGES.parallaxFar, true);
  renderer.textureFor(GL_IMAGES.parallaxMid, true);
  renderer.textureFor(GL_IMAGES.parallaxNear, true);
  renderer.textureFor(GL_IMAGES.glow, false);
  renderer.textureFor(GL_IMAGES.lightRay, false);
  renderer.textureFor(GL_IMAGES.forgeCore, false);
  for (const name of SPRITE_PAIR_NAMES) {
    const pair = GL_IMAGES.sprites[name];
    if (!pair) continue;
    renderer.textureFor(pair.diffuse, false);
    renderer.textureFor(pair.normal, false);
  }
}

function loadMissingVisualAssetsNow() {
  for (const [key, path] of Object.entries(GAMEPLAY_IMAGE_PATHS)) {
    if (!GL_IMAGES[key]) GL_IMAGES[key] = loadImage(path);
  }
  for (const name of SPRITE_PAIR_NAMES) {
    const pair = GL_IMAGES.sprites[name];
    if (!pair?.diffuse || !pair?.normal) {
      GL_IMAGES.sprites[name] = loadSpritePair(name);
    }
  }
}

function queueGameplayImageLoad(options = {}) {
  if (gameplayImagesQueued) return;
  gameplayImagesQueued = true;
  const pending = Object.entries(GAMEPLAY_IMAGE_PATHS);
  const initialDelay = Number(options.initialDelay) || 120;
  const stepDelay = Number(options.stepDelay) || 450;
  const pump = () => {
    const next = pending.shift();
    if (!next) return;
    const [key, path] = next;
    if (!GL_IMAGES[key]) GL_IMAGES[key] = loadImage(path);
    if (pending.length) runWhenIdle(pump, stepDelay);
  };
  runWhenIdle(pump, initialDelay);
}

function queueSpritePairLoad(options = {}) {
  if (spritePairsQueued) return;
  spritePairsQueued = true;
  const pending = [...SPRITE_PAIR_NAMES];
  const initialDelay = Number(options.initialDelay) || 1200;
  const stepDelay = Number(options.stepDelay) || 650;
  const pump = () => {
    const name = pending.shift();
    if (!name) return;
    const pair = GL_IMAGES.sprites[name];
    if (!pair?.diffuse || !pair?.normal) {
      GL_IMAGES.sprites[name] = loadSpritePair(name);
    }
    if (pending.length) runWhenIdle(pump, stepDelay);
  };
  runWhenIdle(pump, initialDelay);
}

function loadSpritePair(name) {
  return {
    diffuse: loadImage(`${ASSETS.spriteBase}${name}.png`),
    normal: loadImage(`${ASSETS.spriteBase}${name}.normal.png`)
  };
}

function imageReady(image) {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function isPowerOfTwo(value) {
  return value > 0 && (value & (value - 1)) === 0;
}

function colorVec(color, alpha = 1) {
  const key = `${color}|${alpha}`;
  if (COLOR_VEC_CACHE.has(key)) return COLOR_VEC_CACHE.get(key);
  let r = 1;
  let g = 1;
  let b = 1;
  if (typeof color === "string" && color.startsWith("#")) {
    const clean = color.slice(1);
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16) / 255;
      g = parseInt(clean[1] + clean[1], 16) / 255;
      b = parseInt(clean[2] + clean[2], 16) / 255;
    } else {
      r = parseInt(clean.slice(0, 2), 16) / 255;
      g = parseInt(clean.slice(2, 4), 16) / 255;
      b = parseInt(clean.slice(4, 6), 16) / 255;
    }
  }
  const vec = [r, g, b, alpha];
  COLOR_VEC_CACHE.set(key, vec);
  return vec;
}

function rotatePoint(x, y, angle, originX, originY) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: originX + x * cos - y * sin,
    y: originY + x * sin + y * cos
  };
}

function drawRotatedPoly(x, y, angle, points, color, alpha) {
  renderer.drawWorldPolygon(points.map((point) => rotatePoint(point.x, point.y, angle, x, y)), color, alpha);
}

function drawRotatedLine(x, y, angle, ax, ay, bx, by, width, color, alpha) {
  const a = rotatePoint(ax, ay, angle, x, y);
  const b = rotatePoint(bx, by, angle, x, y);
  renderer.drawWorldLine(a.x, a.y, b.x, b.y, width, color, alpha);
}

function drawRotatedOutline(x, y, angle, points, color, width, alpha, fill = false) {
  const rotated = points.map((point) => rotatePoint(point.x, point.y, angle, x, y));
  if (fill) renderer.drawWorldPolygon(rotated, color, alpha * 0.16);
  for (let i = 0; i < rotated.length; i += 1) {
    const a = rotated[i];
    const b = rotated[(i + 1) % rotated.length];
    renderer.drawWorldLine(a.x, a.y, b.x, b.y, width, color, alpha);
  }
}

function compact(list) {
  let write = 0;
  for (let read = 0; read < list.length; read += 1) {
    if (!list[read].dead) {
      list[write] = list[read];
      write += 1;
    }
  }
  list.length = write;
}

function normalize(x, y) {
  const d = Math.hypot(x, y);
  if (d < 0.0001) return null;
  return { x: x / d, y: y / d };
}

function deadzone(value) {
  return Math.abs(value) > 0.18 ? value : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothStep(rate, dt) {
  return 1 - Math.exp(-Math.max(0, rate) * dt);
}

function turnTowardAngle(current, target, rate, dt) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * smoothStep(rate, dt);
}

function distance2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function colorToFill(color, alpha) {
  if (color === COLORS.cyan) return `rgba(109, 236, 255, ${alpha})`;
  if (color === COLORS.lime) return `rgba(184, 255, 66, ${alpha})`;
  if (color === COLORS.magenta) return `rgba(255, 66, 214, ${alpha})`;
  if (color === COLORS.orange) return `rgba(255, 156, 47, ${alpha})`;
  if (color === COLORS.red) return `rgba(255, 60, 87, ${alpha})`;
  if (color === COLORS.yellow) return `rgba(255, 245, 106, ${alpha})`;
  if (color === COLORS.violet) return `rgba(119, 98, 255, ${alpha})`;
  return `rgba(247, 251, 255, ${alpha})`;
}

function formatNumber(value) {
  return Math.floor(value).toLocaleString("en-US");
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function loadBest() {
  try {
    return Number(localStorage.getItem("2084-static-wars-best") || 0);
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem("2084-static-wars-best", String(value));
  } catch {
    // Storage can be disabled in privacy modes; the run still plays.
  }
}

function loadPlayerCount() {
  try {
    const value = Number(localStorage.getItem("2084-static-wars-players") || 1);
    return Number.isFinite(value) ? Math.round(clamp(value, 1, 4)) : 1;
  } catch {
    return 1;
  }
}

function savePlayerCount(value) {
  try {
    localStorage.setItem("2084-static-wars-players", String(value));
  } catch {
    // The picker still applies for the current page session.
  }
}

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMuted(value) {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, value ? "1" : "0");
    for (const key of LEGACY_MUTE_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Muting is still applied in memory when storage is unavailable.
  }
}
