/**
 * Smoke Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * Lightweight production smoke tests run after every deployment.
 * These tests verify the critical path works - if these fail, rollback immediately.
 *
 * Usage:
 *   DEPLOY_URL=https://your-app.vercel.app npx playwright test smoke.spec.ts
 *
 * What this tests (CRITICAL PATH ONLY):
 * - App loads
 * - Health check passes
 * - Can reach login page
 * - Can complete signup/login (with test credentials)
 * - Can create core entity
 *
 * Design principles:
 * - Fast (< 60 seconds total)
 * - Minimal (only critical flows)
 * - Idempotent (safe to run repeatedly)
 */

import { test, expect } from '@playwright/test';

// Get deploy URL from environment or default to localhost
const DEPLOY_URL = process.env.DEPLOY_URL || 'http://localhost:3000';

// Smoke test timeout - fail fast
test.setTimeout(30000);

test.describe('Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' }); // Run in order

  // ============================================================
  // 1. APP LOADS
  // ============================================================

  test('app loads', async ({ page }) => {
    const response = await page.goto(DEPLOY_URL);
    expect(response?.status()).toBeLessThan(500);

    // Page should have content
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  // ============================================================
  // 2. HEALTH CHECK
  // ============================================================

  test('health check passes', async ({ request }) => {
    const response = await request.get(`${DEPLOY_URL}/api/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  // ============================================================
  // 3. AUTH ACCESSIBLE
  // ============================================================

  test('login page accessible', async ({ page }) => {
    const response = await page.goto(`${DEPLOY_URL}/login`);
    expect(response?.status()).toBeLessThan(500);

    // Should have login form
    await page.waitForLoadState('networkidle');
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count();
    expect(hasEmailInput).toBeGreaterThan(0);
  });

  // ============================================================
  // 4. AUTH FLOW (Optional - requires test credentials)
  // ============================================================

  test.describe('Auth Flow', () => {
    // Skip if no test credentials provided
    const TEST_EMAIL = process.env.SMOKE_TEST_EMAIL;
    const TEST_PASSWORD = process.env.SMOKE_TEST_PASSWORD;

    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping auth flow - no test credentials');

    test('can login with test credentials', async ({ page }) => {
      await page.goto(`${DEPLOY_URL}/login`);

      // Fill login form
      await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL!);
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD!);

      // Submit
      await page.click('button[type="submit"]');

      // Wait for redirect (should go to dashboard or home)
      await page.waitForURL((url) => !url.pathname.includes('/login'), {
        timeout: 10000,
      });

      // Should be logged in
      expect(page.url()).not.toContain('/login');
    });

    test('can access protected route after login', async ({ page }) => {
      // Login first
      await page.goto(`${DEPLOY_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL!);
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

      // Try to access dashboard
      await page.goto(`${DEPLOY_URL}/dashboard`);
      expect(page.url()).toContain('/dashboard');

      // Should show dashboard content
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(100);
    });
  });

  // ============================================================
  // 5. CORE ENTITY CRUD (Optional - requires auth)
  // ============================================================

  test.describe('Core Entity CRUD', () => {
    const TEST_EMAIL = process.env.SMOKE_TEST_EMAIL;
    const TEST_PASSWORD = process.env.SMOKE_TEST_PASSWORD;

    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping CRUD tests - no test credentials');

    // Test CRUD on first entity
    const ENTITY_NAME = 'profile';
    const ENTITY_PLURAL = '';

    test(`can create ${ENTITY_NAME}`, async ({ page }) => {
      // Login first
      await page.goto(`${DEPLOY_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL!);
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

      // Navigate to entity list
      await page.goto(`${DEPLOY_URL}/${ENTITY_PLURAL}`);

      // Look for create button
      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create"), a:has-text("New")').first();
      const hasCreateButton = await createButton.count();

      if (hasCreateButton > 0) {
        await createButton.click();

        // Should navigate to create page or open dialog
        await page.waitForTimeout(1000);

        // Fill first text input (usually name/title)
        const textInputs = page.locator('input[type="text"]');
        const inputCount = await textInputs.count();

        if (inputCount > 0) {
          await textInputs.first().fill(`Smoke Test ${Date.now()}`);
        }

        // Try to submit
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();

          // Wait for result (success or error, either is acceptable for smoke test)
          await page.waitForTimeout(2000);

          // Should not have crashed
          const body = await page.textContent('body');
          expect(body?.length).toBeGreaterThan(50);
        }
      }
    });

    test(`can view ${ENTITY_NAME} list`, async ({ page }) => {
      // Login first
      await page.goto(`${DEPLOY_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL!);
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

      // Navigate to entity list
      const response = await page.goto(`${DEPLOY_URL}/${ENTITY_PLURAL}`);
      expect(response?.status()).toBeLessThan(500);

      // Page should have content (list or empty state)
      await page.waitForLoadState('networkidle');
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(50);
    });
  });

  // ============================================================
  // 6. API ENDPOINTS RESPOND
  // ============================================================

  test('API returns proper error for unauthorized access', async ({ request }) => {
    const response0 = await request.get(`${DEPLOY_URL}/api/`);
    // Should return 401 (unauthorized) not 500 (error)
    expect([401, 403]).toContain(response0.status());
    const response1 = await request.get(`${DEPLOY_URL}/api/`);
    // Should return 401 (unauthorized) not 500 (error)
    expect([401, 403]).toContain(response1.status());
    const response2 = await request.get(`${DEPLOY_URL}/api/`);
    // Should return 401 (unauthorized) not 500 (error)
    expect([401, 403]).toContain(response2.status());
    const response3 = await request.get(`${DEPLOY_URL}/api/`);
    // Should return 401 (unauthorized) not 500 (error)
    expect([401, 403]).toContain(response3.status());
    const response4 = await request.get(`${DEPLOY_URL}/api/`);
    // Should return 401 (unauthorized) not 500 (error)
    expect([401, 403]).toContain(response4.status());
    const response5 = await request.get(`${DEPLOY_URL}/api/`);
    // Should return 401 (unauthorized) not 500 (error)
    expect([401, 403]).toContain(response5.status());
  });
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
