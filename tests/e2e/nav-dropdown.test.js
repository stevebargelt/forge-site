import { test, expect } from '@playwright/test';

// ── DESKTOP DROPDOWN ──────────────────────────────────────────────────────────
//
// Tests run at the default Desktop Chrome viewport (1280×720), well above the
// 600 px breakpoint where the hamburger takes over.

test.describe('Guides dropdown — desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Guides button has aria-expanded=false initially', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Guides button has aria-controls pointing to #guides-menu', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await expect(btn).toHaveAttribute('aria-controls', 'guides-menu');
  });

  test('clicking Guides sets aria-expanded=true and makes the 3 child links visible', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#guides-menu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('a')).toHaveCount(3);
  });

  test('dropdown links have correct hrefs', async ({ page }) => {
    await page.locator('header .nav-guides-btn').click();
    const links = page.locator('#guides-menu a');
    await expect(links.nth(0)).toHaveAttribute('href', '/add-a-feature');
    await expect(links.nth(1)).toHaveAttribute('href', '/do-research');
    await expect(links.nth(2)).toHaveAttribute('href', '/kick-off-a-project');
  });

  test('clicking Guides again closes dropdown: aria-expanded=false, menu hidden', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#guides-menu')).not.toBeVisible();
  });

  test('clicking outside the Guides group closes the dropdown', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    // Click well below the header in the page content
    await page.mouse.click(100, 400);
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#guides-menu')).not.toBeVisible();
  });

  test('clicking "Add a feature" navigates to /add-a-feature', async ({ page }) => {
    await page.locator('header .nav-guides-btn').click();
    await page.locator('#guides-menu a[href="/add-a-feature"]').click();
    await expect(page).toHaveURL(/\/add-a-feature/);
    await expect(page.locator('h1')).toContainText('Add a feature');
  });

  test('clicking "Do research" navigates to /do-research', async ({ page }) => {
    await page.locator('header .nav-guides-btn').click();
    await page.locator('#guides-menu a[href="/do-research"]').click();
    await expect(page).toHaveURL(/\/do-research/);
    await expect(page.locator('h1')).toContainText('Do research');
  });

  test('clicking "New project" navigates to /kick-off-a-project', async ({ page }) => {
    await page.locator('header .nav-guides-btn').click();
    await page.locator('#guides-menu a[href="/kick-off-a-project"]').click();
    await expect(page).toHaveURL(/\/kick-off-a-project/);
    await expect(page.locator('h1')).toContainText('Kick off');
  });
});

// ── KEYBOARD ACCESSIBILITY ────────────────────────────────────────────────────
//
// Exercises ArrowDown / ArrowUp / Escape / Enter / Space / Tab behaviour
// as specified in the JS in MarketingLayout.astro.

test.describe('Guides dropdown — keyboard a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Guides button is reachable by Tab from the start of the page', async ({ page }) => {
    let found = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const classes = await page.evaluate(() =>
        Array.from(document.activeElement?.classList ?? []),
      );
      if (classes.includes('nav-guides-btn')) {
        found = true;
        break;
      }
    }
    expect(found, 'Guides button should be reachable via Tab').toBe(true);
  });

  test('ArrowDown on the button opens menu and focuses first link', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('ArrowDown');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#guides-menu a').first()).toBeFocused();
  });

  test('ArrowDown navigates sequentially through all 3 menu items', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('ArrowDown');
    const links = page.locator('#guides-menu a');
    await expect(links.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(links.nth(2)).toBeFocused();
  });

  test('ArrowUp from the first menu item closes menu and returns focus to button', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#guides-menu a').first()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
  });

  test('Escape from within the menu closes dropdown and returns focus to button', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('ArrowDown');
    // Now inside the menu
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
  });

  test('Escape on the button itself (when open) closes dropdown', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.click(); // opens menu; focus stays on button after programmatic click
    await btn.focus(); // make sure focus is explicitly on button
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter on the Guides button opens the dropdown', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  test('Space on the Guides button toggles open then closed', async ({ page }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('Space');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('focus does not get trapped: Tab past all menu items closes menu and moves on', async ({
    page,
  }) => {
    const btn = page.locator('header .nav-guides-btn');
    await btn.focus();
    await page.keyboard.press('ArrowDown');
    // Tab through all 3 links — after the last one, focus leaves the guides group
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // The focusin listener on document closes the dropdown when focus leaves the group
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    // Active element must not be a guides link
    const activeClass = await page.evaluate(() =>
      Array.from(document.activeElement?.classList ?? []).join(' '),
    );
    expect(activeClass).not.toContain('nav-guides-link');
  });
});

// ── NO-JS FALLBACK ────────────────────────────────────────────────────────────
//
// Without JS the html.js class is never added.
// "html.js .nav-guides-menu { display: none }" therefore does NOT apply,
// and the base ".nav-guides-menu { display: flex }" makes the submenu visible
// inline — the group must not become a keyboard or markup dead-end.

test.describe('Guides dropdown — no-JS fallback', () => {
  test.use({ javaScriptEnabled: false });

  test('all 3 Guides links are present and visible inline without JS', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('#guides-menu');
    await expect(menu.locator('a[href="/add-a-feature"]')).toBeVisible();
    await expect(menu.locator('a[href="/do-research"]')).toBeVisible();
    await expect(menu.locator('a[href="/kick-off-a-project"]')).toBeVisible();
  });

  test('no-JS: all 3 Guides links are keyboard-reachable via Tab', async ({ page }) => {
    await page.goto('/');
    let addFeature = false;
    let doResearch = false;
    let newProject = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const href = await page.evaluate(() => document.activeElement?.getAttribute('href'));
      if (href === '/add-a-feature') addFeature = true;
      if (href === '/do-research') doResearch = true;
      if (href === '/kick-off-a-project') newProject = true;
      if (addFeature && doResearch && newProject) break;
    }
    expect(addFeature, '/add-a-feature reachable via Tab').toBe(true);
    expect(doResearch, '/do-research reachable via Tab').toBe(true);
    expect(newProject, '/kick-off-a-project reachable via Tab').toBe(true);
  });
});

// ── MOBILE NAV ────────────────────────────────────────────────────────────────
//
// 375 × 812 — hamburger replaces the desktop nav-links (requires JS).

test.describe('Guides in mobile nav', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opening hamburger shows a "Guides" section label', async ({ page }) => {
    await page.click('.nav-toggle');
    const label = page.locator('.nav-mobile-section-label');
    await expect(label).toBeVisible();
    await expect(label).toContainText('Guides');
  });

  test('all 3 guide links are visible and indented under the Guides section', async ({ page }) => {
    await page.click('.nav-toggle');
    const section = page.locator('.nav-mobile-section');
    await expect(section.locator('a[href="/add-a-feature"]')).toBeVisible();
    await expect(section.locator('a[href="/do-research"]')).toBeVisible();
    await expect(section.locator('a[href="/kick-off-a-project"]')).toBeVisible();
  });

  test('the other 4 top-level mobile links are present and visible', async ({ page }) => {
    await page.click('.nav-toggle');
    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav.locator('a[href="/what-forge-does"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/how-forge-runs-work"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/how-routing-works"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/docs/"]')).toBeVisible();
  });

  test('Escape closes mobile nav and returns focus to hamburger button', async ({ page }) => {
    await page.click('.nav-toggle');
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#mobile-nav')).not.toHaveClass(/nav-mobile--open/);
    const focusedOnToggle = await page.evaluate(() =>
      document.activeElement?.classList.contains('nav-toggle'),
    );
    expect(focusedOnToggle).toBe(true);
  });
});

// ── STRUCTURE & ORDER ─────────────────────────────────────────────────────────
//
// Asserts the top-level nav order, that Guides is a button (not a link),
// and that the footer still exposes the walkthrough pages directly.

test.describe('nav structure and order', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('desktop nav has exactly 5 top-level items in the correct order', async ({ page }) => {
    const items = page.locator('.nav-links > li');
    await expect(items).toHaveCount(5);
    await expect(items.nth(0)).toContainText('What Forge does');
    await expect(items.nth(1)).toContainText('How it works');
    await expect(items.nth(2)).toContainText('Routing');
    await expect(items.nth(3)).toContainText('Guides');
    await expect(items.nth(4)).toContainText('Docs');
  });

  test('Guides is a <button>, not an <a>', async ({ page }) => {
    const el = page.locator('.nav-guides-btn');
    const tag = await el.evaluate((node) => node.tagName.toLowerCase());
    expect(tag).toBe('button');
  });

  test('Docs nav item is an <a> (not a button) — regression guard', async ({ page }) => {
    const docsLink = page.locator('.nav-links > li').nth(4).locator('a');
    await expect(docsLink).toHaveAttribute('href', '/docs/');
  });

  test('footer still directly links to all 3 walkthrough pages (unchanged)', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/add-a-feature"]')).toBeVisible();
    await expect(footer.locator('a[href="/do-research"]')).toBeVisible();
    await expect(footer.locator('a[href="/kick-off-a-project"]')).toBeVisible();
  });
});
