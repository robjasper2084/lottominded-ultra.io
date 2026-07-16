import * as THREE from "three";

const STYLE = [
  { color: "#7fd4ff", cameraZ: 15.8, x: 3.15 },
  { color: "#ff8a5b", cameraZ: 15.2, x: 2.75 },
  { color: "#c9a06a", cameraZ: 15.6, x: 3.0 },
  { color: "#4fb6e0", cameraZ: 14.8, x: 3.15 },
  { color: "#5bf0d8", cameraZ: 14.6, x: 2.85 },
  { color: "#e08ab8", cameraZ: 15.1, x: 2.55 },
  { color: "#a78bfa", cameraZ: 15.6, x: 3.0 },
  { color: "#3d7fd6", cameraZ: 16.4, x: 2.8 },
];

const LIVELINESS = [0.82, 1.0, 0.48, 0.88, 0.7, 1.0, 0.78, 0.42];
const DEFAULT_BACKGROUNDS = [
  "#04060a",
  "#0a0710",
  "#070910",
  "#04080d",
  "#050a0a",
  "#0a070c",
  "#0a0812",
  "#030408",
];

const mulberry32 = (seed) => () => {
  let value = seed += 0x6d2b79f5;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const setPoint = (target, index, x, y, z) => {
  const offset = index * 3;
  target[offset] = x;
  target[offset + 1] = y;
  target[offset + 2] = z;
};

const unitDirection = (random) => {
  const y = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
};

const gaussian = (random) => {
  const first = Math.max(1e-7, random());
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(Math.PI * 2 * second);
};

const rotateX = (x, y, z, angle) => {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [x, y * cosine - z * sine, y * sine + z * cosine];
};

const rotateZ = (x, y, z, angle) => {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [x * cosine - y * sine, x * sine + y * cosine, z];
};

function generateGyroscope(count, seed = 11) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  const ringRadii = [6.4, 5.3, 4.2];
  const ringTilts = [[-0.5, 0], [0.9, 0.7], [0.25, -1.1]];

  for (let index = 0; index < count; index += 1) {
    const sample = random();
    let x;
    let y;
    let z;

    if (sample < 0.84) {
      const ring = index % 3;
      const angle = random() * Math.PI * 2;
      const radius = ringRadii[ring] + (random() - 0.5) * 0.14;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * 0.14;
      [x, y, z] = rotateZ(...rotateX(x, y, z, ringTilts[ring][0]), ringTilts[ring][1]);
    } else {
      const direction = unitDirection(random);
      const radius = sample < 0.94 ? 1.8 * Math.cbrt(random()) : 7.2 + random() * 3.8;
      x = direction[0] * radius;
      y = direction[1] * radius;
      z = direction[2] * radius;
    }

    setPoint(target, index, x, y, z);
  }

  return target;
}

function generateStar(count, seed = 23) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const direction = unitDirection(random);
    const radius = random() < 0.85
      ? 3.4 * Math.cbrt(random())
      : 3.4 + Math.pow(random(), 2.4) * 5.6;
    setPoint(target, index, direction[0] * radius, direction[1] * radius, direction[2] * radius);
  }

  return target;
}

function generateRingedPlanet(count, seed = 37) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    let x;
    let y;
    let z;

    if (random() < 0.76) {
      const direction = unitDirection(random);
      const radius = 3.1 + (random() - 0.5) * 0.08;
      x = direction[0] * radius;
      y = direction[1] * radius;
      z = direction[2] * radius;
    } else {
      const angle = random() * Math.PI * 2;
      const radius = 4.4 + random() * 2.1;
      x = Math.cos(angle) * radius;
      y = (random() - 0.5) * 0.08;
      z = Math.sin(angle) * radius;
    }

    [x, y, z] = rotateX(x, y, z, -0.4);
    [x, y, z] = rotateZ(x, y, z, 0.16);
    setPoint(target, index, x, y, z);
  }

  return target;
}

function generateOceanWaves(count, seed = 51) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  const cells = 17 * 11;

  for (let index = 0; index < count; index += 1) {
    const cell = index % cells;
    const column = cell % 17;
    const row = Math.floor(cell / 17);
    let x = (column / 16 * 2 - 1) * 7 + (random() - 0.5) * 0.7;
    let z = (row / 10 * 2 - 1) * 5 + (random() - 0.5) * 0.7;
    let y = Math.sin(x * 0.55 + z * 0.35) * 0.9
      + Math.sin(x * 1.15 - z * 0.6) * 0.45
      + Math.sin(z * 1.7) * 0.25
      + (random() - 0.5) * 0.08;
    [x, y, z] = rotateX(x, y, z, -0.5);
    setPoint(target, index, x, y, z);
  }

  return target;
}

function generateDnaHelix(count, seed = 67) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  const radius = 2.7;
  const turns = 4.2;
  const height = 11.5;

  for (let index = 0; index < count; index += 1) {
    const kind = random();
    let x;
    let y;
    let z;

    if (kind < 0.78) {
      const t = random();
      const phase = random() < 0.5 ? 0 : Math.PI;
      const angle = t * turns * Math.PI * 2 + phase;
      x = Math.cos(angle) * radius + (random() - 0.5) * 0.08;
      y = (t - 0.5) * height + (random() - 0.5) * 0.08;
      z = Math.sin(angle) * radius + (random() - 0.5) * 0.08;
    } else if (kind < 0.88) {
      const t = random();
      const bridge = random() * 2 - 1;
      const angle = t * turns * Math.PI * 2;
      x = Math.cos(angle) * radius * bridge;
      y = (t - 0.5) * height;
      z = Math.sin(angle) * radius * bridge;
    } else {
      const angle = random() * Math.PI * 2;
      const dustRadius = 3.8 + random() * 3.2;
      x = Math.cos(angle) * dustRadius;
      y = (random() - 0.5) * height;
      z = Math.sin(angle) * dustRadius;
    }

    setPoint(target, index, x, y, z);
  }

  return target;
}

function generateComet(count, seed = 79) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  const headEnd = Math.floor(count * 0.2);
  const tailEnd = headEnd + Math.floor(count * 0.72);
  const start = [4.4, 2.2, 0];
  const control = [0.4, 3.0, 0.9];
  const end = [-8.2, -3.0, -0.6];

  for (let index = 0; index < count; index += 1) {
    let x;
    let y;
    let z;

    if (index < headEnd) {
      const direction = unitDirection(random);
      const radius = Math.cbrt(random());
      x = start[0] + direction[0] * radius;
      y = start[1] + direction[1] * radius;
      z = start[2] + direction[2] * radius;
    } else if (index < tailEnd) {
      const t = Math.pow(random(), 1.35);
      const inverse = 1 - t;
      const spread = 0.12 + t * 2.3;
      const curveX = inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0];
      const curveY = inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1];
      const curveZ = inverse * inverse * start[2] + 2 * inverse * t * control[2] + t * t * end[2];
      const tangentX = 2 * inverse * (control[0] - start[0]) + 2 * t * (end[0] - control[0]);
      const tangentY = 2 * inverse * (control[1] - start[1]) + 2 * t * (end[1] - control[1]);
      const tangentLength = Math.hypot(tangentX, tangentY) || 1;
      const alongX = tangentX / tangentLength;
      const alongY = tangentY / tangentLength;
      const crossSpread = gaussian(random) * spread;
      const alongSpread = gaussian(random) * spread * 0.18;
      x = curveX - alongY * crossSpread + alongX * alongSpread;
      y = curveY + alongX * crossSpread + alongY * alongSpread;
      z = curveZ + gaussian(random) * spread * 0.5;
    } else {
      const direction = unitDirection(random);
      const radius = 8 + random() * 5;
      x = direction[0] * radius;
      y = direction[1] * radius;
      z = direction[2] * radius;
    }

    setPoint(target, index, x, y, z);
  }

  return target;
}

function generateSignalTransmission(count, seed = 97) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  const coreEnd = Math.floor(count * 0.14);
  const shellEnd = Math.floor(count * 0.86);

  for (let index = 0; index < count; index += 1) {
    const direction = unitDirection(random);
    let radius;

    if (index < coreEnd) {
      radius = 1.3 * Math.cbrt(random());
    } else if (index < shellEnd) {
      const shell = (index - coreEnd) % 5;
      radius = 2.0 + shell * 1.3 + (random() - 0.5) * 0.13;
    } else {
      radius = 8.8 + random() * 3.2;
    }

    setPoint(target, index, direction[0] * radius, direction[1] * radius, direction[2] * radius);
  }

  return target;
}

function generateEarth(count, seed = 113) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const direction = unitDirection(random);
    const atmosphere = random() > 0.93;
    const radius = atmosphere ? 4.48 + random() * 0.08 : 4.15 + (random() - 0.5) * 0.12;
    setPoint(target, index, direction[0] * radius, direction[1] * radius * 0.985, direction[2] * radius);
  }

  return target;
}

const generators = [
  generateGyroscope,
  generateStar,
  generateRingedPlanet,
  generateOceanWaves,
  generateDnaHelix,
  generateComet,
  generateSignalTransmission,
  generateEarth,
];

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.decoding = "async";
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`Unable to load particle mask: ${source}`));
  image.src = source;
});

async function generateMascotTargets(count) {
  const image = await loadImage("./assets/cursor/lm-mascot-front.png");
  const sampleCanvas = document.createElement("canvas");
  const sampleHeight = 320;
  const sampleWidth = Math.max(96, Math.round(sampleHeight * image.naturalWidth / image.naturalHeight));
  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("The LottoMan particle mask canvas is unavailable.");
  context.clearRect(0, 0, sampleWidth, sampleHeight);
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const candidates = [];
  let minX = sampleWidth;
  let maxX = 0;
  let minY = sampleHeight;
  let maxY = 0;
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const offset = (y * sampleWidth + x) * 4;
      if (pixels[offset + 3] < 44) continue;
      const luminance = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
      if (luminance < 14 && pixels[offset + 3] < 180) continue;
      candidates.push([x, y]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (candidates.length < 100) throw new Error("The LottoMan particle mask contains too few visible pixels.");

  const random = mulberry32(8241);
  const height = Math.max(1, maxY - minY);
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const scale = 10.8 / height;
  const base = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const sample = candidates[Math.floor(random() * candidates.length)];
    const x = (sample[0] - centerX + random() - 0.5) * scale;
    const y = (centerY - sample[1] + random() - 0.5) * scale;
    const z = (random() - 0.5) * (0.28 + random() * 0.42);
    setPoint(base, index, x, y, z);
  }

  const profiles = [
    { scale: 1.00, turn: 0.00, wave: 0.00, depth: 0.10 },
    { scale: 1.05, turn: 0.10, wave: 0.13, depth: 0.34 },
    { scale: 0.98, turn: -0.08, wave: 0.18, depth: 0.26 },
    { scale: 1.03, turn: 0.13, wave: 0.25, depth: 0.42 },
    { scale: 0.97, turn: -0.12, wave: 0.14, depth: 0.30 },
    { scale: 1.06, turn: 0.07, wave: 0.22, depth: 0.48 },
    { scale: 1.01, turn: -0.05, wave: 0.28, depth: 0.54 },
    { scale: 1.00, turn: 0.00, wave: 0.06, depth: 0.18 },
  ];

  return profiles.map((profile, profileIndex) => {
    const target = new Float32Array(base.length);
    const phase = profileIndex * 0.92;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const bx = base[offset];
      const by = base[offset + 1];
      const bz = base[offset + 2];
      const radius = Math.hypot(bx, by) + 0.001;
      const angle = profile.turn * Math.sin(by * 0.46 + phase);
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const pulse = Math.sin(by * 1.9 + index * 0.017 + phase) * profile.wave;
      const radial = 1 + pulse * 0.026;
      const x = (bx * cosine - by * sine * 0.06) * profile.scale * radial;
      const y = (by * cosine + bx * sine * 0.06) * profile.scale;
      const z = bz + Math.sin(radius * 0.82 + phase + index * 0.011) * profile.depth;
      setPoint(target, index, x, y, z);
    }
    return target;
  });
}

const waitForRuntime = async () => {
  if (window.gsap && window.ScrollTrigger) return;
  if (document.readyState === "complete") return;
  await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
};

async function initializeParticleEntity() {
  await waitForRuntime();

  const canvas = document.getElementById("featureEntity");
  const arcadeStage = document.querySelector(".arcade-main");
  if (arcadeStage) {
    [
      ".arcade-hero",
      ".arcade-featured",
      ".arcade-library",
      ".arcade-tools",
      ".motion-rail",
      ".feature-stack",
    ].forEach((selector) => {
      const section = arcadeStage.querySelector(`:scope > ${selector}`);
      if (section) arcadeStage.append(section);
    });
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  const anchors = [...document.querySelectorAll("[data-shape]")]
    .filter((element) => Number.isFinite(Number(element.dataset.shape)))
    .sort((first, second) => Number(first.dataset.shape) - Number(second.dataset.shape));
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!canvas || reducedMotion.matches || anchors.length < 8 || !gsap || !ScrollTrigger) {
    document.body.classList.add("feature-entity-fallback");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);

  const pointCount = mobile ? 5000 : 15000;
  const pointRandom = mulberry32(191);
  const seeds = new Float32Array(pointCount);
  const scales = new Float32Array(pointCount);

  for (let index = 0; index < pointCount; index += 1) {
    const seed = pointRandom();
    seeds[index] = seed;
    scales[index] = seed > 0.985 ? 2.4 : 0.5 + pointRandom() * 0.9;
  }

  let shapes;
  try {
    shapes = await generateMascotTargets(pointCount);
    shapes[5] = generateComet(pointCount, 79);
    document.body.classList.add("feature-entity-mascot");
  } catch (error) {
    console.warn("LottoMan particle mask unavailable; using geometric targets.", error);
    shapes = generators.map((generator, index) => generator(pointCount, 101 + index * 137));
  }
  const backgrounds = DEFAULT_BACKGROUNDS.map((fallback, shape) => (
    anchors.find((anchor) => Number(anchor.dataset.shape) === shape)?.dataset.bg || fallback
  ));
  const entityRail = document.createElement("aside");
  entityRail.className = "lm-entity-rail";
  entityRail.setAttribute("aria-label", "LottoMan particle sections");
  const anchorByShape = new Map();
  anchors.forEach((anchor) => {
    const shape = Number(anchor.dataset.shape);
    if (!anchorByShape.has(shape)) anchorByShape.set(shape, anchor);
  });
  [...anchorByShape.entries()].forEach(([shape, anchor]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.entityRailShape = String(shape);
    button.textContent = anchor.dataset.entityLabel
      || anchor.querySelector("h1,h2,h3")?.textContent?.trim().split(/\s+/).slice(0, 2).join(" ")
      || `Signal ${shape + 1}`;
    button.addEventListener("click", () => anchor.scrollIntoView({ behavior: "smooth", block: "start" }));
    entityRail.append(button);
  });
  const entityStatus = document.createElement("div");
  entityStatus.className = "lm-entity-status";
  entityStatus.textContent = "LottoMan array assembled";
  document.body.append(entityRail, entityStatus);

  const contextAttributes = {
    alpha: false,
    antialias: false,
    depth: true,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  };
  const context = canvas.getContext("webgl2", contextAttributes) || canvas.getContext("webgl", contextAttributes);

  if (!context) {
    document.body.classList.add("feature-entity-fallback");
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgrounds[0]);
  const camera = new THREE.PerspectiveCamera(mobile ? 56 : 48, 1, 0.1, 80);
  camera.position.set(0, 0, STYLE[0].cameraZ);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
  geometry.setAttribute("aPosA", new THREE.BufferAttribute(shapes[0], 3));
  geometry.setAttribute("aPosB", new THREE.BufferAttribute(shapes[1], 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  const uniforms = {
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uTime2: { value: 0 },
    uLiveliness: { value: LIVELINESS[0] },
    uScrollTurbulence: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uBurst: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uMouseForce: { value: 0 },
    uComet: { value: 0 },
    uColorFrom: { value: new THREE.Color(STYLE[0].color) },
    uColorTo: { value: new THREE.Color(STYLE[1].color) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      attribute vec3 aPosA;
      attribute vec3 aPosB;
      attribute float aSeed;
      attribute float aScale;
      uniform float uMorph;
      uniform float uTime;
      uniform float uTime2;
      uniform float uLiveliness;
      uniform float uScrollTurbulence;
      uniform float uPixelRatio;
      uniform float uBurst;
      uniform vec2 uMouse;
      uniform float uMouseForce;
      uniform float uComet;
      varying float vSeed;
      varying float vTravel;

      vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0 / 7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m *= m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      float smoothTwice(float value) {
        value = value * value * (3.0 - 2.0 * value);
        return value * value * (3.0 - 2.0 * value);
      }

      void main() {
        float departure = clamp((uMorph - aSeed * 0.3) / 0.7, 0.0, 1.0);
        float tt = smoothTwice(departure);
        vec3 base = mix(aPosA, aPosB, tt);
        vec3 cometHead = vec3(4.4, 2.2, 0.0);
        float cometWake = smoothstep(1.2, 9.0, distance(base, cometHead));
        float cometPhase = dot(base.xy, vec2(-0.92, -0.4));
        float cometNoiseOne = snoise(vec3(cometPhase * 0.42 - uTime2 * 0.72, aSeed * 5.0, 7.1));
        float cometNoiseTwo = snoise(vec3(cometPhase * 0.9 - uTime2 * 1.16, aSeed * 9.0, 19.7));
        vec3 cometFlutter = vec3(-0.4, 0.92, 0.15) * (cometNoiseOne * 0.45 + cometNoiseTwo * 0.2);
        vec3 cometSurge = vec3(-0.92, -0.4, 0.0) * cometNoiseTwo * 0.3;
        base += (cometFlutter + cometSurge) * cometWake * uComet;
        vec3 noisePoint = base * 0.2 + vec3(uTime2 * 0.075, -uTime2 * 0.052, uTime2 * 0.061);
        vec3 flow = vec3(
          snoise(noisePoint),
          snoise(noisePoint + vec3(19.13, 7.17, 3.91)),
          snoise(noisePoint + vec3(41.73, 29.41, 13.37))
        );
        float storm = 0.05 * uLiveliness
          + sin(uMorph * 3.14159265) * 1.05 * (0.8 + aSeed)
          + uScrollTurbulence;
        vec3 position = base + flow * storm;
        float radialLength = max(0.2, length(position.xy));
        vec2 radial = position.xy / radialLength;
        float burstTwist = uBurst * (0.5 + aSeed * 0.75);
        float burstCos = cos(burstTwist);
        float burstSin = sin(burstTwist);
        position.xy = mat2(burstCos, -burstSin, burstSin, burstCos) * position.xy;
        position.xy += radial * uBurst * (1.35 + aSeed * 3.8);
        position.z += (aSeed - 0.5) * uBurst * 4.2;
        vec2 mouseDelta = position.xy - uMouse;
        float mouseDistance = max(0.12, length(mouseDelta));
        float mouseFalloff = smoothstep(2.65, 0.0, mouseDistance);
        position.xy += mouseDelta / mouseDistance * mouseFalloff * uMouseForce * (0.6 + aSeed * 0.8);
        float breath = 1.0 + sin(uTime2 * 0.72 + aSeed * 6.28318)
          * (0.006 + uLiveliness * 0.009);
        position *= breath;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = max(1.4, aScale * uPixelRatio * (58.0 / max(1.0, -mvPosition.z)));
        vSeed = aSeed;
        vTravel = tt;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorFrom;
      uniform vec3 uColorTo;
      varying float vSeed;
      varying float vTravel;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float distanceFromCenter = length(center);
        if (distanceFromCenter > 0.5) discard;
        float disc = smoothstep(0.5, 0.1, distanceFromCenter);
        float hotCore = smoothstep(0.17, 0.0, distanceFromCenter);
        float twinkle = 0.68 + 0.32 * sin(uTime * (1.6 + vSeed * 4.2) + vSeed * 73.0);
        vec3 color = mix(uColorFrom, uColorTo, vTravel);
        if (vSeed > 0.985) color = vec3(1.0);
        if (vSeed > 0.9982) color = vec3(1.0, 0.2392, 0.5412);
        color += hotCore * vec3(0.84);
        gl_FragColor = vec4(color, disc * (0.58 + twinkle * 0.42));
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.rotation.order = "ZYX";
  group.add(points);
  scene.add(group);

  const state = {
    shapeFloat: 0,
    segment: -1,
    pointerTargetX: 0,
    pointerTargetY: 0,
    pointerX: 0,
    pointerY: 0,
    pointerInside: false,
    pointerSpeed: 0,
    pointerLastX: window.innerWidth * 0.5,
    pointerLastY: window.innerHeight * 0.5,
    scrollTurbulence: 0,
    maxTurbulence: 0,
    variableTime: 0,
    flight: 0.5,
    cometWeight: 0,
    lastTime: performance.now(),
    currentAnchor: -1,
    destroyed: false,
  };
  const progressTable = new Float32Array(8);
  const backgroundFrom = new THREE.Color(backgrounds[0]);
  const backgroundTo = new THREE.Color(backgrounds[1]);

  const setCurrentAnchor = (shape) => {
    if (shape === state.currentAnchor) return;
    state.currentAnchor = shape;
    anchors.forEach((anchor) => {
      const active = Number(anchor.dataset.shape) === shape;
      anchor.classList.toggle("is-entity-current", active);
      if (active) {
        anchor.style.setProperty("--feature-entity-glow", anchor.dataset.glow || STYLE[shape].color);
      }
    });
    entityRail.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.entityRailShape) === shape);
    });
    document.body.dataset.featureEntityShape = String(shape);
    document.body.style.setProperty("--feature-entity-glow", STYLE[shape].color);
  };

  const bindSegment = (segment) => {
    const nextSegment = Math.min(6, Math.max(0, segment));
    if (nextSegment === state.segment) return;
    state.segment = nextSegment;
    geometry.setAttribute("position", new THREE.BufferAttribute(shapes[nextSegment], 3));
    geometry.setAttribute("aPosA", new THREE.BufferAttribute(shapes[nextSegment], 3));
    geometry.setAttribute("aPosB", new THREE.BufferAttribute(shapes[nextSegment + 1], 3));
    uniforms.uColorFrom.value.set(STYLE[nextSegment].color);
    uniforms.uColorTo.value.set(STYLE[nextSegment + 1].color);
    backgroundFrom.set(backgrounds[nextSegment]);
    backgroundTo.set(backgrounds[nextSegment + 1]);
  };

  const setShapeFloat = (value) => {
    state.shapeFloat = THREE.MathUtils.clamp(Number(value) || 0, 0, 7);
    const segment = Math.min(6, Math.floor(state.shapeFloat));
    bindSegment(segment);
    uniforms.uMorph.value = state.shapeFloat >= 7 ? 1 : state.shapeFloat - segment;
    setCurrentAnchor(Math.round(state.shapeFloat));
  };

  const recomputeShapeFloat = () => {
    let nextShapeFloat = 0;
    for (let shape = 1; shape <= 7; shape += 1) {
      const progress = progressTable[shape];
      if (progress > 0) nextShapeFloat = Math.max(nextShapeFloat, shape - 1 + progress);
    }
    setShapeFloat(nextShapeFloat);
  };

  anchors.forEach((anchor) => {
    const shape = Number(anchor.dataset.shape);
    if (shape < 1) return;
    const proxy = { progress: 0 };
    const animation = gsap.to(proxy, {
      progress: 1,
      paused: true,
      ease: "none",
      onUpdate: () => {
        progressTable[shape] = proxy.progress;
        recomputeShapeFloat();
      },
    });

    ScrollTrigger.create({
      id: `feature-entity-shape-${shape}`,
      trigger: anchor,
      start: "top 94%",
      end: "top 34%",
      scrub: 1.2,
      animation,
      invalidateOnRefresh: false,
    });
  });

  anchors.filter((anchor) => Number(anchor.dataset.shape) === 5).forEach((anchor, index) => {
    ScrollTrigger.create({
      id: `feature-comet-flight-${index}`,
      trigger: anchor,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => { state.flight = self.progress; },
      onRefresh: (self) => { state.flight = self.progress; },
    });
  });

  const kickTurbulence = (velocity = 0) => {
    const kick = Math.min(1.2, Math.abs(velocity) / 80) * 0.3;
    state.scrollTurbulence = Math.max(state.scrollTurbulence, kick);
    state.maxTurbulence = Math.max(state.maxTurbulence, state.scrollTurbulence);
  };

  let lenis = null;
  let lenisTick = null;
  let nativeLastY = window.scrollY;
  let nativeLastTime = performance.now();
  const onNativeScroll = () => {
    const now = performance.now();
    const elapsed = Math.max(16, now - nativeLastTime);
    const velocity = (window.scrollY - nativeLastY) / elapsed * 16;
    nativeLastY = window.scrollY;
    nativeLastTime = now;
    kickTurbulence(velocity);
  };

  if (window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.35,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.92,
    });
    lenis.on("scroll", (event) => {
      ScrollTrigger.update();
      kickTurbulence(event?.velocity || 0);
    });
    lenisTick = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(lenisTick);
    window.__lmFeatureLenis = lenis;
  } else {
    window.addEventListener("scroll", onNativeScroll, { passive: true });
  }

  const onAnchorClick = (event) => {
    if (!lenis) return;
    const link = event.target.closest("a[href^='#']");
    const selector = link?.getAttribute("href");
    if (!selector || selector === "#") return;
    const target = document.querySelector(selector);
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: -92 });
    history.replaceState(null, "", selector);
  };
  document.addEventListener("click", onAnchorClick);

  const onPointerMove = (event) => {
    const movement = Math.hypot(event.clientX - state.pointerLastX, event.clientY - state.pointerLastY);
    state.pointerSpeed = Math.min(1.4, Math.max(state.pointerSpeed, movement / 26));
    state.pointerLastX = event.clientX;
    state.pointerLastY = event.clientY;
    state.pointerInside = true;
    state.pointerTargetX = event.clientX / window.innerWidth * 2 - 1;
    state.pointerTargetY = event.clientY / window.innerHeight * 2 - 1;
  };
  const onPointerLeave = () => {
    state.pointerInside = false;
    state.pointerTargetX = 0;
    state.pointerTargetY = 0;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });

  let burstTimeline = null;
  const disturb = (amplitude = 1) => {
    burstTimeline?.kill();
    document.body.classList.add("feature-entity-disturbed");
    entityStatus.textContent = "LottoMan array disturbed";
    window.dispatchEvent(new CustomEvent("lottoman:burst", { detail: { amplitude } }));
    burstTimeline = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove("feature-entity-disturbed");
        entityStatus.textContent = "LottoMan array assembled";
      },
    });
    burstTimeline
      .to(uniforms.uBurst, { value: amplitude, duration: 0.85, ease: "power4.out" })
      .to(uniforms.uBurst, { value: 0, duration: 1.55, ease: "elastic.out(1, 0.48)" });
  };
  const onSkyClick = (event) => {
    if (event.target.closest("a,button,input,select,textarea,label,[role='button'],[contenteditable='true']")) return;
    disturb(1);
  };
  document.addEventListener("click", onSkyClick);

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
  };
  resize();
  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  if (!resizeObserver) window.addEventListener("resize", resize, { passive: true });

  bindSegment(0);
  setCurrentAnchor(0);

  const render = (tickerTime) => {
    if (state.destroyed || document.hidden) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0, (now - state.lastTime) / 1000));
    state.lastTime = now;
    const segment = state.segment < 0 ? 0 : state.segment;
    const fraction = uniforms.uMorph.value;
    const drift = THREE.MathUtils.lerp(LIVELINESS[segment], LIVELINESS[segment + 1], fraction);
    const cometWeight = Math.max(0, 1 - Math.abs(state.shapeFloat - 5));
    state.cometWeight += (cometWeight - state.cometWeight) * (1 - Math.exp(-dt * 7));

    state.variableTime += dt * (0.5 + drift * 1.6);
    state.scrollTurbulence *= Math.exp(-dt * 2.8);
    state.pointerSpeed *= Math.exp(-dt * 5.2);
    uniforms.uTime.value = tickerTime;
    uniforms.uTime2.value = state.variableTime;
    uniforms.uLiveliness.value = drift;
    uniforms.uScrollTurbulence.value = state.scrollTurbulence;
    uniforms.uMouse.value.set(state.pointerX * 6.7 - group.position.x, -state.pointerY * 4.6);
    uniforms.uMouseForce.value += ((state.pointerInside ? 0.5 + state.pointerSpeed : 0) - uniforms.uMouseForce.value) * 0.08;
    uniforms.uComet.value = state.cometWeight;

    state.pointerX += (state.pointerTargetX - state.pointerX) * 0.045;
    state.pointerY += (state.pointerTargetY - state.pointerY) * 0.045;
    group.rotation.y = Math.sin(now * 0.00013) * 0.09 + state.pointerX * 0.14;
    group.rotation.x = Math.cos(now * 0.00011) * 0.045 - state.pointerY * 0.1;
    group.rotation.z = Math.sin(now * 0.000071) * 0.035;
    const flightTravel = (state.flight - 0.5) * 9 * state.cometWeight;
    const flightBob = Math.sin(now * 0.001 * 0.45) * 0.18 * state.cometWeight;
    group.position.x = THREE.MathUtils.lerp(STYLE[segment].x, STYLE[segment + 1].x, fraction)
      + flightTravel * 0.92;
    group.position.y = flightTravel * 0.38 + flightBob;
    camera.position.z = THREE.MathUtils.lerp(
      STYLE[segment].cameraZ,
      STYLE[segment + 1].cameraZ,
      fraction,
    ) + Math.sin(fraction * Math.PI) * 1.3;
    scene.background.copy(backgroundFrom).lerp(backgroundTo, fraction);
    renderer.render(scene, camera);
  };
  gsap.ticker.add(render);

  const onVisibilityChange = () => {
    state.lastTime = performance.now();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  const onContextLost = (event) => {
    event.preventDefault();
    document.body.classList.add("feature-entity-fallback");
  };
  canvas.addEventListener("webglcontextlost", onContextLost, false);

  const refreshScrollGeometry = () => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  };
  const arcadeGrid = document.querySelector("[data-arcade-grid]");
  let gridRefreshTimer = 0;
  const gridObserver = arcadeGrid && "MutationObserver" in window
    ? new MutationObserver(() => {
        window.clearTimeout(gridRefreshTimer);
        gridRefreshTimer = window.setTimeout(refreshScrollGeometry, 80);
      })
    : null;
  gridObserver?.observe(arcadeGrid, { childList: true });
  window.addEventListener("load", refreshScrollGeometry, { once: true });
  window.setTimeout(refreshScrollGeometry, 180);
  window.setTimeout(() => {
    refreshScrollGeometry();
  }, 900);

  const destroy = () => {
    if (state.destroyed) return;
    state.destroyed = true;
    gsap.ticker.remove(render);
    if (lenisTick) gsap.ticker.remove(lenisTick);
    lenis?.destroy?.();
    window.removeEventListener("scroll", onNativeScroll);
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("click", onAnchorClick);
    document.removeEventListener("click", onSkyClick);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    resizeObserver?.disconnect();
    gridObserver?.disconnect();
    window.clearTimeout(gridRefreshTimer);
    geometry.dispose();
    material.dispose();
    burstTimeline?.kill();
    renderer.dispose();
    entityRail.remove();
    entityStatus.remove();
  };

  window.__lmFeatureEntity = {
    setShapeFloat,
    setFlight(progress) { state.flight = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1); },
    burst: disturb,
    refresh: refreshScrollGeometry,
    destroy,
    get ready() { return !state.destroyed; },
    get pointCount() { return pointCount; },
    get shapeCount() { return shapes.length; },
    get shapeFloat() { return state.shapeFloat; },
    get segment() { return state.segment; },
    get morph() { return uniforms.uMorph.value; },
    get variableTime() { return state.variableTime; },
    get turbulence() { return state.scrollTurbulence; },
    get maxTurbulence() { return state.maxTurbulence; },
    get pixelRatio() { return renderer.getPixelRatio(); },
    get rendererAlpha() { return renderer.getContext().getContextAttributes()?.alpha ?? null; },
    get rotationOrder() { return group.rotation.order; },
    get cameraZ() { return camera.position.z; },
    get groupX() { return group.position.x; },
    get groupY() { return group.position.y; },
    get flight() { return state.flight; },
    get cometWeight() { return state.cometWeight; },
    get background() { return `#${scene.background.getHexString()}`; },
    get currentColor() { return `#${uniforms.uColorFrom.value.getHexString()}`; },
    get lenisActive() { return Boolean(lenis); },
  };

  document.body.classList.remove("feature-entity-fallback");
  document.body.classList.add("feature-entity-ready");
  window.dispatchEvent(new CustomEvent("lm:feature-entity-ready", { detail: window.__lmFeatureEntity }));
  window.addEventListener("pagehide", destroy, { once: true });
}

initializeParticleEntity().catch((error) => {
  document.body.classList.add("feature-entity-fallback");
  console.error("Feature particle organism failed to initialize.", error);
});
