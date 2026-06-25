---
id: FW-15
type: story
status: active
title: "docs: reconcile provisional campaigns concept doc as Campaign Runner ships"
created: 2026-06-25
---

src/content/docs/concepts/campaign-runner.mdx is PROVISIONAL — drafted 2026-06-25 from forge's campaign-runner-plan.md at forge@d8a8aa3, describing the full intended design while only Phase 0 (Backlog Integrity Prerequisites) has shipped. Reconcile the doc to real shipped behavior as Phases 1-5 (FG-390..FG-396) land; flip the shipped-vs-planned table and the 'under active development' Aside accordingly, and bump _generatedFrom.

Process note for any forge-sourced doc work: this doc had to be written/corrected from the orchestrator's brief because 'forge invoke' mounts the project dir (forge-site), NOT /Users/stevebargelt/code/forge, so the documentation-maintainer container could not read campaign-runner-plan.md or the forge source. Two accuracy defects resulted (pilot mode + Phase 0 label) and were caught/corrected on host verification. The forge->forge-site docs pipeline (the #9 area) needs to solve ground-truth access so the maintainer reads source directly instead of relying on a hand-distilled brief.