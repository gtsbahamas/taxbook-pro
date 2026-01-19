/**
 * Visual Regression Tests
 *
 * Purpose: Catch unintended visual changes via screenshot comparisons.
 * Run: npx playwright test visual-regression.spec.ts
 *
 * Baseline screenshots are stored in tests/visual-baselines/
 * Run with --update-snapshots to update baselines.
 */

import { test, expect, Page } from '@playwright/test';

// Viewport presets for responsive testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

// Theme variants
const THEMES = ['light', 'dark'] as const;

// Pages to test
const PAGES = [
  { name: 'landing', path: '/', requiresAuth: false },
  { name: 'login', path: '/login', requiresAuth: false },
  { name: 'signup', path: '/signup', requiresAuth: false },
  { name: 'dashboard', path: '/dashboard', requiresAuth: true },
  { name: 'profile-list', path: '/profile', requiresAuth: true },
  { name: 'client-list', path: '/client', requiresAuth: true },
  { name: 'service-list', path: '/service', requiresAuth: true },
  { name: 'appointment-list', path: '/appointment', requiresAuth: true },
  { name: 'availability-list', path: '/availability', requiresAuth: true },
  { name: 'document-list', path: '/document', requiresAuth: true },
  { name: 'settings', path: '/settings', requiresAuth: true },
];

// Test configuration
test.describe.configure({ mode: 'parallel' });

// Helper to set theme
async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    localStorage.setItem('theme', t);
  }, theme);
  // Wait for theme transition
  await page.waitForTimeout(300);
}

// Helper to wait for page to stabilize
async function waitForStable(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for any animations to complete
  await page.waitForTimeout(500);
  // Hide dynamic elements that change between runs
  await page.evaluate(() => {
    // Hide timestamps
    document.querySelectorAll('[data-testid="timestamp"], time').forEach((el) => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
    // Hide avatars (may have random colors)
    document.querySelectorAll('[data-testid="avatar"]').forEach((el) => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
  });
}

// Helper to login for authenticated pages
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// =============================================================================
// Page-Level Visual Tests
// =============================================================================
test.describe('Page Screenshots', () => {
  for (const pageConfig of PAGES) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      for (const theme of THEMES) {
        test(`${pageConfig.name} - ${viewportName} - ${theme}`, async ({ page }) => {
          // Set viewport
          await page.setViewportSize(viewport);

          // Login if required
          if (pageConfig.requiresAuth) {
            await login(page);
          }

          // Navigate to page
          await page.goto(pageConfig.path);
          await waitForStable(page);

          // Set theme
          await setTheme(page, theme);

          // Take screenshot
          await expect(page).toHaveScreenshot(
            `${pageConfig.name}-${viewportName}-${theme}.png`,
            {
              fullPage: true,
              animations: 'disabled',
              maxDiffPixels: 100, // Allow small differences
            }
          );
        });
      }
    }
  }
});

// =============================================================================
// Component-Level Visual Tests
// =============================================================================
test.describe('Component Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  // Button variants
  test('Button variants', async ({ page }) => {
    await page.goto('/');
    await waitForStable(page);

    // Find all buttons and screenshot each variant
    const buttons = page.locator('button');
    const count = await buttons.count();

    if (count > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toHaveScreenshot('button-default.png', {
        animations: 'disabled',
      });
    }
  });

  // Card component
  test('Card component', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await waitForStable(page);

    const cards = page.locator('[data-testid="card"], .card, [class*="Card"]');
    const count = await cards.count();

    if (count > 0) {
      await expect(cards.first()).toHaveScreenshot('card-default.png', {
        animations: 'disabled',
      });
    }
  });

  // Form elements
  test('Form elements', async ({ page }) => {
    await page.goto('/login');
    await waitForStable(page);

    const form = page.locator('form');
    await expect(form).toHaveScreenshot('form-login.png', {
      animations: 'disabled',
    });
  });

  // Navigation
  test('Navigation - desktop', async ({ page }) => {
    await page.goto('/');
    await waitForStable(page);

    const nav = page.locator('nav, header').first();
    await expect(nav).toHaveScreenshot('nav-desktop.png', {
      animations: 'disabled',
    });
  });

  test('Navigation - mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');
    await waitForStable(page);

    const nav = page.locator('nav, header').first();
    await expect(nav).toHaveScreenshot('nav-mobile.png', {
      animations: 'disabled',
    });

    // Open mobile menu if exists
    const menuButton = page.locator('[data-testid="mobile-menu"], [aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('nav-mobile-open.png', {
        animations: 'disabled',
      });
    }
  });
});

// =============================================================================
// State-Specific Visual Tests
// =============================================================================
test.describe('UI States', () => {
  test('Loading state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Intercept API to simulate loading
    await page.route('/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.continue();
    });

    await login(page);
    await page.goto('/dashboard');

    // Capture loading state quickly
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, [class*="skeleton"]');
    if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(page).toHaveScreenshot('loading-state.png', {
        animations: 'disabled',
      });
    }
  });

  test('Empty state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await login(page);

    // Navigate to a list page
    await page.goto('/profile');
    await waitForStable(page);

    const emptyState = page.locator('[data-testid="empty-state"], .empty-state, [class*="empty"]');
    if (await emptyState.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        animations: 'disabled',
      });
    }
  });

  test('Error state', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Force an error
    await page.route('/api/**', (route) => route.fulfill({ status: 500 }));

    await login(page);
    await page.goto('/dashboard');
    await waitForStable(page);

    const errorState = page.locator('[data-testid="error"], .error, [role="alert"]');
    if (await errorState.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(errorState).toHaveScreenshot('error-state.png', {
        animations: 'disabled',
      });
    }
  });
});

// =============================================================================
// Dark/Light Theme Comparison
// =============================================================================
test.describe('Theme Consistency', () => {
  test('Theme toggle visual comparison', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/');
    await waitForStable(page);

    // Light theme
    await setTheme(page, 'light');
    await expect(page).toHaveScreenshot('theme-light.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Dark theme
    await setTheme(page, 'dark');
    await expect(page).toHaveScreenshot('theme-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

// =============================================================================
// Accessibility Visual Tests
// =============================================================================
test.describe('Accessibility Visual', () => {
  test('Focus indicators visible', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/login');
    await waitForStable(page);

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-first-element.png', {
      animations: 'disabled',
    });

    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-second-element.png', {
      animations: 'disabled',
    });
  });

  test('High contrast mode', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Emulate high contrast
    await page.emulateMedia({ forcedColors: 'active' });

    await page.goto('/');
    await waitForStable(page);

    await expect(page).toHaveScreenshot('high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
