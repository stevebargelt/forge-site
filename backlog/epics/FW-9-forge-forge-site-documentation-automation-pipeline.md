---
id: FW-9
type: epic
status: active
title: forge → forge-site documentation automation pipeline (epic)
---

EPIC — forge -> forge-site documentation automation pipeline.

forge-site hosts forge docs, kept current by an automated forge->forge-site sync. Strategy + architecture ratified; see docs/prds/forge-website-platform.md.

Design (ratified, per current PRD):
- Two layers: Layer 1 = SEMANTIC EMISSION (forge-side: emits JSON/schema only, never renders); Layer 2 = RENDERING + DELIVERY (forge-site renders JSON->MDX; CI-bot + PR via peter-evans/create-pull-request).
- Export contract split by content type: structured JSON for GENERATED (CLI ref, workflow ref) with schema_version; MDX passthrough (with sanitization) for SYNCED prose (allowlist, not glob).
- Buckets + markers: GENERATED/_generatedFrom (commit URL), SYNCED/_syncedFrom (blob URL), AUTHORED/no marker.
- Auto-merge: content-only auto on green CI; structural (file add/remove, IA/config, schema_version bump, URL/slug-set delta incl. rename) needs human review. Classified by path + URL/slug-set delta + frontmatter keys + schema_version + add/remove — NOT file count. Labels CI-computed, never trusted from the PR.
- Drift layer: deterministic emit + git diff --exit-code on JSON in forge CI AND on rendered MDX in forge-site CI; lychee link-check in forge-site CI; provenance frontmatter.

forge-site children:
- FW-16 — export contract spec (schema v1) + forge-site build validation. BLOCKS the slices.
- FW-17 — CLI reference renderer (JSON->MDX).
- FW-19 — cross-repo delivery + auto-merge classifier (forge-site CI).
- FW-20 — stale-gen determinism check on rendered MDX (forge-site CI).
- FW-21 — workflow reference renderer (jsonschema2md). [slice 2]
- FW-22 — synced concept-docs: sanitization contract + allowlist + Starlight integration. [slice 3]
- FW-3 — drift guard: schema-validate the run-trace transform.
- FW-4 — drift guard: lychee link-check + provenance marker.
- FW-18 — authored-page source-brief convention.

forge-side work (emitters, producer contract impl, forge CI steps, sanitizer) is tracked in the FORGE repo — enumerated in a handoff list for the forge orchestrator to ingest/validate.

Sequencing: FW-16 (+ forge emitter) -> [FW-17 + FW-19 + FW-20] CLI slice end-to-end -> FW-21 workflow ref (slice 2) -> FW-22 concept sync (slice 3). FW-3/FW-4 land alongside the first slice.