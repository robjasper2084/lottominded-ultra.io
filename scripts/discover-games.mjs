import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const ignoredSegments = new Set(["node_modules", ".git", "dist", "audit", "output"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredSegments.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    if (entry.isFile() && entry.name.toLowerCase() === "index.html") files.push(absolute);
  }

  return files;
}

function textBetween(source, tag) {
  const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

async function isReadable(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const candidates = await walk(siteRoot);
const report = [];

for (const file of candidates) {
  const source = await readFile(file, "utf8");
  const relative = path.relative(siteRoot, file).replaceAll(path.sep, "/");
  const signals = {
    canvas: /<canvas\b/i.test(source),
    iframe: /<iframe\b/i.test(source),
    animationLoop: /requestAnimationFrame\s*\(/i.test(source),
    gameLanguage: /\b(game|playable|arcade|player|score|level|paddle|maze)\b/i.test(source),
  };

  if (!relative.startsWith("games/") && !Object.values(signals).some(Boolean)) continue;

  report.push({
    route: `./${relative.replace(/index\.html$/i, "")}`,
    index: relative,
    exists: await isReadable(file),
    title: textBetween(source, "title"),
    heading: textBetween(source, "h1"),
    signals,
  });
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), candidates: report }, null, 2));
