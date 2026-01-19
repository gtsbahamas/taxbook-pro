/**
 * Playwright Configuration - taxbook-pro
 * Generated: 2026-01-19
 *
 * Global setup seeds the database before running tests.
 * This ensures consistent test data across all runs.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? "50%" : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  // Global setup: Seed database before tests
  globalSetup: "./tests/e2e/global-setup.ts",

  // Global teardown: Optional cleanup after tests
  // globalTeardown: "./tests/e2e/global-teardown.ts",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Test timeout
  timeout: 30000,

  // Assertion timeout
  expect: {
    timeout: 5000,
  },

  projects: [
    // Setup project - runs database seeding once
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },
    // Main test projects depend on setup
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },
    // Mobile viewports
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
      dependencies: ["setup"],
    },
    // Deploy verification - runs against deployed URL
    // Usage: DEPLOY_URL=https://your-app.vercel.app npx playwright test --project=deploy-verification
    {
      name: "deploy-verification",
      testDir: "./tests/e2e",
      testMatch: /deploy-verification\.spec\.ts|smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.DEPLOY_URL || "http://localhost:3000",
      },
      // No dependencies - runs independently against deployed URL
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
