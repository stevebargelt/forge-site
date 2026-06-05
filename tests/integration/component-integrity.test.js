/**
 * Component integrity tests — verify the extracted visual motif components
 * (GateGlyph, RedBadge, StageChip) have the correct CSS classes and that
 * ForgeRunDiagram.astro preserves its GSAP animation DOM hooks after the
 * refactor. Also verifies walkthrough pages use the extracted components
 * correctly and respect the four-step shape structure.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

// ── Extracted component files exist ──────────────────────────────────────

describe('extracted motif component files exist', () => {
  const components = [
    'src/components/GateGlyph.astro',
    'src/components/RedBadge.astro',
    'src/components/StageChip.astro',
  ];
  for (const c of components) {
    it(`${c} exists`, () => {
      assert.ok(existsSync(join(ROOT, c)), `missing component: ${c}`);
    });
  }
});

// ── GateGlyph.astro ──────────────────────────────────────────────────────

describe('GateGlyph.astro', () => {
  let src;
  it('is readable', () => { src = read('src/components/GateGlyph.astro'); });

  it('defines .gate-marker CSS class for card variant (GSAP animation target)', () => {
    assert.ok(/\.gate-marker/.test(src), 'GateGlyph.astro must define .gate-marker (queried by GSAP)');
  });

  it('defines .gate-glyph CSS class for inline variant', () => {
    assert.ok(/\.gate-glyph/.test(src), 'GateGlyph.astro must define .gate-glyph for inline variant');
  });

  it('card variant renders element with class gate-marker in markup', () => {
    assert.ok(
      /class="gate-marker"/.test(src) || /class=\{[^}]*gate-marker[^}]*\}/.test(src),
      'GateGlyph card variant must have class="gate-marker" so GSAP .gate-marker query finds it'
    );
  });

  it('inline variant renders element with class gate-glyph in markup', () => {
    assert.ok(
      /class="gate-glyph"/.test(src),
      'GateGlyph inline variant must have class="gate-glyph" in rendered markup'
    );
  });

  it('supports a variant prop', () => {
    assert.ok(/variant/.test(src), 'GateGlyph.astro must accept a variant prop');
  });

  it('diamond SVG path is present', () => {
    assert.ok(/<svg/.test(src), 'GateGlyph.astro must contain an SVG element');
    assert.ok(/<path/.test(src), 'GateGlyph.astro SVG must use a <path> element for the diamond');
  });
});

// ── RedBadge.astro ───────────────────────────────────────────────────────

describe('RedBadge.astro', () => {
  let src;
  it('is readable', () => { src = read('src/components/RedBadge.astro'); });

  it('defines .red-badge CSS class for card variant', () => {
    assert.ok(/\.red-badge[^-]/.test(src) || /\.red-badge{/.test(src) || /\.red-badge\s/.test(src),
      'RedBadge.astro must define .red-badge CSS class for card variant');
  });

  it('defines .red-badge-glyph CSS class for inline variant', () => {
    assert.ok(/\.red-badge-glyph/.test(src), 'RedBadge.astro must define .red-badge-glyph for inline variant');
  });

  it('card variant renders element with class red-badge', () => {
    assert.ok(/class="red-badge"/.test(src), 'RedBadge card variant must render class="red-badge"');
  });

  it('inline variant renders element with class red-badge-glyph', () => {
    assert.ok(/class="red-badge-glyph"/.test(src), 'RedBadge inline variant must render class="red-badge-glyph"');
  });

  it('uses a hexagon polygon SVG element', () => {
    assert.ok(/polygon/.test(src), 'RedBadge must use a <polygon> SVG element for the hexagon shape');
  });

  it('supports a variant prop', () => {
    assert.ok(/variant/.test(src), 'RedBadge.astro must accept a variant prop');
  });

  it('card variant has accessibility label', () => {
    assert.ok(/aria-label/.test(src), 'RedBadge.astro must have an aria-label for accessibility');
  });
});

// ── StageChip.astro ──────────────────────────────────────────────────────

describe('StageChip.astro', () => {
  let src;
  it('is readable', () => { src = read('src/components/StageChip.astro'); });

  it('defines .stage-chip CSS class', () => {
    assert.ok(/\.stage-chip/.test(src), 'StageChip.astro must define .stage-chip CSS class');
  });

  it('renders element with class stage-chip', () => {
    assert.ok(/class="stage-chip"/.test(src), 'StageChip.astro must render class="stage-chip" in markup');
  });

  it('renders the name prop as text content', () => {
    assert.ok(/\{name\}/.test(src), 'StageChip.astro must render {name} prop as text content');
  });

  it('declares a name prop in its Props interface', () => {
    assert.ok(/name\s*:/.test(src), 'StageChip.astro must declare a name: prop in its Props interface');
  });

  it('uses monospace font family from design tokens', () => {
    assert.ok(/--forge-font-family-mono/.test(src), 'StageChip should use --forge-font-family-mono token');
  });
});

// ── ForgeRunDiagram.astro: GSAP DOM hooks preserved ──────────────────────

describe('ForgeRunDiagram.astro: imports from extracted components', () => {
  let src;
  it('is readable', () => { src = read('src/components/ForgeRunDiagram.astro'); });

  it('imports GateGlyph from the extracted component file', () => {
    assert.ok(
      /import GateGlyph from/.test(src),
      'ForgeRunDiagram must import GateGlyph from extracted component, not inline it'
    );
  });

  it('imports RedBadge from the extracted component file', () => {
    assert.ok(
      /import RedBadge from/.test(src),
      'ForgeRunDiagram must import RedBadge from extracted component, not inline it'
    );
  });

  it('uses <GateGlyph /> in its template', () => {
    assert.ok(/<GateGlyph/.test(src), 'ForgeRunDiagram must use <GateGlyph> in its template');
  });

  it('uses <RedBadge /> in its template', () => {
    assert.ok(/<RedBadge/.test(src), 'ForgeRunDiagram must use <RedBadge> in its template');
  });
});

describe('ForgeRunDiagram.astro: GSAP animation DOM hooks preserved', () => {
  let src;
  it('is readable', () => { src = read('src/components/ForgeRunDiagram.astro'); });

  it('preserves .stage-node class on list items (GSAP query hook)', () => {
    assert.ok(
      /stage-node/.test(src),
      'ForgeRunDiagram must preserve .stage-node class — GSAP animation queries it'
    );
  });

  it('preserves data-stage attribute on stage nodes (GSAP query hook)', () => {
    assert.ok(
      /data-stage/.test(src),
      'ForgeRunDiagram must preserve data-stage attribute — GSAP animation reads it'
    );
  });

  it('preserves .track-seg class on timeline segments (GSAP query hook)', () => {
    assert.ok(
      /track-seg/.test(src),
      'ForgeRunDiagram must preserve .track-seg class — GSAP animation queries it'
    );
  });

  it('preserves data-animation-complete attribute on the figure element', () => {
    assert.ok(
      /data-animation-complete/.test(src),
      'ForgeRunDiagram must preserve data-animation-complete attribute on the figure'
    );
  });
});

// ── MarketingLayout: new pages in navigation ─────────────────────────────

describe('MarketingLayout.astro: navigation links for new walkthrough pages', () => {
  let src;
  it('is readable', () => { src = read('src/layouts/MarketingLayout.astro'); });

  it('links to /add-a-feature in site header nav', () => {
    assert.ok(/\/add-a-feature/.test(src), 'MarketingLayout must link to /add-a-feature in navigation');
  });

  it('links to /do-research in site header nav', () => {
    assert.ok(/\/do-research/.test(src), 'MarketingLayout must link to /do-research in navigation');
  });

  it('links to /kick-off-a-project in site header nav', () => {
    assert.ok(/\/kick-off-a-project/.test(src), 'MarketingLayout must link to /kick-off-a-project in navigation');
  });
});

// ── Walkthrough pages: component usage ───────────────────────────────────

const WALKTHROUGH_PAGES = [
  {
    path: 'src/pages/add-a-feature.astro',
    importsGateGlyph: true,
    importsRedBadge: true,
    importsStageChip: true,
    stageNames: ['architect', 'plan', 'build', 'verify'],
  },
  {
    path: 'src/pages/do-research.astro',
    importsGateGlyph: false,
    importsRedBadge: false,
    importsStageChip: true,
    stageNames: ['research'],
  },
  {
    path: 'src/pages/kick-off-a-project.astro',
    importsGateGlyph: true,
    importsRedBadge: true,
    importsStageChip: true,
    stageNames: ['scope', 'backlog', 'build'],
  },
];

for (const page of WALKTHROUGH_PAGES) {
  describe(`${page.path}: component imports and structure`, () => {
    let src;
    it('is readable', () => { src = read(page.path); });

    it('uses MarketingLayout', () => {
      assert.ok(/import MarketingLayout from/.test(src), `${page.path} must import MarketingLayout`);
    });

    it('applies --forge- design token CSS variables', () => {
      assert.ok(/--forge-/.test(src), `${page.path} must use --forge- design token CSS variables`);
    });

    it('has @media (prefers-reduced-motion: reduce) block', () => {
      assert.ok(
        /prefers-reduced-motion/.test(src),
        `${page.path} must include @media (prefers-reduced-motion: reduce) for animation safety`
      );
    });

    it('has four-step shape structure: "What you say"', () => {
      assert.ok(/What you say/i.test(src), `${page.path} must have "What you say" step`);
    });

    it('has four-step shape structure: "What the orchestrator does"', () => {
      assert.ok(
        /What the orchestrator does/i.test(src),
        `${page.path} must have "What the orchestrator does" step`
      );
    });

    it('has four-step shape structure: "What you see"', () => {
      assert.ok(/What you see/i.test(src), `${page.path} must have "What you see" step`);
    });

    it('has four-step shape structure: "What you get"', () => {
      assert.ok(/What you get/i.test(src), `${page.path} must have "What you get" step`);
    });

    it('has "Walkthrough" eyebrow text', () => {
      assert.ok(/Walkthrough/i.test(src), `${page.path} must have "Walkthrough" eyebrow label`);
    });

    if (page.importsGateGlyph) {
      it('imports GateGlyph', () => {
        assert.ok(/import GateGlyph from/.test(src), `${page.path} must import GateGlyph`);
      });
      it('uses <GateGlyph> component', () => {
        assert.ok(/<GateGlyph/.test(src), `${page.path} must use <GateGlyph> component`);
      });
    } else {
      it('does not use GateGlyph (no gates in this flow)', () => {
        assert.ok(
          !/<GateGlyph/.test(src),
          `${page.path} must not use <GateGlyph> — this flow has no gates`
        );
      });
    }

    if (page.importsRedBadge) {
      it('imports RedBadge', () => {
        assert.ok(/import RedBadge from/.test(src), `${page.path} must import RedBadge`);
      });
      it('uses <RedBadge> component', () => {
        assert.ok(/<RedBadge/.test(src), `${page.path} must use <RedBadge> component`);
      });
    } else {
      it('does not use RedBadge (no adversarial review in this flow)', () => {
        assert.ok(
          !/<RedBadge/.test(src),
          `${page.path} must not use <RedBadge> — this flow has no adversarial review`
        );
      });
    }

    if (page.importsStageChip) {
      it('imports StageChip', () => {
        assert.ok(/import StageChip from/.test(src), `${page.path} must import StageChip`);
      });
      it('uses <StageChip> component', () => {
        assert.ok(/<StageChip/.test(src), `${page.path} must use <StageChip> component`);
      });
      for (const name of page.stageNames) {
        it(`uses <StageChip name="${name}">`, () => {
          assert.ok(
            new RegExp(`StageChip[^>]*name="${name}"`).test(src) ||
            new RegExp(`name="${name}"[^>]*StageChip`).test(src) ||
            new RegExp(`<StageChip name="${name}"`).test(src),
            `${page.path} must use <StageChip name="${name}">`
          );
        });
      }
    }
  });
}

// ── No inline motif duplication: ForgeRunDiagram must not redefine gates ─

describe('ForgeRunDiagram.astro: no inline gate/badge markup duplication', () => {
  let src;
  it('is readable', () => { src = read('src/components/ForgeRunDiagram.astro'); });

  it('does not define a standalone gate-marker div inline (uses <GateGlyph> instead)', () => {
    const inlineGateMarker = /<div[^>]+class="gate-marker"/.test(src);
    const usesComponent = /<GateGlyph/.test(src);
    assert.ok(
      !inlineGateMarker || usesComponent,
      'ForgeRunDiagram should delegate gate markers to <GateGlyph> rather than defining them inline'
    );
  });
});
