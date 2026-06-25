---
id: FW-13
type: story
status: done
title: "feat: /how-routing-works explainer — first docs-pipeline consumer"
---

**Closed:** 2026-06-05.

Public Astro page on forge-site explaining how forge's human-authored RACI compiles to an executable routing policy, rendering ~5 curated route cards from REAL forge data (forge route governance --json), not hand-drawn.

Scope (this slice):
- Architecture consult resolves the export-contract boundary (generator location, routes.json shape, provenance marker).
- Generator: forge route governance --json -> src/data/routes.json with _generatedFrom: forge@<sha>.
- Page: RACI-source -> compiled-route compile visual + per-prompt routing-loop strip + curated route cards + governance invariants (accountable:human always; overrides can't weaken force rules). Reuses GateGlyph/RedBadge/StageChip motifs; nav link added.
- Tests: integration (data contract) + e2e (page render); manual-qa pass (new public page).

This is the FIRST real consumer of the export contract (#9) — gives #9 the 'second consumer' it was deferred for. Ties to drift guards #4 (link-check + 'verified against forge commit' marker) and #3 (schema-validate the transform). Self-demonstrating: forge-site showing forge's own governance, kept current by forge's own pipeline.

Decisions back this: research/forge-docs-pipeline-2026-06-05.md; docs-strategy reversal (site HOSTS forge docs via automated sync).