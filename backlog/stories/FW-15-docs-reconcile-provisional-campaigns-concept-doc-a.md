---
id: FW-15
type: story
status: active
title: "docs: reconcile provisional campaigns concept doc as Campaign Runner ships"
created: 2026-06-25
---

src/content/docs/concepts/campaign-runner.mdx is PROVISIONAL — drafted 2026-06-25 from forge's campaign-runner-plan.md at forge@d8a8aa3, describing the full intended design while only Phase 0 (Backlog Integrity Prerequisites) has shipped. It is an AUTHORED page (no provenance marker); it carries a source-citation MDX comment, not _generatedFrom.

Reconcile the doc to real shipped behavior as Phases 1-5 (FG-390..FG-396) land: flip the shipped-vs-planned table and the "under active development" Aside, and UPDATE THE SOURCE-CITATION COMMENT / source brief (the forge sha + date) — do NOT add a _generatedFrom marker (that key is reserved for pipeline-GENERATED pages; this page is authored).

Process note for forge-sourced authored docs: this doc had to be written/corrected from the orchestrator's brief because forge invoke mounts the project dir (forge-site), NOT the forge repo, so the maintainer could not read campaign-runner-plan.md directly. Two accuracy defects resulted (pilot mode + Phase 0 label), caught on host verification. The authored-page brief convention (FW-18) is the process control for this; the pipeline (FW-9) sidesteps it for generated/synced content.