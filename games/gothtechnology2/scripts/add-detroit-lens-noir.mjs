import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const atlasRoot = resolve(root, "assets/motion-atlases");
const manifestPath = resolve(atlasRoot, "motion-atlas-manifest.json");
const expectedHashes = {
  "detroit-lens-noir-locomotion.webp": "9af08e11f5dc1c2cfb83a756388012952fcb387dbb395699bc1b27e10c7dff7a",
  "detroit-lens-noir-combat.webp": "11d8da0d8dca98c7a0d6be97397fab7e838eee0bb426d737f153ea7846a0ac5d",
  "detroit-lens-noir-reaction.webp": "3d52b1f279f547991c72b6f0b938c7a4be8073c0da3bbf2984a6a9cc32993f65"
};

for (const [filename, expectedHash] of Object.entries(expectedHashes)) {
  const bytes = await readFile(resolve(atlasRoot, filename));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== expectedHash) throw new Error(`Unexpected Noir source atlas: ${filename}`);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const original = manifest.characters?.DETROIT_LENS;
if (!original) throw new Error("DETROIT_LENS is missing from the motion manifest");

const noir = structuredClone(original);
noir.atlasFiles = noir.atlasFiles.map((filename) => filename.replace("detroit-lens-", "detroit-lens-noir-"));
for (const motion of Object.values(noir.motions)) {
  motion.sheet = motion.sheet.replace("detroit-lens-", "detroit-lens-noir-");
}
manifest.characters.DETROIT_LENS_NOIR = noir;

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log("Added DETROIT_LENS_NOIR with 39 original black costume motions.");
