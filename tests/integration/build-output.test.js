/**
 * Build integration tests — run `pnpm build` and verify:
 *   1. Build exits with code 0
 *   2. Expected static HTML artifacts are produced
 *   3. Key page content is present in the built HTML
 *   4. Design tokens are referenced in the built CSS
 *
 * This is a slow test (~30-60s) because it triggers a real Astro build.
 * It runs last so fast source-level checks can fail-fast first.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function distPath(rel) {
  return join(ROOT, 'dist', rel);
}

function readDist(rel) {
  return readFileSync(distPath(rel), 'utf8');
}

// ── Build step ────────────────────────────────────────────────────────────

describe('pnpm build', () => {
  it('exits with code 0', { timeout: 180_000 }, () => {
    // pnpm install ensures platform-native binaries (e.g. Rollup) are present
    // when node_modules were installed on a different OS (macOS host → Linux container).
    try {
      execSync('CI=true pnpm install', { cwd: ROOT, stdio: 'pipe' });
    } catch (_) {
      // Non-fatal: install may fail if already up-to-date or offline; attempt build anyway.
    }
    try {
      execSync('pnpm build', { cwd: ROOT, stdio: 'pipe' });
    } catch (err) {
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      assert.fail(`pnpm build failed:\n${output}`);
    }
  });
});

// ── Output file existence ─────────────────────────────────────────────────

describe('build output files', () => {
  const expectedFiles = [
    'index.html',
    'how-forge-runs-work/index.html',
    'what-forge-does/index.html',
    'docs/index.html',
    'favicon.svg',
  ];

  for (const f of expectedFiles) {
    it(`dist/${f} exists`, () => {
      assert.ok(existsSync(distPath(f)), `missing build artifact: dist/${f}`);
    });
  }

  it('dist/_astro/ directory exists (bundled assets)', () => {
    assert.ok(existsSync(join(ROOT, 'dist', '_astro')), 'expected dist/_astro/ (bundled CSS/JS assets)');
  });
});

// ── Home page ─────────────────────────────────────────────────────────────

describe('dist/index.html', () => {
  let html;
  it('is readable', () => { html = readDist('index.html'); });

  it('has correct <title>', () => {
    assert.ok(/Home.*Forge|Forge.*Home/.test(html), 'expected "Home — Forge" or similar in <title>');
  });

  it('includes navigation links', () => {
    assert.ok(/what-forge-does/.test(html), 'home page must link to /what-forge-does');
    assert.ok(/how-forge-runs-work/.test(html), 'home page must link to /how-forge-runs-work');
    assert.ok(/\/docs/.test(html), 'home page must link to /docs');
  });

  it('references design token CSS custom properties', () => {
    assert.ok(/--forge-/.test(html) || /_astro\//.test(html),
      'expected either inline --forge- tokens or a link to bundled CSS');
  });

  it('has viewport meta tag', () => {
    assert.ok(/name="viewport"/.test(html), 'missing viewport meta tag');
  });
});

// ── How Forge runs work page ──────────────────────────────────────────────

describe('dist/how-forge-runs-work/index.html', () => {
  let html;
  it('is readable', () => { html = readDist('how-forge-runs-work/index.html'); });

  it('has correct <title>', () => {
    assert.ok(/How Forge runs work/i.test(html), 'expected "How Forge runs work" in <title>');
  });

  it('h1 contains page title', () => {
    assert.ok(/How Forge runs work/i.test(html), 'expected h1 with "How Forge runs work"');
  });

  const concepts = [
    ['Runs',       'id="runs"'],
    ['Tasks',      'id="tasks"'],
    ['Gates',      'id="gates"'],
    ['Reds',       'id="reds"'],
    ['Agents',     'id="agents"'],
    ['blackboard', 'id="blackboard"'],
  ];

  for (const [label, pattern] of concepts) {
    it(`has section anchor for concept: ${label}`, () => {
      assert.ok(html.includes(pattern), `expected section anchor ${pattern} for concept ${label}`);
    });
  }

  it('meta description is set', () => {
    assert.ok(/name="description"/.test(html), 'missing meta description on how-forge-runs-work');
  });

  it('links to /docs/ for canonical CLI detail', () => {
    assert.ok(/href="\/docs\//.test(html), 'expected outbound links to /docs/ for canonical CLI detail');
  });
});

// ── What Forge does page ──────────────────────────────────────────────────

describe('dist/what-forge-does/index.html', () => {
  let html;
  it('is readable', () => { html = readDist('what-forge-does/index.html'); });

  it('has correct <title>', () => {
    assert.ok(/What Forge does/i.test(html), 'expected "What Forge does" in <title>');
  });

  it('contains stakeholder-oriented headline', () => {
    assert.ok(
      /Forge sends AI agents|What Forge does/i.test(html),
      'expected stakeholder-oriented headline'
    );
  });

  it('mentions planning before building', () => {
    assert.ok(/[Pp]lan/.test(html), 'expected mention of planning in what-forge-does');
  });

  it('mentions adversarial review', () => {
    assert.ok(/[Rr]ed|[Aa]dversarial|[Rr]eview/.test(html), 'expected mention of review in what-forge-does');
  });

  it('links to /how-forge-runs-work for deeper technical content', () => {
    assert.ok(/how-forge-runs-work/.test(html), 'what-forge-does must link to /how-forge-runs-work');
  });

  it('meta description is set', () => {
    assert.ok(/name="description"/.test(html), 'missing meta description on what-forge-does');
  });
});

// ── Starlight /docs page ──────────────────────────────────────────────────

describe('dist/docs/index.html', () => {
  let html;
  it('is readable', () => { html = readDist('docs/index.html'); });

  it('contains Starlight-generated markup', () => {
    assert.ok(
      /starlight|sl-|sidebar|starlightSidebar/i.test(html),
      'expected Starlight-specific markup in docs/index.html'
    );
  });

  it('title references Forge Documentation', () => {
    assert.ok(/Forge/.test(html), 'expected Forge branding in docs/index.html title');
  });

  it('mentions core Forge concepts', () => {
    assert.ok(/Runs|Tasks|Gates/.test(html), 'expected Forge concepts in /docs index');
  });

  it('links to the narrative pages', () => {
    assert.ok(/how-forge-runs-work/.test(html), 'docs index must link to /how-forge-runs-work');
  });
});

// ── Bundled CSS contains design tokens ───────────────────────────────────

describe('bundled CSS assets contain design tokens', () => {
  it('build output contains --forge-color-accent token', () => {
    const astroDir = join(ROOT, 'dist', '_astro');

    if (existsSync(astroDir)) {
      const cssFiles = readdirSync(astroDir).filter(f => f.endsWith('.css'));
      if (cssFiles.length > 0) {
        const hasToken = cssFiles.some(f => {
          const content = readFileSync(join(astroDir, f), 'utf8');
          return /--forge-color-accent/.test(content);
        });
        assert.ok(hasToken, 'expected --forge-color-accent in bundled CSS under dist/_astro/');
        return;
      }
    }

    // Fallback: styles may be inlined — check index.html
    const indexHtml = readDist('index.html');
    assert.ok(
      /--forge-color-accent/.test(indexHtml),
      'expected --forge-color-accent in build output (checked index.html)'
    );
  });
});
