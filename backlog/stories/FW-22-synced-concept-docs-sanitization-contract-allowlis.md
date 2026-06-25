---
id: FW-22
type: story
status: active
title: "Synced concept-docs: sanitization contract + allowlist + Starlight integration (forge-site)"
created: 2026-06-25
---

Parent: FW-9. Slice 3 (last; allowlist starts empty). forge-site-side.

ALLOWLIST OWNERSHIP (decided): forge-site holds the SINGLE CANONICAL allowlist as a committed config; forge's sync (P5) READS it from forge-site rather than keeping its own copy. forge-site owns what appears on the public site; one source of truth, no drift.

forge-site responsibilities:
- Define + host the canonical allowlist config (explicit entries, not a glob); starts empty. forge sync reads it.
- Define the sanitization CONTRACT the forge-side sync must satisfy (fail-loud rules, per PRD Synced-prose sanitization): strip/replace frontmatter (inject title from H1, description from first paragraph, _syncedFrom); rewrite relative links; copy+rewrite or reject images; disallow MDX imports/components; detect private/internal links; reconcile duplicate-H1/title. The sanitizer RUNS forge-side (reads forge docs); forge-site owns the rule contract.
- Consume synced MDX landing under the synced root (src/content/docs/guides/**) with _syncedFrom + editUrl:false; wire Starlight sidebar/IA.

See docs/prds/forge-website-platform.md (Synced content, Synced-prose sanitization, Committed roots).