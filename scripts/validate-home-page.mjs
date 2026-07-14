import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const htmlPath = resolve(root, "index.html");
const html = readFileSync(htmlPath, "utf8");
const failures = [];

if (/lm-healing-generator|healing-frequency\.js/i.test(html)) {
  failures.push("The removed healing-frequency generator is still referenced by index.html.");
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) failures.push(`Duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);

const references = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
for (const reference of references) {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
  const cleanPath = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!cleanPath) continue;
  if (cleanPath.startsWith("../")) continue;
  const absolutePath = resolve(root, cleanPath);
  if (!absolutePath.startsWith(root) || !existsSync(absolutePath)) {
    failures.push(`Missing local asset or route: ${reference}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Homepage static check passed (${ids.length} IDs, ${references.length} local/external references scanned).`);
}
