---
id: FW-19
type: story
status: active
title: Cross-repo delivery + auto-merge classifier (forge-site CI)
created: 2026-06-25
---

Parent: FW-9. Decomposed out of the original FW-17 "full loop" scope. forge-site-side. Security-sensitive (auto-merging PRs).

MDX COMMIT HANDOFF (decided): forge CI opens a JSON-ONLY PR into forge-site (artifacts under src/data/generated/**). forge-site CI, triggered on that PR, runs the renderer (FW-17 for CLI; FW-21 for workflows), COMMITS the rendered MDX to the PR branch, then classifies + gates. The renderer runs forge-site-side only — forge never runs forge-site code (clean producer/consumer boundary). Use a token with the right PR-write scope.

LOOP PREVENTION (must not suppress the final gated run): the render job commits ONLY when the rendered MDX actually differs from what is on the branch (a no-op render makes no commit, which bounds the loop). Auto-merge is BLOCKED until a CI run on the rendered branch — AFTER the last render commit — reports BOTH (a) no further render diff (render has converged) AND (b) all gates green. Do NOT use a blanket [skip ci] on the render commit or any loop-guard that bypasses the build / e2e / lychee / FW-20 checks on the rendered commit — the final, fully-gated run on the converged branch is mandatory before merge.

Auto-merge classifier (labels CI-COMPUTED; never trusted if supplied on the incoming PR):
- eligible only from the expected bot/app identity + target branch (the identity forge CI delivers under)
- all changed paths within COMMITTED ROOTS: src/data/generated/**, src/content/docs/reference/**, src/content/docs/guides/** (the synced root)
- content-only requires: no URL/slug-set delta, no file add/remove in roots, no structural frontmatter-key change, no schema_version change
- structural triggers (URL/slug delta incl. command rename, file add/remove, frontmatter key change, schema_version bump, astro.config.mjs change, first-run, any path outside roots) -> human review
- classification by path + URL/slug-set delta + frontmatter keys + schema_version + add/remove — NOT file count

Required gates before auto-merge (on the converged rendered branch): build clean + lychee (FW-4) + integration + e2e + stale-gen MDX check (FW-20) + CI-computed content-only label. Then auto-merge.

See docs/prds/forge-website-platform.md (Rendering model, Auto-merge policy, Committed roots).