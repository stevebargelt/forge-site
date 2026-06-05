import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GOVERNANCE_URL = new URL('../../fixtures/forge-route-governance.json', import.meta.url);
const RACI_URL = new URL('../../fixtures/forge-raci-source.md', import.meta.url);
const SHA_URL = new URL('../../fixtures/forge-provenance-sha.txt', import.meta.url);

// The five routes that constitute the teaching payload, in presentation order.
// path spread: in_session → invoke_chain → workflow → invoke (parallel) → invoke (conditional)
const CURATED_KEYS = [
  'strategy',
  'implementation_quick',
  'implementation_full',
  'review_security',
  'documentation_durable',
];

function extractRaciSnippets(raciSource) {
  const snippets = {};
  // Split on the lookahead '### route: ' so each chunk starts with its header
  const chunks = raciSource.split(/(?=^### route: )/m);
  for (const chunk of chunks) {
    const match = chunk.match(/^### route: (\w+)/);
    if (!match) continue;
    // trimEnd strips the blank line(s) between this block and the next
    snippets[match[1]] = chunk.trimEnd();
  }
  return snippets;
}

export function getRoutesProjection() {
  const governance = JSON.parse(readFileSync(GOVERNANCE_URL, 'utf8'));
  const raciSource = readFileSync(RACI_URL, 'utf8');
  const fullSha = readFileSync(SHA_URL, 'utf8').trim();
  const shortSha = fullSha.slice(0, 7);

  const raciSnippets = extractRaciSnippets(raciSource);
  const source = governance.source ?? 'host';

  const routes = CURATED_KEYS.map((key) => {
    const r = governance.routes[key];
    if (!r) throw new Error(`Route '${key}' not found in governance fixture`);
    const raciSnippet = raciSnippets[key];
    if (!raciSnippet) throw new Error(`RACI snippet not found for route '${key}'`);
    return {
      key,
      classification_hints: r.classification_hints,
      consulted: r.consulted,
      responsible: r.responsible,
      path: r.path,
      required_followups: r.required_followups,
      informed: r.informed,
      force_rules: r.force_rules,
      source,
      raciSnippet,
    };
  });

  return {
    provenance: {
      generatedFrom: `forge@${shortSha}`,
      fullSha,
      capturedAt: '2026-06-05T00:00:00.000Z',
    },
    accountable: governance.accountable,
    routes,
  };
}

// When run directly: regenerate src/data/routes.json and print a freshness warning if
// the committed SHA already differs from the fixture SHA (warn-only, no hard failure).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const OUTPUT_URL = new URL('../data/routes.json', import.meta.url);
  const projection = getRoutesProjection();

  const currentSha = readFileSync(SHA_URL, 'utf8').trim();
  if (projection.provenance.fullSha !== currentSha) {
    process.stderr.write(
      `WARN: routes.json SHA (${projection.provenance.fullSha}) does not match fixture (${currentSha}) — re-running to refresh\n`,
    );
  }

  writeFileSync(OUTPUT_URL, JSON.stringify(projection, null, 2) + '\n', 'utf8');
  process.stdout.write(`routes.json written → ${OUTPUT_URL.pathname}\n`);
}
