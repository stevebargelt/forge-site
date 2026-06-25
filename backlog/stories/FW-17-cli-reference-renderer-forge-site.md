---
id: FW-17
type: story
status: active
title: CLI reference renderer (forge-site)
created: 2026-06-25
---

Parent: FW-9. Depends on FW-16 (contract) and the forge-side CLI emitter. forge-site-side. Decomposed: the emitter is forge-side; delivery + auto-merge is FW-19.

CLI reference RENDERER (forge-site code): convert src/data/generated/cli.schema-v1.json -> committed MDX under src/content/docs/reference/cli/*, stamping _generatedFrom (from the envelope forge_sha) + editUrl:false. Gives Starlight auto-sidebar + pagefind search natively.

Execution / handoff (per FW-19): forge CI opens a JSON-only PR; forge-site CI runs THIS renderer and commits the rendered MDX to the PR branch. The renderer never runs in forge CI. Must be deterministic (FW-20 git-diff drift check; re-render over unchanged JSON = byte-identical) and must consume FW-16 schema validation before rendering.

Value: fixes the 2 live /reference/* 404s linked from /how-routing-works and /how-forge-runs-work. First renderer proven before the workflow renderer (FW-21).

NOTE: the standalone-page pattern (/how-routing-works rendering src/data/routes.json in a bespoke Astro page) is distinct — in-docs reference uses JSON->MDX specifically for Starlight content-collection integration. See docs/prds/forge-website-platform.md (Rendering model).