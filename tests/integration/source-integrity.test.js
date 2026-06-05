/**
 * Source-level integrity tests — verify the design tokens, config files,
 * and page source files are correctly structured before any build runs.
 * These tests read source files only; no build required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function readSource(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

// ── Design tokens ─────────────────────────────────────────────────────────

describe('design tokens (src/styles/tokens.css)', () => {
  let tokens;
  it('tokens.css exists', () => {
    const p = join(ROOT, 'src/styles/tokens.css');
    assert.ok(existsSync(p), 'tokens.css not found');
    tokens = readFileSync(p, 'utf8');
  });

  it('accent color seeded from the Forge magenta hsl(329…)', () => {
    assert.ok(
      /--forge-color-accent\s*:\s*hsl\(\s*329/.test(tokens),
      'expected --forge-color-accent: hsl(329, ...) in tokens.css'
    );
  });

  it('accent palette has at least 3 derived variants', () => {
    const accentVars = (tokens.match(/--forge-color-accent[\w-]*/g) || []);
    const unique = [...new Set(accentVars)];
    assert.ok(unique.length >= 3, `expected ≥3 accent vars, found: ${unique.join(', ')}`);
  });

  it('typography font-family variables are defined', () => {
    assert.ok(/--forge-font-family-body/.test(tokens), 'missing --forge-font-family-body');
    assert.ok(/--forge-font-family-display/.test(tokens), 'missing --forge-font-family-display');
    assert.ok(/--forge-font-family-mono/.test(tokens), 'missing --forge-font-family-mono');
  });

  it('typography size scale is defined', () => {
    assert.ok(/--forge-font-size-base/.test(tokens), 'missing --forge-font-size-base');
    assert.ok(/--forge-font-size-xs/.test(tokens), 'missing --forge-font-size-xs');
    assert.ok(/--forge-font-size-5xl/.test(tokens), 'missing --forge-font-size-5xl');
  });

  it('spacing scale is defined', () => {
    assert.ok(/--forge-space-4/.test(tokens), 'missing --forge-space-4');
    assert.ok(/--forge-space-16/.test(tokens), 'missing --forge-space-16');
  });

  it('surface and border color tokens are defined', () => {
    assert.ok(/--forge-color-surface\b/.test(tokens), 'missing --forge-color-surface');
    assert.ok(/--forge-color-border/.test(tokens), 'missing --forge-color-border');
  });

  it('has dark mode overrides', () => {
    assert.ok(
      /prefers-color-scheme:\s*dark/.test(tokens),
      'expected dark mode media query in tokens.css'
    );
  });

  it('has diagram style documentation comment', () => {
    assert.ok(
      /[Dd]iagram style/.test(tokens),
      'expected diagram style documentation comment in tokens.css'
    );
  });
});

// ── Vercel configuration ──────────────────────────────────────────────────

describe('vercel.json', () => {
  let cfg;
  it('vercel.json exists', () => {
    const p = join(ROOT, 'vercel.json');
    assert.ok(existsSync(p), 'vercel.json not found');
    cfg = JSON.parse(readFileSync(p, 'utf8'));
  });

  it('outputDirectory is dist', () => {
    assert.equal(cfg.outputDirectory, 'dist');
  });

  it('buildCommand is set', () => {
    assert.ok(cfg.buildCommand && cfg.buildCommand.length > 0, 'buildCommand must be non-empty');
  });
});

// ── Astro config ──────────────────────────────────────────────────────────

describe('astro.config.mjs', () => {
  let src;
  it('astro.config.mjs exists', () => {
    const p = join(ROOT, 'astro.config.mjs');
    assert.ok(existsSync(p), 'astro.config.mjs not found');
    src = readFileSync(p, 'utf8');
  });

  it('uses static output', () => {
    assert.ok(/output\s*:\s*['"]static['"]/.test(src), 'expected output: "static" in astro.config.mjs');
  });

  it('integrates Starlight', () => {
    assert.ok(/@astrojs\/starlight/.test(src), 'expected @astrojs/starlight import in astro.config.mjs');
  });

  it('Starlight sidebar includes /docs route', () => {
    assert.ok(/\/docs/.test(src), 'expected /docs route reference in astro.config.mjs');
  });
});

// ── global.css imports tokens ──────────────────────────────────────────────

describe('src/styles/global.css', () => {
  it('imports tokens.css', () => {
    const src = readSource('src/styles/global.css');
    assert.ok(
      /@import.*tokens/.test(src),
      'global.css must @import tokens.css'
    );
  });
});

// ── Source page files ─────────────────────────────────────────────────────

describe('source page files exist', () => {
  const pages = [
    'src/pages/index.astro',
    'src/pages/how-forge-runs-work.astro',
    'src/pages/what-forge-does.astro',
    'src/content/docs/index.mdx',
    'src/pages/add-a-feature.astro',
    'src/pages/do-research.astro',
    'src/pages/kick-off-a-project.astro',
  ];

  for (const p of pages) {
    it(`${p} exists`, () => {
      assert.ok(existsSync(join(ROOT, p)), `missing source page: ${p}`);
    });
  }
});

describe('how-forge-runs-work.astro content', () => {
  let src;
  it('page source is readable', () => {
    src = readSource('src/pages/how-forge-runs-work.astro');
  });

  const requiredConcepts = ['runs', 'tasks', 'gates', 'reds', 'agents', 'blackboard'];
  for (const concept of requiredConcepts) {
    it(`references concept: ${concept}`, () => {
      assert.ok(
        new RegExp(concept, 'i').test(src),
        `how-forge-runs-work.astro must reference concept: ${concept}`
      );
    });
  }

  it('has h1 heading text', () => {
    assert.ok(/How Forge runs work/i.test(src), 'expected h1 "How Forge runs work"');
  });

  it('uses MarketingLayout', () => {
    assert.ok(/MarketingLayout/.test(src), 'page must use MarketingLayout');
  });

  it('applies design token CSS variables', () => {
    assert.ok(/--forge-/.test(src), 'page must use --forge- design token variables');
  });
});

describe('what-forge-does.astro content', () => {
  let src;
  it('page source is readable', () => {
    src = readSource('src/pages/what-forge-does.astro');
  });

  it('has h1 heading text', () => {
    assert.ok(/[Ww]hat [Ff]orge does|Forge sends AI agents/.test(src), 'expected main headline text');
  });

  it('uses MarketingLayout', () => {
    assert.ok(/MarketingLayout/.test(src), 'page must use MarketingLayout');
  });

  it('applies design token CSS variables', () => {
    assert.ok(/--forge-/.test(src), 'page must use --forge- design token variables');
  });
});

describe('docs/index.mdx content', () => {
  let src;
  it('index.mdx is readable', () => {
    src = readSource('src/content/docs/index.mdx');
  });

  it('has a title in frontmatter', () => {
    assert.ok(/^title:/m.test(src), 'docs/index.mdx must have a title in frontmatter');
  });

  it('references key Forge concepts in the table', () => {
    const concepts = ['Runs', 'Tasks', 'Gates', 'Reds', 'Agents'];
    for (const c of concepts) {
      assert.ok(new RegExp(c).test(src), `docs/index.mdx must reference concept: ${c}`);
    }
  });
});

// ── Walkthrough page integrity ─────────────────────────────────────────────

describe('walkthrough pages: no internal model or CLI leakage', () => {
  const walkthroughPages = [
    'src/pages/add-a-feature.astro',
    'src/pages/do-research.astro',
    'src/pages/kick-off-a-project.astro',
  ];

  for (const page of walkthroughPages) {
    it(`${page}: no getCanonicalModel or forge-run-transform references`, () => {
      const src = readSource(page);
      assert.ok(
        !/getCanonicalModel|forge-run-transform/.test(src),
        `${page} must not reference internal identifiers getCanonicalModel or forge-run-transform`
      );
    });

    it(`${page}: no bare inline CLI command in a <code> element outside DOCS-linked context`, () => {
      const src = readSource(page);
      // A bare CLI invocation is a forge subcommand + agent/argument inside a <code> element,
      // not wrapped in an anchor href. e.g. <code>forge invoke some-agent</code> is a violation.
      assert.ok(
        !/<code[^>]*>forge\s+(invoke|new|watch|gate|backlog|status|next)\s+\S+<\/code>/.test(src),
        `${page} must not have bare forge CLI commands in <code> elements — link via DOCS const instead`
      );
    });
  }
});
