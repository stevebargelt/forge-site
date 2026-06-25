---
id: FW-12
type: story
status: active
title: "forge bug: request-changes rework is a no-op (rationale not propagated; fanout re-runs original steps) + container env gaps"
---

Two compounding infra failures on run-walkthrough-pages-with-diagram-pull-through-73c794, build rework (task-build-d127ce):

1) REWORK NO-OP (same root as #11 — input plumbing). 'forge gate <build-parent> request-changes --rationale "<14-item a11y fix list>"' created a follow-up build task that RE-FANNED into the original 4 plan steps with their ORIGINAL inputs. The rationale (the actual fix list) never reached the agents. Each agent found the original work already in the tree and reported 'already in place / verified' — applying ZERO fixes. Confirmed by grepping the working tree: none of the 14 fixes present (GateGlyph inline still aria-label not aria-hidden, no skip link, no no-JS nav fallback, do-research still restates CLI inline, etc.). request-changes rationale must propagate into the rework task inputs, or rework must carry the reviewer feedback as the task brief — otherwise human gate feedback is silently dropped and the run loops on unchanged code.

2) CONTAINER ENV GAPS (separate infra issue). build-0/build-2 failed: (a) browser-tools/visual verification — browser-start.js targets '/Applications/Google Chrome.app' (macOS path); the agent container is Linux with no Chrome binary, :9222 refused, browser-tools npm install fails on readonly fs; (b) native modules — /project/node_modules built for macOS arm64; agents had to copy Linux x64 rollup/esbuild from the forge-test scratch dir to start the dev server. Frontend agents that require browser-tools screenshots cannot self-validate UI in this container. Either provision Chrome in the frontend container + a Linux node_modules, or make the frontend seed fall back to Playwright (which DID run in-container against pre-built dist) when browser-tools is unavailable.

WORKAROUND this run: orchestrator invoking frontend-specialist directly with the fix list in --task (reaches the agent), and doing real-browser visual verification on the host. Relates to #11.