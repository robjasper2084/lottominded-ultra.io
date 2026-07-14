const { chromium } = require(
  "C:/Users/digit/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright"
);

async function inspectPage(page) {
  return page.evaluate(() => ({
    title: document.title,
    hero: document.querySelector(".arcade-hero h1")?.textContent.trim(),
    cards: document.querySelectorAll(".arcade-grid .arcade-card").length,
    columns: getComputedStyle(document.querySelector(".arcade-grid")).gridTemplateColumns,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    covers: {
      spheres: document.querySelector('[data-game-id="lottery-spheres"] img')?.currentSrc,
      pong: document.querySelector('[data-game-id="raytrace-pong"] img')?.currentSrc,
      stem: document.querySelector('[data-game-id="stem-studio"] img')?.currentSrc,
      promptLab: document.querySelector('[data-game-id="beat2lotto-lab"] img')?.currentSrc
    }
  }));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1562, height: 1318 },
    deviceScaleFactor: 1
  });
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:8142/features-app.html#arcade-library", {
    waitUntil: "networkidle",
    timeout: 30000
  });
  await page.waitForTimeout(1200);
  const desktop = await inspectPage(page);
  await page.screenshot({
    path: "output/playwright/features-arcade-desktop.png",
    fullPage: false
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(800);
  const mobile = await inspectPage(page);
  await page.screenshot({
    path: "output/playwright/features-arcade-mobile.png",
    fullPage: false
  });

  console.log(JSON.stringify({ desktop, mobile, errors }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
