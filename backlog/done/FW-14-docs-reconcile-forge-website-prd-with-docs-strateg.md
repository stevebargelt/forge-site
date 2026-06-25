---
id: FW-14
type: story
status: done
title: "docs: reconcile forge-website PRD with docs-strategy reversal + /how-routing-works"
closed: 2026-06-25
---

docs/prds/forge-website-platform.md still encodes the OLD 'site explains concepts, links out, NEVER restate CLI/schema' strategy. That was reversed: forge-site now HOSTS forge's docs via an automated forge->forge-site sync (research/forge-docs-pipeline-2026-06-05.md; memory docs-convenience-over-drift-avoidance).

Now concrete because #13 shipped the first consumer: /how-routing-works renders forge's real routing policy from a committed projection (src/data/routes.json) with a forge@<sha> provenance marker. The PRD should reflect: the hosted-docs direction, the export-contract/committed-artifact pattern, the provenance/drift-guard layer (#3/#4), and the new page in the site IA.

Route to documentation-maintainer (durable docs). Deferral target for #13's operator_behavior_changed docs-impact.