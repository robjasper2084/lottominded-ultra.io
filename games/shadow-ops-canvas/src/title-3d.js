import * as THREE from "../assets/vendor/three.module.min.js";

const titleScreen = document.getElementById("titleScreen");
const canvas = document.getElementById("titleWorld");
const TITLE_ASSET_BASE = "../assets/title3d/";
const TITLE_ENV_PACK_ID = (new URLSearchParams(window.location.search).get("envpack") || "cyber-vault-v1").trim();
const TITLE_ENV_PACK_BASES = {
  "cyber-vault-v1": "../assets/environment3d/cyber-vault-v1/"
};

if (titleScreen && canvas) {
  try {
    new TitleVaultWorld(titleScreen, canvas);
  } catch (error) {
    canvas.dataset.titleWorldError = "true";
    console.warn("Title 3D world disabled", error);
  }
}

function TitleVaultWorld(root, targetCanvas) {
  this.root = root;
  this.canvas = targetCanvas;
  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.FogExp2(0x020104, 0.085);
  this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  this.renderer = new THREE.WebGLRenderer({
    canvas: targetCanvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });
  this.renderer.setClearColor(0x000000, 0);
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  if (THREE.SRGBColorSpace) this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  this.textureLoader = new THREE.TextureLoader();
  this.backdropTexture = loadTitleTexture(this, "title3d_clean_backdrop_nohero_2.jpg");
  this.platformTexture = loadTitleTexture(this, "title3d_ref_platform_tile_v2.jpg", { repeat: [2.4, 2.4] });
  this.wallTexture = loadTitleTexture(this, "title3d_ref_wall_tile_v2.jpg", { repeat: [1.45, 2.25] });
  this.environmentPackBase = TITLE_ENV_PACK_BASES[TITLE_ENV_PACK_ID] || "";
  this.environmentPackTextures = this.environmentPackBase ? {
    far: loadTextureFromBase(this, this.environmentPackBase, "layers/far-purple-nebula-sky.png"),
    silhouette: loadTextureFromBase(this, this.environmentPackBase, "layers/distant-cyber-vault-silhouettes.png"),
    wall: loadTextureFromBase(this, this.environmentPackBase, "layers/mid-circuit-wall.png"),
    fog: loadTextureFromBase(this, this.environmentPackBase, "layers/hologram-fog-overlay.png")
  } : null;

  this.clock = new THREE.Clock();
  this.raycaster = new THREE.Raycaster();
  this.pointer = new THREE.Vector2(-0.12, 0.06);
  this.pointerTarget = new THREE.Vector2(-0.12, 0.06);
  this.lookAt = new THREE.Vector3(0.2, 1.15, -1.1);
  this.yaw = -0.3;
  this.pitch = 0.14;
  this.targetYaw = -0.3;
  this.targetPitch = 0.14;
  this.distance = 8.8;
  this.targetDistance = 8.8;
  this.dragging = false;
  this.visible = !root.classList.contains("is-hidden");
  this.interactives = [];
  this.pulses = [];
  this.energySparks = [];
  this.hovered = null;
  this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  buildScene(this);
  bindTitleWorldEvents(this);
  this.resize();
  this.observer = new MutationObserver(() => {
    this.visible = !this.root.classList.contains("is-hidden");
    if (this.visible) this.resize();
  });
  this.observer.observe(this.root, { attributes: true, attributeFilter: ["class"] });
  this.canvas.dataset.titleWorldReady = "true";
  window.__titleVaultWorld = this;
  requestAnimationFrame(() => animateTitleWorld(this));
}

function buildScene(world) {
  const scene = world.scene;
  scene.add(new THREE.HemisphereLight(0x8adfff, 0x13050f, 0.72));

  const keyLight = new THREE.PointLight(0xff4fda, 5.8, 18);
  keyLight.position.set(-3.4, 4.2, 3.6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xffd66d, 4.4, 20);
  rimLight.position.set(5.6, 3.4, -4.2);
  scene.add(rimLight);

  makeHiggsfieldBackdrop(world);
  makeTitleFloorGrid(world);
  makeReferenceWallPlanes(world);
  makeCyberVaultReactor(world);
  makeCircuitPylonRow(world);
  makePlatform(world, -4.6, 0.42, 0.6, 3.1, 0.34, 1.2);
  makePlatform(world, 0.2, 0.35, -1.4, 5.6, 0.32, 1.45);
  makePlatform(world, 4.6, 0.52, -2.7, 3.2, 0.38, 1.4);
  makePlatform(world, 6.4, 1.8, -4.2, 2.5, 0.28, 1.05);
  makeVaultGate(world, 6.15, 1.72, -2.58);
  makeDrone(world, -1.5, 3.0, -3.15, 0.0);
  makeDrone(world, 1.4, 3.28, -3.6, 1.4);
  makeDrone(world, 4.0, 2.75, -2.35, 2.6);
  makeParticleField(world);
  makeTitleFogAndEmblems(world);
}

function titleAssetUrl(file) {
  return new URL(`${TITLE_ASSET_BASE}${file}`, import.meta.url).href;
}

function assetUrl(base, file) {
  return new URL(`${base}${file}`, import.meta.url).href;
}

function loadTitleTexture(world, file, options = {}) {
  return configureTexture(world, world.textureLoader.load(titleAssetUrl(file)), options);
}

function loadTextureFromBase(world, base, file, options = {}) {
  return configureTexture(world, world.textureLoader.load(assetUrl(base, file)), options);
}

function configureTexture(world, texture, options = {}) {
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, world.renderer.capabilities.getMaxAnisotropy?.() || 1);
  if (options.repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(options.repeat[0], options.repeat[1]);
  }
  return texture;
}

function makeHiggsfieldBackdrop(world) {
  if (world.environmentPackTextures) {
    makeEnvironmentPackBackdrop(world);
    return;
  }
  const material = new THREE.MeshBasicMaterial({
    map: world.backdropTexture,
    transparent: true,
    opacity: 0.96,
    depthWrite: false
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(17.6, 9.82), material);
  backdrop.position.set(0.6, 3.15, -8.15);
  backdrop.renderOrder = -10;
  world.scene.add(backdrop);

  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(18.2, 10.2),
    new THREE.MeshBasicMaterial({
      color: 0x16051f,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  haze.position.set(0.3, 3.15, -7.92);
  haze.renderOrder = -9;
  world.scene.add(haze);
}

function makeEnvironmentPackBackdrop(world) {
  const layers = [
    { texture: world.environmentPackTextures.far, z: -8.45, opacity: 0.96, order: -14, scale: [17.9, 10.1] },
    { texture: world.environmentPackTextures.silhouette, z: -8.2, opacity: 0.78, order: -13, scale: [17.9, 10.1] },
    { texture: world.environmentPackTextures.wall, z: -7.92, opacity: 0.58, order: -12, scale: [18.0, 10.12] },
    { texture: world.environmentPackTextures.fog, z: -7.58, opacity: 0.34, order: -11, scale: [18.0, 10.12], additive: true }
  ];
  for (const layer of layers) {
    const material = new THREE.MeshBasicMaterial({
      map: layer.texture,
      transparent: true,
      opacity: layer.opacity,
      depthWrite: false,
      blending: layer.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(layer.scale[0], layer.scale[1]), material);
    plane.position.set(0.45, 3.12, layer.z);
    plane.renderOrder = layer.order;
    world.scene.add(plane);
  }

  const readabilityWash = new THREE.Mesh(
    new THREE.PlaneGeometry(18.2, 10.2),
    new THREE.MeshBasicMaterial({
      color: 0x020104,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    })
  );
  readabilityWash.position.set(0.32, 3.14, -7.34);
  readabilityWash.renderOrder = -10;
  world.scene.add(readabilityWash);
}

function makeTitleFloorGrid(world) {
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x06070b,
    map: world.platformTexture,
    metalness: 0.58,
    roughness: 0.36,
    emissive: 0x160022,
    emissiveIntensity: 0.35
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 18, 28, 18), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.08, -1.5);
  world.scene.add(floor);

  const grid = new THREE.GridHelper(28, 32, 0xffd66d, 0x38dbff);
  grid.position.set(0, -0.05, -1.5);
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  sceneSafeAdd(world.scene, grid);

  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 0.08),
    new THREE.MeshBasicMaterial({
      color: 0x38dbff,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  horizon.position.set(0, 1.05, -5.55);
  horizon.renderOrder = -2;
  world.scene.add(horizon);
}

function makeTitleFogAndEmblems(world) {
  makeTitleSprite(world, "ref_cards/fog_floor_v2.png", 0.15, 0.72, -3.8, 9.6, 2.08, {
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    renderOrder: -5
  });
  makeTitleSprite(world, "ref_cards/fog_center_v2.png", 0.2, 2.0, -5.25, 6.6, 3.1, {
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    renderOrder: -4
  });
  makeTitleSprite(world, "ref_cards/m_emblem_v2.png", -6.35, 2.25, -3.35, 1.45, 1.58, {
    name: "lottomind-emblem",
    interactive: true,
    opacity: 0.72,
    bob: 0.014,
    alphaTest: 0.08
  });
  makeTitleSprite(world, "ref_cards/lock_badge_v2.png", 6.18, 1.38, -2.28, 0.72, 0.9, {
    name: "vault-lock-emblem",
    interactive: true,
    opacity: 0.9,
    bob: 0.03,
    alphaTest: 0.1
  });
}

function sceneSafeAdd(scene, object) {
  scene.add(object);
}

function makeReferenceWallPlanes(world) {
  const material = new THREE.MeshStandardMaterial({
    map: world.wallTexture,
    color: 0x1a1420,
    metalness: 0.68,
    roughness: 0.34,
    emissive: 0x2a1108,
    emissiveIntensity: 0.52,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 6.6), material);
  left.position.set(-7.25, 2.5, -4.85);
  left.rotation.y = 0.24;
  left.renderOrder = -6;
  world.scene.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 6.3), material.clone());
  right.position.set(7.35, 2.38, -4.75);
  right.rotation.y = -0.22;
  right.renderOrder = -6;
  world.scene.add(right);
}

function makeCyberVaultReactor(world) {
  const group = new THREE.Group();
  group.name = "cyber-vault-heart-reactor";
  group.position.set(2.85, 2.68, -4.58);
  group.rotation.y = -0.2;
  group.userData.phase = 0;
  world.scene.add(group);

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x111018,
    metalness: 0.86,
    roughness: 0.23,
    emissive: 0x230029,
    emissiveIntensity: 0.62
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd66d,
    metalness: 0.82,
    roughness: 0.18,
    emissive: 0x7a4300,
    emissiveIntensity: 0.82
  });
  const magentaMat = new THREE.MeshStandardMaterial({
    color: 0xff4fda,
    metalness: 0.25,
    roughness: 0.16,
    emissive: 0xff2fbc,
    emissiveIntensity: 2.4
  });

  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.09, 18, 128), armorMat);
  const mid = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.045, 12, 112), goldMat);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 10, 96), magentaMat);
  outer.rotation.z = 0.12;
  mid.rotation.z = -0.38;
  inner.rotation.z = 0.66;
  outer.userData.spin = 0.08;
  mid.userData.spin = -0.13;
  inner.userData.spin = 0.22;
  group.add(outer, mid, inner);

  const heart = new THREE.Mesh(makeHeartGeometry(), magentaMat);
  heart.position.set(0, -0.04, 0.06);
  heart.scale.setScalar(0.64);
  group.add(heart);

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), i % 2 ? armorMat : goldMat);
    blade.position.set(Math.cos(angle) * 1.22, Math.sin(angle) * 1.22, -0.08);
    blade.rotation.z = angle;
    group.add(blade);
  }

  for (let i = 0; i < 18; i += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.025 + (i % 3) * 0.008, 10, 8),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xffd66d : 0xff4fda,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    spark.userData.orbitRadius = 0.72 + Math.random() * 0.72;
    spark.userData.orbitSpeed = 0.35 + Math.random() * 0.55;
    spark.userData.orbitPhase = Math.random() * Math.PI * 2;
    spark.userData.baseY = (Math.random() - 0.5) * 1.1;
    group.add(spark);
    world.energySparks.push(spark);
  }

  group.userData.animate = (time) => {
    const pulse = 1 + Math.sin(time * 2.15) * 0.035;
    group.scale.setScalar(pulse);
    heart.scale.setScalar(0.64 + Math.sin(time * 3.2) * 0.045);
    magentaMat.emissiveIntensity = 2.1 + Math.sin(time * 2.3) * 0.55;
    for (const spark of world.energySparks) {
      const t = time * spark.userData.orbitSpeed + spark.userData.orbitPhase;
      spark.position.set(Math.cos(t) * spark.userData.orbitRadius, spark.userData.baseY + Math.sin(t * 1.7) * 0.18, Math.sin(t) * 0.22 + 0.04);
      spark.material.opacity = 0.42 + Math.sin(time * 2.8 + spark.userData.orbitPhase) * 0.28;
    }
  };

  addInteractive(world, group, "heart-core-reactor");
}

function makeHeartGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.34);
  shape.bezierCurveTo(0.58, 0.92, 1.34, 0.34, 0.72, -0.32);
  shape.bezierCurveTo(0.42, -0.64, 0.16, -0.78, 0, -1.04);
  shape.bezierCurveTo(-0.16, -0.78, -0.42, -0.64, -0.72, -0.32);
  shape.bezierCurveTo(-1.34, 0.34, -0.58, 0.92, 0, 0.34);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.025,
    bevelThickness: 0.025
  });
  geometry.center();
  return geometry;
}

function makeCircuitPylonRow(world) {
  for (let i = 0; i < 8; i += 1) {
    const x = -6.8 + i * 1.9;
    const y = 0.95 + (i % 3) * 0.16;
    const z = -4.95 + (i % 2) * 0.55;
    makeCircuitPylon(world, x, y, z, i);
  }
  for (let i = 0; i < 5; i += 1) {
    makeEnergyNode(world, -5.4 + i * 2.7, 0.58, -2.1 - i * 0.28, i % 2 ? 0xffd66d : 0xa522ff, `floor-energy-node-${i}`);
  }
}

function makePlatform(world, x, y, z, width, height, depth) {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: 0x09080d,
      map: world.platformTexture,
      metalness: 0.76,
      roughness: 0.28,
      emissive: 0x1b071f,
      emissiveIntensity: 0.36
    })
  );
  body.position.set(x, y, z);
  world.scene.add(body);

  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.94, 0.035, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xffd66d })
  );
  rail.position.set(x, y + height * 0.56, z + depth * 0.52);
  world.scene.add(rail);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.82, 0.026, 0.052),
    new THREE.MeshBasicMaterial({ color: 0xa522ff, transparent: true, opacity: 0.82 })
  );
  glow.position.set(x, y + height * 0.62, z + depth * 0.55);
  world.scene.add(glow);
}

function makeReferenceAssetLayer(world) {
  makeTitleSprite(world, "ref_cards/fog_floor_v2.png", 0.15, 0.72, -3.8, 9.6, 2.08, {
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    renderOrder: -5
  });
  makeTitleSprite(world, "ref_cards/fog_center_v2.png", 0.2, 2.0, -5.25, 6.6, 3.1, {
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    renderOrder: -4
  });
  makeTitleSprite(world, "ref_cards/m_emblem_v2.png", -6.35, 2.25, -3.35, 1.45, 1.58, {
    name: "lottomind-emblem",
    interactive: true,
    opacity: 0.72,
    bob: 0.014,
    alphaTest: 0.08
  });
  makeTitleSprite(world, "ref_cards/upper_platform_v2.png", -3.62, 2.32, -4.35, 2.32, 0.88, {
    opacity: 0.82,
    renderOrder: -1,
    alphaTest: 0.04
  });
  makeTitleSprite(world, "ref_cards/floor_chunk_v2.png", 3.15, 1.03, -4.65, 3.7, 0.94, {
    opacity: 0.58,
    renderOrder: -2,
    alphaTest: 0.05
  });
  makeTitleSprite(world, "ref_cards/lock_badge_v2.png", 6.18, 1.38, -2.28, 0.72, 0.9, {
    name: "vault-lock",
    interactive: true,
    opacity: 0.9,
    bob: 0.03,
    alphaTest: 0.1
  });
  makeTitleSprite(world, "ref_cards/purple_hud_scan_v2.png", -3.38, 1.34, -1.95, 1.36, 0.58, {
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    bob: 0.01,
    alphaTest: 0.04
  });
  makeTitleSprite(world, "ref_cards/left_wall_circuit_v2.png", -7.15, 2.05, -4.15, 1.25, 2.9, {
    opacity: 0.38,
    renderOrder: -3,
    alphaTest: 0.06
  });
  makeTitleSprite(world, "ref_cards/right_wall_circuit_v2.png", 7.05, 2.12, -4.1, 1.15, 2.8, {
    opacity: 0.34,
    renderOrder: -3,
    alphaTest: 0.06
  });
}

function makeTitleSprite(world, file, x, y, z, width, height, options = {}) {
  const texture = loadTitleTexture(world, file);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: options.opacity ?? 0.9,
    depthWrite: false,
    blending: options.blending || THREE.NormalBlending
  });
  material.alphaTest = options.alphaTest ?? 0.025;
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = options.renderOrder ?? 2;
  if (options.bob && !world.reducedMotion) {
    sprite.userData.baseY = y;
    sprite.userData.phase = x * 0.6 + z * 0.3;
    sprite.userData.animate = (time) => {
      sprite.position.y = sprite.userData.baseY + Math.sin(time * 1.55 + sprite.userData.phase) * options.bob;
      material.opacity = (options.opacity ?? 0.9) * (0.9 + Math.sin(time * 2.4 + sprite.userData.phase) * 0.08);
    };
  }
  world.scene.add(sprite);
  if (options.interactive || options.name) addInteractive(world, sprite, options.name || file);
  return sprite;
}

function makeVaultGate(world, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  world.scene.add(group);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x1b1028,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0xa522ff,
    emissiveIntensity: 1.1
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd66d,
    metalness: 0.68,
    roughness: 0.24,
    emissive: 0x5e3300,
    emissiveIntensity: 0.8
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff4f9a,
    metalness: 0.34,
    roughness: 0.16,
    emissive: 0xff2fbc,
    emissiveIntensity: 1.6
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.055, 12, 96), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 10, 80), goldMat);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 2), coreMat);
  group.add(ring, ring2, core);
  ring.userData.spin = 0.18;
  ring2.userData.spin = -0.26;
  core.userData.spin = 0.5;

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 1.68, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x0a0910,
      metalness: 0.6,
      roughness: 0.22,
      emissive: 0x251334,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.58
    })
  );
  door.position.z = -0.08;
  group.add(door);
  addInteractive(world, core, "vault-core");
}

function makeDrone(world, x, y, z, phase) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.userData.phase = phase;
  world.scene.add(group);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x141019,
    metalness: 0.82,
    roughness: 0.2,
    emissive: 0x3d0750,
    emissiveIntensity: 0.75
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd66d });
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0xa522ff, transparent: true, opacity: 0.62 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.36), bodyMat);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.04), eyeMat);
  eye.position.set(0, 0.01, 0.2);
  group.add(body, eye);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.055, 0.055), bodyMat);
    arm.position.set(side * 0.42, 0.1, 0);
    const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 36), rotorMat);
    rotor.rotation.x = Math.PI / 2;
    rotor.position.set(side * 0.72, 0.13, 0);
    rotor.userData.spin = side * 1.8;
    group.add(arm, rotor);
  }

  group.userData.animate = (time) => {
    group.position.y = y + Math.sin(time * 1.7 + phase) * 0.12;
    group.rotation.y = Math.sin(time * 0.9 + phase) * 0.28;
  };
}

function makeHeartCrystal(world, x, y, z, scale) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  world.scene.add(group);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xff4f9a,
    metalness: 0.25,
    roughness: 0.16,
    emissive: 0xff2f86,
    emissiveIntensity: 1.5
  });
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), mat);
  const right = left.clone();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.58, 4), mat);
  left.position.set(-0.16, 0.14, 0);
  right.position.set(0.16, 0.14, 0);
  cone.position.set(0, -0.14, 0);
  cone.rotation.z = Math.PI / 4;
  group.add(left, right, cone);
  addInteractive(world, group, "heart-crystal");
}

function makeEnergyNode(world, x, y, z, color, name) {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.32,
    roughness: 0.18,
    emissive: color,
    emissiveIntensity: 1.35
  });
  const node = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.16, 36), material);
  node.position.set(x, y, z);
  world.scene.add(node);
  addInteractive(world, node, name);
}

function makeCircuitPylon(world, x, y, z, index) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0b0a0e,
    metalness: 0.7,
    roughness: 0.34,
    emissive: index % 2 ? 0x331339 : 0x241500,
    emissiveIntensity: 0.7
  });
  const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.5 + (index % 3) * 0.34, 0.28), mat);
  pylon.position.set(x, y, z);
  world.scene.add(pylon);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 1.14, 0.018),
    new THREE.MeshBasicMaterial({ color: index % 2 ? 0xa522ff : 0xffd66d })
  );
  strip.position.set(x + 0.116, y, z + 0.151);
  world.scene.add(strip);
}

function makeParticleField(world) {
  const count = 360;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = 0.6 + Math.random() * 5.2;
    positions[i * 3 + 2] = -7.4 + Math.random() * 7.8;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x9bf6ff,
    size: 0.045,
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const stars = new THREE.Points(geometry, material);
  stars.userData.animate = (time) => {
    stars.rotation.y = time * 0.015;
    material.opacity = 0.48 + Math.sin(time * 1.4) * 0.14;
  };
  world.scene.add(stars);
}

function addInteractive(world, object, name) {
  object.userData.interactiveName = name;
  object.userData.baseScale = object.scale.clone();
  object.traverse?.((child) => {
    child.userData.interactiveRoot = object;
  });
  world.interactives.push(object);
}

function bindTitleWorldEvents(world) {
  const canvas = world.canvas;
  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    world.pointerTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    world.pointerTarget.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  canvas.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    world.dragging = true;
    world.lastPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    updatePointer(event);
    if (!world.dragging || !world.lastPointer) return;
    const dx = event.clientX - world.lastPointer.x;
    const dy = event.clientY - world.lastPointer.y;
    world.targetYaw -= dx * 0.0048;
    world.targetPitch = THREE.MathUtils.clamp(world.targetPitch + dy * 0.0032, -0.18, 0.44);
    world.lastPointer = { x: event.clientX, y: event.clientY };
  });

  world.root.addEventListener("pointermove", (event) => {
    updatePointer(event);
  });

  const endDrag = (event) => {
    world.dragging = false;
    world.lastPointer = null;
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    world.dragging = false;
    world.lastPointer = null;
  });

  canvas.addEventListener("click", () => {
    if (world.hovered) {
      spawnPulse(world, world.hovered.getWorldPosition(new THREE.Vector3()));
      world.targetDistance = Math.max(6.8, world.targetDistance - 0.18);
    }
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      world.targetDistance = THREE.MathUtils.clamp(world.targetDistance + Math.sign(event.deltaY) * 0.42, 6.6, 10.6);
    },
    { passive: false }
  );

  window.addEventListener("resize", () => world.resize());

  world.resize = () => {
    const rect = world.root.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || window.innerWidth));
    const height = Math.max(1, Math.round(rect.height || window.innerHeight));
    world.camera.aspect = width / height;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(width, height, false);
  };
}

function spawnPulse(world, position) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x38dbff,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 8, 48), material);
  pulse.position.copy(position);
  pulse.rotation.x = Math.PI / 2;
  pulse.userData.age = 0;
  world.scene.add(pulse);
  world.pulses.push(pulse);
}

function animateTitleWorld(world) {
  requestAnimationFrame(() => animateTitleWorld(world));
  if (!world.visible) return;
  const dt = Math.min(world.clock.getDelta(), 0.05);
  const time = world.clock.elapsedTime;
  const ease = 1 - Math.pow(0.001, dt);

  world.pointer.lerp(world.pointerTarget, 0.08);
  world.yaw += (world.targetYaw - world.yaw) * ease * 0.55;
  world.pitch += (world.targetPitch - world.pitch) * ease * 0.55;
  world.distance += (world.targetDistance - world.distance) * ease * 0.4;

  const idleYaw = world.reducedMotion ? 0 : Math.sin(time * 0.15) * 0.05;
  const yaw = world.yaw + idleYaw + world.pointer.x * 0.05;
  const pitch = world.pitch + world.pointer.y * 0.045;
  const target = world.lookAt;
  const horizontal = Math.cos(pitch) * world.distance;
  world.camera.position.set(
    target.x + Math.sin(yaw) * horizontal,
    target.y + Math.sin(pitch) * world.distance + 1.2,
    target.z + Math.cos(yaw) * horizontal
  );
  world.camera.lookAt(target.x + world.pointer.x * 0.45, target.y + world.pointer.y * 0.24, target.z - 0.2);

  world.scene.traverse((object) => {
    if (object.userData.spin && !world.reducedMotion) object.rotation.z += object.userData.spin * dt;
    if (object.userData.animate) object.userData.animate(time, dt);
  });

  updateHover(world);
  updatePulses(world, dt);
  world.renderer.render(world.scene, world.camera);
}

function updateHover(world) {
  world.raycaster.setFromCamera(world.pointer, world.camera);
  const hits = world.raycaster.intersectObjects(world.interactives, true);
  const next = hits[0]?.object?.userData?.interactiveRoot || hits[0]?.object || null;
  if (next === world.hovered) return;
  setInteractiveHover(world.hovered, false);
  world.hovered = next;
  setInteractiveHover(world.hovered, true);
}

function setInteractiveHover(object, active) {
  if (!object) return;
  const base = object.userData.baseScale || new THREE.Vector3(1, 1, 1);
  object.scale.copy(base).multiplyScalar(active ? 1.12 : 1);
  object.traverse?.((child) => {
    const mat = child.material;
    if (mat?.emissiveIntensity !== undefined) {
      if (mat.userData.baseEmissiveIntensity === undefined) mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
      mat.emissiveIntensity = active ? mat.userData.baseEmissiveIntensity + 0.9 : mat.userData.baseEmissiveIntensity;
    }
  });
}

function updatePulses(world, dt) {
  for (let i = world.pulses.length - 1; i >= 0; i -= 1) {
    const pulse = world.pulses[i];
    pulse.userData.age += dt;
    const age = pulse.userData.age;
    pulse.scale.setScalar(1 + age * 4.2);
    pulse.material.opacity = Math.max(0, 0.72 - age * 1.2);
    if (age > 0.65) {
      world.scene.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
      world.pulses.splice(i, 1);
    }
  }
}
