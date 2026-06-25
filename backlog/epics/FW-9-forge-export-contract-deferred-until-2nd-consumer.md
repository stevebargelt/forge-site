---
id: FW-9
type: epic
status: active
title: forge → forge-site documentation automation pipeline (epic)
---

EPIC — forge → forge-site documentation automation pipeline.

forge-site hosts forge's docs, kept current by an automated forge→forge-site sync. Was DEFERRED ("until 2nd consumer"); un-deferred — /how-routing-works and the campaigns concept doc are now consumers, and the CLI reference is the first generated slice. Strategy + architecture ratified; see docs/prds/forge-website-platform.md.

Design (ratified):
- Two layers: Layer 1 generation runs forge-SIDE in forge CI; Layer 2 delivery = CI-bot + PR (peter-evans/create-pull-request).
- Export contract split by content type: structured JSON for GENERATED (CLI ref, workflow ref) with schema_version; MDX passthrough for SYNCED prose (allowlist, not glob).
- Buckets + markers: GENERATED/_generatedFrom (commit URL), SYNCED/_syncedFrom (blob URL), AUTHORED/no marker.
- Auto-merge: content-only auto on green CI; structural (file add/remove, IA/config, schema bump, rename) needs human review; classified by file-count delta.
- Drift layer: deterministic gen + git diff --exit-code in forge CI; lychee link-check in forge-site CI; provenance frontmatter.

Children:
- FW-16 — JSON export contract (schema v1) — BLOCKS the first slice.
- FW-17 — CLI-reference generator (first slice; depends on FW-16).
- FW-3 — drift guard: schema-validate the run-trace transform.
- FW-4 — drift guard: link check + provenance marker.
- FW-18 — authored-page source-brief convention (author-path process control).
- (later, file when their turn comes) workflow-reference generator (slice 2); concept-doc sync (slice 3, allowlist starts empty).

Sequencing: FW-16 → FW-17 → workflow ref → concept sync. Drift guards (FW-3/FW-4) land alongside the first generated slice.