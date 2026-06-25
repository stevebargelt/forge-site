# SPEC - Forge website and presentation documentation platform

**Status:** accepted
**Captured:** 2026-06-03
**Revised:** 2026-06-25

## Objective

Create a polished documentation and presentation surface for Forge that serves two audiences:

1. **Human engineers** who need accurate, operationally useful docs for installing, configuring, debugging, and extending Forge.
2. **Less technical stakeholders** who need a clear, beautiful explanation of what Forge is, how work moves through the system, and why the orchestration model matters.

This should support static docs, interactive diagrams, and high-quality motion explainers showing work progressing through Forge.

## Strategy

forge-site hosts forge's docs, kept current by an automated forge → forge-site sync pipeline. The original "site links out, never restate CLI/schema, export contract deferred" framing was reversed after an architecture pass confirmed that a hosted, generated reference is tractable and that every third-party docs platform would replace Starlight while still failing to document a commander CLI or YAML workflows.

The pattern is already proven in production: `/how-routing-works` renders forge's real routing policy from a committed projection (`src/data/routes.json`) stamped with a `forge@<sha>` provenance marker. The docs pipeline extends that same precedent to the full CLI and workflow reference.

## Why separate repo

The dashboard was re-merged into the Forge repo because it reads Forge's SQLite schema and needs compile-time coupling to Forge types. The website is different:

- It will carry heavier visual assets, animation tooling, screenshots, video exports, and design iteration artifacts.
- It should have an independent deployment cadence.
- It is public from day one, separate from the parts of the Forge repo that remain internal or noisy.
- It benefits from a cleaner content workflow and visual design system that should not churn the CLI repo.
- It should be easy to invite design/copy collaborators without giving them the same working surface as Forge core implementation.

The risk of a separate repo is drift. The pipeline mitigates that by pulling from forge's source of truth on every change: generated content is re-emitted in forge CI and delivered via PR; synced prose is pulled from allowlisted forge docs. The site is coupled to forge's stable operator-visible surface via a versioned export contract, not to its internals.

## Two-layer design

### Layer 1 — Generation (forge-side)

Generation runs in forge's CI, never in forge-site's build. This keeps forge-site's build free of native tooling dependencies and gives generators native access to forge's source tree.

| Content | Generator |
|---|---|
| CLI reference | Commander introspection (~100–200 lines TS walking commander's public `Help`/`Command` APIs) → structured JSON emitted by forge |
| Workflow reference | `@adobe/jsonschema2md` run as a forge-site build step against forge's workflow JSON Schema |
| Concept / how-to prose | Sync of allowlisted `docs/*.md` from forge → MDX passthrough with forge-side frontmatter injection |

**Ruled out:** Mintlify, Fern, Speakeasy, Stainless, and similar platforms. They would replace Starlight and still cannot document a commander CLI tree or YAML workflow definitions. Adopting one adds lock-in and cost while solving neither problem.

### Layer 2 — Delivery

CI-bot + PR via `peter-evans/create-pull-request`. When forge CI runs, generators emit their artifacts and a single updating PR is opened (or force-updated) into forge-site. The PR carries a `content-only` or `structural` label (see [Auto-merge policy](#auto-merge-policy)) that determines whether it merges automatically or awaits human review.

## Export contract

The export contract is the keystone of the pipeline. It is split by content type.

### Generated content → structured JSON

forge emits:

- A **semantic command tree** (CLI reference) as JSON
- A **workflow manifest** + the **workflow JSON Schema** (used by `@adobe/jsonschema2md` in the forge-site build)

forge-site owns all Starlight rendering from these artifacts. forge must never reference Starlight frontmatter, MDX imports, or Astro IA — that is the consumer's concern, not the producer's.

The JSON carries a top-level `schema_version` field (starting at `1`). Versioning rules:

- New fields are backward-compatible; no version bump required.
- Removed or renamed fields are **breaking** and require a forge-site renderer update before the PR can merge.
- forge-site's build **fails** if `schema_version` is absent or unrecognized.

MDX-for-generated was explicitly rejected: it couples forge to Starlight's frontmatter structure, making the boundary lossy and difficult to migrate if the rendering layer ever changes.

### Synced content → MDX passthrough

forge's `docs/*.md` prose syncs to forge-site as MDX with forge-side frontmatter injection: `title` derived from H1, `description` from the first paragraph. No JSON indirection for prose — the markdown is the payload.

Sync is driven by an **explicit allowlist** (not a glob), so forge's plan/design/architecture docs never leak into the public site. Only docs describing shipped, stable behavior qualify. **The allowlist starts empty at first deployment.**

## Content buckets and markers

Three content buckets, each with a distinct provenance convention:

| Bucket | Marker | Contents |
|---|---|---|
| **GENERATED** | `_generatedFrom: '<commit-URL>'` + `editUrl: false` | `/docs/reference/cli/*`, `/docs/reference/workflows/*` |
| **SYNCED** | `_syncedFrom: '<blob-URL>'` + `editUrl: false` | Allowlisted `docs/*.md` prose from forge |
| **AUTHORED** | *(none — absence of a marker = authored)* | Narrative pages (`how-forge-runs-work`, walkthroughs, `what-forge-does`), cross-cutting concept pages |

**Pre-slice-1 fix (resolved):** `src/content/docs/concepts/campaign-runner.mdx` is an AUTHORED page (no provenance marker). The incorrect `_generatedFrom` marker it previously carried was removed.

## Auto-merge policy

forge-site CI classifies every incoming pipeline PR as content-only or structural and applies the corresponding label:

| Diff type | Treatment | Triggers structural label |
|---|---|---|
| Content-only | Auto-merges on green CI (build + lychee + integration + e2e) | — |
| Structural | Human review required | File added or removed in generated/synced dirs (including command renames, which appear as add + delete), `astro.config.mjs` changes, `schema_version` bumps, first-run PRs, any change outside the generated/synced roots |

Classification is by file-count delta, not byte delta. A PR that only updates existing generated files is content-only even if it changes thousands of lines.

## Drift and provenance layer

Realizes FW-3 and FW-4 concretely:

- **Provenance:** `_generatedFrom` / `_syncedFrom` frontmatter on every non-authored page, pointing to the exact forge commit or blob URL that produced it.
- **Stale-gen detection:** `git diff --exit-code` on generated dirs in forge CI — if a source change would produce different output than what is committed, the build fails. Generators must be deterministic.
- **Dead-link check:** `lychee` runs in forge-site CI on every PR. No dead doc-link can ship.
- **Freshness check (optional):** compare the `_generatedFrom` SHA against forge `HEAD` to surface pages that haven't been regenerated since a forge change.

## FW-15 residual

The pipeline sidesteps the container mount gap for generated and synced content: generation runs forge-side with native source access, so the mount problem never arises for those buckets.

Residual risk is in the **authored** bucket only. Authored pages that reference forge internals (agent types, config fields, runtime behavior) cannot be technically enforced to stay current.

Process control: authored pages referencing forge internals require a human-provided source brief, cited as a comment at the top of the MDX file. This is a convention, not a build gate.

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

## Roadmap

### Work breakdown

**FW-9 — Pipeline epic** (re-parents FW-3, FW-4; FW-14 closed — PRD reconciliation done)

The overall forge → forge-site docs automation pipeline. Child items:

**FW-16 — Define and version the JSON export contract (schema v1)**
Specifies the command tree JSON shape, the workflow manifest JSON shape, the `schema_version` field contract, and the forge-site renderer interface. **Blocks all generator work.** No slice starts until this is merged and the schema_version handling is in place in forge-site's build.

**FW-17 — First slice: CLI-reference generator** *(depends on FW-16)*
Implement the commander introspection generator in forge, wire it into forge CI, emit the command tree JSON, build the forge-site renderer, and connect the full generate → JSON → render → stamp → PR → link-check → auto-merge loop end to end. This slice:
- Fixes the 2 live `/reference/*` 404s currently linked from `/how-routing-works`.
- Proves the complete pipeline before investing in subsequent generators.

**FW-3 — Drift guard: schema-validate the run-trace transform**

**FW-4 — Drift guard: link check + provenance marker**

**FW-18 — Authored-page source-brief convention**
Document the authored-bucket brief convention (source brief as an MDX comment for pages referencing forge internals); also covers writing the bucket marker-convention note. This is a process control, not a build gate.

Workflow-reference generator (slice 2) and concept-doc sync (slice 3, allowlist starts empty) are future child tickets, to be filed when their turn comes.

**Pre-slice-1 fix (resolved):** `src/content/docs/concepts/campaign-runner.mdx` carried a false `_generatedFrom` marker; removed. The authored-page convention is documented in FW-18.

### Sequencing

1. FW-16: Define JSON contract (schema v1) — blocks everything below
2. FW-17: CLI-reference generator (first slice; proves the full loop)
3. Workflow reference generator (future child ticket, to be filed)
4. Concept-doc sync (future child ticket, to be filed; allowlist starts empty)

## Open decisions

- Whether Remotion videos render in CI or only on demand.

## Non-goals for the first slice

- Full migration of all existing Forge docs in one go.
- Populating the synced-doc allowlist before the generated reference is proven.
- Syncing forge's plan, design, or architecture docs to the public site.
- Adopting a third-party docs platform (Mintlify, Fern, etc.).
- Dashboard replacement or in-dashboard docs.
- Every workflow diagram.
- Custom CMS.
- Complex analytics.
