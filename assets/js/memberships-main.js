import * as THREE from "three";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 767px)").matches;
const pointCount = mobile ? 5000 : 15000;
const canvas = document.getElementById("lmSignalEntity");
const sections = [...document.querySelectorAll(".lm-observatory-section[data-lm-shape]")];

const STYLE = [
  { color: "#7fd4ff", cameraZ: 14.5, x: 0 },
  { color: "#ff8a5b", cameraZ: 13.5, x: 0 },
  { color: "#c9a06a", cameraZ: 14.5, x: 2.0 },
  { color: "#4fb6e0", cameraZ: 13.0, x: 2.4 },
  { color: "#5bf0d8", cameraZ: 12.5, x: 1.8 },
  { color: "#e08ab8", cameraZ: 13.5, x: -0.8 },
  { color: "#a78bfa", cameraZ: 14.5, x: 0 },
  { color: "#3d7fd6", cameraZ: 16.0, x: 0 },
];
const DRIFT = [0.18, 0.72, 0.28, 0.62, 0.46, 0.86, 0.68, 0.24];
const LIVELINESS = [0.3, 0.95, 0.42, 0.82, 0.64, 1.0, 0.72, 0.3];
const BACKGROUNDS = sections.map((section) => section.dataset.lmBg || "#04060a");

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
  for (let index = 0; index < count; index += 1) {
    const ring = index % 5;
    const angle = random() * Math.PI * 2;
    const radius = 2.8 + ring * 0.62 + (random() - 0.5) * 0.16;
    let x = Math.cos(angle) * radius;
    let y = Math.sin(angle) * radius;
    let z = (random() - 0.5) * 0.12;
    if (ring === 1) [x, y, z] = rotateX(x, y, z, Math.PI / 2.7);
    if (ring === 2) [x, y, z] = rotateX(x, y, z, -Math.PI / 2.5);
    if (ring === 3) [x, y, z] = rotateZ(...rotateX(x, y, z, Math.PI / 2), Math.PI / 3.2);
    if (ring === 4) [x, y, z] = rotateZ(...rotateX(x, y, z, Math.PI / 2), -Math.PI / 3.2);
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
  for (let index = 0; index < count; index += 1) {
    let x;
    let y;
    let z;
    if (random() < 0.24) {
      const direction = unitDirection(random);
      const radius = 2.3 * Math.cbrt(random());
      x = 2.6 + direction[0] * radius;
      y = direction[1] * radius;
      z = direction[2] * radius;
    } else {
      const t = Math.pow(random(), 0.72);
      const width = 0.18 + t * 1.08;
      x = 2.3 - t * 9.2 + (random() - 0.5) * width;
      y = Math.sin(t * Math.PI * 1.2) * 1.15 + (random() - 0.5) * width;
      z = Math.cos(t * Math.PI * 0.9) * 0.72 + (random() - 0.5) * width;
    }
    setPoint(target, index, x, y, z);
  }
  return target;
}

function generateSignalTransmission(count, seed = 97) {
  const random = mulberry32(seed);
  const target = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const kind = random();
    let x;
    let y;
    let z;
    if (kind < 0.82) {
      const shell = 2.1 + Math.floor(random() * 5) * 0.92;
      const polar = (random() - 0.5) * Math.PI * 0.84;
      const azimuth = (random() - 0.5) * Math.PI * 1.28;
      x = Math.cos(polar) * Math.cos(azimuth) * shell - 1.25;
      y = Math.sin(polar) * shell;
      z = Math.cos(polar) * Math.sin(azimuth) * shell;
    } else {
      x = -1.2 + random() * 7.6;
      y = (random() - 0.5) * 0.18;
      z = (random() - 0.5) * 0.18;
    }
    setPoint(target, index, x, y, z);
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

function initializeEntity(runtime) {
  if (!canvas || reducedMotion.matches || sections.length !== 8) {
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

    const shapes = generators.map((generator, index) => generator(pointCount, 101 + index * 137));
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
      uPulse: { value: 0 },
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
        uniform float uMorph;
        uniform float uTime;
        uniform float uTime2;
        uniform float uLiveliness;
        uniform float uScrollTurbulence;
        uniform float uPulse;
        uniform float uPixelRatio;
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
          float breath = 1.0 + sin(uTime2 * 0.72 + aSeed * 6.28318) * (0.006 + uLiveliness * 0.009);
          position *= breath + uPulse * (0.035 + aSeed * 0.025);
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
          float disc = smoothstep(0.5, 0.12, distanceFromCenter);
          float hotCore = smoothstep(0.16, 0.0, distanceFromCenter);
          float twinkle = 0.68 + 0.32 * sin(uTime * (1.6 + vSeed * 4.2) + vSeed * 73.0);
          vec3 color = mix(uColorFrom, uColorTo, vTravel);
          if (vSeed > 0.985) color = vec3(1.0);
          if (vSeed > 0.9982) color = vec3(1.0, 0.2392, 0.5412);
          color += hotCore * 1.05;
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

    const entityState = {
      shapeFloat: 0,
      segment: -1,
      pointerTargetX: 0,
      pointerTargetY: 0,
      pointerX: 0,
      pointerY: 0,
      scrollTurbulence: 0,
      maxTurbulence: 0,
      variableTime: 0,
      lastTime: performance.now(),
      pulseStarted: 0,
      destroyed: false,
    };
    const progressTable = new Float32Array(8);
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
        if (progress > 0) nextShapeFloat = Math.max(nextShapeFloat, shape - 1 + progress);
      }
      setShapeFloat(nextShapeFloat);
    };

    sections.forEach((section) => {
      const shape = Number(section.dataset.lmShape);
      if (!Number.isFinite(shape) || shape < 1) return;
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

    const onPointerMove = (event) => {
      entityState.pointerTargetX = event.clientX / innerWidth * 2 - 1;
      entityState.pointerTargetY = event.clientY / innerHeight * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    bindSegment(0);
    const render = () => {
      if (entityState.destroyed || document.hidden) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - entityState.lastTime) / 1000));
      entityState.lastTime = now;
      const segment = entityState.segment < 0 ? 0 : entityState.segment;
      const fraction = uniforms.uMorph.value;
      const drift = THREE.MathUtils.lerp(DRIFT[segment], DRIFT[segment + 1], fraction);
      const liveliness = THREE.MathUtils.lerp(LIVELINESS[segment], LIVELINESS[segment + 1], fraction);
      entityState.variableTime += dt * (0.5 + drift * 1.6);
      entityState.scrollTurbulence *= Math.exp(-dt * 2.8);
      uniforms.uTime.value = now * 0.001;
      uniforms.uTime2.value = entityState.variableTime;
      uniforms.uLiveliness.value = liveliness;
      uniforms.uScrollTurbulence.value = entityState.scrollTurbulence;
      if (entityState.pulseStarted) {
        const pulseAge = (now - entityState.pulseStarted) / 850;
        uniforms.uPulse.value = pulseAge < 1 ? Math.sin(pulseAge * Math.PI) : 0;
      }

      entityState.pointerX += (entityState.pointerTargetX - entityState.pointerX) * 0.045;
      entityState.pointerY += (entityState.pointerTargetY - entityState.pointerY) * 0.045;
      group.rotation.y = Math.sin(now * 0.00013) * 0.09 + entityState.pointerX * 0.14;
      group.rotation.x = Math.cos(now * 0.00011) * 0.045 - entityState.pointerY * 0.1;
      group.rotation.z = Math.sin(now * 0.000071) * 0.035;
      group.position.x = THREE.MathUtils.lerp(STYLE[segment].x, STYLE[segment + 1].x, fraction);
      camera.position.z = THREE.MathUtils.lerp(STYLE[segment].cameraZ, STYLE[segment + 1].cameraZ, fraction)
        + Math.sin(fraction * Math.PI) * 1.3;
      scene.background.copy(backgroundFrom).lerp(backgroundTo, fraction);
      renderer.render(scene, camera);
    };
    gsap.ticker.add(render);

    const api = {
      pulse() { entityState.pulseStarted = performance.now(); },
      get currentShape() { return entityState.shapeFloat; },
      get shapeFloat() { return entityState.shapeFloat; },
      get morph() { return uniforms.uMorph.value; },
      get segment() { return entityState.segment; },
      get pointCount() { return pointCount; },
      get turbulence() { return uniforms.uScrollTurbulence.value; },
      get maxTurbulence() { return entityState.maxTurbulence; },
      get cameraZ() { return camera.position.z; },
      get groupX() { return group.position.x; },
      get rendererAlpha() { return renderer.getContext().getContextAttributes()?.alpha ?? null; },
      get pixelRatio() { return renderer.getPixelRatio(); },
      get toneMapping() { return renderer.toneMapping; },
      destroy() {
        entityState.destroyed = true;
        gsap.ticker.remove(render);
        runtime?.lenis?.off?.("scroll", onLenisScroll);
        window.removeEventListener("pointermove", onPointerMove);
        resizeObserver.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
    };
    window.__lmMembershipVisual = api;
    window.dispatchEvent(new CustomEvent("lm:membership-entity-ready", { detail: api }));
    document.body.classList.remove("lm-no-webgl");
    ScrollTrigger.refresh();
  } catch (error) {
    canvas.hidden = true;
    document.body.classList.add("lm-no-webgl");
    window.dispatchEvent(new CustomEvent("lm:membership-entity-error", { detail: { message: error?.message || "WebGL initialization failed" } }));
  }
}

let initialized = false;
const connectRuntime = (runtime) => {
  if (initialized) return;
  initialized = true;
  initializeEntity(runtime);
};
window.addEventListener("lm:membership-runtime-ready", (event) => connectRuntime(event.detail), { once: true });

await import("./memberships-cinematic.js?v=membership-entity-4");
if (window.__lmMembershipRuntime) connectRuntime(window.__lmMembershipRuntime);
