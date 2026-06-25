# Forge-side work — forge → forge-site docs automation pipeline

**Purpose:** the producer-side (forge repo) deliverables for the docs automation pipeline, for the **forge orchestrator** to ingest, validate against forge's structure, and file in forge's own backlog. The consumer-side (forge-site) work is already filed under epic **FW-9** in forge-site's backlog.

**Context:** forge is the PRODUCER — it emits versioned semantic JSON/schema artifacts with a provenance envelope and **never renders MDX or references Starlight/Astro**. forge-site is the CONSUMER — it validates and renders (JSON → MDX). The boundary contract is **schema v1** (forge-site spec ticket: FW-16). Authoritative design: `forge-site/docs/prds/forge-website-platform.md`.

**Cross-references:** forge-site consumer tickets — FW-16 (contract spec + build validation), FW-17 (CLI renderer), FW-19 (delivery + auto-merge classifier + render handoff), FW-20 (stale-gen MDX check), FW-21 (workflow renderer), FW-22 (synced sanitization contract + allowlist + integration).

---

## P1. CLI command-tree JSON emitter  *(blocks the first slice)*

Walk commander's public `Help`/`Command` APIs (v14+: `visibleCommands/Options/Arguments`, `Command.commands/.options/.registeredArguments/.name/.description/.alias`) and emit `cli.schema-v1.json` conforming to the contract.

Per-command fields (must match FW-16 schema v1): stable `id`/`slug` (rename-detectable; URL slug), `name`/`path` (e.g. `forge ops check`), `summary`, `description`, `aliases`, `arguments` (name/description/required/variadic), `options` (name/aliases/description/type/default/required/variadic/repeatable), `inherited_options`, `examples` (`{description, command}`), `hidden` (bool), `deprecated` (bool|message), `ordering` rules.

Root provenance envelope: `schema_version: 1`, `forge_sha`, `generated_at`.

**Acceptance:** validates against the FW-16 JSON Schema; deterministic — re-running over unchanged source produces byte-identical JSON (required by P3 + forge-site FW-20); hidden commands present-with-flag in JSON (renderer excludes them).

## P2. Workflow manifest + JSON Schema emitter  *(slice 2)*

Emit `workflows.schema-v1.json` (manifest: name/description/path/category per workflow) **plus** the workflow YAML JSON Schema (doubles as editor validation via `$schema`). Same provenance envelope; deterministic. Consumed by forge-site FW-21 (`@adobe/jsonschema2md`).

## P3. forge CI — stale-gen determinism on emitted JSON

`git diff --exit-code` on the emitted JSON after re-emit in forge CI; **fail** if a forge source change would produce different JSON than what was delivered. Pairs with forge-site FW-20 (same check on rendered MDX). Emitters must be deterministic.

## P4. forge CI — cross-repo PR delivery

On relevant forge change: run emitters, then open/force-update a **single** PR into forge-site via `peter-evans/create-pull-request`. **The PR carries JSON only** for generated content (`src/data/generated/**`) — forge-site CI renders and commits the MDX on the PR branch (see "Render handoff" below). For synced content (slice 3), the PR also carries the **sanitized MDX** (the sanitizer is forge-side, P5). Use a **dedicated bot/app identity + target branch** — forge-site's auto-merge classifier (FW-19) gates eligibility on exactly this identity, so it must be stable and documented.

## P5. Synced-prose sync + sanitizer  *(slice 3)*

Read forge `docs/*.md` listed in the **forge-site-owned allowlist** (P5 **reads** the canonical allowlist from forge-site — does **not** duplicate it; decision below) and apply the **sanitization contract** (defined in FW-22, fail-loud): strip/replace frontmatter (inject `title` from H1, `description` from first paragraph, `_syncedFrom` blob URL); rewrite relative links to absolute site/forge URLs; copy+rewrite or reject images; **disallow** MDX imports/components (fail on presence); detect private/internal links (fail or strip); reconcile duplicate-H1 / title mismatch. Emit sanitized MDX for P4 delivery. Only docs describing **shipped, stable** behavior qualify — never plan/design/architecture docs.

## P6. Contract conformance (shared boundary)

The export contract (schema v1) is the producer/consumer boundary. forge-site FW-16 holds the spec + JSON Schema; forge's emitters (P1/P2) must validate their own output against that JSON Schema before delivery, and treat removed/renamed fields as a breaking `schema_version` bump.

---

## Resolved cross-repo decisions

1. **Render handoff — RESOLVED.** forge CI opens a **JSON-only** PR; **forge-site CI** runs the renderer and commits the rendered MDX to the PR branch. The renderer is forge-site code and **never runs in forge CI** (clean producer/consumer split). forge-side implication: P4 delivers JSON, not rendered MDX, for generated content.
2. **PR creation ownership — RESOLVED.** The **producer (forge CI)** opens/force-updates the PR (P4) under a dedicated bot identity.
3. **Allowlist home — RESOLVED.** **forge-site owns the single canonical allowlist** (committed config); forge's sync (P5) **reads it from forge-site**, does not keep its own copy.

## Remaining open question (for the forge orchestrator)

4. **Mirror epic.** Whether forge files P1–P6 as its own epic mirroring FW-9, referencing FW-16's schema v1 as the shared contract. forge's call, against its backlog conventions.
