/**
 * Projection determinism guard — re-running forge-route-transform.js over the
 * committed fixtures must reproduce src/data/routes.json exactly.
 *
 * If this test fails, the committed src/data/routes.json has drifted from its
 * source fixtures. Fix by re-running: node src/lib/forge-route-transform.js
 *
 * Run: node --test tests/integration/routes-projection.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

let committed;
let projection;

before(async () => {
  committed = JSON.parse(readFileSync(join(ROOT, 'src/data/routes.json'), 'utf8'));
  const { getRoutesProjection } = await import('../../src/lib/forge-route-transform.js');
  projection = getRoutesProjection();
});

// ── Top-level determinism ─────────────────────────────────────────────────

describe('projection determinism: provenance', () => {
  it('generatedFrom matches committed', () => {
    assert.equal(
      projection.provenance.generatedFrom,
      committed.provenance.generatedFrom,
      `transform produced generatedFrom='${projection.provenance.generatedFrom}', committed has '${committed.provenance.generatedFrom}'`,
    );
  });

  it('fullSha matches committed', () => {
    assert.equal(
      projection.provenance.fullSha,
      committed.provenance.fullSha,
      `SHA mismatch: transform='${projection.provenance.fullSha}', committed='${committed.provenance.fullSha}'`,
    );
  });

  it('capturedAt matches committed (hardcoded in transform)', () => {
    assert.equal(projection.provenance.capturedAt, committed.provenance.capturedAt);
  });

  it('accountable matches committed', () => {
    assert.equal(projection.accountable, committed.accountable);
  });
});

describe('projection determinism: route count and order', () => {
  it('produces the same number of routes', () => {
    assert.equal(
      projection.routes.length,
      committed.routes.length,
      `transform produced ${projection.routes.length} routes, committed has ${committed.routes.length}`,
    );
  });

  it('route keys are in the same order', () => {
    const projKeys = projection.routes.map((r) => r.key);
    const committedKeys = committed.routes.map((r) => r.key);
    assert.deepEqual(projKeys, committedKeys, `route key order mismatch`);
  });
});

describe('projection determinism: per-route field equality', () => {
  const CURATED_KEYS = [
    'strategy',
    'implementation_quick',
    'implementation_full',
    'review_security',
    'documentation_durable',
  ];

  for (const key of CURATED_KEYS) {
    it(`route '${key}' is deeply equal to committed`, () => {
      const proj = projection.routes.find((r) => r.key === key);
      const comm = committed.routes.find((r) => r.key === key);

      assert.ok(proj, `projection missing route '${key}'`);
      assert.ok(comm, `committed routes.json missing route '${key}'`);

      assert.deepEqual(
        proj,
        comm,
        `route '${key}' has drifted — re-run node src/lib/forge-route-transform.js to regenerate`,
      );
    });
  }
});

describe('projection determinism: raciSnippets reproduced verbatim', () => {
  it('all raciSnippets in projection match committed exactly', () => {
    for (let i = 0; i < Math.min(projection.routes.length, committed.routes.length); i++) {
      const projRoute = projection.routes[i];
      const commRoute = committed.routes[i];
      assert.equal(
        projRoute.raciSnippet,
        commRoute.raciSnippet,
        `raciSnippet for route '${commRoute.key}' does not match committed — fixture drift?`,
      );
    }
  });
});

describe('projection determinism: full deep equal', () => {
  it('entire projection output is deeply equal to committed routes.json', () => {
    assert.deepEqual(
      projection,
      committed,
      'forge-route-transform.js output does not match committed src/data/routes.json — re-run the transform to regenerate',
    );
  });
});
