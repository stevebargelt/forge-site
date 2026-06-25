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

## Definitions

These terms are used consistently throughout this document and the pipeline implementation:

**PRODUCER ARTIFACT** — forge emits versioned semantic JSON/schema files with a provenance envelope (`schema_version`, forge commit SHA, `generated_at` timestamp). forge never renders MDX, never references Starlight frontmatter, and never emits Astro IA. The producer boundary ends at JSON/schema output.

**CONSUMER RENDERER** — forge-site validates the PRODUCER ARTIFACTs and renders them into committed MDX. All rendering is forge-site's responsibility: the CLI renderer (forge-site code) converts the command-tree JSON to MDX; `@adobe/jsonschema2md` (forge-site dependency) converts the workflow JSON Schema to MDX. Neither tool runs in forge CI.

**COMMITTED ROOTS** — the exact directory trees eligible for pipeline PR updates and auto-merge. See [Committed roots](#committed-roots) for the definitive list.

## Two-layer design

### Layer 1 — Semantic emission (forge-side)

Forge's CI emits semantic JSON and schema artifacts — it does not render. This keeps forge-site's build free of native tooling dependencies and gives emitters native access to forge's source tree.

| Content | forge emits |
|---|---|
| CLI reference | Commander introspection (~100–200 lines TS walking commander's public `Help`/`Command` APIs) → `src/data/generated/cli.schema-v1.json` |
| Workflow reference | Workflow manifest + workflow JSON Schema → `src/data/generated/workflows.schema-v1.json` (+ the workflow JSON Schema file) |
| Concept / how-to prose | Allowlisted `docs/*.md` files synced directly; no JSON indirection |

### Layer 2 — Rendering and delivery (forge-site-side)

forge-site's cross-repo PR flow runs the CONSUMER RENDERER after receiving the artifacts:

| Content | forge-site renderer |
|---|---|
| CLI reference | CLI renderer (forge-site code) converts `cli.schema-v1.json` → committed MDX under `src/content/docs/reference/cli/*` |
| Workflow reference | `@adobe/jsonschema2md` (forge-site dependency) converts the workflow JSON Schema → committed MDX under `src/content/docs/reference/workflows/*` |
| Concept / how-to prose | Synced MDX passthrough with sanitization (see [Synced-prose sanitization](#synced-prose-sanitization)) |

CI-bot + PR via `peter-evans/create-pull-request`. When forge CI runs, emitters produce their artifacts and a single updating PR is opened (or force-updated) into forge-site. The PR carries a `content-only` or `structural` label (see [Auto-merge policy](#auto-merge-policy)) that determines whether it merges automatically or awaits human review.

**Ruled out:** Mintlify, Fern, Speakeasy, Stainless, and similar platforms. They would replace Starlight and still cannot document a commander CLI tree or YAML workflow definitions. Adopting one adds lock-in and cost while solving neither problem.

## Export contract

The export contract is the keystone of the pipeline. It is split by content type.

### Generated content → semantic JSON artifacts

Forge emits the following artifacts, each carrying a top-level provenance envelope:

```jsonc
{
  "schema_version": 1,
  "generated_at": "<ISO-8601 timestamp>",
  "forge_sha": "<forge commit SHA>",
  // ... artifact-specific content
}
```

**CLI command tree:** emitted to `src/data/generated/cli.schema-v1.json`. Contains the full command tree as a structured JSON object (see FW-16 acceptance criteria for the required fields).

**Workflow manifest + JSON Schema:** emitted to `src/data/generated/workflows.schema-v1.json` (manifest) alongside the workflow JSON Schema file.

Versioning rules:

- New fields are backward-compatible; no version bump required.
- Removed or renamed fields are **breaking** and require a forge-site renderer update before the PR can merge.
- forge-site's build **fails** if `schema_version` is absent or unrecognized.

**MDX-for-generated was explicitly rejected:** it couples forge to Starlight's frontmatter structure, making the boundary lossy and difficult to migrate if the rendering layer ever changes.

### Rendering model: JSON → MDX (forge-site-side)

forge-site's CONSUMER RENDERER converts the JSON artifacts into committed MDX files:

- `src/data/generated/cli.schema-v1.json` → committed MDX under `src/content/docs/reference/cli/*`
- Workflow JSON Schema → committed MDX under `src/content/docs/reference/workflows/*`

**Both the JSON source of truth and the rendered MDX are committed.** Rendered MDX carries:
- `_generatedFrom: '<commit-URL>'` — derived from the provenance envelope's `forge_sha`
- `editUrl: false` — disables Starlight's "Edit this page" link

This gives Starlight auto-sidebar and pagefind search natively, without runtime generation.

The renderer runs in the cross-repo PR flow as forge-site code, not in forge CI.

#### Standalone pages vs. in-docs reference content

`/how-routing-works` renders `src/data/routes.json` directly in a standalone Astro page, with provenance shown in the UI. This is the pattern for **standalone pages** that live outside the `/docs` content collection.

In-docs reference content uses the JSON → MDX renderer so it integrates with Starlight's `/docs` content collection — giving search, sidebar, breadcrumbs, and inter-doc linking. These two patterns serve different needs and must not be conflated.

### Synced content → MDX passthrough

forge's `docs/*.md` prose syncs to forge-site as MDX with sanitization applied before the PR is opened (see [Synced-prose sanitization](#synced-prose-sanitization)).

Sync is driven by an **explicit allowlist** (not a glob), so forge's plan/design/architecture docs never leak into the public site. Only docs describing shipped, stable behavior qualify. **The allowlist starts empty at first deployment.**

## Committed roots

These are the exact directory trees eligible for pipeline PR updates and auto-merge. Auto-merge classification, provenance markers, and link-check scoping all depend on this list.

| Root | Type | Contents |
|---|---|---|
| `src/data/generated/**` | GENERATED (producer JSON) | CLI command-tree JSON, workflow manifest and JSON Schema emitted by forge CI |
| `src/content/docs/reference/**` | GENERATED (rendered MDX) | MDX rendered from the JSON artifacts; `_generatedFrom` + `editUrl: false` on every file |
| `src/content/docs/guides/**` | SYNCED | Allowlisted `docs/*.md` prose synced from forge; `_syncedFrom` + `editUrl: false` |
| Everything else under `src/content/docs/**` and `src/pages/**` | AUTHORED | Narrative pages, walkthroughs, concept pages; no provenance marker |

## Content buckets and markers

Three content buckets, each with a distinct provenance convention:

| Bucket | Marker | Contents |
|---|---|---|
| **GENERATED** | `_generatedFrom: '<commit-URL>'` + `editUrl: false` | `src/content/docs/reference/cli/*`, `src/content/docs/reference/workflows/*` |
| **SYNCED** | `_syncedFrom: '<blob-URL>'` + `editUrl: false` | Allowlisted `docs/*.md` prose from forge, synced to `src/content/docs/guides/**` |
| **AUTHORED** | *(none — absence of a marker = authored)* | Narrative pages (`how-forge-runs-work`, walkthroughs, `what-forge-does`), cross-cutting concept pages |

**Pre-slice-1 fix (resolved):** `src/content/docs/concepts/campaign-runner.mdx` is an AUTHORED page (no provenance marker). The incorrect `_generatedFrom` marker it previously carried was removed.

## Synced-prose sanitization

Before opening a PR for synced content, the sync step sanitizes each file. Sanitization is fail-loud: the sync fails rather than shipping broken or unsafe content.

| Input condition | Sanitization action |
|---|---|
| Existing frontmatter | Stripped and replaced with injected `title` (derived from H1) + `description` (from first paragraph) + `_syncedFrom` |
| Relative links | Rewritten to absolute site paths or absolute forge URLs |
| Images / static assets | Copied into forge-site's asset tree and URLs rewritten; file is rejected if copying fails |
| MDX imports / component usage | Disallowed — treated as untrusted; presence of any import or component fails the sync |
| Private / internal links | Detected; sync fails or link is stripped (behavior configurable per link pattern in the allowlist) |
| Duplicate H1 or title mismatch | Title derived from H1; duplicate H1 dropped from body |

## Auto-merge policy

forge-site CI classifies every incoming pipeline PR and applies the corresponding label. Labels are **computed by forge-site CI**; manually supplied labels are never trusted for merge eligibility.

A pipeline PR is **auto-merge-eligible** only if ALL of the following hold:

1. It originates from the expected bot/app identity and targets the expected branch.
2. Its `content-only` label was computed by forge-site CI (not manually applied).
3. All changed paths are within the declared COMMITTED ROOTS.
4. It is content-only: no URL/slug-set delta, no file add or remove within the roots, no structural frontmatter key change, no `schema_version` change.

**Classification is by path restriction + URL/slug-set delta + frontmatter keys + `schema_version` + add/remove — not by file count.** A manifest change that renames a command route changes the URL/slug set without adding or removing files — that is STRUCTURAL and requires human review even if the file count is unchanged.

Anything else is STRUCTURAL → human review required:

| Trigger | Treatment |
|---|---|
| URL/slug-set delta (route rename, new or removed command) | Structural — human review |
| File added or removed in committed roots | Structural — human review |
| Frontmatter structural-key change | Structural — human review |
| `schema_version` bump | Structural — human review |
| `astro.config.mjs` changes | Structural — human review |
| First-run PR | Structural — human review |
| Any path outside the committed roots | Structural — human review |

## Drift and provenance layer

Realizes FW-3 and FW-4 concretely:

- **Provenance:** `_generatedFrom` / `_syncedFrom` frontmatter on every non-authored page, pointing to the exact forge commit or blob URL that produced it.
- **Stale-gen detection:**
  - forge CI runs `git diff --exit-code` on the emitted JSON artifacts (`src/data/generated/**`) — if a forge source change would produce different JSON than what is committed, forge CI fails. Emitters must be deterministic.
  - forge-site CI runs `git diff --exit-code` on the rendered MDX (`src/content/docs/reference/**`) — if re-running the renderer over the committed JSON would produce different MDX than what is committed, forge-site CI fails. The renderer must be deterministic.
- **Dead-link check:** `lychee` runs in forge-site CI on every PR. No dead doc-link can ship.
- **Freshness check (optional):** compare the `_generatedFrom` SHA against forge `HEAD` to surface pages that haven't been regenerated since a forge change.

## FW-15 residual

The pipeline sidesteps the container mount gap for generated and synced content: generation runs forge-side with native source access, so the mount problem never arises for those buckets.

Residual risk is in the **authored** bucket only. Authored pages that reference forge internals (agent types, config fields, runtime behavior) cannot be technically enforced to stay current.

Process control: authored pages referencing forge internals require a human-provided source brief, cited as a comment at the top of the MDX file. This is a convention, not a build gate. A review checklist for applying this convention is maintained in `CLAUDE.md`/`CONTRIBUTING` (authored by FW-18) and applied at PR review.

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

Use **GSAP over SVG** for interactive animations embedded in site pages. Framer Motion will be added only if React islands become necessary for interactive animations.

Best for:

- A task moving from pending -> running -> awaiting_gate -> complete.
- Reds reviewing build output.
- The orchestrator consuming `forge ops check --json`.
- Provider/profile routing across Claude, Codex, and future providers.

This approach keeps animation code in the repo, so agents can build, test, and maintain it.

### Exportable videos

Use **Remotion** for rendered explainer videos and GIFs.

Best for:

- A 30-60 second "What is Forge?" explainer.
- Product demos.
- Release videos.
- Animated walkthroughs that need MP4/WebM export.

Remotion keeps videos code-owned and reusable.

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

The overall forge → forge-site docs automation pipeline. Child items (forge-site stories):

**FW-16 — Export contract spec (schema v1) + forge-site build validation.** BLOCKS the slices. (The EMITTER that produces conforming JSON is forge-SIDE — see forge-side work list.)

Acceptance criteria for `cli.schema-v1.json` — the schema must carry, for each command node:

- `id` / `slug` — stable identifier used as the URL slug; must not change without a `schema_version` bump
- `name` / `path` — display name and full command path (e.g. `forge ops check`)
- `summary` — one-line description used in command listings
- `description` — full description used on the command's detail page
- `aliases` — list of accepted alternative names
- `arguments` — positional args, each with: `name`, `description`, `required`, `variadic`
- `options` — flags/options, each with: `name`, `aliases`, `description`, `type`, `default`, `required`, `variadic`, `repeatable`
- `inherited_options` — global/inherited options carried by this command (may reference a shared definition)
- `examples` — list of `{ description, command }` pairs
- `hidden` — boolean; hidden commands are excluded from rendered docs
- `deprecated` — boolean or deprecation-message string; rendered with a deprecation callout
- `ordering` — explicit ordering rules for arguments and options in rendered output
- Provenance envelope at root: `schema_version`, `forge_sha`, `generated_at`

forge-site's build must fail if `schema_version` is absent, unrecognized, or if any required field is missing from a non-hidden command node. Schema validation runs before rendering begins.

**FW-17 — CLI reference RENDERER (forge-site):** `cli.schema-v1.json` → committed MDX under `src/content/docs/reference/cli/*`, `_generatedFrom` + `editUrl:false`. *(Narrowed from the original 'full loop' scope — emitter is forge-side; delivery+auto-merge is FW-19.)*

**FW-19 — Cross-repo delivery + auto-merge classifier (forge-site CI):** receive the pipeline PR, compute the content-only/structural label (CI-computed, bot-identity-gated, path/slug-delta based), run CI gates, auto-merge on green content-only. Security-sensitive.

**FW-20 — Stale-gen determinism check on rendered MDX (forge-site CI git diff).** Pairs with the forge-side JSON-side check.

**FW-21 — Workflow reference renderer (forge-site, @adobe/jsonschema2md).** Slice 2.

**FW-22 — Synced concept-docs: sanitization contract + allowlist (starts empty) + Starlight integration (forge-site).** Slice 3.

**FW-3 — Drift guard: schema-validate the run-trace transform.**

**FW-4 — Drift guard: lychee link-check + provenance marker.**

**FW-18 — Authored-page source-brief convention + review checklist.**

**Pre-slice-1 fix (resolved):** `src/content/docs/concepts/campaign-runner.mdx` carried a false `_generatedFrom` marker; removed. The authored-page convention is documented in FW-18.

### Forge-side work

The producer-side deliverables (CLI + workflow JSON emitters, forge-CI stale-gen JSON check, cross-repo PR delivery, synced-prose sync+sanitizer, contract conformance) live in the FORGE repo and are enumerated for the forge orchestrator in `research/forge-side-pipeline-work.md`.

### Sequencing

1. FW-16 + forge-side CLI emitter (contract + producer)
2. CLI slice end-to-end: FW-17 (render) + FW-19 (deliver/auto-merge) + FW-20 (MDX drift). FW-3/FW-4 land alongside this slice.
3. FW-21: workflow reference renderer (slice 2)
4. FW-22: synced concept-docs (slice 3)

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
- Remotion video production — not needed for FW-16 or FW-17; the motion stack for these slices is GSAP on-page animations only.
