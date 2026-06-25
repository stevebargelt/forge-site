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

#12 (container env gap: tsx missing in forge-test wrapper) is being handled on the forge side — user routed it. Do NOT re-file or re-flag as needing handoff. It surfaced again this session on both invokes for #13 (agents fell back to node --test + pnpm test:e2e; orchestrator re-verified on host).
