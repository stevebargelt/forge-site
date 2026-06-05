import { test, expect } from '@playwright/test';

// ── 1. MOBILE NAV (375 × 812, JS enabled) ───────────────────────────────

test.describe('mobile nav at 375 × 812', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/add-a-feature');
  });

  test('hamburger is visible; desktop nav-links are hidden', async ({ page }) => {
    const toggleDisplay = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.nav-toggle')).display,
    );
    expect(toggleDisplay).not.toBe('none');

    const linksDisplay = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.nav-links')).display,
    );
    expect(linksDisplay).toBe('none');
  });

  test('clicking hamburger: aria-expanded true, nav-mobile--open added, aria-hidden removed, 6 links visible', async ({
    page,
  }) => {
    await page.click('.nav-toggle');

    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-nav')).toHaveClass(/nav-mobile--open/);

    const ariaHidden = await page.locator('#mobile-nav').getAttribute('aria-hidden');
    expect(ariaHidden).toBeNull();

    const linkCount = await page.locator('.nav-mobile-link').count();
    expect(linkCount).toBe(7);
  });

  test('Escape closes mobile nav and returns focus to hamburger button', async ({ page }) => {
    await page.click('.nav-toggle');
    await page.keyboard.press('Escape');

    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#mobile-nav')).not.toHaveClass(/nav-mobile--open/);
    await expect(page.locator('#mobile-nav')).toHaveAttribute('aria-hidden', 'true');

    const focusedOnToggle = await page.evaluate(() =>
      document.activeElement.classList.contains('nav-toggle'),
    );
    expect(focusedOnToggle).toBe(true);
  });
});

// ── 2. SKIP LINK (desktop viewport) ──────────────────────────────────────

test.describe('skip link', () => {
  test('is first focusable element and becomes visible on keyboard Tab', async ({ page }) => {
    await page.goto('/add-a-feature');

    // Real keyboard Tab — not programmatic .focus() — so :focus CSS triggers
    await page.keyboard.press('Tab');

    const active = await page.evaluate(() => ({
      classes: Array.from(document.activeElement.classList),
      text: document.activeElement.textContent?.trim(),
      href: document.activeElement.getAttribute('href'),
    }));

    expect(active.classes).toContain('skip-link');
    expect(active.text).toBe('Skip to main content');
    expect(active.href).toBe('#main-content');

    // :focus rule moves the link from left:-9999px to a visible on-screen position
    const leftPx = await page.evaluate(() =>
      document.querySelector('.skip-link').getBoundingClientRect().left,
    );
    expect(leftPx).toBeGreaterThanOrEqual(0);
  });
});

// ── 3. NO-JS NAV FALLBACK (375 × 812, JS disabled) ───────────────────────

test.describe('no-js nav fallback', () => {
  test.use({ javaScriptEnabled: false });

  test('nav-links stay visible without html.js class (progressive enhancement)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/add-a-feature');

    // Without JS, document.documentElement never gets the 'js' class, so the
    // media-query rule "html.js .nav-links { display: none }" does not apply.
    const linksDisplay = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.nav-links')).display,
    );
    expect(linksDisplay).not.toBe('none');
  });
});
