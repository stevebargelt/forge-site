---
id: FW-22
type: story
status: active
title: "Synced concept-docs: sanitization contract + allowlist + Starlight integration (forge-site)"
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic). Slice 3 (last; allowlist starts empty). forge-site-side.

forge-site responsibilities for the SYNCED bucket:
- Define the sanitization CONTRACT the forge-side sync must satisfy (the fail-loud rules: strip/replace frontmatter; rewrite relative links; copy+rewrite or reject images; disallow MDX imports/components; detect private/internal links; reconcile duplicate-H1/title) — see PRD Synced-prose sanitization. The sanitizer itself runs forge-side (reads forge docs); forge-site owns the rule contract.
- Define + host the explicit allowlist (not a glob); starts empty.
- Consume synced MDX landing under the synced root (e.g. src/content/docs/guides/**) with _syncedFrom + editUrl:false; wire Starlight sidebar/IA.
See docs/prds/forge-website-platform.md (Synced content, Synced-prose sanitization, Committed roots).