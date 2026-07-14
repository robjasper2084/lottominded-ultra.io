import { chromium } from "file:///C:/Users/digit/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.argv[2] || "http://127.0.0.1:8150/games/shadow-ops-canvas/index.html?v=complete-asset-pass-1&debug=1";
const outputDir = path.resolve("audit", "complete-asset-pass");
fs.mkdirSync(outputDir, { recursive: true });

const report = { url: baseUrl, consoleErrors: [], pageErrors: [], failedRequests: [], screenshots: [], touchChecks: [] };
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

async function attachDiagnostics(page) {
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("requestfailed", (request) => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
}

async function shot(page, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}

async function desktopPass() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await attachDiagnostics(page);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await shot(page, "01-title-desktop");
  await page.locator('[data-action="start-solo"]').click();
  await page.waitForTimeout(900);
  await shot(page, "02-level1-start");
  await page.locator('[data-debug="keys"]').click();
  await page.waitForTimeout(400);
  await shot(page, "03-level1-gate-ready");
  await page.locator('[data-debug="boss"]').click();
  await page.waitForTimeout(600);
  await shot(page, "04-level1-boss");
  await page.locator('[data-debug="level2"]').click();
  await page.locator('[data-debug="boss"]').click();
  await page.waitForTimeout(600);
  await shot(page, "05-level2-boss");
  await page.locator('[data-debug="level3"]').click();
  await page.locator('[data-debug="boss"]').click();
  await page.waitForTimeout(600);
  await shot(page, "06-level3-boss");
  await page.locator('[data-debug="underground-enter"]').click();
  await page.waitForTimeout(500);
  await shot(page, "07-underground");
  await page.locator('[data-debug="underground-complete"]').click();
  await page.waitForTimeout(500);
  await shot(page, "08-underground-complete");
  await page.locator('[data-debug="terminal"]').click();
  await page.waitForTimeout(500);
  await shot(page, "09-terminal");
  await page.close();
}

async function mobilePass(name, viewport) {
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await attachDiagnostics(page);
  await page.goto(baseUrl.replace(/([?&])debug=1(&|$)/, "$1").replace(/[?&]$/, ""), { waitUntil: "networkidle" });
  await shot(page, `${name}-title`);
  await page.locator('[data-action="start-solo"]').click();
  await page.waitForTimeout(3200);
  const move = await page.locator('[data-stick="move"]').boundingBox();
  const fire = await page.locator('[data-stick="fire"]').boundingBox();
  if (move && fire) {
    const actionState = (action) => page.locator(`[data-touch="${action}"]`).evaluate((node) => node.classList.contains("is-touching"));
    await page.mouse.move(move.x + move.width / 2, move.y + move.height / 2);
    await page.mouse.down();
    await page.mouse.move(move.x + move.width * 0.82, move.y + move.height / 2);
    report.touchChecks.push({ name, action: "move-right", active: await actionState("right"), accidentalDash: await actionState("dash") });
    await page.mouse.move(move.x + move.width / 2, move.y + move.height * 0.12);
    report.touchChecks.push({ name, action: "jump", active: await actionState("jump"), accidentalDash: await actionState("dash") });
    await page.mouse.move(move.x + move.width / 2, move.y + move.height * 0.88);
    report.touchChecks.push({ name, action: "crouch", active: await actionState("down"), accidentalDash: await actionState("dash") });
    await page.mouse.up();
    await page.mouse.move(fire.x + fire.width / 2, fire.y + fire.height / 2);
    await page.mouse.down();
    await page.mouse.move(fire.x + fire.width * 0.84, fire.y + fire.height * 0.35);
    report.touchChecks.push({ name, action: "aim-fire", active: await actionState("fire"), accidentalDash: await actionState("dash") });
    await page.mouse.up();
  }
  await shot(page, `${name}-gameplay`);
  await context.close();
}

await desktopPass();
await mobilePass("10-mobile-portrait", { width: 430, height: 932 });
await mobilePass("11-mobile-landscape", { width: 932, height: 430 });
await browser.close();

const unique = (items) => [...new Map(items.map((item) => [JSON.stringify(item), item])).values()];
report.consoleErrors = unique(report.consoleErrors);
report.pageErrors = unique(report.pageErrors);
report.failedRequests = unique(report.failedRequests);
fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
