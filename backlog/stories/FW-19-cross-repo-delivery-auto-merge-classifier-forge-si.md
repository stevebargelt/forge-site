---
id: FW-19
type: story
status: active
title: Cross-repo delivery + auto-merge classifier (forge-site CI)
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). Decomposed out of the original FW-17 "full loop" scope. forge-site-side.

The forge-site CI half of the pipeline: receive the pipeline PR, classify it, and gate merge.

- Auto-merge classifier (computes the content-only vs structural label; labels NEVER trusted if manually supplied):
  - eligible only from the expected bot/app identity + target branch
  - all changed paths within the declared COMMITTED ROOTS (src/data/generated/**, src/content/docs/reference/**, the synced root)
  - content-only requires: no URL/slug-set delta, no file add/remove in roots, no structural frontmatter-key change, no schema_version change
  - structural triggers (URL/slug delta incl. command rename, file add/remove, frontmatter key change, schema_version bump, astro.config.mjs change, first-run, any path outside roots) -> human review
  - classification is by path + URL/slug-set delta + frontmatter keys + schema_version + add/remove — NOT file count
- CI gates required before auto-merge: build clean + lychee + integration + e2e + CI-computed content-only label.
- The auto-merge action itself (merge on green + label).

SECURITY-SENSITIVE (auto-merging PRs) — warrants its own story + review. See docs/prds/forge-website-platform.md (Auto-merge policy, Committed roots).