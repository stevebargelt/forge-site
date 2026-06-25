---
id: FW-21
type: story
status: active
title: Workflow reference renderer (forge-site, jsonschema2md)
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). Slice 2 (after the CLI reference is proven). forge-site-side.

Render the workflow reference from forge-emitted artifacts: @adobe/jsonschema2md (forge-site dependency) converts the workflow JSON Schema -> committed MDX under src/content/docs/reference/workflows/*, with _generatedFrom + editUrl:false. Consumes the workflow manifest + JSON Schema emitted forge-side. Depends on the contract (FW-16) and the workflow emitter (forge-side). See docs/prds/forge-website-platform.md (Two-layer design, Roadmap).