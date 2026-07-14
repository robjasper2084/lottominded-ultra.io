import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  globalSetup: "./tests/global-setup.js",
  outputDir: "./output/playwright",
  timeout: 30_000,
  fullyParallel: false,
  reporter: process.env.CI
    ? [["line"], ["junit", { outputFile: "output/test-results/playwright.xml" }]]
    : "line",
  use: {
    baseURL: "http://127.0.0.1:4178",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] }
    }
  ]
});
