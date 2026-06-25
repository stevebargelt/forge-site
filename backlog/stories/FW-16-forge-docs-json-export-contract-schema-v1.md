---
id: FW-16
type: story
status: active
title: forge-docs JSON export contract — schema v1
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). BLOCKS the generator slices. forge-site owns the contract SPEC + build validation; the EMITTER that produces conforming JSON is forge-side (see the forge-side work list).

Define and version the structured-JSON export contract (the producer/consumer boundary). forge emits SEMANTIC data only; forge-site renders + validates.

Producer artifacts (with provenance envelope: schema_version, forge commit sha, generated-at):
- CLI command-tree JSON (src/data/generated/cli.schema-v1.json)
- Workflow manifest + workflow JSON Schema (src/data/generated/workflows.schema-v1.json)

schema_version rules: start at 1; new fields = backward-compatible; removed/renamed = breaking (requires forge-site renderer update before merge).

CLI schema v1 must define, per command: stable id/slug (rename-detectable); name/path; summary/description; aliases; arguments; options (type, default, required, variadic, repeatable); inherited/global options; examples; hidden/deprecated flags; ordering rules; provenance envelope.

forge-site deliverable here: enforce the contract in the forge-site build — FAIL if schema_version is absent/unrecognized or any required field is missing from a non-hidden command node; validation runs before rendering. (The forge-side emitter implementing this contract is tracked in the forge repo.)

See docs/prds/forge-website-platform.md (Definitions, Export contract, Roadmap -> FW-16).