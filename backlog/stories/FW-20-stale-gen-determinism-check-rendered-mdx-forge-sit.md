---
id: FW-20
type: story
status: active
title: Stale-gen determinism check — rendered MDX (forge-site CI)
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). forge-site-side half of the stale-gen drift guard (the JSON-side check is forge-side).

forge-site CI runs git diff --exit-code on the rendered MDX (src/content/docs/reference/**): re-run the renderer over the committed JSON artifacts; if the output differs from what is committed, FAIL the build. The renderer must be deterministic. Pairs with the forge-side check on emitted JSON (src/data/generated/**). See docs/prds/forge-website-platform.md (Drift and provenance layer).