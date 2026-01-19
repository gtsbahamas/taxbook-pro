/**
 * Global Setup for E2E Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * This file runs once before all tests begin.
 * It seeds the database with test data.
 *
 * Location: tests/e2e/global-setup.ts
 */

import { execSync } from "child_process";

async function globalSetup(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("GLOBAL SETUP: Seeding Database");
  console.log("=".repeat(60));

  // Skip seeding if running against production or if explicitly disabled
  if (process.env.SKIP_SEED === "true") {
    console.log("  [SKIP] SKIP_SEED=true, skipping database seed");
    return;
  }

  // Skip seeding in CI if the database is already seeded
  if (process.env.CI && process.env.DB_SEEDED === "true") {
    console.log("  [SKIP] CI database already seeded");
    return;
  }

  try {
    // Run the seed script with seed-dev (reset + seed for clean state)
    // Use seed-dev for a clean slate each test run
    const command = process.env.CI
      ? "npx tsx scripts/seed.ts seed" // In CI, just add data (faster)
      : "npx tsx scripts/seed.ts seed-dev"; // In dev, reset + seed (consistent)

    console.log(`  Running: ${command}`);

    execSync(command, {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });

    console.log("\n  [OK] Database seeded successfully");
  } catch (error) {
    console.error("\n  [ERROR] Failed to seed database:");
    console.error(error);

    // In CI, fail fast if seeding fails
    if (process.env.CI) {
      process.exit(1);
    }

    // In development, warn but continue (tests might still work)
    console.warn("  [WARN] Continuing without seed data...");
  }

  console.log("=".repeat(60) + "\n");
}

export default globalSetup;
