---
id: FW-18
type: story
status: active
title: "docs: authored-page source-brief convention (pipeline author-path process control)"
created: 2026-06-25
---

Parent: FW-9 (forge-docs automation pipeline epic).

The pipeline sidesteps the container mount gap for GENERATED/SYNCED content (generation runs forge-side with native source access). Residual risk is the AUTHORED bucket only: a forge-invoked agent authoring a concept page that references forge internals cannot read the forge repo (mounts forge-site only) — the cause of the two accuracy defects in campaign-runner.mdx.

Process control (not a build gate): document in CLAUDE.md / CONTRIBUTING that authored pages referencing forge internals require a human-provided source brief, cited as a comment at the top of the MDX. Also document the bucket marker convention: _generatedFrom (commit URL) = generated; _syncedFrom (blob URL) = synced; no marker = authored. See docs/prds/forge-website-platform.md (Content buckets and markers, FW-15 residual).