---
id: FW-3
type: story
status: active
title: "Drift guard: schema-validate the run-trace transform"
---

src/lib/forge-run-transform.js hard-codes forge's event vocabulary (run.created, task.started, container.started, gate.decided, task.awaiting_red, verdict.received, task.failed, task.retried, run.completed) and taskId conventions (task-architect-, task-build-N-). If forge renames an event or changes task-ID naming, the committed fixture + transform silently misrender.

Make the transform validate the fixture against the event shape it expects and FAIL the build loudly on mismatch (missing expected event types, no parent-build task found, empty canonical wave, etc.) instead of producing a wrong model. Turns silent forge drift into a red CI build. Cheap, high-value, directly hardens the diagram we shipped (#2). Priority: high among follow-ups.

**Parent:** FW-9 (forge-docs automation pipeline epic) — the drift-guard layer.