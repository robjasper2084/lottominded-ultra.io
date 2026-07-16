import * as THREE from "three";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 767px)").matches;
const cinematicDesktop = !mobile && !reducedMotion.matches;
const pointCount = mobile ? 5000 : 15000;
const canvas = document.getElementById("lmSignalEntity");
const sections = [...document.querySelectorAll(".lm-observatory-section[data-lm-shape]")];

let postModules = null;
if (cinematicDesktop) {
  try {
    const [{ EffectComposer }, { RenderPass }, { AfterimagePass }, { UnrealBloomPass }] = await Promise.all([
      import("../vendor/three/addons/postprocessing/EffectComposer.js"),
      import("../vendor/three/addons/postprocessing/RenderPass.js"),
      import("../vendor/three/addons/postprocessing/AfterimagePass.js"),
      import("../vendor/three/addons/postprocessing/UnrealBloomPass.js"),
    ]);
    postModules = { EffectComposer, RenderPass, AfterimagePass, UnrealBloomPass };
  } catch (error) {
    console.warn("Membership post-processing unavailable; using the plain renderer.", error);
  }
}

const STYLE = [
  { color: "#7fd4ff", cameraZ: 14.5, x: 0 },
  { color: "#d8a2ff", cameraZ: 13.5, x: 0 },
  { color: "#7fd4ff", cameraZ: 14.5, x: 2.0 },
  { color: "#4fb6e0", cameraZ: 13.0, x: 2.4 },
  { color: "#5bf0d8", cameraZ: 12.5, x: 1.8 },
  { color: "#e08ab8", cameraZ: 13.5, x: -0.8 },
  { color: "#a78bfa", cameraZ: 14.5, x: 0 },
  { color: "#3d7fd6", cameraZ: 16.0, x: 0 },
];
const LIVELINESS = [0.3, 0.95, 0.42, 0.82, 0.64, 1.0, 0.72, 0.3];
const HERO_RING_COLORS = ["#ff4b4b", "#7fd4ff", "#b9f0e4"];
const HERO_CORE_COLOR = "#ff8a5b";
const HERO_RING_RADII = [6.4, 5.3, 4.2];
const HERO_RING_TILTS = [[-0.5, 0], [0.9, 0.7], [0.25, -1.1]];
const HERO_GIMBAL_AXES = [[1, 0.18, 0], [0, 1, 0.22], [0.25, 0, 1]];
const HERO_GIMBAL_SPEEDS = [0.24, -0.38, 0.55];
const HERO_MASCOT_SOURCE = new URL("../cursor/lm-mascot-front.png", import.meta.url);
const HERO_BRAIN_SOURCE = new URL("../brand/membership-brain-coin-particle-source.webp", import.meta.url);
const HERO_MASCOT_COLORS = ["#7fd4ff", "#ffffff", "#ff3d8a"];
const IGNITION_PARTICLE_SOURCE = new URL("../brand/membership-lottomind-reporter-particle-mask.png", import.meta.url);
const GAMING_PARTICLE_SOURCE = new URL("../brand/membership-hooded-brain-particle-mask.jpg", import.meta.url);
const BACKGROUNDS = Array.from({ length: 8 }, (_, shape) => {
  const exact = sections.find((section) => Number(section.dataset.lmShape) === shape);
  if (exact) return exact.dataset.lmBg || "#04060a";
  const next = sections.find((section) => Number(section.dataset.lmShape) > shape);
  const previous = [...sections].reverse().find((section) => Number(section.dataset.lmShape) < shape);
  return next?.dataset.lmBg || previous?.dataset.lmBg || "#04060a";
});

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
  const z = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(Math.max(0, 1 - z * z));
  return [Math.cos(angle) * radius, z, Math.sin(angle) * radius];
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

const createGyroscopeRoles = (count) => {
  const roles = new Float32Array(count);
  const ringCount = Math.floor(count * 0.76);
  const coreEnd = ringCount + Math.floor(count * 0.12);
  for (let index = 0; index < count; index += 1) {
    roles[index] = index < ringCount ? index % 3 : index < coreEnd ? 3 : 4;
  }
  return roles;
};

const sampleEllipsoid = (random, center, radius) => {
  const direction = unitDirection(random);
  const distance = Math.cbrt(random());
  return [
    center[0] + direction[0] * radius[0] * distance,
    center[1] + direction[1] * radius[1] * distance,
    center[2] + direction[2] * radius[2] * distance,
  ];
};

function generateMascotFallback(count, seed = 101) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  const roles = new Float32Array(count);
  const parts = [
    { end: 0.24, center: [0, 2.65, 0], radius: [2.15, 2.0, 1.05], role: 1 },
    { end: 0.33, center: [0, 4.35, 0], radius: [2.25, 0.72, 1.02], role: 0 },
    { end: 0.37, center: [-2.02, 2.7, 0], radius: [0.52, 0.68, 0.44], role: 1 },
    { end: 0.41, center: [2.02, 2.7, 0], radius: [0.52, 0.68, 0.44], role: 1 },
    { end: 0.66, center: [0, -0.15, 0], radius: [1.75, 2.2, 0.86], role: 2 },
    { end: 0.74, center: [-1.85, -0.15, 0], radius: [0.5, 1.95, 0.46], role: 2 },
    { end: 0.82, center: [1.85, -0.15, 0], radius: [0.5, 1.95, 0.46], role: 2 },
    { end: 0.89, center: [-0.78, -3.25, 0], radius: [0.72, 1.65, 0.58], role: 3 },
    { end: 0.96, center: [0.78, -3.25, 0], radius: [0.72, 1.65, 0.58], role: 3 },
  ];
  for (let index = 0; index < count; index += 1) {
    const selector = random();
    const part = parts.find(({ end }) => selector < end);
    if (part) {
      const [x, y, z] = sampleEllipsoid(random, part.center, part.radius);
      setPoint(target, index, x, y, z);
      roles[index] = part.role;
    } else {
      const direction = unitDirection(random);
      const radius = 6.3 + random() * 4.2;
      setPoint(target, index, direction[0] * radius, direction[1] * radius, direction[2] * radius);
      roles[index] = 4;
    }
  }
  return { target, roles, source: "procedural-fallback" };
}

async function loadMascotParticleData(count, seed = 101) {
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = HERO_MASCOT_SOURCE.href;
    await image.decode();

    const sampler = document.createElement("canvas");
    const sampleHeight = 320;
    const sampleWidth = Math.max(96, Math.round(sampleHeight * image.naturalWidth / image.naturalHeight));
    sampler.width = sampleWidth;
    sampler.height = sampleHeight;
    const context = sampler.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Mascot sampler canvas unavailable");
    context.clearRect(0, 0, sampler.width, sampler.height);
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
    const pixels = context.getImageData(0, 0, sampler.width, sampler.height).data;
    const candidates = [];
    let minX = sampler.width;
    let maxX = 0;
    let minY = sampler.height;
    let maxY = 0;
    for (let y = 0; y < sampler.height; y += 1) {
      for (let x = 0; x < sampler.width; x += 1) {
        const offset = (y * sampler.width + x) * 4;
        const alpha = pixels[offset + 3];
        if (alpha < 42) continue;
        const luminance = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
        if (luminance < 14 && alpha < 180) continue;
        candidates.push([x, y]);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (candidates.length < 500) throw new Error("Mascot source has too few opaque pixels");

    const random = mulberry32(8241);
    const target = new Float32Array(count * 3);
    const roles = new Float32Array(count);
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const scale = 10.8 / Math.max(1, maxY - minY);

    for (let index = 0; index < count; index += 1) {
      const [pixelX, pixelY] = candidates[Math.floor(random() * candidates.length)];
      const x = (pixelX - centerX + random() - 0.5) * scale;
      const y = (centerY - pixelY + random() - 0.5) * scale;
      const z = (random() - 0.5) * (0.28 + random() * 0.42);
      setPoint(target, index, x, y, z);
      roles[index] = 0;
    }
    return {
      target,
      roles,
      source: HERO_MASCOT_SOURCE.pathname,
      bounds: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
    };
  } catch (error) {
    console.warn("Membership mascot particle source unavailable; using the procedural Little Man silhouette.", error);
    return generateMascotFallback(count, seed);
  }
}

const mascotParticleDataPromise = loadMascotParticleData(pointCount);

async function loadArtworkParticleTarget(source, count, seed, luminanceFloor = 48) {
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = source.href;
    await image.decode();

    const size = 420;
    const sampler = document.createElement("canvas");
    sampler.width = size;
    sampler.height = size;
    const context = sampler.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Artwork particle sampler canvas unavailable");
    context.drawImage(image, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    const luminanceMap = new Float32Array(size * size);
    const chromaMap = new Float32Array(size * size);
    for (let index = 0; index < size * size; index += 1) {
      const offset = index * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      luminanceMap[index] = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      chromaMap[index] = Math.max(red, green, blue) - Math.min(red, green, blue);
    }
    const candidates = [];
    let minX = size;
    let maxX = 0;
    let minY = size;
    let maxY = 0;

    for (let y = 1; y < size - 1; y += 1) {
      for (let x = 1; x < size - 1; x += 1) {
        const index = y * size + x;
        if (pixels[index * 4 + 3] < 40) continue;
        const luminance = luminanceMap[index];
        const edgeX = Math.abs(luminanceMap[index + 1] - luminanceMap[index - 1]);
        const edgeY = Math.abs(luminanceMap[index + size] - luminanceMap[index - size]);
        const edge = edgeX + edgeY;
        const highlight = Math.max(0, luminance - luminanceFloor) * 0.24;
        const signal = edge * 1.55 + highlight + chromaMap[index] * 0.18;
        if (signal < luminanceFloor) continue;
        candidates.push([x, y, Math.min(1, (signal - luminanceFloor + 18) / 125)]);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (candidates.length < 1000) throw new Error("Artwork particle mask contains too few highlighted pixels");

    const random = mulberry32(seed);
    const target = new Float32Array(count * 3);
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const scale = 11.6 / Math.max(1, maxY - minY);
    for (let index = 0; index < count; index += 1) {
      let candidate;
      do {
        candidate = candidates[Math.floor(random() * candidates.length)];
      } while (random() > candidate[2]);
      const x = (candidate[0] - centerX + random() - 0.5) * scale;
      const y = (centerY - candidate[1] + random() - 0.5) * scale;
      const z = (random() - 0.5) * (0.34 + candidate[2] * 0.58);
      setPoint(target, index, x, y, z);
    }
    return {
      target,
      source: source.pathname,
      bounds: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
    };
  } catch (error) {
    console.warn(`Membership artwork particle mask unavailable: ${source.pathname}`, error);
    return null;
  }
}

const artworkParticleDataPromise = Promise.all([
  loadArtworkParticleTarget(HERO_BRAIN_SOURCE, pointCount, 2249, 42),
  loadArtworkParticleTarget(IGNITION_PARTICLE_SOURCE, pointCount, 3169, 46),
  loadArtworkParticleTarget(GAMING_PARTICLE_SOURCE, pointCount, 4271, 42),
]);

function generateGyroscope(count, seed = 11, roles = createGyroscopeRoles(count)) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const role = roles[index];
    let x;
    let y;
    let z;
    if (role < 3) {
      const ring = Math.floor(role);
      const angle = random() * Math.PI * 2;
      const radius = HERO_RING_RADII[ring] + (random() - 0.5) * 0.14;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = (random() - 0.5) * 0.14;
      [x, y, z] = rotateZ(...rotateX(x, y, z, HERO_RING_TILTS[ring][0]), HERO_RING_TILTS[ring][1]);
    } else {
      const direction = unitDirection(random);
      const radius = role === 3
        ? 1.7 * Math.cbrt(random())
        : 7.5 + random() * 5.5;
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
      [x, y, z] = direction.map((value) => value * radius);
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
  const coreEnd = Math.floor(count * 0.12);
  const shellEnd = coreEnd + Math.floor(count * 0.72);
  for (let index = 0; index < count; index += 1) {
    const direction = unitDirection(random);
    let radius;
    if (index < coreEnd) {
      radius = 1.2 * Math.cbrt(random());
    } else if (index < shellEnd) {
      const shellIndex = (index - coreEnd) % 5;
      radius = 1.8 + shellIndex * 1.35 + (random() - 0.5) * 0.14;
    } else {
      radius = 9 + random() * 4;
    }
    setPoint(
      target,
      index,
      direction[0] * radius,
      direction[1] * radius,
      direction[2] * radius,
    );
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

const buildConstellationTarget = (shape, sampleSize = 420, linkLimit = 300, maxDistance = 1.7) => {
  const sampleCount = Math.min(sampleSize, shape.length / 3);
  const sample = Array.from({ length: sampleCount }, (_, index) => Math.floor(index * (shape.length / 3) / sampleCount));
  const candidates = [];
  const maxDistanceSquared = maxDistance * maxDistance;
  for (let left = 0; left < sample.length; left += 1) {
    const a = sample[left] * 3;
    for (let right = left + 1; right < sample.length; right += 1) {
      const b = sample[right] * 3;
      const dx = shape[a] - shape[b];
      const dy = shape[a + 1] - shape[b + 1];
      const dz = shape[a + 2] - shape[b + 2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      if (distanceSquared <= maxDistanceSquared) candidates.push({ a, b, distanceSquared });
    }
  }
  candidates.sort((first, second) => first.distanceSquared - second.distanceSquared);
  const links = candidates.slice(0, linkLimit);
  const positions = new Float32Array(links.length * 6);
  links.forEach(({ a, b }, index) => {
    const offset = index * 6;
    positions[offset] = shape[a];
    positions[offset + 1] = shape[a + 1];
    positions[offset + 2] = shape[a + 2];
    positions[offset + 3] = shape[b];
    positions[offset + 4] = shape[b + 1];
    positions[offset + 5] = shape[b + 2];
  });
  return positions;
};

function initializeEntity(runtime, particleArtwork) {
  if (!canvas || reducedMotion.matches || sections.length < 2) {
    document.body.classList.add("lm-no-webgl");
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) {
    document.body.classList.add("lm-no-webgl");
    return;
  }

  try {
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
    if (!context) throw new Error("WebGL context unavailable");
    const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: false, antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUNDS[0]);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.set(0, 0, STYLE[0].cameraZ);

    const random = mulberry32(191);
    const seeds = new Float32Array(pointCount);
    const scales = new Float32Array(pointCount);
    for (let index = 0; index < pointCount; index += 1) {
      const seed = random();
      seeds[index] = seed;
      scales[index] = seed > 0.985 ? 2.4 : 0.5 + random() * 0.9;
    }

    const mascotParticleData = particleArtwork.mascot;
    const heroParticleData = particleArtwork.heroBrain?.target
      ? { ...particleArtwork.heroBrain, roles: new Float32Array(pointCount) }
      : mascotParticleData;
    const heroRoles = heroParticleData.roles;
    const heroRoleCounts = [0, 0, 0, 0, 0];
    heroRoles.forEach((role) => { heroRoleCounts[Math.floor(role)] += 1; });
    const shapes = generators.map((generator, index) => (
      index === 0 ? heroParticleData.target : generator(pointCount, 101 + index * 137)
    ));
    if (particleArtwork.ignition?.target) shapes[1] = particleArtwork.ignition.target;
    if (particleArtwork.gaming?.target) shapes[2] = particleArtwork.gaming.target;
    shapes[4] = mascotParticleData.target;
    const heroRoleRadiusBounds = Array.from({ length: 5 }, () => ({ min: Infinity, max: 0 }));
    for (let index = 0; index < pointCount; index += 1) {
      const offset = index * 3;
      const radius = Math.hypot(shapes[0][offset], shapes[0][offset + 1], shapes[0][offset + 2]);
      const bounds = heroRoleRadiusBounds[Math.floor(heroRoles[index])];
      bounds.min = Math.min(bounds.min, radius);
      bounds.max = Math.max(bounds.max, radius);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
    geometry.setAttribute("aPosA", new THREE.BufferAttribute(shapes[0], 3));
    geometry.setAttribute("aPosB", new THREE.BufferAttribute(shapes[1], 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aRing", new THREE.BufferAttribute(heroRoles, 1));

    const uniforms = {
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uTime2: { value: 0 },
      uGimbalTime: { value: 0 },
      uHero: { value: 1 },
      uHeat: { value: 0 },
      uWave: { value: 0 },
      uTide: { value: 0 },
      uLife: { value: 0 },
      uComet: { value: 0 },
      uSignal: { value: 0 },
      uDrift: { value: 1 },
      uLiveliness: { value: LIVELINESS[0] },
      uScrollTurbulence: { value: 0 },
      uPulse: { value: 0 },
      uBurst: { value: 0 },
      uMouse: { value: new THREE.Vector3(999, 999, 999) },
      uMouseForce: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75) },
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
        attribute float aRing;
        uniform float uMorph;
        uniform float uTime;
        uniform float uTime2;
        uniform float uGimbalTime;
        uniform float uHero;
        uniform float uHeat;
        uniform float uWave;
        uniform float uTide;
        uniform float uLife;
        uniform float uComet;
        uniform float uSignal;
        uniform float uDrift;
        uniform float uLiveliness;
        uniform float uScrollTurbulence;
        uniform float uPulse;
        uniform float uBurst;
        uniform vec3 uMouse;
        uniform float uMouseForce;
        uniform float uPixelRatio;
        varying float vSeed;
        varying float vTravel;
        varying float vRing;
        varying float vHero;
        varying float vHeroRadius;
        varying float vSignalBrightness;

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

        vec3 rodrigues(vec3 value, vec3 axis, float angle) {
          axis = normalize(axis);
          float cosine = cos(angle);
          float sine = sin(angle);
          return value * cosine
            + cross(axis, value) * sine
            + axis * dot(axis, value) * (1.0 - cosine);
        }

        void main() {
          float departure = clamp((uMorph - aSeed * 0.3) / 0.7, 0.0, 1.0);
          float tt = smoothTwice(departure);
          vec3 rotatedHero = aPosA;
          if (uHero > 0.001) {
            float coinRadius = length(aPosA.xy);
            float coinBreath = sin(uGimbalTime * 0.82 + aSeed * 0.9) * 0.006;
            float circuitRipple = sin(coinRadius * 1.15 - uGimbalTime * 1.1 + aSeed * 2.0) * 0.018;
            rotatedHero.xy *= 1.0 + coinBreath + circuitRipple;
            float coinTurn = sin(uGimbalTime * 0.23) * 0.055;
            rotatedHero.xy = mat2(cos(coinTurn), -sin(coinTurn), sin(coinTurn), cos(coinTurn)) * rotatedHero.xy;
            rotatedHero.z += sin(uGimbalTime * 0.9 + aSeed * 18.0) * 0.055;
          }
          vec3 heroSource = mix(aPosA, rotatedHero, uHero);
          vec3 base = mix(heroSource, aPosB, tt);
          float lifeShimmer = sin(uTime2 * 1.18 + aSeed * 31.0);
          base.x += lifeShimmer * 0.035 * uLife;
          base.y += cos(uTime2 * 0.84 + aSeed * 23.0) * 0.045 * uLife;
          vec3 waveNormal = vec3(0.0, 0.8776, -0.4794);
          vec3 waveDepth = vec3(0.0, 0.4794, 0.8776);
          float waveX = base.x;
          float waveZ = dot(base, waveDepth);
          float swell = sin(waveX * 0.5 - uTime2 * 0.9 - uTide * 6.0) * 0.55
            + sin(waveX * 1.1 + waveZ * 0.6 - uTime2 * 0.6 - uTide * 4.2) * 0.3
            + snoise(vec3(waveX * 0.25, waveZ * 0.3, uTime2 * 0.18)) * 0.45;
          base += waveNormal * swell * uWave;
          vec3 cometHead = vec3(4.4, 2.2, 0.0);
          float cometWake = smoothstep(1.2, 9.0, distance(base, cometHead));
          float cometPhase = dot(base.xy, vec2(-0.92, -0.4));
          float cometNoiseOne = snoise(vec3(cometPhase * 0.42 - uTime2 * 0.72, aSeed * 5.0, 7.1));
          float cometNoiseTwo = snoise(vec3(cometPhase * 0.9 - uTime2 * 1.16, aSeed * 9.0, 19.7));
          vec3 cometFlutter = vec3(-0.4, 0.92, 0.15) * (cometNoiseOne * 0.45 + cometNoiseTwo * 0.2);
          vec3 cometSurge = vec3(-0.92, -0.4, 0.0) * cometNoiseTwo * 0.3;
          base += (cometFlutter + cometSurge) * cometWake * uComet;
          float signalRadius = length(base);
          float signalShellMask = step(1.6, signalRadius) * (1.0 - step(8.8, signalRadius));
          float radiatedRadius = mod(signalRadius - 1.8 + uTime2 * 0.9, 6.75) + 1.8;
          vec3 radiatedPosition = normalize(base + vec3(0.0001)) * radiatedRadius;
          base = mix(base, radiatedPosition, uSignal * signalShellMask);
          float signalDim = clamp(1.7 - radiatedRadius / 7.0, 0.2, 1.0);
          float signalCoreMask = 1.0 - smoothstep(1.1, 1.3, signalRadius);
          float listeningMask = smoothstep(8.8, 9.2, signalRadius);
          vSignalBrightness = mix(1.0, signalDim, uSignal * signalShellMask);
          vSignalBrightness *= mix(1.0, 1.35, uSignal * signalCoreMask);
          vSignalBrightness *= mix(1.0, 0.28, uSignal * listeningMask);
          vec3 noisePoint = base * 0.2 + vec3(uTime2 * 0.075, -uTime2 * 0.052, uTime2 * 0.061);
          vec3 flow = vec3(
            snoise(noisePoint),
            snoise(noisePoint + vec3(19.13, 7.17, 3.91)),
            snoise(noisePoint + vec3(41.73, 29.41, 13.37))
          );
          float storm = 0.05 * uLiveliness * (1.0 + uDrift * 1.6)
            + sin(uMorph * 3.14159265) * 1.05 * (0.8 + aSeed)
            + uScrollTurbulence;
          vec3 position = base + flow * storm;
          float coronaMask = smoothstep(3.4, 4.2, length(base));
          float coronaNoise = snoise(base * 0.5 + vec3(uTime2 * 0.35)) * 0.5 + 0.5;
          position += normalize(base + vec3(0.0001))
            * coronaMask * coronaNoise * uHeat * (0.25 + aSeed * 0.85);
          float breath = 1.0 + sin(uTime2 * 0.72 + aSeed * 6.28318)
            * (0.006 + uLiveliness * 0.009) * (1.0 + uDrift * 1.2);
          position *= breath + uPulse * (0.035 + aSeed * 0.025);
          vec3 burstDirection = normalize(position + vec3(0.0001));
          position += burstDirection * uBurst * (1.5 + aSeed * 4.0);
          float burstTwist = uBurst * (0.6 + aSeed * 0.4);
          float twistCos = cos(burstTwist);
          float twistSin = sin(burstTwist);
          position.xz = mat2(twistCos, -twistSin, twistSin, twistCos) * position.xz;
          vec3 mouseDelta = position - uMouse;
          float mouseDistance = length(mouseDelta);
          float mouseFalloff = 1.0 - smoothstep(0.0, 2.6, mouseDistance);
          position += mouseDelta / max(mouseDistance, 0.001)
            * mouseFalloff * uMouseForce * (0.6 + aSeed * 0.8);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(1.4, aScale * uPixelRatio * (58.0 / max(1.0, -mvPosition.z)));
          vSeed = aSeed;
          vTravel = tt;
          vRing = aRing;
          vHero = uHero;
          vHeroRadius = length(heroSource);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uHeat;
        uniform vec3 uColorFrom;
        uniform vec3 uColorTo;
        varying float vSeed;
        varying float vTravel;
        varying float vRing;
        varying float vHero;
        varying float vHeroRadius;
        varying float vSignalBrightness;
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float distanceFromCenter = length(center);
          if (distanceFromCenter > 0.5) discard;
          float disc = smoothstep(0.5, 0.12, distanceFromCenter);
          float hotCore = smoothstep(0.16, 0.0, distanceFromCenter);
          float twinkle = (0.68 + 0.32 * sin(uTime * (1.6 + vSeed * 4.2) + vSeed * 73.0))
            * (1.0 + uHeat * 0.35);
          vec3 color = mix(uColorFrom, uColorTo, vTravel);
          vec3 heroColor = vec3(0.4980, 0.8314, 1.0);
          color = mix(color, heroColor, vHero);
          color = mix(color, vec3(1.0, 0.32, 0.12), uHeat * 0.6);
          if (vSeed > 0.985) color = vec3(1.0);
          if (vSeed > 0.9982) color = vec3(1.0, 0.2392, 0.5412);
          vec3 pointCore = mix(vec3(1.05), vec3(0.55, 0.10, 0.025), uHeat);
          color += hotCore * pointCore;
          color *= vSignalBrightness;
          gl_FragColor = vec4(color, disc * (0.58 + twinkle * 0.42));
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const group = new THREE.Group();
    group.rotation.order = "ZYX";
    group.add(points);

    const constellationTargets = cinematicDesktop
      ? shapes.map((shape, index) => index === 0 ? new Float32Array() : buildConstellationTarget(shape))
      : null;
    let constellationGeometry = null;
    let constellationMaterial = null;
    let constellationLines = null;
    if (constellationTargets) {
      constellationGeometry = new THREE.BufferGeometry();
      constellationGeometry.setAttribute("position", new THREE.BufferAttribute(constellationTargets[0], 3));
      constellationMaterial = new THREE.LineBasicMaterial({
        color: STYLE[0].color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });
      constellationLines = new THREE.LineSegments(constellationGeometry, constellationMaterial);
      constellationLines.frustumCulled = false;
      group.add(constellationLines);
    }
    scene.add(group);

    let composer = null;
    let afterimagePass = null;
    let bloomPass = null;
    if (cinematicDesktop && postModules) {
      const { EffectComposer, RenderPass, AfterimagePass, UnrealBloomPass } = postModules;
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      afterimagePass = new AfterimagePass(0.35);
      composer.addPass(afterimagePass);
      bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.12);
      composer.addPass(bloomPass);
    }

    const heroSection = sections.find((section) => Number(section.dataset.lmShape) === 0);
    const initialHeroRect = heroSection?.getBoundingClientRect();
    const entityState = {
      shapeFloat: 0,
      segment: -1,
      orbit: 0,
      charge: 0,
      tide: 0,
      flight: 0.5,
      lifeProgress: 0.5,
      waveWeight: 0,
      lifeWeight: 0,
      cometWeight: 0,
      signalWeight: 0,
      heat: 0,
      starWeight: 0,
      groupScale: 1,
      orbitWeight: 0,
      orbitYaw: 0,
      orbitDolly: 0,
      pointerTargetX: 0,
      pointerTargetY: 0,
      pointerX: 0,
      pointerY: 0,
      pointerInside: false,
      pointerSpeedBoost: 0,
      pointerLastX: 0,
      pointerLastY: 0,
      pointerLastTime: performance.now(),
      mouseForce: 0,
      scrollTurbulence: 0,
      maxTurbulence: 0,
      variableTime: 0,
      gimbalTime: 0,
      helixSpin: 0,
      helixWeight: 0,
      heroWeight: 1,
      heroDrift: 1,
      heroOnScreen: initialHeroRect ? initialHeroRect.bottom > 0 && initialHeroRect.top < innerHeight : true,
      heroIntroStarted: false,
      introActive: false,
      introProgress: 1,
      introCameraOffset: 0,
      introSpin: 0,
      introTurbulence: 0,
      lastTime: performance.now(),
      pulseStarted: 0,
      fullBurstActive: false,
      constellationShape: -1,
      constellationOpacity: 0,
      destroyed: false,
    };
    const heroObserver = heroSection && "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => { entityState.heroOnScreen = entry.isIntersecting; }, { threshold: [0, 0.01, 0.2] })
      : null;
    heroObserver?.observe(heroSection);
    const progressTable = new Float32Array(8);
    const transitionFrom = new Float32Array(8);
    const backgroundFrom = new THREE.Color(BACKGROUNDS[0]);
    const backgroundTo = new THREE.Color(BACKGROUNDS[1]);

    const bindSegment = (segment) => {
      const nextSegment = Math.min(6, Math.max(0, segment));
      if (nextSegment === entityState.segment) return;
      entityState.segment = nextSegment;
      geometry.setAttribute("position", new THREE.BufferAttribute(shapes[nextSegment], 3));
      geometry.setAttribute("aPosA", new THREE.BufferAttribute(shapes[nextSegment], 3));
      geometry.setAttribute("aPosB", new THREE.BufferAttribute(shapes[nextSegment + 1], 3));
      uniforms.uColorFrom.value.set(STYLE[nextSegment].color);
      uniforms.uColorTo.value.set(STYLE[nextSegment + 1].color);
      backgroundFrom.set(BACKGROUNDS[nextSegment]);
      backgroundTo.set(BACKGROUNDS[nextSegment + 1]);
    };

    const setShapeFloat = (value) => {
      entityState.shapeFloat = THREE.MathUtils.clamp(value, 0, 7);
      const segment = Math.min(6, Math.floor(entityState.shapeFloat));
      bindSegment(segment);
      uniforms.uMorph.value = entityState.shapeFloat >= 7 ? 1 : entityState.shapeFloat - segment;
    };

    const recomputeShapeFloat = () => {
      let nextShapeFloat = 0;
      for (let shape = 1; shape <= 7; shape += 1) {
        const progress = progressTable[shape];
        if (progress > 0) {
          const fromShape = transitionFrom[shape];
          nextShapeFloat = Math.max(nextShapeFloat, fromShape + (shape - fromShape) * progress);
        }
      }
      setShapeFloat(nextShapeFloat);
    };

    let previousShape = 0;
    sections.forEach((section) => {
      const shape = Number(section.dataset.lmShape);
      if (!Number.isFinite(shape) || shape < 1) return;
      transitionFrom[shape] = previousShape;
      previousShape = shape;
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
        trigger: section,
        start: "top 94%",
        end: "top 34%",
        scrub: 1.2,
        animation,
        invalidateOnRefresh: false,
      });
    });

    const onLenisScroll = ({ velocity = 0 } = {}) => {
      const kick = Math.min(1.2, Math.abs(velocity) / 80) * 0.3;
      entityState.scrollTurbulence = Math.max(entityState.scrollTurbulence, kick);
      entityState.maxTurbulence = Math.max(entityState.maxTurbulence, entityState.scrollTurbulence);
    };
    runtime?.lenis?.on?.("scroll", onLenisScroll);

    const pointerNdc = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const pointerPlane = new THREE.Plane();
    const planeOrigin = new THREE.Vector3();
    const planeNormal = new THREE.Vector3();
    const pointerWorld = new THREE.Vector3();
    const pointerLocal = new THREE.Vector3();
    const onPointerMove = (event) => {
      entityState.pointerTargetX = event.clientX / innerWidth * 2 - 1;
      entityState.pointerTargetY = event.clientY / innerHeight * 2 - 1;
      pointerNdc.set(entityState.pointerTargetX, -entityState.pointerTargetY);
      const now = performance.now();
      const elapsed = Math.max(8, now - entityState.pointerLastTime);
      const distance = Math.hypot(event.clientX - entityState.pointerLastX, event.clientY - entityState.pointerLastY);
      const velocity = distance / elapsed;
      entityState.pointerSpeedBoost = Math.max(entityState.pointerSpeedBoost, Math.min(0.85, velocity * 0.45));
      entityState.pointerLastX = event.clientX;
      entityState.pointerLastY = event.clientY;
      entityState.pointerLastTime = now;
      entityState.pointerInside = true;
    };
    const onPointerLeave = () => { entityState.pointerInside = false; };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("blur", onPointerLeave);

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      composer?.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let burstTimeline = null;
    let introTimeline = null;
    const startHeroIntro = () => {
      if (reducedMotion.matches || entityState.heroIntroStarted) return;
      entityState.heroIntroStarted = true;
      entityState.introActive = true;
      entityState.introProgress = 0;
      entityState.introCameraOffset = -11;
      entityState.introSpin = 1.2;
      entityState.introTurbulence = 0.9;
      entityState.maxTurbulence = Math.max(entityState.maxTurbulence, 0.9);
      introTimeline?.kill();
      introTimeline = gsap.to(entityState, {
        introProgress: 1,
        duration: 2.8,
        ease: "expo.out",
        overwrite: "auto",
        onComplete: () => {
          entityState.introActive = false;
          entityState.introCameraOffset = 0;
          entityState.introSpin = 0;
          entityState.introTurbulence = 0;
          introTimeline = null;
        },
      });
    };
    const runFullBurst = () => {
      if (reducedMotion.matches) return;
      burstTimeline?.kill();
      gsap.killTweensOf(uniforms.uBurst);
      uniforms.uBurst.value = 0;
      entityState.fullBurstActive = true;
      window.dispatchEvent(new CustomEvent("aeon:burst", { detail: { amplitude: 1, source: "pointer" } }));
      burstTimeline = gsap.timeline({
        onComplete: () => {
          entityState.fullBurstActive = false;
          burstTimeline = null;
        },
      })
        .to(uniforms.uBurst, { value: 1, duration: 1, ease: "power4.out" })
        .to(uniforms.uBurst, { value: 0, duration: 1.7, ease: "elastic.out(1, 0.45)" });
    };
    const runArrivalPulse = () => {
      if (reducedMotion.matches || entityState.fullBurstActive) return;
      burstTimeline?.kill();
      gsap.killTweensOf(uniforms.uBurst);
      uniforms.uBurst.value = 0;
      burstTimeline = gsap.timeline({ onComplete: () => { burstTimeline = null; } })
        .to(uniforms.uBurst, { value: 0.12, duration: 0.5, ease: "power2.out" })
        .to(uniforms.uBurst, { value: 0, duration: 1.2, ease: "expo.out" });
    };

    bindSegment(0);
    const render = () => {
      if (entityState.destroyed || document.hidden) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - entityState.lastTime) / 1000));
      entityState.lastTime = now;
      const segment = entityState.segment < 0 ? 0 : entityState.segment;
      const fraction = uniforms.uMorph.value;
      const liveliness = THREE.MathUtils.lerp(LIVELINESS[segment], LIVELINESS[segment + 1], fraction);
      const heroWeight = 1 - THREE.MathUtils.smoothstep(entityState.shapeFloat, 0, 1);
      const starWeight = Math.max(0, 1 - Math.abs(entityState.shapeFloat - 1));
      const waveWeight = Math.max(0, 1 - Math.abs(entityState.shapeFloat - 3));
      const helixWeight = Math.max(0, 1 - Math.abs(entityState.shapeFloat - 4));
      const cometWeight = Math.max(0, 1 - Math.abs(entityState.shapeFloat - 5));
      const signalWeight = Math.max(0, 1 - Math.abs(entityState.shapeFloat - 6));
      entityState.heroWeight = heroWeight;
      entityState.starWeight = starWeight;
      entityState.helixWeight = helixWeight;
      entityState.lifeWeight += (helixWeight - entityState.lifeWeight) * (1 - Math.exp(-dt * 7));
      entityState.waveWeight += (waveWeight - entityState.waveWeight) * (1 - Math.exp(-dt * 7));
      entityState.cometWeight += (cometWeight - entityState.cometWeight) * (1 - Math.exp(-dt * 7));
      entityState.signalWeight += (signalWeight - entityState.signalWeight) * (1 - Math.exp(-dt * 7));
      entityState.heat += (entityState.charge * starWeight - entityState.heat) * (1 - Math.exp(-dt * 7));
      entityState.heroDrift += (heroWeight - entityState.heroDrift) * (1 - Math.exp(-dt * 4.5));
      if (entityState.heroOnScreen && entityState.heroIntroStarted) entityState.gimbalTime += dt;
      entityState.helixSpin += dt * 0.14;
      entityState.variableTime += dt * (0.5 + entityState.heroDrift * 1.6);
      entityState.scrollTurbulence *= Math.exp(-dt * 2.8);
      entityState.pointerSpeedBoost *= Math.exp(-dt * 4.2);
      const introRemaining = entityState.introActive ? 1 - entityState.introProgress : 0;
      entityState.introCameraOffset = -11 * introRemaining;
      entityState.introSpin = 1.2 * introRemaining;
      entityState.introTurbulence = 0.9 * introRemaining;
      const renderTurbulence = Math.max(entityState.scrollTurbulence, entityState.introTurbulence);
      entityState.maxTurbulence = Math.max(entityState.maxTurbulence, renderTurbulence);
      uniforms.uTime.value = now * 0.001;
      uniforms.uTime2.value = entityState.variableTime;
      uniforms.uGimbalTime.value = entityState.gimbalTime;
      uniforms.uHero.value = heroWeight;
      uniforms.uHeat.value = entityState.heat;
      uniforms.uWave.value = entityState.waveWeight;
      uniforms.uTide.value = entityState.tide;
      uniforms.uLife.value = entityState.lifeWeight;
      uniforms.uComet.value = entityState.cometWeight;
      uniforms.uSignal.value = entityState.signalWeight;
      uniforms.uDrift.value = entityState.heroDrift;
      uniforms.uLiveliness.value = liveliness;
      uniforms.uScrollTurbulence.value = renderTurbulence;
      if (entityState.pulseStarted) {
        const pulseAge = (now - entityState.pulseStarted) / 850;
        uniforms.uPulse.value = pulseAge < 1 ? Math.sin(pulseAge * Math.PI) : 0;
      }

      entityState.pointerX += (entityState.pointerTargetX - entityState.pointerX) * 0.045;
      entityState.pointerY += (entityState.pointerTargetY - entityState.pointerY) * 0.045;
      const orbitWeight = Math.max(0, 1 - Math.abs(entityState.shapeFloat - 2));
      const orbitYaw = entityState.orbit * 2.2 * orbitWeight;
      const orbitDolly = Math.sin(entityState.orbit * Math.PI) * 1.6 * orbitWeight;
      entityState.orbitWeight = orbitWeight;
      entityState.orbitYaw = orbitYaw;
      entityState.orbitDolly = orbitDolly;
      const regularSwayY = Math.sin(now * 0.00013) * 0.09;
      const regularSwayX = Math.cos(now * 0.00011) * 0.045;
      const mascotFacingSway = Math.sin(entityState.gimbalTime * 0.45) * 0.08;
      const mascotNod = Math.sin(entityState.gimbalTime * 0.31) * 0.028;
      const baseRotationY = THREE.MathUtils.lerp(regularSwayY, mascotFacingSway, heroWeight)
        + entityState.pointerX * 0.14 + orbitYaw;
      const baseRotationX = THREE.MathUtils.lerp(regularSwayX, mascotNod, heroWeight)
        - entityState.pointerY * 0.1;
      const baseRotationZ = Math.sin(now * 0.000071) * 0.035 * (1 - heroWeight) + entityState.introSpin;
      const lifeYaw = Math.sin(now * 0.00034) * 0.12;
      const lifeNod = Math.sin(now * 0.00027) * 0.025;
      const lifeTilt = Math.sin(now * 0.00021) * 0.035;
      group.rotation.y = THREE.MathUtils.lerp(baseRotationY, lifeYaw, entityState.lifeWeight);
      group.rotation.x = THREE.MathUtils.lerp(baseRotationX, lifeNod, entityState.lifeWeight);
      group.rotation.z = THREE.MathUtils.lerp(baseRotationZ, lifeTilt, entityState.lifeWeight);
      const chargeBreath = Math.sin(now * 0.001 * 1.1) * 0.012 * (1 + entityState.charge);
      entityState.groupScale = 1 + starWeight * (entityState.charge * 0.07 + chargeBreath);
      group.scale.setScalar(entityState.groupScale);
      const flightTravel = (entityState.flight - 0.5) * 9 * entityState.cometWeight;
      const flightBob = Math.sin(now * 0.001 * 0.45) * 0.18 * entityState.cometWeight;
      const lifeTravel = (entityState.lifeProgress - 0.5) * entityState.lifeWeight;
      const lifeBob = Math.sin(now * 0.001 * 0.58) * 0.14 * entityState.lifeWeight;
      group.position.x = THREE.MathUtils.lerp(STYLE[segment].x, STYLE[segment + 1].x, fraction)
        + flightTravel * 0.92
        + lifeTravel * 0.8;
      group.position.y = flightTravel * 0.38 + flightBob + lifeTravel * 1.1 + lifeBob;
      camera.position.z = THREE.MathUtils.lerp(STYLE[segment].cameraZ, STYLE[segment + 1].cameraZ, fraction)
        + Math.sin(fraction * Math.PI) * 1.3
        - orbitDolly
        + entityState.introCameraOffset;
      group.updateMatrixWorld(true);
      const mouseTargetForce = entityState.pointerInside
        ? Math.min(1.4, 0.55 + entityState.pointerSpeedBoost)
        : 0;
      entityState.mouseForce += (mouseTargetForce - entityState.mouseForce) * (1 - Math.exp(-dt * 8));
      uniforms.uMouseForce.value = entityState.mouseForce;
      if (entityState.pointerInside && entityState.mouseForce > 0.001) {
        raycaster.setFromCamera(pointerNdc, camera);
        planeOrigin.set(0, 0, 0);
        group.localToWorld(planeOrigin);
        planeNormal.set(0, 0, 1).transformDirection(group.matrixWorld);
        pointerPlane.setFromNormalAndCoplanarPoint(planeNormal, planeOrigin);
        if (raycaster.ray.intersectPlane(pointerPlane, pointerWorld)) {
          pointerLocal.copy(pointerWorld);
          group.worldToLocal(pointerLocal);
          uniforms.uMouse.value.copy(pointerLocal);
        }
      }

      const burst = uniforms.uBurst.value;
      if (constellationLines && constellationMaterial && constellationTargets) {
        const atStart = fraction < 0.04;
        const atEnd = fraction > 0.96;
        const restingShape = atEnd ? Math.min(7, segment + 1) : atStart ? segment : -1;
        if (restingShape >= 0 && restingShape !== entityState.constellationShape) {
          entityState.constellationShape = restingShape;
          constellationGeometry.setAttribute("position", new THREE.BufferAttribute(constellationTargets[restingShape], 3));
          constellationMaterial.color.set(STYLE[restingShape].color);
        }
        const linesAllowed = restingShape > 0 && restingShape !== 6 && burst < 0.01;
        if (linesAllowed) {
          entityState.constellationOpacity += (0.13 - entityState.constellationOpacity) * (1 - Math.exp(-dt * 7));
          constellationMaterial.opacity = entityState.constellationOpacity;
          constellationLines.visible = entityState.constellationOpacity > 0.001;
        } else {
          entityState.constellationOpacity = 0;
          constellationMaterial.opacity = 0;
          constellationLines.visible = false;
        }
      }

      scene.background.copy(backgroundFrom).lerp(backgroundTo, fraction);
      if (composer && afterimagePass) {
        const storm = Math.sin(fraction * Math.PI);
        afterimagePass.uniforms.damp.value = Math.min(
          0.92,
          0.35 + storm * 0.45 + burst * 0.5 + renderTurbulence * 0.4,
        );
        composer.render(dt);
      } else {
        renderer.render(scene, camera);
      }
    };
    gsap.ticker.add(render);

    const api = {
      pulse() { entityState.pulseStarted = performance.now(); },
      burst: runFullBurst,
      arrivalPulse: runArrivalPulse,
      startHeroIntro,
      setOrbit(progress) { entityState.orbit = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1); },
      setCharge(progress) { entityState.charge = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1); },
      setTide(progress) { entityState.tide = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1); },
      setLife(progress) { entityState.lifeProgress = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1); },
      setFlight(progress) { entityState.flight = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1); },
      get currentShape() { return entityState.shapeFloat; },
      get shapeFloat() { return entityState.shapeFloat; },
      get morph() { return uniforms.uMorph.value; },
      get segment() { return entityState.segment; },
      get pointCount() { return pointCount; },
      get turbulence() { return uniforms.uScrollTurbulence.value; },
      get maxTurbulence() { return entityState.maxTurbulence; },
      get variableTime() { return entityState.variableTime; },
      get gimbalTime() { return entityState.gimbalTime; },
      get heroWeight() { return entityState.heroWeight; },
      get heroDrift() { return entityState.heroDrift; },
      get helixWeight() { return entityState.lifeWeight; },
      get helixSpin() { return entityState.helixSpin; },
      get lifeWeight() { return entityState.lifeWeight; },
      get lifeProgress() { return entityState.lifeProgress; },
      get groupRotation() { return [group.rotation.x, group.rotation.y, group.rotation.z]; },
      get rotationOrder() { return group.rotation.order; },
      get heroOnScreen() { return entityState.heroOnScreen; },
      get heroIntroStarted() { return entityState.heroIntroStarted; },
      get introActive() { return entityState.introActive; },
      get introProgress() { return entityState.introProgress; },
      get introCameraOffset() { return entityState.introCameraOffset; },
      get introSpin() { return entityState.introSpin; },
      get introTurbulence() { return entityState.introTurbulence; },
      get heroRoleCounts() { return [...heroRoleCounts]; },
      get heroSource() { return heroParticleData.source; },
      get heroBounds() { return heroParticleData.bounds ? { ...heroParticleData.bounds } : null; },
      get heroColors() { return [...HERO_MASCOT_COLORS]; },
      get artworkParticleSources() {
        return {
          ignition: particleArtwork.ignition?.source || null,
          gaming: particleArtwork.gaming?.source || null,
          life: mascotParticleData.source || null,
        };
      },
      get heroRoleRadiusBounds() { return heroRoleRadiusBounds.map(({ min, max }) => ({ min, max })); },
      get heroRingColors() { return [...HERO_RING_COLORS]; },
      get heroCoreColor() { return HERO_CORE_COLOR; },
      get heroRingRadii() { return [...HERO_RING_RADII]; },
      get heroRingTilts() { return HERO_RING_TILTS.map((tilt) => [...tilt]); },
      get heroGimbalAxes() { return HERO_GIMBAL_AXES.map((axis) => [...axis]); },
      get heroGimbalSpeeds() { return [...HERO_GIMBAL_SPEEDS]; },
      get cameraZ() { return camera.position.z; },
      get groupX() { return group.position.x; },
      get groupY() { return group.position.y; },
      get orbit() { return entityState.orbit; },
      get orbitWeight() { return entityState.orbitWeight; },
      get orbitYaw() { return entityState.orbitYaw; },
      get orbitDolly() { return entityState.orbitDolly; },
      get charge() { return entityState.charge; },
      get heat() { return entityState.heat; },
      get starWeight() { return entityState.starWeight; },
      get wave() { return uniforms.uWave.value; },
      get tide() { return uniforms.uTide.value; },
      get flight() { return entityState.flight; },
      get cometWeight() { return entityState.cometWeight; },
      get signal() { return uniforms.uSignal.value; },
      get transmissionRoleCounts() {
        const core = Math.floor(pointCount * 0.12);
        const shells = Math.floor(pointCount * 0.72);
        return { core, shells, listening: pointCount - core - shells };
      },
      get transmissionColor() { return STYLE[6].color; },
      get groupScale() { return entityState.groupScale; },
      get burstValue() { return uniforms.uBurst.value; },
      get burstActive() { return entityState.fullBurstActive; },
      get mouseForce() { return entityState.mouseForce; },
      get mousePosition() { return uniforms.uMouse.value.toArray(); },
      get postEnabled() { return Boolean(composer); },
      get postPassCount() { return composer?.passes?.length || 0; },
      get afterimageDamp() { return afterimagePass?.uniforms?.damp?.value ?? null; },
      get bloomSettings() {
        return bloomPass ? { strength: bloomPass.strength, radius: bloomPass.radius, threshold: bloomPass.threshold } : null;
      },
      get constellationShape() { return entityState.constellationShape; },
      get constellationOpacity() { return entityState.constellationOpacity; },
      get constellationColor() { return constellationMaterial ? `#${constellationMaterial.color.getHexString()}` : null; },
      get constellationLinkCount() {
        return entityState.constellationShape >= 0
          ? constellationTargets?.[entityState.constellationShape]?.length / 6 || 0
          : 0;
      },
      get rendererAlpha() { return renderer.getContext().getContextAttributes()?.alpha ?? null; },
      get pixelRatio() { return renderer.getPixelRatio(); },
      get toneMapping() { return renderer.toneMapping; },
      destroy() {
        entityState.destroyed = true;
        burstTimeline?.kill();
        introTimeline?.kill();
        gsap.ticker.remove(render);
        runtime?.lenis?.off?.("scroll", onLenisScroll);
        window.removeEventListener("pointermove", onPointerMove);
        document.documentElement.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("blur", onPointerLeave);
        heroObserver?.disconnect();
        resizeObserver.disconnect();
        constellationGeometry?.dispose();
        constellationMaterial?.dispose();
        bloomPass?.dispose?.();
        afterimagePass?.dispose?.();
        composer?.dispose?.();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
    };
    window.__lmMembershipVisual = api;
    window.dispatchEvent(new CustomEvent("lm:membership-entity-ready", { detail: api }));
    document.body.classList.remove("lm-no-webgl");
    const ignitionSection = document.getElementById("ignition");
    const ignitionLines = ignitionSection?.querySelectorAll("[data-lm-ignition-line]");
    if (ignitionSection && ignitionLines?.length === 4) {
      gsap.set(ignitionLines, { opacity: 0.14, y: 24 });
      const ignitionTimeline = gsap.timeline({ paused: true });
      ignitionTimeline.to(ignitionLines, {
        opacity: 1,
        y: 0,
        color: "#eef2f7",
        duration: 0.35,
        stagger: 0.45,
        ease: "none",
      });
      ignitionTimeline.eventCallback("onUpdate", () => api.setCharge(ignitionTimeline.progress()));
      const ignitionTrigger = ScrollTrigger.create({
        id: "lm-ignition-pin",
        trigger: ignitionSection,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 1.3)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        animation: ignitionTimeline,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 2,
        onRefresh: () => api.setCharge(ignitionTimeline.progress()),
      });
      api.ignitionTrigger = ignitionTrigger;
    }
    const worldsSection = document.getElementById("worlds");
    const worldsTrack = worldsSection?.querySelector("[data-lm-worlds-track]");
    const worldsProgress = worldsSection?.querySelector("[data-lm-worlds-progress]");
    if (worldsSection && worldsTrack && worldsProgress) {
      const horizontalDistance = () => Math.max(0, worldsTrack.scrollWidth - window.innerWidth + 80);
      const revealTargets = worldsSection.querySelectorAll(".lm-epoch-card__media, .lm-epoch-card__era");
      gsap.set(revealTargets, { autoAlpha: 0, y: 20 });
      ScrollTrigger.create({
        trigger: worldsSection,
        start: "top 60%",
        once: true,
        onEnter: () => {
          worldsSection.classList.add("is-revealed");
          gsap.to(revealTargets, { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.075, ease: "power3.out" });
        },
      });
      const worldsTween = gsap.to(worldsTrack, {
        x: () => -horizontalDistance(),
        ease: "none",
        paused: true,
      });
      const worldsTrigger = ScrollTrigger.create({
        id: "lm-worlds-pin",
        trigger: worldsSection,
        start: "top top",
        end: () => `+=${Math.round(horizontalDistance() + window.innerHeight * 0.4)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        animation: worldsTween,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,
        onUpdate: (self) => {
          api.setOrbit(self.progress);
          worldsProgress.style.transform = `scaleX(${self.progress})`;
          worldsSection.style.setProperty("--lm-worlds-progress", self.progress.toFixed(4));
        },
        onRefresh: (self) => api.setOrbit(self.progress),
      });
      api.worldsTrigger = worldsTrigger;
    }
    const waterSection = document.getElementById("water");
    if (waterSection) {
      const waterTrigger = ScrollTrigger.create({
        id: "lm-water-tide",
        trigger: waterSection,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => api.setTide(self.progress),
        onRefresh: (self) => api.setTide(self.progress),
      });
      api.waterTrigger = waterTrigger;
    }
    const lifeSection = document.getElementById("life");
    if (lifeSection) {
      const lifeTrigger = ScrollTrigger.create({
        id: "lm-mascot-life-scroll",
        trigger: lifeSection,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => api.setLife(self.progress),
        onRefresh: (self) => api.setLife(self.progress),
      });
      api.lifeTrigger = lifeTrigger;
    }
    const flightSection = document.getElementById("flight");
    if (flightSection) {
      const flightTrigger = ScrollTrigger.create({
        id: "lm-comet-flight",
        trigger: flightSection,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => api.setFlight(self.progress),
        onRefresh: (self) => api.setFlight(self.progress),
      });
      api.flightTrigger = flightTrigger;
    }
    const refreshScrollGeometry = () => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
    refreshScrollGeometry();
    if (document.readyState === "complete") {
      window.setTimeout(refreshScrollGeometry, 0);
    } else {
      window.addEventListener("load", refreshScrollGeometry, { once: true });
    }
    window.setTimeout(refreshScrollGeometry, 320);
  } catch (error) {
    canvas.hidden = true;
    document.body.classList.add("lm-no-webgl");
    window.dispatchEvent(new CustomEvent("lm:membership-entity-error", { detail: { message: error?.message || "WebGL initialization failed" } }));
  }
}

let initialized = false;
const connectRuntime = async (runtime) => {
  if (initialized) return;
  initialized = true;
  const [mascot, [heroBrain, ignition, gaming]] = await Promise.all([
    mascotParticleDataPromise,
    artworkParticleDataPromise,
  ]);
  initializeEntity(runtime, { mascot, heroBrain, ignition, gaming });
};
window.addEventListener("lm:membership-runtime-ready", (event) => connectRuntime(event.detail), { once: true });

await import("./memberships-cinematic.js?v=membership-runtime-ready-3");
if (window.__lmMembershipRuntime) connectRuntime(window.__lmMembershipRuntime);
