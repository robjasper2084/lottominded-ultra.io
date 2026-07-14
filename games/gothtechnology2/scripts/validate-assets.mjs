import { access, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { ASSET_URLS } from "../src/config/assets.js";
import { MOTIONS } from "../src/config/constants.js";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const REQUIRED_FRAME_COUNT = 6;
const REQUIRED_PROVIDER = "Higgsfield Nano Banana Pro";
const REQUIRED_SOURCE = "higgsfield-v2";

const collectUrls = (value, urls = new Set()) => {
  if (typeof value === "string") urls.add(value);
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => collectUrls(entry, urls));
  return urls;
};

const localAssetPath = (url) => url.split(/[?#]/, 1)[0];
const manifestPath = resolve(root, localAssetPath(ASSET_URLS.manifest));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const urls = collectUrls(ASSET_URLS);
const motionSheets = new Set();

if (manifest.provider !== REQUIRED_PROVIDER) failures.push(`Unexpected sprite provider: ${manifest.provider}`);
if (manifest.framesPerMotion !== REQUIRED_FRAME_COUNT) {
  failures.push(`Manifest declares ${manifest.framesPerMotion} frames per motion; requires ${REQUIRED_FRAME_COUNT}`);
}

for (const [characterId, character] of Object.entries(manifest.characters ?? {})) {
  const runtimeMotions = character.motions ?? {};
  const missingMotions = MOTIONS.filter((motion) => !(motion in runtimeMotions));
  if (missingMotions.length) failures.push(`${characterId}: missing motions ${missingMotions.join(", ")}`);
  const unexpectedMotions = Object.keys(runtimeMotions).filter((motion) => !MOTIONS.includes(motion));
  if (unexpectedMotions.length) failures.push(`${characterId}: unexpected motions ${unexpectedMotions.join(", ")}`);
  if (character.atlasFiles?.length !== 3) failures.push(`${characterId}: expected three selection-loaded atlas files`);

  for (const [motionName, motion] of Object.entries(runtimeMotions)) {
    urls.add(motion.sheet);
    motionSheets.add(motion.sheet);
    if (motion.frameCount !== motion.frames?.length) {
      failures.push(`${characterId}/${motionName}: frameCount does not match frames array`);
    }
    if (motion.frameCount !== REQUIRED_FRAME_COUNT) {
      failures.push(`${characterId}/${motionName}: ${motion.frameCount} frames, requires ${REQUIRED_FRAME_COUNT}`);
    }
    if ((motion.uniqueFrames ?? 0) < REQUIRED_FRAME_COUNT) {
      failures.push(`${characterId}/${motionName}: ${motion.uniqueFrames ?? 0} unique frames, requires ${REQUIRED_FRAME_COUNT}`);
    }
    if (motion.source !== REQUIRED_SOURCE) {
      failures.push(`${characterId}/${motionName}: unexpected source ${motion.source}`);
    }
    if (!motion.higgsfieldJobId) {
      failures.push(`${characterId}/${motionName}: missing Higgsfield job provenance`);
    }
    if (motion.frames?.some((frame) => frame.w <= 0 || frame.h <= 0 || frame.x < 0 || frame.y < 0)) {
      failures.push(`${characterId}/${motionName}: invalid packed frame rectangle`);
    }
  }

  const signature = (motionName) => JSON.stringify({
    sheet: runtimeMotions[motionName]?.sheet,
    job: runtimeMotions[motionName]?.higgsfieldJobId,
    frames: runtimeMotions[motionName]?.frames?.map(({ x, y }) => [x, y])
  });
  if (signature("DASH_FORWARD") === signature("RUN_FORWARD") || signature("DASH_FORWARD") === signature("WALK_FORWARD")) {
    failures.push(`${characterId}: DASH_FORWARD reuses a locomotion sequence`);
  }
  if (signature("DASH_BACK") === signature("RUN_BACK") || signature("DASH_BACK") === signature("WALK_BACK")) {
    failures.push(`${characterId}: DASH_BACK reuses a locomotion sequence`);
  }
}

urls.add("../../assets/js/lm-game-rewards-sdk.js");
for (const url of urls) {
  try {
    await access(resolve(root, localAssetPath(url)));
  } catch {
    failures.push(`Missing asset: ${url}`);
  }
}

let motionAtlasBytes = 0;
for (const sheet of motionSheets) motionAtlasBytes += (await stat(resolve(root, sheet))).size;
if (motionAtlasBytes > 8 * 1024 * 1024) {
  failures.push(`Motion atlases exceed 8 MiB budget: ${motionAtlasBytes} bytes`);
}

if (failures.length) {
  console.error(`Asset validation failed:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${urls.size} asset paths and ${MOTIONS.length} motions per character.`);
  console.log(`Packed motion atlas payload: ${(motionAtlasBytes / 1024 / 1024).toFixed(2)} MiB.`);
}
