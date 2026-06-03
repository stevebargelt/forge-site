/**
 * Unit tests for the forge-run-trace → canonical model transform.
 * Verifies: stage ordering, gate/red presence, retry-collapse timing,
 * payload sanitization. Zero dependencies — node:test only.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let model;

// Load once — dynamic import handles ESM modules with file-relative paths
before(async () => {
  const { getCanonicalModel } = await import('../../src/lib/forge-run-transform.js');
  model = getCanonicalModel();
});

// ── 1. Stage count and ordering ───────────────────────────────────────────

describe('stage identity and ordering', () => {
  it('returns exactly 5 stages', () => {
    assert.equal(model.stages.length, 5, `expected 5 stages, got ${model.stages.length}`);
  });

  it('stage IDs are exactly [orchestrator, architect, plan, build, verify] in order', () => {
    const ids = model.stages.map((s) => s.id);
    assert.deepEqual(ids, ['orchestrator', 'architect', 'plan', 'build', 'verify']);
  });
});

// ── 2. Gate presence on every stage except orchestrator ───────────────────

describe('gate presence', () => {
  const gatedStages = ['architect', 'plan', 'build', 'verify'];

  for (const stageId of gatedStages) {
    it(`${stageId} has hasGate:true`, () => {
      const stage = model.stages.find((s) => s.id === stageId);
      assert.ok(stage, `stage '${stageId}' not found`);
      assert.equal(stage.hasGate, true, `expected hasGate:true on ${stageId}`);
    });
  }

  it('orchestrator has hasGate:false (no gate event for meta-stage)', () => {
    const stage = model.stages.find((s) => s.id === 'orchestrator');
    assert.ok(stage, 'orchestrator stage not found');
    assert.equal(stage.hasGate, false, 'orchestrator must not have a gate');
  });
});

// ── 3. Canonical build wave selection (excludes failed/retried waves) ─────

describe('canonical build wave', () => {
  it('selects a non-empty canonical wave', () => {
    assert.ok(Array.isArray(model.canonicalBuildWaveIds));
    assert.ok(model.canonicalBuildWaveIds.length >= 1, 'expected at least one canonical build task');
  });

  it('excludes the parent build task and the failed/rejected pre-retry waves', async () => {
    const { readFileSync } = await import('node:fs');
    const url = new URL('../../fixtures/forge-run-trace.jsonl', import.meta.url);
    const events = readFileSync(url, 'utf8').trim().split('\n').map((l) => JSON.parse(l));

    const failedIds = events.filter((e) => e.eventType === 'task.failed').map((e) => e.taskId);
    const retriedTs = Math.min(...events.filter((e) => e.eventType === 'task.retried').map((e) => new Date(e.ts).getTime()));
    const startedBeforeRetry = new Set(
      events
        .filter((e) => e.eventType === 'container.started' && new Date(e.ts).getTime() <= retriedTs)
        .map((e) => e.taskId)
    );

    for (const id of model.canonicalBuildWaveIds) {
      assert.ok(!failedIds.includes(id), `canonical wave must not include the failed task ${id}`);
      assert.ok(!startedBeforeRetry.has(id), `canonical wave must exclude the pre-retry wave task ${id}`);
    }
  });
});

// ── 4. Build is the largest inner stage by honest single-wave timing ──────
//   (FIX 3: inequality only — no hardcoded percentage; build must NOT be the
//   inflated all-retries span.)

describe('inner-stage weights', () => {
  const inner = (id) => model.stages.find((s) => s.id === id);

  it('build is the largest inner stage', () => {
    const b = inner('build').relativeWeight;
    for (const id of ['architect', 'plan', 'verify']) {
      assert.ok(b > inner(id).relativeWeight, `build weight (${b}) must exceed ${id} (${inner(id).relativeWeight})`);
    }
  });

  it('build is NOT the inflated all-retries span (weight well under 0.80)', () => {
    assert.ok(
      inner('build').relativeWeight < 0.80,
      `build weight ${inner('build').relativeWeight} looks like the all-retries span; expected the canonical single wave`
    );
  });

  it('inner-stage weights sum to 1.0', () => {
    const sum = model.stages
      .filter((s) => s.role === 'inner')
      .reduce((a, s) => a + s.relativeWeight, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `inner weights should sum to 1.0, got ${sum}`);
  });
});

// ── 5. Red presence: only architect ──────────────────────────────────────

describe('red presence', () => {
  it('only architect has hasReds:true', () => {
    const redsStages = model.stages.filter((s) => s.hasReds === true);
    assert.equal(
      redsStages.length,
      1,
      `expected exactly 1 stage with hasReds:true, found: ${redsStages.map((s) => s.id).join(', ')}`
    );
    assert.equal(redsStages[0].id, 'architect', 'only architect should have hasReds:true');
  });

  it('architect has redCount:2', () => {
    const architect = model.stages.find((s) => s.id === 'architect');
    assert.ok(architect, 'architect stage not found');
    assert.equal(architect.redCount, 2, `expected redCount:2 on architect, got ${architect.redCount}`);
  });

  it('verify has hasReds:false', () => {
    const verify = model.stages.find((s) => s.id === 'verify');
    assert.ok(verify, 'verify stage not found');
    assert.equal(verify.hasReds, false, 'verify must not have reds');
  });
});

// ── 6. Payload sanitization ───────────────────────────────────────────────

describe('payload sanitization', () => {
  let serialized;

  before(() => {
    serialized = JSON.stringify(model);
  });

  const forbidden = ['rationale', '/workspace', 'fb97c69', 'containerName', 'workspace-vs'];

  for (const token of forbidden) {
    it(`output does not contain "${token}"`, () => {
      assert.ok(
        !serialized.includes(token),
        `model JSON must not contain "${token}" — found in serialized output`
      );
    });
  }
});
