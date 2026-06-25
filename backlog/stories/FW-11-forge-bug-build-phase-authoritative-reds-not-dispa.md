---
id: FW-11
type: story
status: active
title: "forge bug: build-phase authoritative reds not dispatched (verdict gate stalls)"
---

On run-walkthrough-pages-with-diagram-pull-through-73c794, the build phase (gate: verdict, 5 authoritative reds per feature.yml) completed its fan-out children but NEVER dispatched the reds — zero red-build task rows, and 'forge next' reported 'nothing ready to dispatch' with the build parent stuck at awaiting_gate. The verdict gate cannot auto-resolve because there are no verdicts. Same empty-input/dispatch gap seen at the architect phase (architect reds returned 'inconclusive' on empty {} inputs), but there it was advisory (specialist authority); at build it's authoritative and silently skips the adversarial review the phase exists for. WORKAROUND used this run: orchestrator manually invoked red-wide/red-narrow/red-frontend via 'forge invoke --read-only --run <id>' against the working-tree diff, then drove the gate by hand. IMPACT: any feature run could silently advance past build with no red audit if the orchestrator force-advances without noticing. Repro: feature workflow, build phase with fanout. Investigate the build reds-on-parent dispatch path (feature.yml notes 'per-parent dispatch, not per-child' / #139).