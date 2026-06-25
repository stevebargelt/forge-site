---
id: FW-17
type: story
status: active
title: CLI-reference generator — first pipeline slice
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). Depends on the JSON export contract (schema v1) ticket.

First slice of the docs pipeline — proves the full loop end to end:
forge-side commander introspection -> command-tree JSON emission -> forge-site MDX renderer -> _generatedFrom stamp -> peter-evans/create-pull-request -> forge-site CI (build + lychee + integration + e2e) -> auto-merge on content-only label.

Value: fixes the 2 live /reference/* 404s currently linked from /how-routing-works and /how-forge-runs-work. Lowest-complexity generator (no JSON Schema versioning surface) — correct to prove the contract here before workflow ref. See docs/prds/forge-website-platform.md (Roadmap).