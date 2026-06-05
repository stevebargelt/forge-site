# forge-site backlog

Work tracking for the Forge website. Managed via the `forge backlog` CLI.

## Notes for next session
**Last session ended 2026-06-05.**

**Where we left off:** Two threads. (1) Built an unplanned feature — three product-owner walkthrough pages (add-a-feature / do-research / kick-off-a-project) with a visual "pull-through" reusing the #2 diagram's motifs (gate diamond, red hexagon, stage chips) extracted into shared components, plus a 6-link nav with an accessible mobile hamburger. Done + fully verified (host: build clean, 174 integration + 47 e2e; real-browser: pull-through, diagram intact, mobile nav, skip link). NOT a backlog ticket; built ad-hoc from conversation. (2) Mid-discussion the docs strategy PIVOTED hard (see decisions) and we researched the forge→forge-site sync pipeline; findings written to `research/forge-docs-pipeline-2026-06-05.md`.

**Picked up next:**
- **Commit the work (non-ticket thread, most immediate).** The entire walkthrough feature + the research doc are uncommitted on `main`. Likely 2 commits on a branch (feature, then research doc). User was mid-deciding when /handoff fired — confirm and commit.
- **Reframe the backlog (pending user go):** promote **#9** from "deferred" to the docs-pipeline EPIC; re-parent **#3/#4/#8** under it. The research makes #4 (link-check + `_generatedFrom` marker) and #9 (export contract) concrete.
- **Architecture pass then first slice:** spin up architecture-advisor on the 3 open decisions in the research doc — the **JSON-vs-MDX export contract** is the key call — then build slice one = the **CLI-reference generator** (forge-side commander introspection), which also fixes 2 of the live 404s.

**External state to remember:**
- **8 dead doc links are LIVE** on /how-forge-runs-work — every `/docs/concepts/*` and `/docs/reference/*` link 404s (only `/docs/` exists; pre-existing from #1/#2). No stopgap applied — user chose to fix by building the real pages (now the pipeline). The CLI-ref slice fixes the 2 `/reference/*` ones.
- **forge bugs #11/#12 are the USER's to hand to forge** ("I am handling this"). Don't re-file or act on them here. Note: the "rework no-op" half of #12 was triaged as partly orchestrator misuse (request-changes at the build phase re-runs the unchanged plan; rationale isn't a task input), not purely a forge defect.
- **Memory updated this session:** `docs-convenience-over-drift-avoidance.md` (new) records the strategy reversal + that cross-repo work into forge is in scope.
- **PRD/durable docs still encode the OLD "link out" strategy** (`docs/prds/forge-website-platform.md`) — will need a documentation-maintainer pass to reconcile once the new direction is locked.

**Decisions worth not relitigating:**
- **DOCS STRATEGY REVERSED (supersedes last session's notes).** The prior rule — "site explains concepts + links out, NEVER restate CLI/schema; #9 deferred until a 2nd consumer" — is DEAD. New direction: forge-site HOSTS forge's docs (CLI ref, workflow defs, concepts) kept current by an automated forge→forge-site pipeline. Rationale: "never restate" was cost-avoidance wearing a UX costume; convenience > avoiding-hard-work; solve drift with automation, not omission. The drift guards (#3/#4) become the integrity layer that MAKES this safe, not blockers.
- **BUILD bespoke, do NOT adopt a platform.** Two research passes independently concluded: no platform (Mintlify/Fern/ReadMe/GitBook/Backstage) fits — all would replace Starlight AND still not solve CLI/workflow generation. Pattern: **CI-bot + PR** (forge generates → `peter-evans/create-pull-request` → single PR into forge-site) + small owned generators (commander introspection for CLI ref; `@adobe/jsonschema2md` for workflow ref) + `_generatedFrom: forge@<sha>` frontmatter + `lychee` link-check. ~1-2 day MVP. Fern/Speakeasy/Stainless are OpenAPI-only — ruled out.
- forge is also ours; **forge-side export code is sanctioned** — forge is the producer (clean export contract), forge-site the consumer.
- Walkthrough feature scope settled: 3 pages, motif components extracted from ForgeRunDiagram (GSAP hooks preserved byte-identical), mobile nav folded into scope, generic happy-path, a11y fixes applied (inline motifs aria-hidden, skip link, no-JS nav fallback, Escape-to-close). Video/screenshot capture deferred to **#10** (forward, during a future live run).

**Shipped (for reference) — note: built but UNCOMMITTED:**
- Walkthrough feature (not a ticket): `src/pages/{add-a-feature,do-research,kick-off-a-project}.astro`, `src/components/{GateGlyph,RedBadge,StageChip}.astro`, refactor of `ForgeRunDiagram.astro` + `MarketingLayout.astro` (nav/mobile/skip-link) + `tokens.css` + `src/content/docs/index.mdx` (Walkthroughs section); tests `mobile-nav.test.js`, `walkthrough-pages.test.js`, `component-integrity.test.js`.
- Research doc: `research/forge-docs-pipeline-2026-06-05.md`.
- Filed this session: **#10** (video capture), **#11** (forge reds-dispatch bug), **#12** (forge rework-no-op + container env gaps).

## Active

### #3 — Drift guard: schema-validate the run-trace transform
src/lib/forge-run-transform.js hard-codes forge's event vocabulary (run.created, task.started, container.started, gate.decided, task.awaiting_red, verdict.received, task.failed, task.retried, run.completed) and taskId conventions (task-architect-, task-build-N-). If forge renames an event or changes task-ID naming, the committed fixture + transform silently misrender.

Make the transform validate the fixture against the event shape it expects and FAIL the build loudly on mismatch (missing expected event types, no parent-build task found, empty canonical wave, etc.) instead of producing a wrong model. Turns silent forge drift into a red CI build. Cheap, high-value, directly hardens the diagram we shipped (#2). Priority: high among follow-ups.


### #4 — Drift guard: build-time canonical-doc link check + 'verified against forge commit' marker
forge-site links out to canonical forge docs (centralized URL const). These drift if forge docs move/rename.

(1) Add a build-time check that all outbound forge-doc URLs resolve; fail or warn loudly at build, not in production. (2) Add a 'verified against forge commit <sha>' marker on data-derived pages (the diagram page) so staleness is visible/auditable. From the PRD drift-controls section.


### #5 — Diagram: accessible stage hover/focus details
Add an interactivity layer to the /how-forge-runs-work pipeline diagram: hover OR keyboard-focus a stage reveals its real per-stage data already in the model (duration share, gate decision, reds e.g. '2 reds: fail + inconclusive' on Architect, the task family). Must be accessible: :focus-visible, ARIA, not motion/hover-only. Deepens the 'real data' hook.

Optional sub-item: pin the diagram section during the ScrollTrigger scrub for a more deliberate hold-and-reveal (currently no-pin scrub). Evaluate feel before committing to pin.


### #6 — Set 'site' in astro.config.mjs (clear sitemap WARN)
Every build logs: [WARN] [@astrojs/sitemap] The Sitemap integration requires the 'site' astro.config option. Skipping. Set the canonical site URL in astro.config.mjs so the sitemap generates. Small. Pairs naturally with the first Vercel deploy (need the real URL).


### #7 — First Vercel deploy (public)
Vercel static config is wired (vercel.json / adapter) but the site has never actually been deployed. Stand up the live public URL (PRD: public from day one). Confirm /docs (Starlight) and the marketing routes serve, and the diagram animates in production. Feeds the 'site' config ticket (need the real URL).


### #8 — Deepen narrative page copy
The two narrative pages (what-forge-does, how-forge-runs-work) are genuine first-run copy. Deepen the stakeholder framing and the engineer-facing concept explanations. Keep the source-of-truth discipline: explain concepts + link out to canonical forge docs, do not restate CLI/schema specifics.


### #9 — forge export contract (DEFERRED until 2nd consumer)
DEFERRED — do not start until a second page needs generated forge content. The PRD-resolved drift-control mechanism: forge emits a small versioned JSON (version, command help, workflow list, event schema / sample trace) that forge-site consumes at build time. Today the only consumer is the diagram (one committed trace), which does not justify the contract. Build this when generated command/schema/workflow content is actually needed on the site; it also becomes the clean channel to refresh the diagram trace + schema-guard expectations.


### #10 — Capture screenshot/video walkthrough during a live run
Visual layer for the Walkthroughs pages (Add a feature / Do research / Kick off a new project). Capture screenshots and a short screen-recorded video of a real orchestrator session — done FORWARD during the next live run (next feature or the #6/#7 deploy), not retroactively. Video is sped-up / thinking-time-cut, narrated, not real-time. Pairs with the text walkthroughs shipped via the pull-through feature; drops media into those pages once captured. Fast-follow, not blocking.


### #11 — forge bug: build-phase authoritative reds not dispatched (verdict gate stalls)
On run-walkthrough-pages-with-diagram-pull-through-73c794, the build phase (gate: verdict, 5 authoritative reds per feature.yml) completed its fan-out children but NEVER dispatched the reds — zero red-build task rows, and 'forge next' reported 'nothing ready to dispatch' with the build parent stuck at awaiting_gate. The verdict gate cannot auto-resolve because there are no verdicts. Same empty-input/dispatch gap seen at the architect phase (architect reds returned 'inconclusive' on empty {} inputs), but there it was advisory (specialist authority); at build it's authoritative and silently skips the adversarial review the phase exists for. WORKAROUND used this run: orchestrator manually invoked red-wide/red-narrow/red-frontend via 'forge invoke --read-only --run <id>' against the working-tree diff, then drove the gate by hand. IMPACT: any feature run could silently advance past build with no red audit if the orchestrator force-advances without noticing. Repro: feature workflow, build phase with fanout. Investigate the build reds-on-parent dispatch path (feature.yml notes 'per-parent dispatch, not per-child' / #139).


### #12 — forge bug: request-changes rework is a no-op (rationale not propagated; fanout re-runs original steps) + container env gaps
Two compounding infra failures on run-walkthrough-pages-with-diagram-pull-through-73c794, build rework (task-build-d127ce):

1) REWORK NO-OP (same root as #11 — input plumbing). 'forge gate <build-parent> request-changes --rationale "<14-item a11y fix list>"' created a follow-up build task that RE-FANNED into the original 4 plan steps with their ORIGINAL inputs. The rationale (the actual fix list) never reached the agents. Each agent found the original work already in the tree and reported 'already in place / verified' — applying ZERO fixes. Confirmed by grepping the working tree: none of the 14 fixes present (GateGlyph inline still aria-label not aria-hidden, no skip link, no no-JS nav fallback, do-research still restates CLI inline, etc.). request-changes rationale must propagate into the rework task inputs, or rework must carry the reviewer feedback as the task brief — otherwise human gate feedback is silently dropped and the run loops on unchanged code.

2) CONTAINER ENV GAPS (separate infra issue). build-0/build-2 failed: (a) browser-tools/visual verification — browser-start.js targets '/Applications/Google Chrome.app' (macOS path); the agent container is Linux with no Chrome binary, :9222 refused, browser-tools npm install fails on readonly fs; (b) native modules — /project/node_modules built for macOS arm64; agents had to copy Linux x64 rollup/esbuild from the forge-test scratch dir to start the dev server. Frontend agents that require browser-tools screenshots cannot self-validate UI in this container. Either provision Chrome in the frontend container + a Linux node_modules, or make the frontend seed fall back to Playwright (which DID run in-container against pre-built dist) when browser-tools is unavailable.

WORKAROUND this run: orchestrator invoking frontend-specialist directly with the fix list in --task (reaches the agent), and doing real-browser visual verification on the host. Relates to #11.


## Done (recent)

### #2 — Polished animated workflow diagram (real Forge state data)
**Closed:** 2026-06-03.

Split out from #1 (bones-first decision).

The showpiece: an on-page animated diagram of a feature request moving orchestrator -> architect -> plan -> build -> tests -> reds -> done.

Constraints from docs/prds/forge-website-platform.md:
- Driven by REAL Forge run/ops state data (e.g. forge ops check --json output or a recorded run trace), not a hand-faked timeline. Self-correcting against drift; 'living docs' quality.
- On-page motion via code-driven animation (Framer Motion or GSAP over SVG) — repo-native, agent-buildable/testable. NOT Rive (deferred).
- Depends on #1 (site scaffold) landing first.

Open sub-decision to settle before build: the data shape that feeds the animation (live fetch vs build-time snapshot vs recorded trace fixture).


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

