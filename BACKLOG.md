# forge-site backlog

Work tracking for the Forge website. Managed via the `forge backlog` CLI.

## Notes for next session

_Picked up next:_ Initial repo scaffolding. PRD accepted at `docs/prds/forge-website-platform.md`. Next concrete move is the first-slice Astro + Starlight scaffold (pipeline implementation).

## Active

### #1 — Scaffold Astro + Starlight site (first slice)
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

