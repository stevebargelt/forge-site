---
id: FW-3
type: story
status: active
title: "Drift guard: schema-validate the run-trace transform"
---

src/lib/forge-run-transform.js hard-codes forge's event vocabulary (run.created, task.started, container.started, gate.decided, task.awaiting_red, verdict.received, task.failed, task.retried, run.completed) and taskId conventions (task-architect-, task-build-N-). If forge renames an event or changes task-ID naming, the committed fixture + transform silently misrender.

Make the transform validate the fixture against the event shape it expects and FAIL the build loudly on mismatch (missing expected event types, no parent-build task found, empty canonical wave, etc.) instead of producing a wrong model. Turns silent forge drift into a red CI build. Directly hardens the animated run-trace diagram (FW-2).

Scope note: this is ADJACENT visual-drift hardening for the existing diagram — NOT on the FW-16/FW-17 docs-pipeline critical path. Keep active and valuable, but it does not block the CLI-reference slice. Loosely associated with the FW-9 drift-guard family; sequence independently.