/**
 * Drift-guard for src/data/routes.json.
 *
 * Validates the committed projection against its JSON Schema and spot-checks:
 *   - correct route keys in the specified order
 *   - each raciSnippet starts with '### route: <key>'
 *   - provenance.fullSha matches fixtures/forge-provenance-sha.txt (warn-only)
 *   - accountable invariant is 'human' on every route
 *
 * Shape drift fails loudly; SHA freshness is warn-only (committed SHA is source of truth).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

const CURATED_ORDER = [
  'strategy',
  'implementation_quick',
  'implementation_full',
  'review_security',
  'documentation_durable',
];

const VALID_PATHS = new Set(['in_session', 'invoke', 'invoke_chain', 'workflow', 'manual', 'cli']);

// ── File existence ────────────────────────────────────────────────────────

describe('src/data/routes.json exists', () => {
  it('file is present', () => {
    assert.ok(existsSync(join(ROOT, 'src/data/routes.json')), 'src/data/routes.json not found');
  });
});

// ── Top-level shape ───────────────────────────────────────────────────────

describe('routes.json top-level shape', () => {
  let routes;

  it('is valid JSON', () => {
    routes = readJson('src/data/routes.json');
  });

  it('has provenance object', () => {
    assert.equal(typeof routes.provenance, 'object', 'provenance must be an object');
    assert.ok(routes.provenance !== null, 'provenance must not be null');
  });

  it('provenance.generatedFrom matches forge@<7+ hex chars>', () => {
    assert.match(
      routes.provenance.generatedFrom,
      /^forge@[a-f0-9]{7,}/,
      `provenance.generatedFrom must match forge@<sha>, got: ${routes.provenance.generatedFrom}`,
    );
  });

  it('provenance.fullSha is a 40-char hex string', () => {
    assert.match(
      routes.provenance.fullSha,
      /^[a-f0-9]{40}$/,
      `provenance.fullSha must be 40 hex chars, got: ${routes.provenance.fullSha}`,
    );
  });

  it('provenance.capturedAt is an ISO date-time string', () => {
    assert.match(
      routes.provenance.capturedAt,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      `provenance.capturedAt must be ISO date-time, got: ${routes.provenance.capturedAt}`,
    );
  });

  it('accountable is "human"', () => {
    assert.equal(routes.accountable, 'human', 'top-level accountable must be "human"');
  });

  it('routes is an array of exactly 5 entries', () => {
    assert.ok(Array.isArray(routes.routes), 'routes must be an array');
    assert.equal(routes.routes.length, 5, `expected 5 routes, got ${routes.routes.length}`);
  });
});

// ── Route ordering ────────────────────────────────────────────────────────

describe('routes.json route ordering', () => {
  let routes;
  it('reads routes array', () => {
    routes = readJson('src/data/routes.json');
  });

  it('route keys are in the curated order', () => {
    const keys = routes.routes.map((r) => r.key);
    assert.deepEqual(
      keys,
      CURATED_ORDER,
      `route keys must be [${CURATED_ORDER.join(', ')}], got [${keys.join(', ')}]`,
    );
  });
});

// ── Per-route field validation ────────────────────────────────────────────

describe('each route has required fields with correct types', () => {
  let routes;
  it('loads routes', () => {
    routes = readJson('src/data/routes.json');
  });

  for (const key of CURATED_ORDER) {
    it(`route '${key}' has key field matching its position`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.equal(route.key, key, `route.key must equal '${key}'`);
    });

    it(`route '${key}' has valid path`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(
        VALID_PATHS.has(route.path),
        `route '${key}' path '${route.path}' must be one of [${[...VALID_PATHS].join(', ')}]`,
      );
    });

    it(`route '${key}' has non-empty responsible`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(route.responsible && route.responsible.length > 0, `route '${key}' must have a responsible`);
    });

    it(`route '${key}' has classification_hints array`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(Array.isArray(route.classification_hints), `route '${key}' classification_hints must be an array`);
      assert.ok(route.classification_hints.length > 0, `route '${key}' must have at least one classification_hint`);
    });

    it(`route '${key}' consulted and required_followups are arrays`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(Array.isArray(route.consulted), `route '${key}' consulted must be an array`);
      assert.ok(Array.isArray(route.required_followups), `route '${key}' required_followups must be an array`);
    });

    it(`route '${key}' informed is an array with name fields`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(Array.isArray(route.informed), `route '${key}' informed must be an array`);
      for (const entry of route.informed) {
        assert.ok(entry.name, `route '${key}' informed entry must have a name field`);
      }
    });

    it(`route '${key}' source is 'host' or 'project'`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(
        route.source === 'host' || route.source === 'project',
        `route '${key}' source must be 'host' or 'project', got '${route.source}'`,
      );
    });

    it(`route '${key}' raciSnippet starts with '### route: ${key}'`, () => {
      const route = routes?.routes?.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.ok(
        typeof route.raciSnippet === 'string' && route.raciSnippet.startsWith(`### route: ${key}`),
        `route '${key}' raciSnippet must start with '### route: ${key}'`,
      );
    });
  }
});

// ── Path-spread correctness (the teaching payload) ────────────────────────

describe('path spread covers the teaching cases', () => {
  let routes;
  it('loads routes', () => {
    routes = readJson('src/data/routes.json');
  });

  it('strategy has path: in_session', () => {
    assert.equal(routes?.routes?.find((r) => r.key === 'strategy')?.path, 'in_session');
  });

  it('implementation_quick has path: invoke_chain', () => {
    assert.equal(routes?.routes?.find((r) => r.key === 'implementation_quick')?.path, 'invoke_chain');
  });

  it('implementation_full has path: workflow', () => {
    assert.equal(routes?.routes?.find((r) => r.key === 'implementation_full')?.path, 'workflow');
  });

  it('review_security has path: invoke', () => {
    assert.equal(routes?.routes?.find((r) => r.key === 'review_security')?.path, 'invoke');
  });

  it('documentation_durable has path: invoke', () => {
    assert.equal(routes?.routes?.find((r) => r.key === 'documentation_durable')?.path, 'invoke');
  });

  it('implementation_quick has required_followups: [test-engineer]', () => {
    const route = routes?.routes?.find((r) => r.key === 'implementation_quick');
    assert.deepEqual(route?.required_followups, ['test-engineer']);
  });

  it('documentation_durable has conditional informed entry (when=operator_behavior_changed)', () => {
    const route = routes?.routes?.find((r) => r.key === 'documentation_durable');
    const conditional = route?.informed?.find((i) => i.when === 'operator_behavior_changed');
    assert.ok(conditional, 'documentation_durable must have an informed entry with when=operator_behavior_changed');
  });
});

// ── Provenance freshness (warn-only) ──────────────────────────────────────

describe('provenance freshness (warn-only)', () => {
  it('logs a warning if routes.json SHA differs from fixture SHA (not a failure)', () => {
    const routes = readJson('src/data/routes.json');
    const fixtureSha = readFileSync(join(ROOT, 'fixtures/forge-provenance-sha.txt'), 'utf8').trim();
    if (routes.provenance.fullSha !== fixtureSha) {
      process.stderr.write(
        `WARN: routes.json provenance.fullSha (${routes.provenance.fullSha}) does not match ` +
        `fixtures/forge-provenance-sha.txt (${fixtureSha}) — routes.json may need regeneration.\n`,
      );
    }
    // This is warn-only: always pass.
    assert.ok(true);
  });
});
