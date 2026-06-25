---
id: FW-16
type: story
status: active
title: forge-docs JSON export contract — schema v1
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). BLOCKS the first generator slice.

Define and version the structured-JSON export contract forge emits for GENERATED docs content:
- Semantic command tree (CLI reference) shape.
- Workflow manifest + the workflow JSON Schema.
- Top-level schema_version field (start at 1). New fields = backward-compatible; removed/renamed = breaking, requires forge-site renderer update before merge. forge-site build fails if schema_version absent/unrecognized.
- The _generatedFrom metadata envelope (commit URL the renderer stamps into page frontmatter).
Boundary: forge emits semantic data only — never Starlight frontmatter, MDX imports, or Astro IA. Owner: forge-side. See docs/prds/forge-website-platform.md (Export contract).