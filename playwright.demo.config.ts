import { defineConfig, devices } from "@playwright/test";

/**
 * Demo recordings. Each *.demo.ts scenario is recorded as a video at
 * 1280x720 and saved into ./videos by the helper. Run with `npm run demos`.
 * Scenarios are paced for humans, so they are slow by design and never
 * run as part of the test suite.
 */
export default defineConfig({
  testDir: "./demos",
  testMatch: /.*\.demo\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: "./videos/.raw",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    video: { mode: "on", size: { width: 1280, height: 720 } },
    actionTimeout: 20_000,
    colorScheme: "light",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
