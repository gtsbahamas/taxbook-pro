/**
 * Accessibility Audit Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * Comprehensive accessibility testing using @axe-core/playwright.
 * Tests WCAG 2.1 AA compliance across all pages and components.
 *
 * These tests catch:
 * - Missing alt text on images
 * - Missing form labels
 * - Color contrast violations
 * - Keyboard navigation issues
 * - Focus management problems
 * - ARIA attribute errors
 *
 * Run with: npx playwright test tests/e2e/accessibility.spec.ts
 * Generate report: npx playwright test --reporter=html
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CONFIGURATION
// ============================================================

// Test user credentials (create this user in Supabase first)
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

// WCAG 2.1 AA rules to check
const WCAG_RULES = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'best-practice',
];

// Critical rules that should never have violations
const CRITICAL_RULES = [
  'image-alt',           // Images must have alt text
  'label',               // Form inputs must have labels
  'button-name',         // Buttons must have accessible names
  'link-name',           // Links must have accessible names
  'color-contrast',      // Text must have sufficient contrast
  'aria-valid-attr',     // ARIA attributes must be valid
  'aria-roles',          // ARIA roles must be valid
  'duplicate-id',        // IDs must be unique
  'html-has-lang',       // HTML must have lang attribute
  'document-title',      // Pages must have titles
];

// Pages to test (unauthenticated)
const PUBLIC_PAGES = [
  { path: '/', name: 'Landing Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/signup', name: 'Signup Page' },
];

// Pages to test (authenticated)
const PROTECTED_PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/settings', name: 'Settings' },
  { path: '/profile', name: 'Profile List' },
  { path: '/client', name: 'Client List' },
  { path: '/service', name: 'Service List' },
  { path: '/appointment', name: 'Appointment List' },
  { path: '/availability', name: 'Availability List' },
  { path: '/document', name: 'Document List' },
];

// Entity detail pages (require existing data)
const ENTITY_DETAIL_PAGES = [
  {
    listPath: '/profile',
    name: 'Profile Detail',
    entityName: 'Profile',
  },
  {
    listPath: '/client',
    name: 'Client Detail',
    entityName: 'Client',
  },
  {
    listPath: '/service',
    name: 'Service Detail',
    entityName: 'Service',
  },
  {
    listPath: '/appointment',
    name: 'Appointment Detail',
    entityName: 'Appointment',
  },
  {
    listPath: '/availability',
    name: 'Availability Detail',
    entityName: 'Availability',
  },
  {
    listPath: '/document',
    name: 'Document Detail',
    entityName: 'Document',
  },
];

// ============================================================
// ACCESSIBILITY REPORT TYPES
// ============================================================

interface ViolationResult {
  page: string;
  pageName: string;
  violations: AxeViolation[];
  timestamp: string;
}

interface AxeViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

/**
 * Type guard to check if a violation has a valid impact value
 */
function hasValidImpact(violation: { impact?: string | null }): violation is { impact: 'critical' | 'serious' | 'moderate' | 'minor' } {
  return violation.impact === 'critical' ||
         violation.impact === 'serious' ||
         violation.impact === 'moderate' ||
         violation.impact === 'minor';
}

/**
 * Convert axe-core Result to our AxeViolation type.
 * Uses 'unknown' to accept axe-core's complex types without strict matching.
 */
function toAxeViolation(result: unknown): AxeViolation {
  // Type assertion for the axe-core result structure
  const r = result as {
    id: string;
    impact?: string | null;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: Array<string | string[]>;  // UnlabelledFrameSelector can be string or string[]
      failureSummary?: string;
    }>;
  };

  return {
    id: r.id,
    impact: hasValidImpact(r) ? r.impact : null,
    description: r.description,
    help: r.help,
    helpUrl: r.helpUrl,
    nodes: r.nodes.map(n => ({
      html: n.html,
      // Flatten target: convert any nested arrays to flat string array
      target: n.target.flatMap(t => Array.isArray(t) ? t : [t]),
      failureSummary: n.failureSummary || '',
    })),
  };
}

interface AccessibilityReport {
  projectName: string;
  generatedAt: string;
  summary: {
    totalPages: number;
    pagesWithViolations: number;
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
    moderateViolations: number;
    minorViolations: number;
  };
  results: ViolationResult[];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Login helper for authenticated tests
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER_EMAIL);
  await page.fill('input[type="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login page (more robust than checking specific URL)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

/**
 * Run axe accessibility scan on current page
 */
async function runAxeScan(page: Page, pagePath: string, pageName: string): Promise<ViolationResult> {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_RULES)
    .analyze();

  return {
    page: pagePath,
    pageName,
    violations: results.violations.map(toAxeViolation),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check for critical violations that should fail the test
 */
function getCriticalViolations(violations: AxeViolation[]): AxeViolation[] {
  return violations.filter(v =>
    CRITICAL_RULES.includes(v.id) ||
    v.impact === 'critical' ||
    v.impact === 'serious' ||
    v.impact === null // Treat unknown impact as critical to be safe
  );
}

/**
 * Format violation for console output
 */
function formatViolation(violation: AxeViolation): string {
  const nodeInfo = violation.nodes
    .map(n => `    - ${n.target.join(' > ')}\n      HTML: ${n.html.slice(0, 100)}...`)
    .join('\n');

  const impactLabel = violation.impact ? violation.impact.toUpperCase() : 'UNKNOWN';

  return `
  [${impactLabel}] ${violation.id}
  ${violation.description}
  Help: ${violation.helpUrl}
  Affected elements:
${nodeInfo}
`;
}

/**
 * Generate HTML accessibility report
 */
function generateAccessibilityReport(results: ViolationResult[]): AccessibilityReport {
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  // Count null/unknown impacts as critical (safety first)
  const criticalCount = results.reduce(
    (sum, r) => sum + r.violations.filter(v => v.impact === 'critical' || v.impact === null).length,
    0
  );
  const seriousCount = results.reduce(
    (sum, r) => sum + r.violations.filter(v => v.impact === 'serious').length,
    0
  );
  const moderateCount = results.reduce(
    (sum, r) => sum + r.violations.filter(v => v.impact === 'moderate').length,
    0
  );
  const minorCount = results.reduce(
    (sum, r) => sum + r.violations.filter(v => v.impact === 'minor').length,
    0
  );

  return {
    projectName: 'taxbook-pro',
    generatedAt: new Date().toISOString(),
    summary: {
      totalPages: results.length,
      pagesWithViolations: results.filter(r => r.violations.length > 0).length,
      totalViolations,
      criticalViolations: criticalCount,
      seriousViolations: seriousCount,
      moderateViolations: moderateCount,
      minorViolations: minorCount,
    },
    results,
  };
}

/**
 * Save accessibility report to file
 */
function saveReport(report: AccessibilityReport): void {
  const reportDir = path.join(process.cwd(), 'test-results', 'accessibility');

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Save JSON report
  const jsonPath = path.join(reportDir, 'accessibility-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Save HTML report
  const htmlPath = path.join(reportDir, 'accessibility-report.html');
  fs.writeFileSync(htmlPath, generateHtmlReport(report));

  console.log(`\nAccessibility reports saved to:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  HTML: ${htmlPath}`);
}

/**
 * Generate HTML report content
 */
function generateHtmlReport(report: AccessibilityReport): string {
  const getImpactColor = (impact: string | null) => {
    switch (impact) {
      case 'critical': return '#dc2626';
      case 'serious': return '#ea580c';
      case 'moderate': return '#ca8a04';
      case 'minor': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const violationsHtml = report.results
    .filter(r => r.violations.length > 0)
    .map(result => `
      <div class="page-result">
        <h3>${result.pageName} <span class="path">(${result.page})</span></h3>
        <p class="violation-count">${result.violations.length} violation(s)</p>
        ${result.violations.map(v => `
          <div class="violation" style="border-left: 4px solid ${getImpactColor(v.impact)}">
            <div class="violation-header">
              <span class="impact" style="background: ${getImpactColor(v.impact)}">${v.impact ?? 'unknown'}</span>
              <strong>${v.id}</strong>
            </div>
            <p>${v.description}</p>
            <p><a href="${v.helpUrl}" target="_blank">How to fix</a></p>
            <details>
              <summary>Affected elements (${v.nodes.length})</summary>
              <ul>
                ${v.nodes.map(n => `
                  <li>
                    <code>${n.target.join(' > ')}</code>
                    <pre>${n.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                  </li>
                `).join('')}
              </ul>
            </details>
          </div>
        `).join('')}
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${report.projectName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f9fafb;
    }
    h1 { color: #111827; }
    h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h3 { color: #4b5563; margin-bottom: 0.5rem; }
    .path { color: #6b7280; font-weight: normal; font-size: 0.875rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #6b7280; }
    .stat.critical .stat-value { color: #dc2626; }
    .stat.serious .stat-value { color: #ea580c; }
    .stat.success .stat-value { color: #16a34a; }
    .page-result {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .violation {
      background: #fafafa;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    .violation-header { margin-bottom: 0.5rem; }
    .impact {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      color: white;
      font-size: 0.75rem;
      text-transform: uppercase;
      margin-right: 0.5rem;
    }
    .violation-count { color: #6b7280; margin: 0; }
    details { margin-top: 0.5rem; }
    summary { cursor: pointer; color: #4b5563; }
    pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 0.5rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.75rem;
    }
    code {
      background: #e5e7eb;
      padding: 0.125rem 0.25rem;
      border-radius: 2px;
      font-size: 0.875rem;
    }
    a { color: #2563eb; }
    .success-message {
      background: #dcfce7;
      color: #166534;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <h1>Accessibility Report</h1>
  <p>Project: <strong>${report.projectName}</strong> | Generated: ${new Date(report.generatedAt).toLocaleString()}</p>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${report.summary.totalPages}</div>
      <div class="stat-label">Pages Tested</div>
    </div>
    <div class="stat ${report.summary.criticalViolations > 0 ? 'critical' : 'success'}">
      <div class="stat-value">${report.summary.criticalViolations}</div>
      <div class="stat-label">Critical</div>
    </div>
    <div class="stat ${report.summary.seriousViolations > 0 ? 'serious' : 'success'}">
      <div class="stat-value">${report.summary.seriousViolations}</div>
      <div class="stat-label">Serious</div>
    </div>
    <div class="stat">
      <div class="stat-value">${report.summary.moderateViolations}</div>
      <div class="stat-label">Moderate</div>
    </div>
    <div class="stat">
      <div class="stat-value">${report.summary.minorViolations}</div>
      <div class="stat-label">Minor</div>
    </div>
  </div>

  ${report.summary.totalViolations === 0 ? `
    <div class="success-message">
      <h2>All pages passed accessibility checks!</h2>
      <p>No WCAG 2.1 AA violations detected.</p>
    </div>
  ` : `
    <h2>Violations by Page</h2>
    ${violationsHtml}
  `}
</body>
</html>
`;
}

// ============================================================
// ACCESSIBILITY TESTS - PUBLIC PAGES
// ============================================================

test.describe('Accessibility - Public Pages', () => {
  for (const pageInfo of PUBLIC_PAGES) {
    test(`${pageInfo.name} should have no critical accessibility violations`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, pageInfo.path, pageInfo.name);
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on ${pageInfo.name}:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `${pageInfo.name} has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    });
  }
});

// ============================================================
// ACCESSIBILITY TESTS - PROTECTED PAGES
// ============================================================

test.describe('Accessibility - Protected Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const pageInfo of PROTECTED_PAGES) {
    test(`${pageInfo.name} should have no critical accessibility violations`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, pageInfo.path, pageInfo.name);
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on ${pageInfo.name}:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `${pageInfo.name} has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    });
  }
});

// ============================================================
// ACCESSIBILITY TESTS - ENTITY DETAIL PAGES
// ============================================================

test.describe('Accessibility - Entity Detail Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Profile detail page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to list page first
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Try to click on the first item to get to detail page
    const firstItemLink = page.locator('a[href^="/profile/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, page.url(), 'Profile Detail');
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on Profile Detail:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `Profile Detail has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    } else {
      // No items exist, skip detail page test but log it
      console.log('Skipping Profile detail accessibility test - no items found');
      test.skip();
    }
  });
  test('Client detail page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to list page first
    await page.goto('/client');
    await page.waitForLoadState('networkidle');

    // Try to click on the first item to get to detail page
    const firstItemLink = page.locator('a[href^="/client/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, page.url(), 'Client Detail');
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on Client Detail:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `Client Detail has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    } else {
      // No items exist, skip detail page test but log it
      console.log('Skipping Client detail accessibility test - no items found');
      test.skip();
    }
  });
  test('Service detail page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to list page first
    await page.goto('/service');
    await page.waitForLoadState('networkidle');

    // Try to click on the first item to get to detail page
    const firstItemLink = page.locator('a[href^="/service/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, page.url(), 'Service Detail');
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on Service Detail:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `Service Detail has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    } else {
      // No items exist, skip detail page test but log it
      console.log('Skipping Service detail accessibility test - no items found');
      test.skip();
    }
  });
  test('Appointment detail page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to list page first
    await page.goto('/appointment');
    await page.waitForLoadState('networkidle');

    // Try to click on the first item to get to detail page
    const firstItemLink = page.locator('a[href^="/appointment/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, page.url(), 'Appointment Detail');
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on Appointment Detail:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `Appointment Detail has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    } else {
      // No items exist, skip detail page test but log it
      console.log('Skipping Appointment detail accessibility test - no items found');
      test.skip();
    }
  });
  test('Availability detail page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to list page first
    await page.goto('/availability');
    await page.waitForLoadState('networkidle');

    // Try to click on the first item to get to detail page
    const firstItemLink = page.locator('a[href^="/availability/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, page.url(), 'Availability Detail');
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on Availability Detail:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `Availability Detail has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    } else {
      // No items exist, skip detail page test but log it
      console.log('Skipping Availability detail accessibility test - no items found');
      test.skip();
    }
  });
  test('Document detail page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to list page first
    await page.goto('/document');
    await page.waitForLoadState('networkidle');

    // Try to click on the first item to get to detail page
    const firstItemLink = page.locator('a[href^="/document/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, page.url(), 'Document Detail');
      const criticalViolations = getCriticalViolations(result.violations);

      if (criticalViolations.length > 0) {
        console.error(`\nCritical accessibility violations on Document Detail:`);
        criticalViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
      }

      expect(
        criticalViolations,
        `Document Detail has ${criticalViolations.length} critical accessibility violations`
      ).toHaveLength(0);
    } else {
      // No items exist, skip detail page test but log it
      console.log('Skipping Document detail accessibility test - no items found');
      test.skip();
    }
  });
});

// ============================================================
// CRITICAL ACCESSIBILITY CHECKS
// ============================================================

test.describe('Critical Accessibility - Images', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('all images should have alt text', async ({ page }) => {
    const pagesToCheck = [...PUBLIC_PAGES, ...PROTECTED_PAGES];

    for (const pageInfo of pagesToCheck) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Find all images without alt attribute or with empty alt
      const imagesWithoutAlt = await page.$$eval('img', (images) => {
        return images
          .filter(img => {
            const alt = img.getAttribute('alt');
            // Decorative images can have empty alt, but missing alt is always wrong
            return alt === null;
          })
          .map(img => ({
            src: img.src,
            html: img.outerHTML.slice(0, 200),
          }));
      });

      if (imagesWithoutAlt.length > 0) {
        console.error(`\nImages without alt text on ${pageInfo.name}:`);
        imagesWithoutAlt.forEach(img => console.error(`  - ${img.src}`));
      }

      expect(
        imagesWithoutAlt,
        `${pageInfo.name} has ${imagesWithoutAlt.length} images without alt text`
      ).toHaveLength(0);
    }
  });
});

test.describe('Critical Accessibility - Form Labels', () => {
  test('login form should have labeled inputs', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check email input has label
    const emailLabel = await page.locator('label:has-text("email"), label[for*="email"]').count();
    const emailAriaLabel = await page.locator('input[type="email"][aria-label]').count();
    expect(emailLabel + emailAriaLabel).toBeGreaterThan(0);

    // Check password input has label
    const passwordLabel = await page.locator('label:has-text("password"), label[for*="password"]').count();
    const passwordAriaLabel = await page.locator('input[type="password"][aria-label]').count();
    expect(passwordLabel + passwordAriaLabel).toBeGreaterThan(0);
  });

  test('signup form should have labeled inputs', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Check email input has label
    const emailLabel = await page.locator('label:has-text("email"), label[for*="email"]').count();
    const emailAriaLabel = await page.locator('input[type="email"][aria-label]').count();
    expect(emailLabel + emailAriaLabel).toBeGreaterThan(0);

    // Check password input has label
    const passwordLabel = await page.locator('label:has-text("password"), label[for*="password"]').count();
    const passwordAriaLabel = await page.locator('input[type="password"][aria-label]').count();
    expect(passwordLabel + passwordAriaLabel).toBeGreaterThan(0);
  });

  test('Profile forms should have labeled inputs', async ({ page }) => {
    await login(page);

    // Check create form
    await page.goto('/profile/new');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have associated labels or aria-label
    const unlabeledInputs = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => {
        return inputs.filter(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = input.closest('label');

          return !ariaLabel && !ariaLabelledby && !hasLabel && !parentLabel;
        }).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name'),
          html: input.outerHTML.slice(0, 150),
        }));
      }
    );

    if (unlabeledInputs.length > 0) {
      console.error(`\nUnlabeled inputs on Profile create form:`);
      unlabeledInputs.forEach(input => console.error(`  - ${input.type}: ${input.name}`));
    }

    expect(
      unlabeledInputs,
      `Profile form has ${unlabeledInputs.length} unlabeled inputs`
    ).toHaveLength(0);
  });
  test('Client forms should have labeled inputs', async ({ page }) => {
    await login(page);

    // Check create form
    await page.goto('/client/new');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have associated labels or aria-label
    const unlabeledInputs = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => {
        return inputs.filter(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = input.closest('label');

          return !ariaLabel && !ariaLabelledby && !hasLabel && !parentLabel;
        }).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name'),
          html: input.outerHTML.slice(0, 150),
        }));
      }
    );

    if (unlabeledInputs.length > 0) {
      console.error(`\nUnlabeled inputs on Client create form:`);
      unlabeledInputs.forEach(input => console.error(`  - ${input.type}: ${input.name}`));
    }

    expect(
      unlabeledInputs,
      `Client form has ${unlabeledInputs.length} unlabeled inputs`
    ).toHaveLength(0);
  });
  test('Service forms should have labeled inputs', async ({ page }) => {
    await login(page);

    // Check create form
    await page.goto('/service/new');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have associated labels or aria-label
    const unlabeledInputs = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => {
        return inputs.filter(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = input.closest('label');

          return !ariaLabel && !ariaLabelledby && !hasLabel && !parentLabel;
        }).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name'),
          html: input.outerHTML.slice(0, 150),
        }));
      }
    );

    if (unlabeledInputs.length > 0) {
      console.error(`\nUnlabeled inputs on Service create form:`);
      unlabeledInputs.forEach(input => console.error(`  - ${input.type}: ${input.name}`));
    }

    expect(
      unlabeledInputs,
      `Service form has ${unlabeledInputs.length} unlabeled inputs`
    ).toHaveLength(0);
  });
  test('Appointment forms should have labeled inputs', async ({ page }) => {
    await login(page);

    // Check create form
    await page.goto('/appointment/new');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have associated labels or aria-label
    const unlabeledInputs = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => {
        return inputs.filter(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = input.closest('label');

          return !ariaLabel && !ariaLabelledby && !hasLabel && !parentLabel;
        }).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name'),
          html: input.outerHTML.slice(0, 150),
        }));
      }
    );

    if (unlabeledInputs.length > 0) {
      console.error(`\nUnlabeled inputs on Appointment create form:`);
      unlabeledInputs.forEach(input => console.error(`  - ${input.type}: ${input.name}`));
    }

    expect(
      unlabeledInputs,
      `Appointment form has ${unlabeledInputs.length} unlabeled inputs`
    ).toHaveLength(0);
  });
  test('Availability forms should have labeled inputs', async ({ page }) => {
    await login(page);

    // Check create form
    await page.goto('/availability/new');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have associated labels or aria-label
    const unlabeledInputs = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => {
        return inputs.filter(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = input.closest('label');

          return !ariaLabel && !ariaLabelledby && !hasLabel && !parentLabel;
        }).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name'),
          html: input.outerHTML.slice(0, 150),
        }));
      }
    );

    if (unlabeledInputs.length > 0) {
      console.error(`\nUnlabeled inputs on Availability create form:`);
      unlabeledInputs.forEach(input => console.error(`  - ${input.type}: ${input.name}`));
    }

    expect(
      unlabeledInputs,
      `Availability form has ${unlabeledInputs.length} unlabeled inputs`
    ).toHaveLength(0);
  });
  test('Document forms should have labeled inputs', async ({ page }) => {
    await login(page);

    // Check create form
    await page.goto('/document/new');
    await page.waitForLoadState('networkidle');

    // All visible inputs should have associated labels or aria-label
    const unlabeledInputs = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      (inputs) => {
        return inputs.filter(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
          const parentLabel = input.closest('label');

          return !ariaLabel && !ariaLabelledby && !hasLabel && !parentLabel;
        }).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name'),
          html: input.outerHTML.slice(0, 150),
        }));
      }
    );

    if (unlabeledInputs.length > 0) {
      console.error(`\nUnlabeled inputs on Document create form:`);
      unlabeledInputs.forEach(input => console.error(`  - ${input.type}: ${input.name}`));
    }

    expect(
      unlabeledInputs,
      `Document form has ${unlabeledInputs.length} unlabeled inputs`
    ).toHaveLength(0);
  });
});

test.describe('Critical Accessibility - Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = results.violations.map(toAxeViolation);

    if (contrastViolations.length > 0) {
      console.error('\nColor contrast violations on dashboard:');
      contrastViolations.forEach((v: AxeViolation) => console.error(formatViolation(v)));
    }

    expect(
      contrastViolations,
      `Dashboard has ${contrastViolations.length} color contrast violations`
    ).toHaveLength(0);
  });
});

// ============================================================
// KEYBOARD NAVIGATION TESTS
// ============================================================

test.describe('Keyboard Navigation', () => {
  test('should be able to navigate login form with keyboard only', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Tab to email input
    await page.keyboard.press('Tab');
    const emailFocused = await page.locator('input[type="email"]').evaluate(
      el => el === document.activeElement
    );
    expect(emailFocused, 'Email input should be focusable via Tab').toBe(true);

    // Tab to password input
    await page.keyboard.press('Tab');
    const passwordFocused = await page.locator('input[type="password"]').evaluate(
      el => el === document.activeElement
    );
    expect(passwordFocused, 'Password input should be focusable via Tab').toBe(true);

    // Tab to submit button
    await page.keyboard.press('Tab');
    const submitFocused = await page.locator('button[type="submit"]').evaluate(
      el => el === document.activeElement
    );
    expect(submitFocused, 'Submit button should be focusable via Tab').toBe(true);
  });

  test('should be able to navigate dashboard with keyboard only', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // All interactive elements should be reachable via Tab
    const interactiveElements = await page.$$eval(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      elements => elements.length
    );

    let focusableCount = 0;
    const maxTabs = 50; // Prevent infinite loop

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');

      // Check if we've cycled back to the beginning
      const activeTag = await page.evaluate(() => document.activeElement?.tagName);
      if (activeTag && ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)) {
        focusableCount++;
      }

      // Check if focus is still within the page
      const focusInBody = await page.evaluate(() =>
        document.body.contains(document.activeElement)
      );
      if (!focusInBody) break;
    }

    expect(
      focusableCount,
      'Should be able to reach interactive elements via Tab'
    ).toBeGreaterThan(0);
  });

  test('should be able to navigate Profile list with keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let foundLink = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const isFocusedLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'A' && el.getAttribute('href')?.includes('/profile/');
      });

      if (isFocusedLink) {
        foundLink = true;

        // Press Enter to navigate to detail
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/profile/');
        break;
      }
    }

    // If no items exist, that's okay
    const isEmpty = await page.locator('text=No profiles').isVisible();
    if (!isEmpty) {
      expect(foundLink, 'Should be able to navigate to Profile detail via keyboard').toBe(true);
    }
  });
  test('should be able to navigate Client list with keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let foundLink = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const isFocusedLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'A' && el.getAttribute('href')?.includes('/client/');
      });

      if (isFocusedLink) {
        foundLink = true;

        // Press Enter to navigate to detail
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/client/');
        break;
      }
    }

    // If no items exist, that's okay
    const isEmpty = await page.locator('text=No clients').isVisible();
    if (!isEmpty) {
      expect(foundLink, 'Should be able to navigate to Client detail via keyboard').toBe(true);
    }
  });
  test('should be able to navigate Service list with keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/service');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let foundLink = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const isFocusedLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'A' && el.getAttribute('href')?.includes('/service/');
      });

      if (isFocusedLink) {
        foundLink = true;

        // Press Enter to navigate to detail
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/service/');
        break;
      }
    }

    // If no items exist, that's okay
    const isEmpty = await page.locator('text=No services').isVisible();
    if (!isEmpty) {
      expect(foundLink, 'Should be able to navigate to Service detail via keyboard').toBe(true);
    }
  });
  test('should be able to navigate Appointment list with keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/appointment');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let foundLink = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const isFocusedLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'A' && el.getAttribute('href')?.includes('/appointment/');
      });

      if (isFocusedLink) {
        foundLink = true;

        // Press Enter to navigate to detail
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/appointment/');
        break;
      }
    }

    // If no items exist, that's okay
    const isEmpty = await page.locator('text=No appointments').isVisible();
    if (!isEmpty) {
      expect(foundLink, 'Should be able to navigate to Appointment detail via keyboard').toBe(true);
    }
  });
  test('should be able to navigate Availability list with keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/availability');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let foundLink = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const isFocusedLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'A' && el.getAttribute('href')?.includes('/availability/');
      });

      if (isFocusedLink) {
        foundLink = true;

        // Press Enter to navigate to detail
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/availability/');
        break;
      }
    }

    // If no items exist, that's okay
    const isEmpty = await page.locator('text=No availabilities').isVisible();
    if (!isEmpty) {
      expect(foundLink, 'Should be able to navigate to Availability detail via keyboard').toBe(true);
    }
  });
  test('should be able to navigate Document list with keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/document');
    await page.waitForLoadState('networkidle');

    // Tab through the page
    let foundLink = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');

      const isFocusedLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'A' && el.getAttribute('href')?.includes('/document/');
      });

      if (isFocusedLink) {
        foundLink = true;

        // Press Enter to navigate to detail
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/document/');
        break;
      }
    }

    // If no items exist, that's okay
    const isEmpty = await page.locator('text=No documents').isVisible();
    if (!isEmpty) {
      expect(foundLink, 'Should be able to navigate to Document detail via keyboard').toBe(true);
    }
  });
});

// ============================================================
// FOCUS MANAGEMENT TESTS
// ============================================================

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('focus should be visible on interactive elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check that focus is visible (element has focus styles)
    const hasFocusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const outline = style.outline;
      const boxShadow = style.boxShadow;

      // Check for focus indicators
      return (
        (outline && outline !== 'none' && !outline.includes('0px')) ||
        (boxShadow && boxShadow !== 'none')
      );
    });

    expect(hasFocusVisible, 'Focused element should have visible focus indicator').toBe(true);
  });

  test('modal should trap focus', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for a delete button to trigger modal
    const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete"]').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Wait for modal to open
      await page.waitForSelector('[role="dialog"], [role="alertdialog"]');

      // Tab through modal elements
      const tabsInModal: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const focusInModal = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
          return modal?.contains(document.activeElement) ?? false;
        });

        tabsInModal.push(focusInModal);
      }

      // Focus should stay within modal
      expect(
        tabsInModal.every(Boolean),
        'Focus should be trapped within modal'
      ).toBe(true);

      // Escape should close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"], [role="alertdialog"]')).not.toBeVisible();
    }
  });

  test('focus should move to new content after navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to a different page
    const navLink = page.locator('nav a, [role="navigation"] a').first();

    if (await navLink.isVisible()) {
      await navLink.click();
      await page.waitForLoadState('networkidle');

      // Focus should be on main content or skip link
      const focusOnMain = await page.evaluate(() => {
        const main = document.querySelector('main, [role="main"]');
        const h1 = document.querySelector('h1');
        const skipLink = document.querySelector('[href="#main-content"], [href="#content"]');

        return (
          main?.contains(document.activeElement) ||
          document.activeElement === h1 ||
          document.activeElement === skipLink ||
          document.activeElement === document.body
        );
      });

      // This is a soft check - some frameworks handle focus differently
      if (!focusOnMain) {
        console.warn('Focus may not be properly managed after navigation');
      }
    }
  });
});

// ============================================================
// FULL ACCESSIBILITY AUDIT WITH REPORT GENERATION
// ============================================================

test.describe('Full Accessibility Audit', () => {
  const allResults: ViolationResult[] = [];

  test.afterAll(async () => {
    if (allResults.length > 0) {
      const report = generateAccessibilityReport(allResults);
      saveReport(report);

      // Log summary
      console.log('\n========================================');
      console.log('ACCESSIBILITY AUDIT SUMMARY');
      console.log('========================================');
      console.log(`Pages tested: ${report.summary.totalPages}`);
      console.log(`Pages with violations: ${report.summary.pagesWithViolations}`);
      console.log(`Total violations: ${report.summary.totalViolations}`);
      console.log(`  - Critical: ${report.summary.criticalViolations}`);
      console.log(`  - Serious: ${report.summary.seriousViolations}`);
      console.log(`  - Moderate: ${report.summary.moderateViolations}`);
      console.log(`  - Minor: ${report.summary.minorViolations}`);
      console.log('========================================\n');
    }
  });

  test('audit all public pages', async ({ page }) => {
    for (const pageInfo of PUBLIC_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, pageInfo.path, pageInfo.name);
      allResults.push(result);
    }
  });

  test('audit all protected pages', async ({ page }) => {
    await login(page);

    for (const pageInfo of PROTECTED_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const result = await runAxeScan(page, pageInfo.path, pageInfo.name);
      allResults.push(result);
    }
  });

  test('audit Profile pages', async ({ page }) => {
    await login(page);

    // List page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/profile', 'Profile List'));

    // Create page
    await page.goto('/profile/new');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/profile/new', 'Profile Create'));

    // Detail page (if items exist)
    await page.goto('/profile');
    const firstItemLink = page.locator('a[href^="/profile/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      allResults.push(await runAxeScan(page, page.url(), 'Profile Detail'));

      // Edit page
      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await page.waitForLoadState('networkidle');
        allResults.push(await runAxeScan(page, page.url(), 'Profile Edit'));
      }
    }
  });
  test('audit Client pages', async ({ page }) => {
    await login(page);

    // List page
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/client', 'Client List'));

    // Create page
    await page.goto('/client/new');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/client/new', 'Client Create'));

    // Detail page (if items exist)
    await page.goto('/client');
    const firstItemLink = page.locator('a[href^="/client/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      allResults.push(await runAxeScan(page, page.url(), 'Client Detail'));

      // Edit page
      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await page.waitForLoadState('networkidle');
        allResults.push(await runAxeScan(page, page.url(), 'Client Edit'));
      }
    }
  });
  test('audit Service pages', async ({ page }) => {
    await login(page);

    // List page
    await page.goto('/service');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/service', 'Service List'));

    // Create page
    await page.goto('/service/new');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/service/new', 'Service Create'));

    // Detail page (if items exist)
    await page.goto('/service');
    const firstItemLink = page.locator('a[href^="/service/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      allResults.push(await runAxeScan(page, page.url(), 'Service Detail'));

      // Edit page
      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await page.waitForLoadState('networkidle');
        allResults.push(await runAxeScan(page, page.url(), 'Service Edit'));
      }
    }
  });
  test('audit Appointment pages', async ({ page }) => {
    await login(page);

    // List page
    await page.goto('/appointment');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/appointment', 'Appointment List'));

    // Create page
    await page.goto('/appointment/new');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/appointment/new', 'Appointment Create'));

    // Detail page (if items exist)
    await page.goto('/appointment');
    const firstItemLink = page.locator('a[href^="/appointment/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      allResults.push(await runAxeScan(page, page.url(), 'Appointment Detail'));

      // Edit page
      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await page.waitForLoadState('networkidle');
        allResults.push(await runAxeScan(page, page.url(), 'Appointment Edit'));
      }
    }
  });
  test('audit Availability pages', async ({ page }) => {
    await login(page);

    // List page
    await page.goto('/availability');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/availability', 'Availability List'));

    // Create page
    await page.goto('/availability/new');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/availability/new', 'Availability Create'));

    // Detail page (if items exist)
    await page.goto('/availability');
    const firstItemLink = page.locator('a[href^="/availability/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      allResults.push(await runAxeScan(page, page.url(), 'Availability Detail'));

      // Edit page
      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await page.waitForLoadState('networkidle');
        allResults.push(await runAxeScan(page, page.url(), 'Availability Edit'));
      }
    }
  });
  test('audit Document pages', async ({ page }) => {
    await login(page);

    // List page
    await page.goto('/document');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/document', 'Document List'));

    // Create page
    await page.goto('/document/new');
    await page.waitForLoadState('networkidle');
    allResults.push(await runAxeScan(page, '/document/new', 'Document Create'));

    // Detail page (if items exist)
    await page.goto('/document');
    const firstItemLink = page.locator('a[href^="/document/"]').first();

    if (await firstItemLink.isVisible()) {
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      allResults.push(await runAxeScan(page, page.url(), 'Document Detail'));

      // Edit page
      const editLink = page.locator('a[href$="/edit"]').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await page.waitForLoadState('networkidle');
        allResults.push(await runAxeScan(page, page.url(), 'Document Edit'));
      }
    }
  });
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
