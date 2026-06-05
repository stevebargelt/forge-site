# Research: keeping forge-site docs in sync with forge

**Date:** 2026-06-05
**Status:** Research findings / decision input — **no decision made yet**
**Question:** How do other projects keep a docs *website* in sync with a separate source-of-truth code repo, and is there an off-the-shelf framework/platform we should adopt instead of building bespoke?
**Our setup:** Astro + Starlight static site (Vercel) ← fed from `forge`, a Node/TS commander-based CLI whose sources of truth are its command tree, YAML workflow definitions, and a `docs/` markdown folder. forge and forge-site are both ours; adding code to forge is in scope.

---

## Bottom line

**Build it; don't adopt a platform.** Two independent research passes (sync mechanism; generation tooling) reached the same verdict.

Every docs *platform* fails on the same two counts:
1. It would **replace Starlight** (the platform *is* the site), and
2. It **still doesn't solve the hard part** — none can document a commander CLI tree or YAML workflow defs; they're all OpenAPI/REST-first or passive markdown sync.

Adopting one buys nothing on the actual problem and adds lock-in + cost. The established pattern for code-derived docs is to build small owned generators and wire them with off-the-shelf CI plumbing. **MVP estimate: ~1–2 engineer-days.**

---

## The design splits into two layers

### Layer 1 — Generation (forge-side; no off-the-shelf answer exists)

| Content | Source of truth | Approach |
|---|---|---|
| **CLI reference** | forge's commander command tree | **Hand-rolled introspection** (~100–200 lines TS) walking commander's public `Help`/`Command` APIs → one MDX per command. The Cobra `GenMarkdownTree` pattern in Node. |
| **Workflow reference** | `workflows/*.yml` / `src/workflows/*.ts` | **`@adobe/jsonschema2md`** (maintained, npm-native, `--example-format yaml`) off a JSON Schema for the workflow YAML. That schema doubles as editor validation via `$schema`. |
| **Concepts / how-tos** | forge's `docs/*.md` | **Sync/transform** forge's markdown into Starlight pages. |

**Commander specifics:** commander v14+ exposes a public `Help` class — `visibleCommands()`, `visibleOptions()`, `visibleArguments()`, `optionTerm/Description()`, `subcommandTerm/Description()` — plus `Command.commands`, `.options`, `.registeredArguments`, `.name()`, `.description()`, `.alias()`. The one library that did this (`commander-to-markdown`) was **archived Aug 2023**. Hand-rolling is the industry norm.

**Ruled out (don't chase):** Fern, Speakeasy, Stainless are **HTTP/OpenAPI-only**. They generate *new* CLIs *from* API specs — not docs *from* an existing commander CLI.

**Starlight ingestion:** simplest is to drop generated `.md`/`.mdx` into `src/content/docs/` (auto-routing, auto-sidebar). Advanced option is a build-time plugin via Astro's `injectRoute()` + `StarlightPage` (how `starlight-openapi` works) — only needed if we want zero pre-committed files.

### Layer 2 — Delivery / cross-repo sync (off-the-shelf plumbing)

Four patterns exist; for **docs derived from code**, the dominant one is **CI bot + PR**:

| Pattern | What it is | Fit |
|---|---|---|
| **CI bot + PR** ✅ | Source repo generates on change → opens/updates a single PR into the docs repo (`peter-evans/create-pull-request`) | **Rank 1 — excellent.** Solves generation + delivery; full control; review gate; no platform fees; Starlight stays. Used by Kubernetes website. |
| Content Layer loader | forge-site fetches forge's `docs/` markdown at build via a custom Astro loader (`raw.githubusercontent.com`) | Rank 2 — good for prose (always current, no PR round-trip), but **no review gate** and CLI gen still needs custom code. `astro-github-file-loader` is nascent (23★). |
| Git submodule | forge added as a submodule in forge-site; CI inits it; prebuild generates | Rank 3 — acceptable; no API token needed; submodule SHA is itself provenance; but bumps must be automated and it's uncommon with Astro. |
| Monorepo colocation | Merge the repos | Not applicable — separate products/cadences. (Cloudflare, Prisma do this.) |

**The one thing to adopt:** `peter-evans/create-pull-request` for the PR step (battle-tested; updates a single PR on re-run, no PR spam). Don't hand-roll a cross-repo PR bot.

---

## Provenance & drift guards (this is ticket #4, realized)

- **Provenance:** each generated file gets frontmatter `_generatedFrom: 'https://github.com/<org>/forge/commit/<sha>'` + `editUrl: false` (Starlight suppresses the "Edit on GitHub" link). Optionally an aside component renders "Generated from forge@`<sha>` — do not edit here."
- **Drift detection:**
  - `git diff --exit-code` on the generated dirs in forge's CI → stale generated docs fail the build (generators must be deterministic).
  - `lychee` (or equivalent) dead-link check in forge-site CI on every PR → no dead doc-link can ship (the original intent of **#4**).
  - Optional: a freshness check comparing forge-site's `_generatedFrom` SHA against forge `HEAD`.

---

## How this maps to the existing backlog

- **#9 (forge export contract)** — un-deferred; becomes the **pipeline epic**: the forge-side generators + the sync workflow.
- **#4 (link check + "verified against forge commit" marker)** — now concrete: the `_generatedFrom` frontmatter + `lychee` CI gate.
- **#3 (schema-guard the run-trace transform)** — same drift-guard family (already in place for the diagram).
- **#8 (deepen narrative copy)** — the hand-authored layer that stays authored alongside the generated reference tree.

---

## Open design decisions (for an architecture pass)

The research converged on the *mechanism* but left genuine boundary calls:

1. **Export contract shape — the key call:** does forge emit **structured JSON** (semantic data; forge-site owns all Starlight rendering — cleaner producer/consumer boundary) or **ready-made MDX** (simpler, but couples forge to Starlight's frontmatter)? The two passes lean different ways.
2. **Generated vs. synced vs. authored line:** CLI + workflows generated; forge's concept/how-to markdown synced; narrative pages (`how-forge-runs-work`, walkthroughs) stay authored. Where exactly does the line fall?
3. **Auto-merge policy:** auto-merge generated-docs PRs on green CI, or require human review? (Likely: auto for content-only diffs, human for structural.)
4. **Sequencing / first slice:** recommended slice one = **CLI reference generator** — highest automation, fixes a live 404 on `/how-forge-runs-work`, and proves the whole generate → stamp → PR → link-check loop end to end.

---

## Recommended next step

A focused **architecture-advisor** pass to settle decisions 1–3 above (now well-armed by this research), then implement incrementally starting with the CLI-reference generator.

---

## Sources

**Generation tooling**
- commander.js public API / introspection — https://github.com/tj/commander.js/issues/756 · https://www.jsdocs.io/package/commander
- `commander-to-markdown` (archived) — https://github.com/studio-b12/commander-to-markdown
- Cobra `GenMarkdownTree` (reference pattern) — https://pkg.go.dev/github.com/spf13/cobra/doc
- `@adobe/jsonschema2md` (active, v8.x) — https://github.com/adobe/jsonschema2md
- `json-schema-for-humans` — https://github.com/coveooss/json-schema-for-humans
- Fern / Speakeasy / Stainless (OpenAPI-only) — https://buildwithfern.com/post/cli-generator · https://www.speakeasy.com/docs/cli-generation · https://www.stainless.com/docs/
- Starlight pages & frontmatter — https://starlight.astro.build/guides/pages/ · https://starlight.astro.build/reference/frontmatter/
- `starlight-openapi` (injectRoute pattern) — https://github.com/HiDeoo/starlight-openapi

**Cross-repo sync**
- Astro Content Layer API — https://docs.astro.build/en/reference/content-loader-reference/ · https://astro.build/blog/content-layer-deep-dive/
- `astro-github-file-loader` (nascent) — https://github.com/gingerchew/astro-github-file-loader
- CI-bot-PR walkthrough — https://medium.com/@vijeta004/automating-documentation-sync-between-github-repos-using-github-actions-9d1bbd249c4e
- `peter-evans/create-pull-request` — https://github.com/peter-evans/create-pull-request
- `Redocly/repo-file-sync-action` — https://github.com/marketplace/actions/repo-file-sync-action
- Kubernetes website (CI-generated reference) — https://www.kubernetes.dev/docs/guide/github-workflow/
- Git submodule docs pattern — https://github.com/kubernetes/website · https://www.astronomer.io/docs/astro/best-practices/git-submodules
- Drift detection (`drift` linter) — https://fiberplane.com/blog/drift-documentation-linter/
- Platforms: Mintlify — https://www.mintlify.com/blog/auto-generate-docs-from-repos · Fern pricing — https://buildwithfern.com/pricing · Backstage TechDocs — https://backstage.io/docs/features/techdocs/creating-and-publishing/ · GitBook Git Sync — https://www.gitbook.com/features/git-sync

*Full structured research results are persisted under `~/.forge/runs/run-docs-sync-cross-repo-patterns-systems-8d076c/` and `~/.forge/runs/run-docs-gen-cli-schema-to-docs-tooling-9ed7be/`.*
