import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against an already running server, for example `npm run start -- -p 3001`.
 * Set PLAYWRIGHT_BASE_URL to target a different address.
 */
export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/.artifacts",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
