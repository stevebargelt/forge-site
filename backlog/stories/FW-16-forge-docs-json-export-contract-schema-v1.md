---
id: FW-16
type: story
status: active
title: forge-docs JSON export contract — schema v1
created: 2026-06-25
---

Parent: FW-9. BLOCKS the slices. forge-site owns the contract SPEC + build validation; the EMITTER that produces conforming JSON is forge-side (see research/forge-side-pipeline-work.md).

Define and version the structured-JSON export contract (producer/consumer boundary). forge emits SEMANTIC data only; forge-site renders + validates.

Producer artifacts (provenance envelope: schema_version, forge_sha, generated_at):
- CLI command-tree JSON (src/data/generated/cli.schema-v1.json)
- Workflow manifest + workflow JSON Schema (src/data/generated/workflows.schema-v1.json)

CLI schema v1 fields, per command: stable id/slug (rename-detectable); name/path; summary; description; aliases; arguments (name/description/required/variadic); options (name/aliases/description/type/default/required/variadic/repeatable); inherited/global options; examples ({description, command}); hidden (bool); deprecated (bool|message); ordering rules.

schema_version rules: start at 1; new fields backward-compatible; removed/renamed = breaking (forge-site renderer update before merge).

Deliverables (machine-readable, not just prose):
- A JSON Schema file FOR cli.schema-v1.json (the meta-schema the emitter output must validate against), committed to forge-site.
- The initial workflow-manifest schema SHAPE (even though FW-21 renders it later) so the contract is settled up front.
- A sample fixture (a representative cli.schema-v1.json) for renderer dev + tests.
- A validation script/test + npm command that validates a given artifact against the JSON Schema; wired so the forge-site build FAILS if schema_version is absent/unrecognized or any required field is missing from a non-hidden command node (validation runs before rendering).

See docs/prds/forge-website-platform.md (Definitions, Export contract, Roadmap -> FW-16).