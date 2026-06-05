/**
 * E2E tests for /how-routing-works — the routing explainer page.
 *
 * Covers: page render, routing-loop strip, dispatch path list, RACI→compiled
 * pairs (real text not images), route cards with path badges, ProvenanceMarker,
 * governance-invariants callouts, desktop + mobile nav, and a11y basics.
 *
 * Run: pnpm test:e2e (builds site first)
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const SCREENSHOTS_DIR = path.join(import.meta.dirname, 'results');
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ── Page render ───────────────────────────────────────────────────────────

test.describe('/how-routing-works: page render', () => {
  test('h1 "How routing works" is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('h1')).toContainText('How routing works');
  });

  test('eyebrow "RACI to routing policy" is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.getByText('RACI to routing policy').first()).toBeVisible();
  });

  test('full page screenshot', async ({ page }) => {
    await page.goto('/how-routing-works');
    await page.locator('h1').waitFor();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-routing-works-full.png'), fullPage: true });
  });
});

// ── Routing loop strip ────────────────────────────────────────────────────

test.describe('/how-routing-works: routing-loop strip', () => {
  test('loop strip section is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.loop-strip')).toBeVisible();
  });

  test('loop strip has exactly 6 step labels', async ({ page }) => {
    await page.goto('/how-routing-works');
    const labels = page.locator('.loop-step-label');
    await expect(labels).toHaveCount(6);
  });

  const LOOP_STEPS = ['prompt', 'classify', 'work type', 'route key', 'route block', 'dispatch'];

  for (const step of LOOP_STEPS) {
    test(`loop strip shows step label "${step}"`, async ({ page }) => {
      await page.goto('/how-routing-works');
      await expect(page.locator('.loop-step-label').getByText(step, { exact: true })).toBeVisible();
    });
  }

  test('loop arrow separators are aria-hidden (decorative)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const arrows = page.locator('.loop-arrow');
    const count = await arrows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(arrows.nth(i)).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('loop strip screenshot', async ({ page }) => {
    await page.goto('/how-routing-works');
    await page.locator('.loop-strip').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-routing-works-loop-strip.png') });
  });
});

// ── Dispatch path types ───────────────────────────────────────────────────

test.describe('/how-routing-works: dispatch path types', () => {
  test('dispatch paths section is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.path-types')).toBeVisible();
  });

  test('path list has exactly 6 items (all dispatch mechanisms covered)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const items = page.locator('.path-item');
    await expect(items).toHaveCount(6);
  });

  const DISPATCH_PATHS = ['in_session', 'invoke', 'invoke_chain', 'workflow', 'manual', 'cli'];

  for (const pathType of DISPATCH_PATHS) {
    test(`dispatch path "${pathType}" is listed as a path-chip`, async ({ page }) => {
      await page.goto('/how-routing-works');
      await expect(page.locator('.path-chip').getByText(pathType, { exact: true }).first()).toBeVisible();
    });
  }
});

// ── RACI → compiled pairs ─────────────────────────────────────────────────

test.describe('/how-routing-works: RACI-to-compiled pairs', () => {
  test('compile-pairs section is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.compile-pairs')).toBeVisible();
  });

  test('exactly 5 compile-pair articles are rendered', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('article.compile-pair')).toHaveCount(5);
  });

  test('RACI source panels contain real text (pre.raci-snippet with code inside)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const snippets = page.locator('pre.raci-snippet code');
    await expect(snippets).not.toHaveCount(0);
    // First snippet should contain '### route:' — real text, not placeholder
    const firstSnippetText = await snippets.first().innerText();
    expect(firstSnippetText).toContain('### route:');
  });

  test('implementation_quick RACI snippet shows "required_followups: test-engineer"', async ({ page }) => {
    await page.goto('/how-routing-works');
    // The compile-pair for implementation_quick is the second one
    const pairs = page.locator('article.compile-pair');
    const implQuickPair = pairs.nth(1);
    await expect(implQuickPair.locator('pre.raci-snippet code')).toContainText('required_followups: test-engineer');
  });

  test('compiled-fields show "responsible" dt/dd pairs', async ({ page }) => {
    await page.goto('/how-routing-works');
    // Each compiled route should have a 'responsible' definition
    const responsibleDts = page.locator('.compiled-fields dt').getByText('responsible');
    const count = await responsibleDts.count();
    expect(count).toBe(5);
  });

  test('compiled-fields show accountable:human in every route', async ({ page }) => {
    await page.goto('/how-routing-works');
    const accountableDds = page.locator('.compiled-field').filter({ hasText: 'accountable' });
    const count = await accountableDds.count();
    expect(count).toBe(5);
    // Every compiled route should show 'human' as the accountable value
    for (let i = 0; i < count; i++) {
      await expect(accountableDds.nth(i)).toContainText('human');
    }
  });

  test('RACI → compiled pair screenshot', async ({ page }) => {
    await page.goto('/how-routing-works');
    await page.locator('.compile-pairs').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-routing-works-raci-pairs.png') });
  });
});

// ── Route cards ───────────────────────────────────────────────────────────

test.describe('/how-routing-works: route cards', () => {
  test('route-cards section is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.route-cards')).toBeVisible();
  });

  test('exactly 5 route-card articles are rendered', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('article.route-card')).toHaveCount(5);
  });

  test('each route card has a path-chip badge', async ({ page }) => {
    await page.goto('/how-routing-works');
    const cards = page.locator('article.route-card');
    const count = await cards.count();
    expect(count).toBe(5);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('.path-chip--card')).toBeVisible();
    }
  });

  const ROUTE_KEYS = [
    'strategy',
    'implementation_quick',
    'implementation_full',
    'review_security',
    'documentation_durable',
  ];

  for (const key of ROUTE_KEYS) {
    test(`route card for "${key}" is visible`, async ({ page }) => {
      await page.goto('/how-routing-works');
      await expect(page.locator(`[id="card-heading-${key}"]`)).toBeVisible();
    });
  }

  test('review_security card has red-badge (adversarial review marker)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const reviewCard = page.locator(`article[aria-labelledby="card-heading-review_security"]`);
    await expect(reviewCard.locator('.red-badge').first()).toBeAttached();
  });

  test('implementation_full card shows workflow stage chips (architect/plan/build/verify)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const implFullCard = page.locator(`article[aria-labelledby="card-heading-implementation_full"]`);
    await expect(implFullCard.locator('.stage-chip').first()).toBeVisible();
    const chipCount = await implFullCard.locator('.stage-chip').count();
    expect(chipCount).toBe(4);
  });

  test('implementation_quick causal flow shows required_followups: test-engineer', async ({ page }) => {
    await page.goto('/how-routing-works');
    const implQuickCard = page.locator(`article[aria-labelledby="card-heading-implementation_quick"]`);
    await expect(implQuickCard.locator('.causal-step--followups')).toBeVisible();
    await expect(implQuickCard.locator('.causal-step--followups')).toContainText('test-engineer');
  });

  test('route cards screenshot', async ({ page }) => {
    await page.goto('/how-routing-works');
    await page.locator('.route-cards').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-routing-works-route-cards.png') });
  });
});

// ── ProvenanceMarker ──────────────────────────────────────────────────────

test.describe('/how-routing-works: ProvenanceMarker', () => {
  test('provenance marker is visible in hero', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.provenance-marker').first()).toBeVisible();
  });

  test('provenance marker shows forge@bbb1c13', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.provenance-marker').first()).toContainText('forge@bbb1c13');
  });

  test('provenance link href contains the full SHA', async ({ page }) => {
    await page.goto('/how-routing-works');
    const link = page.locator('.provenance-link').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('bbb1c136b5723e63d653a05d100f00b3d1a40fc8');
  });

  test('provenance link points to forge commit URL', async ({ page }) => {
    await page.goto('/how-routing-works');
    const link = page.locator('.provenance-link').first();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/github\.com.*\/commit\//);
  });

  test('provenance marker has role="note" (semantic landmark)', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.provenance-marker').first()).toHaveAttribute('role', 'note');
  });
});

// ── Governance invariants ─────────────────────────────────────────────────

test.describe('/how-routing-works: governance invariants', () => {
  test('governance section is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('#governance')).toBeVisible();
  });

  test('"accountable: human" invariant heading is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.invariant-title').filter({ hasText: 'accountable: human' }).first()).toBeVisible();
  });

  test('"cannot weaken force rules" invariant heading is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(
      page.locator('.invariant-title').filter({ hasText: /cannot weaken force rule/i }).first(),
    ).toBeVisible();
  });

  test('"Every routing change is audited" invariant heading is visible', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(
      page.locator('.invariant-title').filter({ hasText: /audited/i }).first(),
    ).toBeVisible();
  });

  test('exactly 3 invariant blocks are present', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('.invariant')).toHaveCount(3);
  });

  test('governance invariants screenshot', async ({ page }) => {
    await page.goto('/how-routing-works');
    await page.locator('#governance').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-routing-works-governance.png') });
  });
});

// ── Desktop nav ───────────────────────────────────────────────────────────

test.describe('/how-routing-works: desktop nav link', () => {
  test('header nav has a "Routing" link', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('header').getByRole('link', { name: /^routing$/i });
    await expect(link).toBeVisible();
  });

  test('clicking "Routing" in desktop nav navigates to /how-routing-works', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: /^routing$/i }).click();
    await expect(page).toHaveURL(/\/how-routing-works/);
    await expect(page.locator('h1')).toContainText('How routing works');
  });

  test('footer has a "Routing" link to /how-routing-works', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a[href="/how-routing-works"]')).toBeVisible();
  });
});

// ── Mobile nav ────────────────────────────────────────────────────────────

test.describe('/how-routing-works: mobile nav', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('mobile nav includes Routing link when hamburger is opened', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-toggle');
    await expect(page.locator('#mobile-nav')).toHaveClass(/nav-mobile--open/);
    const routingLink = page.locator('.nav-mobile-link[href="/how-routing-works"]');
    await expect(routingLink).toBeVisible();
  });

  test('clicking Routing in mobile nav navigates to /how-routing-works', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-toggle');
    await page.locator('.nav-mobile-link[href="/how-routing-works"]').click();
    await expect(page).toHaveURL(/\/how-routing-works/);
    await expect(page.locator('h1')).toContainText('How routing works');
  });

  test('mobile nav screenshot showing Routing link', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-toggle');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'how-routing-works-mobile-nav.png') });
  });
});

// ── A11y ─────────────────────────────────────────────────────────────────

test.describe('/how-routing-works: accessibility', () => {
  test('skip link works: Tab → focuses skip-link → href is #main-content', async ({ page }) => {
    await page.goto('/how-routing-works');
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => ({
      classes: Array.from(document.activeElement.classList),
      href: document.activeElement.getAttribute('href'),
      text: document.activeElement.textContent?.trim(),
    }));
    expect(active.classes).toContain('skip-link');
    expect(active.href).toBe('#main-content');
    expect(active.text).toBe('Skip to main content');
  });

  test('page is keyboard-navigable: Tab reaches the provenance link', async ({ page }) => {
    await page.goto('/how-routing-works');
    // Tab through until we reach the provenance link or run out of tabs
    let found = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const href = await page.evaluate(() => document.activeElement.getAttribute('href'));
      if (href && href.includes('bbb1c136')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('loop arrows are marked aria-hidden="true" (decorative)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const arrows = page.locator('.loop-arrow[aria-hidden="true"]');
    const count = await arrows.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('compile arrow columns are aria-hidden (decorative transition indicator)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const arrowCols = page.locator('.compile-arrow-col[aria-hidden="true"]');
    const count = await arrowCols.count();
    expect(count).toBe(5);
  });

  test('causal arrows are aria-hidden (decorative flow indicators)', async ({ page }) => {
    await page.goto('/how-routing-works');
    const causalArrows = page.locator('.causal-arrow[aria-hidden="true"]');
    const count = await causalArrows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ToC navigation landmark has aria-label', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('nav[aria-label="On this page"]')).toBeVisible();
  });

  test('route cards section is labelled for screen readers', async ({ page }) => {
    await page.goto('/how-routing-works');
    // The cards section has aria-labelledby pointing to its heading
    await expect(page.locator('section[aria-labelledby="cards-heading"]')).toBeVisible();
  });

  test('reduced-motion: page renders without animation failures', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/how-routing-works');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.provenance-marker').first()).toBeVisible();
    await expect(page.locator('.route-cards')).toBeVisible();
    await expect(page.locator('#governance')).toBeVisible();
  });
});

// ── On-this-page ToC links ────────────────────────────────────────────────

test.describe('/how-routing-works: on-page navigation', () => {
  test('ToC has 4 links: routing-loop, raci-to-policy, route-cards, governance', async ({ page }) => {
    await page.goto('/how-routing-works');
    const tocLinks = page.locator('.toc-link');
    await expect(tocLinks).toHaveCount(4);
  });

  test('ToC link to #routing-loop is present', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('a.toc-link[href="#routing-loop"]')).toBeVisible();
  });

  test('ToC link to #raci-to-policy is present', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('a.toc-link[href="#raci-to-policy"]')).toBeVisible();
  });

  test('ToC link to #governance is present', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('a.toc-link[href="#governance"]')).toBeVisible();
  });

  test('"Go further" nav section links to /how-forge-runs-work', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('a[href="/how-forge-runs-work"].bottom-nav-card')).toBeVisible();
  });

  test('"Go further" nav section links to /add-a-feature', async ({ page }) => {
    await page.goto('/how-routing-works');
    await expect(page.locator('a[href="/add-a-feature"].bottom-nav-card')).toBeVisible();
  });
});
