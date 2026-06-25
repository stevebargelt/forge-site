# Forge-side work — forge → forge-site docs automation pipeline

**Purpose:** the producer-side (forge repo) deliverables for the docs automation pipeline, for the **forge orchestrator** to ingest, validate against forge's structure, and file in forge's own backlog. The consumer-side (forge-site) work is already filed under epic **FW-9** in forge-site's backlog.

**Context:** forge is the PRODUCER — it emits versioned semantic JSON/schema artifacts with a provenance envelope and **never renders MDX or references Starlight/Astro**. forge-site is the CONSUMER — it validates and renders (JSON → MDX). The boundary contract is **schema v1** (forge-site spec ticket: FW-16). Authoritative design: `forge-site/docs/prds/forge-website-platform.md`.

**Cross-references:** forge-site consumer tickets — FW-16 (contract spec + build validation), FW-17 (CLI renderer), FW-19 (delivery + auto-merge classifier), FW-20 (stale-gen MDX check), FW-21 (workflow renderer), FW-22 (synced sanitization contract + allowlist + integration).

---

## P1. CLI command-tree JSON emitter  *(blocks the first slice)*

Walk commander's public `Help`/`Command` APIs (v14+: `visibleCommands/Options/Arguments`, `Command.commands/.options/.registeredArguments/.name/.description/.alias`) and emit `cli.schema-v1.json` conforming to the contract.

Per-command fields (must match FW-16 schema v1): stable `id`/`slug` (rename-detectable; URL slug), `name`/`path` (e.g. `forge ops check`), `summary`, `description`, `aliases`, `arguments` (name/description/required/variadic), `options` (name/aliases/description/type/default/required/variadic/repeatable), `inherited_options`, `examples` (`{description, command}`), `hidden` (bool), `deprecated` (bool|message), `ordering` rules.

Root provenance envelope: `schema_version: 1`, `forge_sha`, `generated_at`.

**Acceptance:** validates against schema v1; deterministic — re-running over unchanged source produces byte-identical JSON (required by P3 + forge-site FW-20); hidden commands present-with-flag in JSON (renderer excludes them).

## P2. Workflow manifest + JSON Schema emitter  *(slice 2)*

Emit `workflows.schema-v1.json` (manifest: name/description/path/category per workflow) **plus** the workflow YAML JSON Schema (doubles as editor validation via `$schema`). Same provenance envelope; deterministic. Consumed by forge-site FW-21 (`@adobe/jsonschema2md`).

## P3. forge CI — stale-gen determinism on emitted JSON

`git diff --exit-code` on the emitted JSON after re-emit in forge CI; **fail** if a forge source change would produce different JSON than what was delivered. Pairs with forge-site FW-20 (same check on rendered MDX). Emitters must be deterministic.

## P4. forge CI — cross-repo PR delivery

On relevant forge change: run emitters, then open/force-update a **single** PR into forge-site via `peter-evans/create-pull-request` carrying the JSON artifacts (and, slice 3, the sanitized synced MDX). Use a **dedicated bot/app identity + target branch** — forge-site's auto-merge classifier (FW-19) gates eligibility on exactly this identity, so it must be stable and documented.

## P5. Synced-prose sync + sanitizer  *(slice 3)*

Read **allowlisted** forge `docs/*.md` (allowlist owned by forge-site FW-22; starts empty) and apply the **sanitization contract** (defined in FW-22, fail-loud): strip/replace frontmatter (inject `title` from H1, `description` from first paragraph, `_syncedFrom` blob URL); rewrite relative links to absolute site/forge URLs; copy+rewrite or reject images; **disallow** MDX imports/components (fail on presence); detect private/internal links (fail or strip); reconcile duplicate-H1 / title mismatch. Emit sanitized MDX for P4 delivery. Only docs describing **shipped, stable** behavior qualify — never plan/design/architecture docs.

## P6. Contract conformance (shared boundary)

The export contract (schema v1) is the producer/consumer boundary. forge-site FW-16 holds the spec; forge's emitters (P1/P2) must validate their own output against the same schema before delivery, and treat removed/renamed fields as a breaking `schema_version` bump.

---

## Open placement questions (for the forge orchestrator to resolve against forge's structure)

1. **Renderer execution site.** The JSON→MDX renderer is forge-site *code*; PRD says it runs "in the cross-repo PR flow." Confirm whether it executes in forge CI (pre-PR) or forge-site CI (on the PR). Affects where P4 hands off.
2. **PR creation ownership.** P4 assumes the producer (forge CI) opens the PR. Confirm vs. a shared/reusable workflow.
3. **Allowlist home.** FW-22 says forge-site owns the synced-doc allowlist; confirm forge's sync (P5) reads it from forge-site rather than duplicating it.
4. **Mirror epic.** Whether forge files these as its own epic mirroring FW-9, with FW-16's schema v1 as the shared contract reference.
