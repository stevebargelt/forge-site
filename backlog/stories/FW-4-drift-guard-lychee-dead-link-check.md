---
id: FW-4
type: story
status: active
title: "Drift guard: lychee dead-link check"
---

Narrowed (per review): provenance is now handled by the generated/synced renderers (_generatedFrom/_syncedFrom), rendered-MDX determinism by FW-20, and CI gate orchestration + auto-merge by FW-19. What remains uniquely here:

Add lychee dead-link checking to forge-site CI + its config (lychee.toml or equivalent): run on every PR, fail loudly on any dead doc-link (internal or outbound forge-doc URL) before merge. FW-19 consumes this as one of its required content-only gates.

(The old "verified against forge commit marker" intent is superseded by per-page provenance frontmatter from the renderers.)