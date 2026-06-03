# forge-site backlog

Work tracking for the Forge website. Managed via the `forge backlog` CLI.

## Notes for next session

_Picked up next:_ Initial repo scaffolding. PRD accepted at `docs/prds/forge-website-platform.md`. Next concrete move is the first-slice Astro + Starlight scaffold (pipeline implementation).

## Active

### #2 — Polished animated workflow diagram (real Forge state data)
Split out from #1 (bones-first decision).

The showpiece: an on-page animated diagram of a feature request moving orchestrator -> architect -> plan -> build -> tests -> reds -> done.

Constraints from docs/prds/forge-website-platform.md:
- Driven by REAL Forge run/ops state data (e.g. forge ops check --json output or a recorded run trace), not a hand-faked timeline. Self-correcting against drift; 'living docs' quality.
- On-page motion via code-driven animation (Framer Motion or GSAP over SVG) — repo-native, agent-buildable/testable. NOT Rive (deferred).
- Depends on #1 (site scaffold) landing first.

Open sub-decision to settle before build: the data shape that feeds the animation (live fetch vs build-time snapshot vs recorded trace fixture).


## Done (recent)

### #1 — Scaffold Astro + Starlight site (first slice)
**Closed:** 2026-06-03.

First-slice bootstrap per docs/prds/forge-website-platform.md.

One Astro project, two surfaces: plain Astro for the landing/narrative pages, Starlight for the /docs reference section. Deploy target Vercel. Public from day one.

First-slice acceptance (from PRD):
- Astro project scaffolded with Starlight mounted at /docs
- Minimal Forge visual identity (logo, colors, typography, diagram style)
- One engineer page: 'How Forge runs work'
- One stakeholder page: 'What Forge does'
- One polished animated diagram: feature request moving orchestrator -> architect -> plan -> build -> tests -> reds -> done, driven by real Forge state data
- Vercel deploy target wired

Success = proving the visual language + maintenance model, not page count. Implementation goes through the pipeline.

