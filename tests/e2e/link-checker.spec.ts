/**
 * Link & Button Verification Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests crawl all pages and verify:
 * - All links have valid href attributes (not empty, "#", or "javascript:void(0)")
 * - All buttons have proper handlers (onClick, form submission, or Link wrapper)
 * - Internal links don't result in 404s
 * - Dead links are reported with their page location
 *
 * Run with: npx playwright test link-checker.spec.ts
 */

import { test, expect, Page, Locator } from '@playwright/test';

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Pages to start crawling from
const ENTRY_POINTS = [
  '/',
];

// Pages that require authentication
const AUTHENTICATED_PAGES = [
];

// External domains to skip (we won't verify these are reachable)
const SKIP_EXTERNAL_DOMAINS = [
  'google.com',
  'facebook.com',
  'twitter.com',
  'linkedin.com',
  'github.com',
  'youtube.com',
  // Add more as needed
];

// Patterns to ignore (regex)
const IGNORE_PATTERNS = [
  /^mailto:/,
  /^tel:/,
  /^sms:/,
  /^\#$/,            // Anchor-only links that are valid in some contexts
  /^data:/,
  /^blob:/,
];

// Test user credentials for authenticated pages
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

// Whether to verify external links are reachable (slower but more thorough)
const VERIFY_EXTERNAL_LINKS = process.env.VERIFY_EXTERNAL_LINKS === 'true';

// ============================================================
// TYPES
// ============================================================

interface LinkIssue {
  page: string;
  element: 'link' | 'button';
  selector: string;
  text: string;
  issue: string;
  href?: string;
}

interface CrawlResult {
  visitedPages: Set<string>;
  issues: LinkIssue[];
  deadLinks: Array<{ page: string; href: string; status: number }>;
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Normalize a URL path for comparison
 */
function normalizePath(url: string): string {
  try {
    const parsed = new URL(url, BASE_URL);
    // Only return internal paths
    if (!parsed.href.startsWith(BASE_URL)) {
      return url; // Return as-is for external
    }
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

/**
 * Check if a URL is external
 */
function isExternalUrl(href: string): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, BASE_URL);
    const baseHost = new URL(BASE_URL).host;
    return url.host !== baseHost;
  } catch {
    return false;
  }
}

/**
 * Check if an external URL should be skipped
 */
function shouldSkipExternalUrl(href: string): boolean {
  return SKIP_EXTERNAL_DOMAINS.some(domain => href.includes(domain));
}

/**
 * Check if a URL matches ignore patterns
 */
function shouldIgnoreUrl(href: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(href));
}

/**
 * Extract visible text from an element
 */
async function getElementText(locator: Locator): Promise<string> {
  try {
    const text = await locator.innerText({ timeout: 1000 });
    return text.trim().slice(0, 50) || '[no text]';
  } catch {
    return '[no text]';
  }
}

/**
 * Generate a readable selector for an element
 */
async function getReadableSelector(locator: Locator): Promise<string> {
  try {
    const id = await locator.getAttribute('id');
    if (id) return `#${id}`;

    const className = await locator.getAttribute('class');
    if (className) {
      const firstClass = className.split(' ')[0];
      if (firstClass) return `.${firstClass}`;
    }

    const href = await locator.getAttribute('href');
    if (href) return `[href="${href.slice(0, 30)}..."]`;

    return await getElementText(locator);
  } catch {
    return '[unknown]';
  }
}

// ============================================================
// LINK VALIDATION
// ============================================================

/**
 * Check if a link has a valid href
 */
async function validateLink(
  page: Page,
  link: Locator,
  currentPage: string
): Promise<LinkIssue | null> {
  const href = await link.getAttribute('href');
  const text = await getElementText(link);
  const selector = await getReadableSelector(link);

  // Check for missing href
  if (!href) {
    return {
      page: currentPage,
      element: 'link',
      selector,
      text,
      issue: 'Link has no href attribute',
    };
  }

  // Check for empty href
  if (href.trim() === '') {
    return {
      page: currentPage,
      element: 'link',
      selector,
      text,
      issue: 'Link has empty href',
      href,
    };
  }

  // Check for placeholder href
  if (href === '#') {
    // Check if it has an onClick handler (acceptable pattern)
    const onClick = await link.getAttribute('onclick');
    const hasClickHandler = await link.evaluate(el => {
      // Check for React-style event handlers
      const reactProps = Object.keys(el).find(key => key.startsWith('__reactProps'));
      if (reactProps) {
        return (el as any)[reactProps]?.onClick !== undefined;
      }
      return false;
    });

    if (!onClick && !hasClickHandler) {
      return {
        page: currentPage,
        element: 'link',
        selector,
        text,
        issue: 'Link uses href="#" without onClick handler (likely placeholder)',
        href,
      };
    }
  }

  // Check for javascript:void(0)
  if (href.toLowerCase().includes('javascript:void') || href.toLowerCase() === 'javascript:;') {
    const hasClickHandler = await link.evaluate(el => {
      const reactProps = Object.keys(el).find(key => key.startsWith('__reactProps'));
      if (reactProps) {
        return (el as any)[reactProps]?.onClick !== undefined;
      }
      return el.onclick !== null;
    });

    if (!hasClickHandler) {
      return {
        page: currentPage,
        element: 'link',
        selector,
        text,
        issue: 'Link uses javascript:void(0) without onClick handler',
        href,
      };
    }
  }

  return null;
}

// ============================================================
// BUTTON VALIDATION
// ============================================================

/**
 * Check if a button has proper functionality
 */
async function validateButton(
  page: Page,
  button: Locator,
  currentPage: string
): Promise<LinkIssue | null> {
  const text = await getElementText(button);
  const selector = await getReadableSelector(button);

  // Check if button is inside a form (valid - will submit)
  const isInForm = await button.evaluate(el => {
    return el.closest('form') !== null;
  });
  if (isInForm) {
    return null; // Valid - form submission button
  }

  // Check if button is wrapped by a Link component (Next.js pattern)
  const isInLink = await button.evaluate(el => {
    return el.closest('a') !== null;
  });
  if (isInLink) {
    // This is actually an issue - buttons shouldn't be inside links (hydration error)
    return {
      page: currentPage,
      element: 'button',
      selector,
      text,
      issue: 'Button nested inside <a> tag (causes hydration errors)',
    };
  }

  // Check if button has onClick handler
  const hasClickHandler = await button.evaluate(el => {
    // Check native onclick
    if (el.onclick !== null) return true;

    // Check for React event handlers
    const reactProps = Object.keys(el).find(key => key.startsWith('__reactProps'));
    if (reactProps && (el as any)[reactProps]?.onClick) return true;

    // Check for data attributes that suggest JS handling
    if (el.hasAttribute('data-action')) return true;

    return false;
  });

  if (!hasClickHandler) {
    // Check if it's a type="submit" outside form
    const buttonType = await button.getAttribute('type');
    if (buttonType === 'submit') {
      return {
        page: currentPage,
        element: 'button',
        selector,
        text,
        issue: 'Submit button is outside of a form',
      };
    }

    // Check if button is disabled (acceptable)
    const isDisabled = await button.isDisabled();
    if (isDisabled) {
      return null; // Disabled buttons without handlers are acceptable
    }

    return {
      page: currentPage,
      element: 'button',
      selector,
      text,
      issue: 'Button has no onClick handler and is not inside a form',
    };
  }

  return null;
}

// ============================================================
// 404 CHECKING
// ============================================================

/**
 * Check if internal links return 404
 */
async function checkFor404s(
  page: Page,
  links: string[],
  currentPage: string
): Promise<Array<{ page: string; href: string; status: number }>> {
  const deadLinks: Array<{ page: string; href: string; status: number }> = [];

  for (const href of links) {
    // Skip external and special URLs
    if (isExternalUrl(href) || shouldIgnoreUrl(href)) {
      continue;
    }

    try {
      const response = await page.request.get(href);
      if (response.status() === 404) {
        deadLinks.push({
          page: currentPage,
          href,
          status: 404,
        });
      }
    } catch (error) {
      // Network error - could be dead link
      deadLinks.push({
        page: currentPage,
        href,
        status: 0,
      });
    }
  }

  return deadLinks;
}

// ============================================================
// PAGE CRAWLER
// ============================================================

/**
 * Crawl a page and validate all links and buttons
 */
async function crawlPage(
  page: Page,
  path: string,
  visited: Set<string>,
  issues: LinkIssue[],
  deadLinks: Array<{ page: string; href: string; status: number }>
): Promise<string[]> {
  const normalizedPath = normalizePath(path);

  // Skip if already visited
  if (visited.has(normalizedPath)) {
    return [];
  }
  visited.add(normalizedPath);

  // Navigate to page
  try {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (error) {
    console.warn(`Failed to load page: ${path}`);
    return [];
  }

  // Wait for any dynamic content
  await page.waitForTimeout(500);

  // Find all links
  const links = await page.locator('a').all();
  const internalLinks: string[] = [];

  for (const link of links) {
    try {
      // Validate the link
      const issue = await validateLink(page, link, path);
      if (issue) {
        issues.push(issue);
      }

      // Collect internal links for crawling
      const href = await link.getAttribute('href');
      if (href && !isExternalUrl(href) && !shouldIgnoreUrl(href)) {
        const fullUrl = new URL(href, BASE_URL).href;
        if (fullUrl.startsWith(BASE_URL)) {
          internalLinks.push(href);
        }
      }
    } catch {
      // Element may have been removed from DOM
    }
  }

  // Find all buttons
  const buttons = await page.locator('button').all();

  for (const button of buttons) {
    try {
      const issue = await validateButton(page, button, path);
      if (issue) {
        issues.push(issue);
      }
    } catch {
      // Element may have been removed from DOM
    }
  }

  // Check for 404s on internal links
  const uniqueLinks = [...new Set(internalLinks)];
  const dead = await checkFor404s(page, uniqueLinks, path);
  deadLinks.push(...dead);

  return uniqueLinks;
}

/**
 * Crawl all pages starting from entry points
 */
async function crawlAllPages(
  page: Page,
  entryPoints: string[],
  maxDepth: number = 3
): Promise<CrawlResult> {
  const visited = new Set<string>();
  const issues: LinkIssue[] = [];
  const deadLinks: Array<{ page: string; href: string; status: number }> = [];

  let currentLevel = [...entryPoints];
  let depth = 0;

  while (currentLevel.length > 0 && depth < maxDepth) {
    const nextLevel: string[] = [];

    for (const path of currentLevel) {
      const newLinks = await crawlPage(page, path, visited, issues, deadLinks);
      nextLevel.push(...newLinks);
    }

    currentLevel = [...new Set(nextLevel)].filter(link => !visited.has(normalizePath(link)));
    depth++;
  }

  return { visitedPages: visited, issues, deadLinks };
}

// ============================================================
// TESTS
// ============================================================

test.describe('Link & Button Verification', () => {
  test.describe.configure({ timeout: 120000 }); // Allow 2 minutes for full crawl

  test('should have valid links on all public pages', async ({ page }) => {
    const result = await crawlAllPages(page, ENTRY_POINTS, 2);

    console.log(`Crawled ${result.visitedPages.size} pages`);

    if (result.issues.length > 0) {
      console.log('\n=== LINK/BUTTON ISSUES ===');
      for (const issue of result.issues) {
        console.log(`\nPage: ${issue.page}`);
        console.log(`Element: ${issue.element}`);
        console.log(`Selector: ${issue.selector}`);
        console.log(`Text: ${issue.text}`);
        console.log(`Issue: ${issue.issue}`);
        if (issue.href) console.log(`Href: ${issue.href}`);
      }
    }

    expect(result.issues).toHaveLength(0);
  });

  test('should have no 404 links on public pages', async ({ page }) => {
    const result = await crawlAllPages(page, ENTRY_POINTS, 2);

    if (result.deadLinks.length > 0) {
      console.log('\n=== DEAD LINKS (404) ===');
      for (const dead of result.deadLinks) {
        console.log(`Page: ${dead.page} -> Link: ${dead.href} (${dead.status})`);
      }
    }

    expect(result.deadLinks).toHaveLength(0);
  });

});

test.describe('Specific Link Patterns', () => {
  test('should not have any href="#" without handlers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hashLinks = await page.locator('a[href="#"]').all();
    const invalidLinks: string[] = [];

    for (const link of hashLinks) {
      const hasHandler = await link.evaluate(el => {
        if (el.onclick !== null) return true;
        const reactProps = Object.keys(el).find(key => key.startsWith('__reactProps'));
        return reactProps ? (el as any)[reactProps]?.onClick !== undefined : false;
      });

      if (!hasHandler) {
        const text = await getElementText(link);
        invalidLinks.push(text);
      }
    }

    if (invalidLinks.length > 0) {
      console.log('Links with href="#" but no onClick:', invalidLinks);
    }

    expect(invalidLinks).toHaveLength(0);
  });

  test('should not have any javascript:void links without handlers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const voidLinks = await page.locator('a[href^="javascript:"]').all();
    const invalidLinks: string[] = [];

    for (const link of voidLinks) {
      const hasHandler = await link.evaluate(el => {
        if (el.onclick !== null) return true;
        const reactProps = Object.keys(el).find(key => key.startsWith('__reactProps'));
        return reactProps ? (el as any)[reactProps]?.onClick !== undefined : false;
      });

      if (!hasHandler) {
        const text = await getElementText(link);
        invalidLinks.push(text);
      }
    }

    if (invalidLinks.length > 0) {
      console.log('Links with javascript:void but no onClick:', invalidLinks);
    }

    expect(invalidLinks).toHaveLength(0);
  });

  test('should not have buttons nested inside links (hydration error)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nestedButtons = await page.locator('a button').count();

    if (nestedButtons > 0) {
      const locations = await page.locator('a button').all();
      for (const btn of locations) {
        const text = await getElementText(btn);
        console.log(`Nested button found: "${text}"`);
      }
    }

    expect(nestedButtons).toBe(0);
  });

  test('should not have links nested inside buttons (hydration error)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nestedLinks = await page.locator('button a').count();

    if (nestedLinks > 0) {
      const locations = await page.locator('button a').all();
      for (const link of locations) {
        const text = await getElementText(link);
        console.log(`Nested link found: "${text}"`);
      }
    }

    expect(nestedLinks).toBe(0);
  });

  test('should have accessible link text (not "click here")', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const badPhrases = ['click here', 'here', 'read more', 'learn more', 'link'];
    const accessibilityIssues: string[] = [];

    const links = await page.locator('a').all();

    for (const link of links) {
      const text = (await getElementText(link)).toLowerCase();
      const ariaLabel = await link.getAttribute('aria-label');

      // Skip if has aria-label
      if (ariaLabel && ariaLabel.trim().length > 0) {
        continue;
      }

      // Check for bad link text
      if (badPhrases.includes(text)) {
        accessibilityIssues.push(`Link with text "${text}" lacks context`);
      }
    }

    if (accessibilityIssues.length > 0) {
      console.log('\n=== ACCESSIBILITY ISSUES ===');
      accessibilityIssues.forEach(issue => console.log(issue));
    }

    // This is a warning, not a failure
    if (accessibilityIssues.length > 0) {
      console.warn(`Found ${accessibilityIssues.length} links with poor accessibility`);
    }
  });
});

test.describe('Static Route Validation', () => {
  /**
   * This test validates that all internal routes referenced in source code
   * have corresponding page files. Catches broken links at build time.
   */
  test('all router.push() targets should have corresponding pages', async ({ page }) => {
    // Entity routes that should exist
    const entityRoutes: Array<{ list: string; new: string; detail: string; edit: string }> = [
      { list: '/profile', new: '/profile/new', detail: '/profile/[id]', edit: '/profile/[id]/edit' },
      { list: '/client', new: '/client/new', detail: '/client/[id]', edit: '/client/[id]/edit' },
      { list: '/service', new: '/service/new', detail: '/service/[id]', edit: '/service/[id]/edit' },
      { list: '/appointment', new: '/appointment/new', detail: '/appointment/[id]', edit: '/appointment/[id]/edit' },
      { list: '/availability', new: '/availability/new', detail: '/availability/[id]', edit: '/availability/[id]/edit' },
      { list: '/document', new: '/document/new', detail: '/document/[id]', edit: '/document/[id]/edit' },
    ];

    const missingRoutes: string[] = [];

    for (const entity of entityRoutes) {
      // Test list page
      const listResponse = await page.request.get(entity.list);
      if (listResponse.status() === 404) {
        missingRoutes.push(`${entity.list} (list page)`);
      }

      // Test new page
      const newResponse = await page.request.get(entity.new);
      if (newResponse.status() === 404) {
        missingRoutes.push(`${entity.new} (create page)`);
      }
    }

    if (missingRoutes.length > 0) {
      console.log('\n=== MISSING ENTITY ROUTES ===');
      console.log('These routes are referenced in code but have no page file:');
      missingRoutes.forEach(route => console.log(`  - ${route}`));
      console.log('\nFix: Ensure all entity routes have corresponding page.tsx files');
    }

    expect(missingRoutes).toHaveLength(0);
  });

  test('settings sub-routes should exist', async ({ page }) => {
    const settingsRoutes = [
      '/settings',
      '/settings/profile',
    ];

    const missingRoutes: string[] = [];

    for (const route of settingsRoutes) {
      const response = await page.request.get(route);
      // 307 is OK (redirect), only 404 is a problem
      if (response.status() === 404) {
        missingRoutes.push(route);
      }
    }

    if (missingRoutes.length > 0) {
      console.log('\n=== MISSING SETTINGS ROUTES ===');
      missingRoutes.forEach(route => console.log(`  - ${route}`));
    }

    expect(missingRoutes).toHaveLength(0);
  });
});

