import { readdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const targets = ["src", "scripts", "tests", "playwright.config.js"];

const collect = async (relativePath) => {
  const absolutePath = join(root, relativePath);
  if (extname(absolutePath) === ".js" || extname(absolutePath) === ".mjs") return [absolutePath];
  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(entries
    .filter((entry) => !["node_modules", "output"].includes(entry.name))
    .map((entry) => {
      const childPath = join(relativePath, entry.name);
      if (entry.isDirectory()) return collect(childPath);
      return [".js", ".mjs"].includes(extname(entry.name)) ? [join(root, childPath)] : [];
    }));
  return nested.flat();
};

const files = (await Promise.all(targets.map(collect))).flat();
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`${file}\n${result.stderr || result.stdout}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Syntax check passed for ${files.length} JavaScript files.`);
}
