import { test, expect } from '@playwright/test';

const STAGE_LABELS = ['Orchestrator', 'Architect', 'Plan', 'Build', 'Verify'];

test('scroll-scrubbed path: pipeline fills as the section is scrolled through', async ({ page }) => {
  await page.goto('/how-forge-runs-work');
  // Before scrolling in, the scrubbed reveal has not completed.
  await page.locator('#forge-run-diagram').scrollIntoViewIfNeeded();
  // Scroll fully past the section so the scrubbed timeline reaches progress 1.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator('figure[data-animation-complete="true"]').waitFor({ timeout: 12000 });
  for (const label of STAGE_LABELS) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test('reduced-motion path: static fallback shown, animation skipped', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/how-forge-runs-work');
  await page.locator('figure[data-reduced-motion="true"]').waitFor({ timeout: 5000 });
  await expect(page.locator('figure[data-animation-complete]')).not.toHaveAttribute(
    'data-animation-complete',
    'true',
  );
  for (const label of STAGE_LABELS) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test('accessibility structure: semantic markup and ARIA', async ({ page }) => {
  await page.goto('/how-forge-runs-work');
  await expect(
    page.locator('figure[aria-label]').filter({ hasText: 'pipeline' }),
  ).toHaveCount(1);
  await expect(page.getByRole('list').first()).toBeVisible();
  for (const label of STAGE_LABELS) {
    const el = page.getByText(label, { exact: true }).first();
    await expect(el).toBeVisible();
    await expect(el).not.toHaveAttribute('aria-hidden', 'true');
  }
});
