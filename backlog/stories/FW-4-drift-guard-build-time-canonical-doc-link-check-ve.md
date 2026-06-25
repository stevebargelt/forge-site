---
id: FW-4
type: story
status: active
title: "Drift guard: build-time canonical-doc link check + 'verified against forge commit' marker"
---

forge-site links out to canonical forge docs (centralized URL const). These drift if forge docs move/rename.

(1) Add a build-time check that all outbound forge-doc URLs resolve; fail or warn loudly at build, not in production. (2) Add a "verified against forge commit <sha>" marker on data-derived pages (the diagram page) so staleness is visible/auditable. From the PRD drift-controls section. Realized concretely as: _generatedFrom/_syncedFrom provenance frontmatter + lychee dead-link check in forge-site CI.

**Parent:** FW-9 (forge-docs automation pipeline epic) — the drift-guard layer.