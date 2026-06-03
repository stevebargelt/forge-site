import { readFileSync } from 'node:fs';

const TRACE_URL = new URL('../../fixtures/forge-run-trace.jsonl', import.meta.url);

const STAGE_DEFS = [
  { id: 'orchestrator', label: 'Orchestrator' },
  { id: 'architect',    label: 'Architect' },
  { id: 'plan',         label: 'Plan' },
  { id: 'build',        label: 'Build' },
  { id: 'verify',       label: 'Verify' },
];

// Child build tasks look like task-build-0-d758af, task-build-1-c20fa0, etc.
const BUILD_CHILD_RE = /^task-build-\d+-/;
// Sibling tasks within a wave dispatch together inside this window.
const CANONICAL_BATCH_WINDOW_MS = 120_000;

const PRIMARY_PREFIX = {
  architect: 'task-architect-',
  plan:      'task-plan-',
  verify:    'task-verify-',
};

const ms = (e) => new Date(e.ts).getTime();

// Build a canonical, public-safe pipeline model from a real Forge run trace.
//
// The trace this is grounded in recorded a real orchestration incident: the build
// stage failed a gate and re-ran across multiple waves. Depicting that raw span
// (first failed wave -> last retry) would misrepresent the happy path. So build
// timing is taken from the single CANONICAL successful wave only — the earliest
// build batch dispatched AFTER the retry — and the failed/rejected waves are
// excluded. The returned model carries only derived fields (no raw payload text,
// rationales, error strings, container names, or commit hashes).
export function getCanonicalModel() {
  const raw = readFileSync(TRACE_URL, 'utf8');
  const events = raw.trim().split('\n').map((line) => JSON.parse(line));

  const runCreated   = events.find((e) => e.eventType === 'run.created'   && !e.taskId);
  const runCompleted = events.find((e) => e.eventType === 'run.completed' && !e.taskId);
  const runStart = ms(runCreated);
  const runEnd   = ms(runCompleted);
  const runDurationMs = runEnd - runStart;
  const runTitle = runCreated.payload?.title ?? '';

  // Container work windows per task (excludes orchestrator/human gate-wait latency).
  const cStart = {};
  const cExit = {};
  for (const e of events) {
    if (!e.taskId) continue;
    if (e.eventType === 'container.started' && cStart[e.taskId] == null) cStart[e.taskId] = ms(e);
    if (e.eventType === 'container.exited') cExit[e.taskId] = ms(e);
  }

  // The build parent is the task that both failed and was retried.
  const failedIds  = new Set(events.filter((e) => e.eventType === 'task.failed').map((e) => e.taskId));
  const parentBuildId = events
    .filter((e) => e.eventType === 'task.retried')
    .map((e) => e.taskId)
    .find((id) => failedIds.has(id)) ?? null;
  const retriedTimes = events.filter((e) => e.eventType === 'task.retried').map(ms);
  const retriedTs = retriedTimes.length ? Math.min(...retriedTimes) : -Infinity;

  // Canonical wave: the build batch that actually succeeded into verify — i.e. the
  // LATEST post-retry wave (the run kept retrying until one passed; the final one
  // is the one it advanced on). This excludes the failed/rejected pre-retry waves
  // and any earlier intermediate retry batches.
  const postRetryBuildIds = Object.keys(cStart).filter(
    (id) => BUILD_CHILD_RE.test(id) && cStart[id] > retriedTs,
  );
  const latestStart = postRetryBuildIds.length ? Math.max(...postRetryBuildIds.map((id) => cStart[id])) : 0;
  const canonicalBuildWaveIds = postRetryBuildIds
    .filter((id) => latestStart - cStart[id] <= CANONICAL_BATCH_WINDOW_MS)
    .sort();

  const primaryTaskId = (stageId) => {
    if (stageId === 'build') return parentBuildId;
    const prefix = PRIMARY_PREFIX[stageId];
    return Object.keys(cStart).find((t) => t.startsWith(prefix));
  };

  // [start, end] container window for a stage. Build spans the canonical wave only.
  const stageWindow = (stageId) => {
    if (stageId === 'build') {
      const starts = canonicalBuildWaveIds.map((id) => cStart[id]);
      const exits  = canonicalBuildWaveIds.map((id) => cExit[id]);
      return [Math.min(...starts), Math.max(...exits)];
    }
    const id = primaryTaskId(stageId);
    return [cStart[id], cExit[id]];
  };

  const innerIds = ['architect', 'plan', 'build', 'verify'];
  const windows = Object.fromEntries(innerIds.map((id) => [id, stageWindow(id)]));
  const durations = Object.fromEntries(innerIds.map((id) => [id, windows[id][1] - windows[id][0]]));
  const sumInner = innerIds.reduce((a, id) => a + durations[id], 0);

  const gateTaskIds = new Set(events.filter((e) => e.eventType === 'gate.decided').map((e) => e.taskId));
  const awaitingRedIds = new Set(events.filter((e) => e.eventType === 'task.awaiting_red').map((e) => e.taskId));
  const redCountFor = (taskId) =>
    events.filter((e) => e.eventType === 'verdict.received' && e.taskId === taskId).length;

  const stages = STAGE_DEFS.map((def) => {
    if (def.id === 'orchestrator') {
      return {
        id: 'orchestrator',
        label: def.label,
        role: 'envelope',
        relativeStart: 0,
        relativeDuration: 1,
        relativeWeight: null,
        hasGate: false,
        hasReds: false,
        redCount: 0,
      };
    }
    const [start, end] = windows[def.id];
    const tid = primaryTaskId(def.id);
    return {
      id: def.id,
      label: def.label,
      role: 'inner',
      relativeStart: (start - runStart) / runDurationMs,
      relativeDuration: durations[def.id] / sumInner,
      relativeWeight: durations[def.id] / sumInner,
      hasGate: gateTaskIds.has(tid),
      hasReds: awaitingRedIds.has(tid),
      redCount: redCountFor(tid),
    };
  });

  return { runTitle, runDurationMs, canonicalBuildWaveIds, stages };
}
