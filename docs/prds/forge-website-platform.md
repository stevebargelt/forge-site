# SPEC - Forge website and presentation documentation platform

**Status:** accepted
**Captured:** 2026-06-03
**Revised:** 2026-06-03

## Objective

Create a polished documentation and presentation surface for Forge that serves two audiences:

1. **Human engineers** who need accurate, operationally useful docs for installing, configuring, debugging, and extending Forge.
2. **Less technical stakeholders** who need a clear, beautiful explanation of what Forge is, how work moves through the system, and why the orchestration model matters.

This should support static docs, interactive diagrams, and high-quality motion explainers showing work progressing through Forge.

## Recommendation

Build a separate `forge-site` repository for the public/presentation website. The site is public from day one.

Keep canonical operator and implementation docs in the Forge repo. The website should curate, explain, and visualize the system, but it should not become the only source of truth for CLI behavior, schemas, workflows, or setup contracts.

## Why separate repo

The dashboard was re-merged into the Forge repo because it reads Forge's SQLite schema and needs compile-time coupling to Forge types. The website is different:

- It will carry heavier visual assets, animation tooling, screenshots, video exports, and design iteration artifacts.
- It should have an independent deployment cadence.
- It is public from day one, separate from the parts of the Forge repo that remain internal or noisy.
- It benefits from a cleaner content workflow and visual design system that should not churn the CLI repo.
- It should be easy to invite design/copy collaborators without giving them the same working surface as Forge core implementation.

The risk of a separate repo is drift. Mitigate that by keeping technical truth in Forge and making the site consume or link to it where possible — specifically via the forge export contract described below.

## Source of truth split

**Forge repo remains canonical for:**

- CLI command behavior and flags.
- Workflow YAML and runtime seeds.
- Model policy and provider resolution docs.
- Operator setup and upgrade mechanics.
- Backlog-linked PRDs and architecture decisions.
- Schema contracts and test-backed implementation details.

**Website repo owns:**

- Public narrative and product framing.
- Presentation-quality explanations.
- Visual system diagrams.
- Interactive animations.
- Videos/GIFs for "how Forge works."
- Landing page and audience-specific learning paths.

If a website page and a Forge repo doc disagree, the Forge repo wins. The fix is either to update the site or move the disputed behavior into a provider-neutral Forge primitive/doc.

## Platform choice

Use a single **Astro** project with two distinct surfaces:

- **Plain Astro** for the landing and narrative pages — the "What Forge does" and "How it works" sections aimed at less-technical stakeholders. These pages need distinct, polished design control that Starlight's theme would constrain.
- **Astro Starlight** for the `/docs` reference section — Starlight is a strong utilitarian docs shell with Markdown/MDX, accessible navigation, and search baked in.

Both surfaces live in one repository and deploy together.

Why:

- Astro keeps static publishing simple and does not force the whole site into a heavy app runtime.
- MDX lets normal docs stay readable while allowing custom components for diagrams, explainers, tabs, and embedded animations.
- The site can still host richer React/Svelte/Astro islands where the visuals need interactivity.
- A single project avoids duplicate build pipelines while letting the marketing surface have its own layout and design system free of Starlight's theme constraints.

Official references:

- Astro Starlight: https://astro.build/themes/details/starlight/
- Docusaurus MDX reference for comparison: https://docusaurus.io/docs/markdown-features/react

## Visual and motion tooling

Use a three-part stack matched to the type of work:

### Fast technical diagrams

Use **Mermaid** or code-native SVG for architecture sketches and flow documentation that needs to stay close to technical docs.

Best for:

- Architecture topology.
- Data flow.
- State-machine sketches.
- Internal docs where precision matters more than polish.

Official reference:

- Mermaid: https://mermaid.js.org/

### On-page interactive motion

Use **Framer Motion** or **GSAP over SVG** for interactive animations embedded in site pages.

Best for:

- A task moving from pending -> running -> awaiting_gate -> complete.
- Reds reviewing build output.
- The orchestrator consuming `forge ops check --json`.
- Provider/profile routing across Claude, Codex, and future providers.

This approach keeps animation code in the repo, so agents can build, test, and maintain it. It also shares the React component tree with Remotion video scenes, reducing duplication across the motion stack.

### Exportable videos

Use **Remotion** for rendered explainer videos and GIFs.

Best for:

- A 30-60 second "What is Forge?" explainer.
- Product demos.
- Release videos.
- Animated walkthroughs that need MP4/WebM export.

Remotion keeps videos code-owned and reusable. A component used in a website animation can often be reused in a video scene.

Official reference:

- Remotion: https://www.remotion.dev/docs/

### Principle: animate from real state data

The "how work moves through Forge" animation must be driven by real Forge run and ops state data — feed it from `forge ops check --json` output or a recorded run trace, not a hand-crafted fake timeline. This makes the animation self-correcting against drift and gives the site a "living docs" quality that static screenshots cannot match.

*Rive (a designer-GUI state-machine tool) is explicitly deferred until a dedicated designer owns the asset workflow. Its value depends on human-crafted .riv binaries exported from the Rive editor, which contradicts this PRD's model of canonical site work happening in the repo, built by repo-aware coding agents with build/test validation. This is a deferral, not a permanent exclusion.*

## Agent/tooling recommendation

Do not make a desktop chat app the documentation platform.

Use repo-aware coding agents to build and maintain the site because the artifact is code: MDX, components, animations, build scripts, and tests. Claude Code, Codex, or Forge-routed agents can all contribute when they are working inside the repository and can run the site build.

Use desktop Claude/ChatGPT as collaborators for:

- Storyboarding.
- Copy critique.
- Audience framing.
- Visual direction.
- Reviewing screenshots or drafts.

But the canonical site work should happen in the repo, with normal build/test validation.

## First slice

Keep the first website slice deliberately small:

1. Create the `forge-site` repo with Astro (plain Astro landing surface + Starlight docs section).
2. Add a minimal Forge visual identity: logo, colors, typography, diagram style.
3. Add one engineer-oriented page: "How Forge runs work."
4. Add one less-technical page: "What Forge does."
5. Add one polished animated diagram showing a feature request moving through orchestrator -> architect -> plan -> build -> tests -> reds -> done, driven by real Forge state data.
6. Deploy to Vercel.

Success is not page count. Success is proving the visual language and the maintenance model.

## Content map

Initial site sections:

- **Overview:** what Forge is, why orchestration exists, what problem it solves.
- **How work moves:** runs, tasks, gates, reds, agents, SQLite blackboard.
- **Operating Forge:** init, upgrade, auth, provider setup, dashboard, ops check.
- **Provider model:** Claude, Codex, Bedrock, model policy, provider adapters.
- **Architecture:** host process, Docker agents, project mounts, read-only reds, notifications.
- **Demos:** animated workflows and short videos.
- **Engineer reference:** links back to canonical Forge docs and schemas.

## Drift controls

To keep the site honest:

- Link to canonical Forge docs for technical details instead of duplicating large command references.
- Generated snippets for command help, schemas, and workflow lists are backed by the forge export contract (see below).
- Add a lightweight build-time check for links to Forge docs.
- Keep a clear "last verified against Forge commit" marker for deep architecture pages.
- When Forge changes operator-visible behavior, docs-impact should include website pages only if they duplicate that behavior rather than merely explain it conceptually.

## Forge export contract

The site consumes a minimal machine-readable export from Forge at build time:

- **Version string** — current Forge release version.
- **Command help** — structured output from `forge help --json` or equivalent.
- **Workflow list** — available built-in workflow definitions as JSON.

This export is the backing contract for generated snippets: command reference blocks, workflow lists, and version badges pull from it. The site build fails if the export is absent or malformed, making drift immediately visible rather than silently accumulating.

This resolves the tension between the separate repo (for independence) and drift controls (which need coupling to Forge): the site is coupled to Forge's stable operator-visible surface, not its internals. That is the right boundary.

## Open decisions

- Exact repo name: `forge-site`, `forge-docs`, or `forge-www`.
- Whether Remotion videos render in CI or only on demand.

## Non-goals for the first slice

- Full command reference.
- Full migration of existing Forge docs.
- Dashboard replacement.
- In-dashboard docs.
- Every workflow diagram.
- Custom CMS.
- Complex analytics.
