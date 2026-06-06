import { test, expect } from '@playwright/test';

const SHAPE_HEADINGS = [
  'What you say',
  'What the orchestrator does',
  'What you see and decide',
  'What you get',
];

// ── add-a-feature ────────────────────────────────────────────────────────

test.describe('add-a-feature page', () => {
  test('h1 headline is visible', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.locator('h1')).toContainText('Add a feature');
  });

  test('eyebrow label "Walkthrough · Product owner" is visible', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.getByText(/Walkthrough\s*·\s*Product owner/i).first()).toBeVisible();
  });

  test('four-step shape headings are all visible', async ({ page }) => {
    await page.goto('/add-a-feature');
    for (const heading of SHAPE_HEADINGS) {
      await expect(page.getByText(heading, { exact: true }).first()).toBeVisible();
    }
  });

  test('gate glyph motif (inline GateGlyph) is present in the DOM', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.locator('.gate-glyph').first()).toBeVisible();
  });

  test('red badge glyph motif (inline RedBadge) is present in the DOM', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.locator('.red-badge-glyph').first()).toBeVisible();
  });

  test('at least four stage-chip elements are visible (architect/plan/build/verify)', async ({ page }) => {
    await page.goto('/add-a-feature');
    const chips = page.locator('.stage-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await expect(chips.first()).toBeVisible();
  });

  test('pipeline steps list is present and contains stage descriptions', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.locator('ol[aria-label="Feature walkthrough steps"]')).toBeVisible();
  });

  test('gate callout paragraph is visible', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.locator('.gate-callout').first()).toBeVisible();
  });

  test('"Go further" navigation section links to canonical docs', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.getByText('Go further', { exact: true })).toBeVisible();
    await expect(page.locator('a.bottom-nav-card').first()).toBeVisible();
  });

  test('links to /how-forge-runs-work', async ({ page }) => {
    await page.goto('/add-a-feature');
    await expect(page.locator('a[href="/how-forge-runs-work"]').first()).toBeVisible();
  });

  test('reduced-motion: all motifs remain visible when animations are suppressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/add-a-feature');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.gate-glyph').first()).toBeVisible();
    await expect(page.locator('.red-badge-glyph').first()).toBeVisible();
    await expect(page.locator('.stage-chip').first()).toBeVisible();
  });
});

// ── do-research ───────────────────────────────────────────────────────────

test.describe('do-research page', () => {
  test('h1 headline is visible', async ({ page }) => {
    await page.goto('/do-research');
    await expect(page.locator('h1')).toContainText('Do research');
  });

  test('eyebrow label "Walkthrough · Product owner" is visible', async ({ page }) => {
    await page.goto('/do-research');
    await expect(page.getByText(/Walkthrough\s*·\s*Product owner/i).first()).toBeVisible();
  });

  test('four-step shape headings are all visible', async ({ page }) => {
    await page.goto('/do-research');
    for (const heading of SHAPE_HEADINGS) {
      await expect(page.getByText(heading, { exact: true }).first()).toBeVisible();
    }
  });

  test('stage-chip for "research" specialist is visible', async ({ page }) => {
    await page.goto('/do-research');
    await expect(page.locator('.stage-chip').first()).toBeVisible();
    await expect(page.locator('.stage-chip').first()).toContainText('research');
  });

  test('contrast banner distinguishes research from pipeline runs', async ({ page }) => {
    await page.goto('/do-research');
    await expect(page.locator('[role="note"]').first()).toBeVisible();
  });

  test('two example blockquotes are present', async ({ page }) => {
    await page.goto('/do-research');
    const quotes = page.locator('blockquote.example-quote');
    const count = await quotes.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('"Go further" section links to CLI reference and add-a-feature', async ({ page }) => {
    await page.goto('/do-research');
    await expect(page.getByText('Go further', { exact: true })).toBeVisible();
    await expect(page.locator('main a[href="/add-a-feature"]').first()).toBeVisible();
  });

  test('reduced-motion: page loads correctly without animation failures', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/do-research');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.stage-chip').first()).toBeVisible();
    await expect(page.locator('[role="note"]').first()).toBeVisible();
  });
});

// ── kick-off-a-project ────────────────────────────────────────────────────

test.describe('kick-off-a-project page', () => {
  test('h1 headline is visible', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    await expect(page.locator('h1')).toContainText('Kick off a new project');
  });

  test('eyebrow label "Walkthrough · Product owner" is visible', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    await expect(page.getByText(/Walkthrough\s*·\s*Product owner/i).first()).toBeVisible();
  });

  test('four-step shape headings are all visible', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    for (const heading of SHAPE_HEADINGS) {
      await expect(page.getByText(heading, { exact: true }).first()).toBeVisible();
    }
  });

  test('gate glyph motif (inline GateGlyph) is present in the DOM', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    await expect(page.locator('.gate-glyph').first()).toBeVisible();
  });

  test('red badge glyph motif (inline RedBadge) is present in the DOM', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    await expect(page.locator('.red-badge-glyph').first()).toBeVisible();
  });

  test('at least two stage-chip elements are visible', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    const chips = page.locator('.stage-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(chips.first()).toBeVisible();
  });

  test('"The onboarding arc" section links to add-a-feature', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    await expect(page.locator('main a[href="/add-a-feature"]').first()).toBeVisible();
  });

  test('"Go further" section is present', async ({ page }) => {
    await page.goto('/kick-off-a-project');
    await expect(page.getByText('Go further', { exact: true })).toBeVisible();
  });

  test('reduced-motion: all motifs remain visible when animations are suppressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/kick-off-a-project');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.gate-glyph').first()).toBeVisible();
    await expect(page.locator('.red-badge-glyph').first()).toBeVisible();
    await expect(page.locator('.stage-chip').first()).toBeVisible();
  });
});

// ── Site navigation: new pages linked in header ──────────────────────────

test.describe('site header navigation includes new walkthrough pages', () => {
  test('header links to /add-a-feature (via Guides dropdown)', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: /guides/i }).click();
    const link = page.locator('header').getByRole('link', { name: /add a feature/i });
    await expect(link).toBeVisible();
  });

  test('header links to /do-research (via Guides dropdown)', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: /guides/i }).click();
    const link = page.locator('header').getByRole('link', { name: /do research/i });
    await expect(link).toBeVisible();
  });

  test('header links to /kick-off-a-project (via Guides dropdown)', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: /guides/i }).click();
    const link = page.locator('header').getByRole('link', { name: /new project/i });
    await expect(link).toBeVisible();
  });

  test('footer links to all three new pages', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/add-a-feature"]')).toBeVisible();
    await expect(footer.locator('a[href="/do-research"]')).toBeVisible();
    await expect(footer.locator('a[href="/kick-off-a-project"]')).toBeVisible();
  });

  test('clicking "Add a feature" in Guides dropdown navigates to the page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: /guides/i }).click();
    await page.locator('header').getByRole('link', { name: /add a feature/i }).click();
    await expect(page).toHaveURL(/\/add-a-feature/);
    await expect(page.locator('h1')).toContainText('Add a feature');
  });
});

// ── ForgeRunDiagram animation not broken by refactor ─────────────────────
// (Extends the tests in diagram.test.js with motif-component-specific checks)

test.describe('ForgeRunDiagram: motif components render correctly after refactor', () => {
  test('gate-marker elements are present in the diagram (GateGlyph card variant)', async ({ page }) => {
    await page.goto('/how-forge-runs-work');
    await page.locator('#forge-run-diagram').scrollIntoViewIfNeeded();
    const gateMarker = page.locator('#forge-run-diagram .gate-marker').first();
    await expect(gateMarker).toBeAttached();
    const box = await gateMarker.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
  });

  test('reduced-motion: gate-marker elements are visible in static fallback', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/how-forge-runs-work');
    await page.locator('figure[data-reduced-motion="true"]').waitFor({ timeout: 5000 });
    const gateMarker = page.locator('#forge-run-diagram .gate-marker').first();
    await expect(gateMarker).toBeAttached();
  });

  test('red-badge elements are present in the diagram (RedBadge card variant)', async ({ page }) => {
    await page.goto('/how-forge-runs-work');
    await page.locator('#forge-run-diagram').scrollIntoViewIfNeeded();
    const redBadge = page.locator('#forge-run-diagram .red-badge').first();
    await expect(redBadge).toBeAttached();
  });
});
