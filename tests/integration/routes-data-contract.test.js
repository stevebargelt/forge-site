/**
 * Data-contract guard for src/data/routes.json — the central claim of the
 * /how-routing-works page.
 *
 * Extends routes-schema.test.js with:
 *   - exact provenance value checks (generatedFrom, fullSha against fixture)
 *   - raciSnippet content validation (key route fields present inside each snippet)
 *   - causal field value assertions (consulted, required_followups, informed entries)
 *   - cross-route source consistency
 *
 * Run: node --test tests/integration/routes-data-contract.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

const routes = readJson('src/data/routes.json');
const fixtureSha = readFileSync(join(ROOT, 'fixtures/forge-provenance-sha.txt'), 'utf8').trim();
const expectedShortSha = fixtureSha.slice(0, 7); // bbb1c13

// ── Exact provenance values ───────────────────────────────────────────────

describe('provenance exact values', () => {
  it(`provenance.generatedFrom is exactly 'forge@${expectedShortSha}'`, () => {
    assert.equal(
      routes.provenance.generatedFrom,
      `forge@${expectedShortSha}`,
      `provenance.generatedFrom must be 'forge@${expectedShortSha}', got '${routes.provenance.generatedFrom}'`,
    );
  });

  it('provenance.fullSha matches fixtures/forge-provenance-sha.txt exactly', () => {
    assert.equal(
      routes.provenance.fullSha,
      fixtureSha,
      `provenance.fullSha '${routes.provenance.fullSha}' does not match fixture '${fixtureSha}'`,
    );
  });

  it('provenance.fullSha is 40 hex characters', () => {
    assert.match(routes.provenance.fullSha, /^[a-f0-9]{40}$/, 'fullSha must be 40 lowercase hex chars');
  });

  it('top-level accountable is exactly "human"', () => {
    assert.equal(routes.accountable, 'human');
  });
});

// ── raciSnippet content validation ───────────────────────────────────────
// Each snippet must contain the key route fields from its source block,
// not just start with the correct header.

describe('raciSnippet content: strategy', () => {
  const route = routes.routes.find((r) => r.key === 'strategy');

  it('snippet is a non-empty string', () => {
    assert.ok(typeof route?.raciSnippet === 'string' && route.raciSnippet.length > 0);
  });

  it('snippet contains "path: in_session"', () => {
    assert.ok(
      route.raciSnippet.includes('path: in_session'),
      `strategy snippet must contain 'path: in_session'`,
    );
  });

  it('snippet contains "responsible: orchestrator"', () => {
    assert.ok(
      route.raciSnippet.includes('responsible: orchestrator'),
      `strategy snippet must contain 'responsible: orchestrator'`,
    );
  });

  it('snippet contains "accountable: human"', () => {
    assert.ok(route.raciSnippet.includes('accountable: human'));
  });
});

describe('raciSnippet content: implementation_quick', () => {
  const route = routes.routes.find((r) => r.key === 'implementation_quick');

  it('snippet contains "required_followups: test-engineer" (the causal teaching claim)', () => {
    assert.ok(
      route.raciSnippet.includes('required_followups: test-engineer'),
      `implementation_quick snippet must contain 'required_followups: test-engineer' — this is the central causal claim shown on the page`,
    );
  });

  it('snippet contains "path: invoke_chain"', () => {
    assert.ok(route.raciSnippet.includes('path: invoke_chain'));
  });

  it('snippet contains "responsible: engineer"', () => {
    assert.ok(route.raciSnippet.includes('responsible: engineer'));
  });

  it('snippet contains "consulted: affected_code, existing_tests"', () => {
    assert.ok(
      route.raciSnippet.includes('consulted: affected_code'),
      `implementation_quick snippet must mention consulted sources`,
    );
  });
});

describe('raciSnippet content: implementation_full', () => {
  const route = routes.routes.find((r) => r.key === 'implementation_full');

  it('snippet contains "path: workflow"', () => {
    assert.ok(route.raciSnippet.includes('path: workflow'));
  });

  it('snippet contains "responsible: feature"', () => {
    assert.ok(route.raciSnippet.includes('responsible: feature'));
  });
});

describe('raciSnippet content: review_security', () => {
  const route = routes.routes.find((r) => r.key === 'review_security');

  it('snippet contains "responsible: red-security"', () => {
    assert.ok(
      route.raciSnippet.includes('responsible: red-security'),
      `review_security snippet must contain 'responsible: red-security'`,
    );
  });

  it('snippet contains "path: invoke"', () => {
    assert.ok(route.raciSnippet.includes('path: invoke'));
  });
});

describe('raciSnippet content: documentation_durable', () => {
  const route = routes.routes.find((r) => r.key === 'documentation_durable');

  it('snippet contains "responsible: documentation-maintainer"', () => {
    assert.ok(
      route.raciSnippet.includes('responsible: documentation-maintainer'),
      `documentation_durable snippet must contain 'responsible: documentation-maintainer'`,
    );
  });

  it('snippet contains conditional informed entry (docs_impact:when=operator_behavior_changed)', () => {
    assert.ok(
      route.raciSnippet.includes('docs_impact:when=operator_behavior_changed'),
      `documentation_durable snippet must contain conditional informed entry`,
    );
  });
});

// ── Causal field value assertions ─────────────────────────────────────────
// Verify that consulted/required_followups/informed are NOT flattened to strings —
// they must be proper arrays with the correct values.

describe('causal fields: implementation_quick', () => {
  const route = routes.routes.find((r) => r.key === 'implementation_quick');

  it('required_followups is exactly ["test-engineer"]', () => {
    assert.deepEqual(
      route.required_followups,
      ['test-engineer'],
      `implementation_quick required_followups must be ['test-engineer'], got ${JSON.stringify(route.required_followups)}`,
    );
  });

  it('consulted is a non-empty array (affected sources read before work starts)', () => {
    assert.ok(Array.isArray(route.consulted) && route.consulted.length > 0,
      `implementation_quick consulted must be a non-empty array`);
  });

  it('consulted contains "affected_code"', () => {
    assert.ok(route.consulted.includes('affected_code'), 'consulted must include affected_code');
  });

  it('consulted contains "existing_tests"', () => {
    assert.ok(route.consulted.includes('existing_tests'), 'consulted must include existing_tests');
  });

  it('informed has an entry with when="ticketed" (backlog conditional)', () => {
    const entry = route.informed.find((i) => i.when === 'ticketed');
    assert.ok(entry, `implementation_quick informed must have an entry with when='ticketed'`);
  });

  it('informed has an entry with when="operator_behavior_changed" (docs_impact conditional)', () => {
    const entry = route.informed.find((i) => i.when === 'operator_behavior_changed');
    assert.ok(entry, `implementation_quick informed must have docs_impact conditional entry`);
  });

  it('informed entries are objects with name fields (not flattened strings)', () => {
    for (const entry of route.informed) {
      assert.equal(typeof entry, 'object', 'each informed entry must be an object, not a string');
      assert.ok(entry.name, 'each informed entry must have a name field');
    }
  });
});

describe('causal fields: strategy', () => {
  const route = routes.routes.find((r) => r.key === 'strategy');

  it('consulted is an empty array (strategy works in-session)', () => {
    assert.deepEqual(route.consulted, [], 'strategy consulted must be []');
  });

  it('required_followups is an empty array', () => {
    assert.deepEqual(route.required_followups, [], 'strategy required_followups must be []');
  });

  it('informed has user_summary entry', () => {
    const entry = route.informed.find((i) => i.name === 'user_summary');
    assert.ok(entry, `strategy informed must include user_summary`);
  });
});

describe('causal fields: documentation_durable', () => {
  const route = routes.routes.find((r) => r.key === 'documentation_durable');

  it('informed has conditional entry with when="operator_behavior_changed"', () => {
    const conditional = route.informed.find((i) => i.when === 'operator_behavior_changed');
    assert.ok(conditional, `documentation_durable informed must have when=operator_behavior_changed entry`);
    assert.equal(conditional.name, 'docs_impact');
  });
});

// ── Source consistency ────────────────────────────────────────────────────

describe('source field: all curated routes are from "host"', () => {
  const CURATED_KEYS = [
    'strategy',
    'implementation_quick',
    'implementation_full',
    'review_security',
    'documentation_durable',
  ];

  for (const key of CURATED_KEYS) {
    it(`route '${key}' has source: 'host'`, () => {
      const route = routes.routes.find((r) => r.key === key);
      assert.ok(route, `route '${key}' not found`);
      assert.equal(route.source, 'host', `route '${key}' source must be 'host'`);
    });
  }
});

// ── Path spread: each curated route teaches a distinct dispatch mechanism ─

describe('path spread: five routes cover distinct dispatch mechanisms', () => {
  it('strategy teaches in_session (no container dispatched)', () => {
    assert.equal(routes.routes.find((r) => r.key === 'strategy')?.path, 'in_session');
  });

  it('implementation_quick teaches invoke_chain (engineer → test-engineer)', () => {
    assert.equal(routes.routes.find((r) => r.key === 'implementation_quick')?.path, 'invoke_chain');
  });

  it('implementation_full teaches workflow (multi-step pipeline)', () => {
    assert.equal(routes.routes.find((r) => r.key === 'implementation_full')?.path, 'workflow');
  });

  it('review_security teaches invoke (single agent dispatch)', () => {
    assert.equal(routes.routes.find((r) => r.key === 'review_security')?.path, 'invoke');
  });

  it('documentation_durable teaches invoke with conditional informed', () => {
    assert.equal(routes.routes.find((r) => r.key === 'documentation_durable')?.path, 'invoke');
  });

  it('all five paths are distinct values (no teaching duplication except invoke)', () => {
    const paths = routes.routes.map((r) => r.path);
    const invokeCount = paths.filter((p) => p === 'invoke').length;
    // review_security and documentation_durable both use invoke — that's intentional (parallel vs conditional)
    assert.equal(invokeCount, 2, 'exactly 2 routes should use "invoke" path');
    // The remaining 3 should each use a distinct path
    const nonInvoke = paths.filter((p) => p !== 'invoke');
    const uniqueNonInvoke = new Set(nonInvoke);
    assert.equal(uniqueNonInvoke.size, 3, 'the 3 non-invoke routes must each use a distinct path');
  });
});
