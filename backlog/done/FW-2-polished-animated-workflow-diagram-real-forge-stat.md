---
id: FW-2
type: story
status: done
title: Polished animated workflow diagram (real Forge state data)
---

**Closed:** 2026-06-03.

Split out from #1 (bones-first decision).

The showpiece: an on-page animated diagram of a feature request moving orchestrator -> architect -> plan -> build -> tests -> reds -> done.

Constraints from docs/prds/forge-website-platform.md:
- Driven by REAL Forge run/ops state data (e.g. forge ops check --json output or a recorded run trace), not a hand-faked timeline. Self-correcting against drift; 'living docs' quality.
- On-page motion via code-driven animation (Framer Motion or GSAP over SVG) — repo-native, agent-buildable/testable. NOT Rive (deferred).
- Depends on #1 (site scaffold) landing first.

Open sub-decision to settle before build: the data shape that feeds the animation (live fetch vs build-time snapshot vs recorded trace fixture).