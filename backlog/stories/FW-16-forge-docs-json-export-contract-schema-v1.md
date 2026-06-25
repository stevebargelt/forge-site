---
id: FW-16
type: story
status: active
title: forge-docs JSON export contract — schema v1
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). BLOCKS the first generator slice (FW-17).

Define and version the structured-JSON export contract forge emits for GENERATED docs content. forge emits SEMANTIC data only — never Starlight frontmatter, MDX, or Astro IA. forge-site owns rendering (JSON → MDX).

Producer artifacts (with a provenance envelope: schema_version, forge commit sha, generated-at):
- CLI command-tree JSON (e.g. src/data/generated/cli.schema-v1.json)
- Workflow manifest + workflow JSON Schema (e.g. src/data/generated/workflows.schema-v1.json)

schema_version rules: start at 1; new fields = backward-compatible; removed/renamed = breaking, requires a forge-site renderer update before merge; forge-site build FAILS if schema_version is absent/unrecognized.

Acceptance criteria — CLI schema v1 must define, per command:
- stable command id/slug (rename-detectable)
- command name / path
- summary / description
- aliases
- arguments
- options: type, default, required, variadic, repeatable
- inherited / global options
- examples
- hidden / deprecated flags
- ordering rules (deterministic output)
- provenance envelope (schema_version, commit sha, generated-at)
- schema validation enforced in the forge-site build

See docs/prds/forge-website-platform.md (Definitions, Export contract, Roadmap → FW-16).