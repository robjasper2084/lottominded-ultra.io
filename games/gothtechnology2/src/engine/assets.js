import { ASSET_URLS, MOTION_ASSET_VERSION } from "../config/assets.js?v=motion-atlas4-repaired";

const imageCache = new Map();

export const loadImage = (key, url) => {
  if (imageCache.has(url)) return imageCache.get(url);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`[GOTHTECHNOLOGY] Asset failed: ${key} ${url}`);
      resolve(null);
    };
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
};

export class AssetLoader {
  constructor(onProgress = () => {}) {
    this.onProgress = onProgress;
    this.images = {};
    this.manifest = null;
    this.animations = {};
    this.loadedCharacterMotions = new Set();
    this.characterMotionLoads = new Map();
  }

  async load() {
    this.manifest = await fetch(ASSET_URLS.manifest).then((r) => r.json());
    const baseImages = {
      logo: ASSET_URLS.logo,
      titleBackdrop: ASSET_URLS.titleBackdrop,
      background: ASSET_URLS.background,
      farTrees: ASSET_URLS.farTrees,
      fog: ASSET_URLS.fog,
      embers: ASSET_URLS.embers,
      ground: ASSET_URLS.ground,
      hitSpark: ASSET_URLS.effects.hitSpark,
      blockShield: ASSET_URLS.effects.blockShield,
      dust: ASSET_URLS.effects.dust,
      kalyxFireSlash: ASSET_URLS.effects.kalyxFireSlash,
      kalyxShadowClaw: ASSET_URLS.effects.kalyxShadowClaw,
      ezraBlueBurst: ASSET_URLS.effects.ezraBlueBurst,
      ezraOwlArc: ASSET_URLS.effects.ezraOwlArc,
      smoke: ASSET_URLS.effects.smoke,
      assistOwl: ASSET_URLS.assists.owl,
      assistRaven: ASSET_URLS.assists.raven,
      assistNocturna: ASSET_URLS.assists.nocturna,
      dossierVespera: ASSET_URLS.dossiers.vespera,
      dossierMalach: ASSET_URLS.dossiers.malach
    };

    for (const characterId of Object.keys(this.manifest.characters)) {
      this.animations[characterId] = {};
    }

    const all = Object.entries(baseImages).map(([key, url]) => ({ key, url }));

    const loadGroups = new Map();
    for (const item of all) {
      if (!loadGroups.has(item.url)) loadGroups.set(item.url, []);
      loadGroups.get(item.url).push(item);
    }

    let done = 0;
    await Promise.all(
      [...loadGroups.entries()].map(async ([url, items]) => {
        const image = await loadImage(items[0].key, url);
        for (const { key } of items) this.images[key] = image;
        done += 1;
        this.onProgress(done / loadGroups.size);
      })
    );

    return this;
  }

  async loadCharacterMotions(characterIds, onProgress = () => {}) {
    const uniqueIds = [...new Set(characterIds)].filter((characterId) => this.manifest.characters[characterId]);
    let done = 0;
    await Promise.all(uniqueIds.map(async (characterId) => {
      await this.loadCharacterMotion(characterId);
      done += 1;
      onProgress(done / uniqueIds.length, characterId);
    }));
    return this;
  }

  async loadCharacterMotion(characterId) {
    if (this.loadedCharacterMotions.has(characterId)) return;
    if (this.characterMotionLoads.has(characterId)) return this.characterMotionLoads.get(characterId);

    const loadPromise = (async () => {
      const character = this.manifest.characters[characterId];
      if (!character) throw new Error(`Unknown character motion atlas: ${characterId}`);
      const sheetImages = new Map();
      await Promise.all([...new Set(Object.values(character.motions).map((motion) => motion.sheet))].map(async (sheet, index) => {
        const key = `${characterId}_motions_${index}`;
        const image = await loadImage(key, `${sheet}?v=${MOTION_ASSET_VERSION}`);
        if (!image) throw new Error(`Unable to load character motion atlas: ${characterId} ${sheet}`);
        this.images[key] = image;
        sheetImages.set(sheet, image);
      }));
      this.animations[characterId] ??= {};
      for (const [motion, data] of Object.entries(character.motions)) {
        this.animations[characterId][motion] = { ...data, image: sheetImages.get(data.sheet) };
      }
      this.loadedCharacterMotions.add(characterId);
    })();

    this.characterMotionLoads.set(characterId, loadPromise);
    try {
      await loadPromise;
    } finally {
      this.characterMotionLoads.delete(characterId);
    }
  }

}

export const drawSpriteFrame = (ctx, animation, frameIndex, x, y, options = {}) => {
  if (!animation?.image) return false;
  const frame = animation.frames[frameIndex % animation.frames.length];
  if (!frame || frame.w <= 0 || frame.h <= 0) return false;
  const scale = (options.scale ?? 1) * (animation.renderScale ?? 1);
  const w = frame.w * scale;
  const h = frame.h * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalCompositeOperation = options.composite ?? "source-over";
  ctx.translate(x, y);
  if (options.flip) ctx.scale(-1, 1);
  if (options.underpaint) {
    const underScale = options.underpaintScale ?? 1.018;
    ctx.save();
    ctx.globalAlpha = options.underpaintAlpha ?? 0.42;
    ctx.filter = options.underpaintFilter ?? "brightness(0) saturate(1)";
    ctx.drawImage(
      animation.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      (-w * underScale) / 2,
      -h * underScale,
      w * underScale,
      h * underScale
    );
    ctx.restore();
  }
  ctx.filter = options.filter ?? "none";
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.drawImage(animation.image, frame.x, frame.y, frame.w, frame.h, -w / 2, -h, w, h);
  ctx.restore();
  return true;
};

export const drawSheetFrame = (ctx, image, frameIndex, cellW, cellH, x, y, options = {}) => {
  if (!image) return false;
  const cols = Math.max(1, Math.floor(image.width / cellW));
  const sx = (frameIndex % cols) * cellW;
  const sy = Math.floor(frameIndex / cols) * cellH;
  const scale = options.scale ?? 1;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(x, y);
  if (options.flip) ctx.scale(-1, 1);
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.drawImage(image, sx, sy, cellW, cellH, (-cellW * scale) / 2, -cellH * scale, cellW * scale, cellH * scale);
  ctx.restore();
  return true;
};
