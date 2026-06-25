---
id: FW-21
type: story
status: active
title: Workflow reference renderer (forge-site, jsonschema2md)
created: 2026-06-25
---

Parent: FW-9. Slice 2 (after the CLI reference is proven). forge-site-side. Depends on FW-16 (contract) + the forge-side workflow emitter.

Render the workflow reference from forge-emitted artifacts (workflow manifest + workflow JSON Schema under src/data/generated/) into committed MDX under src/content/docs/reference/workflows/*. @adobe/jsonschema2md is the schema-to-MDX tool, but the story owns the full quality bar, not just "run jsonschema2md":

- IA: one page per workflow, manifest-driven (page set derived from the manifest, not hand-listed); index/overview page.
- Frontmatter: _generatedFrom (from envelope forge_sha) + editUrl:false on every page, same as the CLI renderer.
- Examples: render example workflow YAML (jsonschema2md --example-format yaml or equivalent) where the schema provides them.
- Deterministic output: stable ordering so FW-20 git-diff drift check passes; re-render over unchanged JSON = byte-identical.
- Schema validation: validate the manifest + JSON Schema against the contract before rendering (FW-16); fail the build on mismatch.
- Starlight integration: workflows land in the /docs/reference sidebar/IA alongside the CLI reference; search/pagefind works.
- MDX safety: ensure jsonschema2md output is valid MDX (escape/guard any schema text that could break MDX).

See docs/prds/forge-website-platform.md (Two-layer design, Rendering model, Roadmap).