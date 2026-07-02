#!/usr/bin/env node
/**
 * Validates a forge-docs export-contract artifact against its meta-schema (FW-16).
 *
 * Usage:
 *   node scripts/validate-schema-export.mjs <schema-file> <artifact-file>
 *   node scripts/validate-schema-export.mjs   # no args: validates every known
 *                                              # producer artifact under src/data/generated/
 *                                              # that has actually been emitted; skips the rest.
 *
 * Exits non-zero (and fails the forge-site build, since this runs as "prebuild")
 * when an artifact that IS present fails validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const KNOWN_PAIRS = [
  { schema: 'src/schemas/cli.schema-v1.schema.json', artifact: 'src/data/generated/cli.schema-v1.json' },
  { schema: 'src/schemas/workflows.schema-v1.schema.json', artifact: 'src/data/generated/workflows.schema-v1.json' },
];

function readJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'));
}

export function validateArtifact(schemaRelPath, artifactRelPath) {
  const schema = readJson(schemaRelPath);
  const artifact = readJson(artifactRelPath);
  // strictRequired: false — the hidden-command if/then "required" lists fields
  // declared in the enclosing schema's "properties", not the "then" branch's own;
  // ajv's strict mode otherwise treats that as a likely typo.
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
  const validate = ajv.compile(schema);
  const valid = validate(artifact);
  return {
    valid,
    errors: valid
      ? []
      : validate.errors.map((e) => `${e.instancePath || '/'} ${e.message} (${JSON.stringify(e.params)})`),
  };
}

function main() {
  const args = process.argv.slice(2);
  let failed = false;

  if (args.length === 2) {
    const [schemaPath, artifactPath] = args;
    const { valid, errors } = validateArtifact(schemaPath, artifactPath);
    if (!valid) {
      process.stderr.write(`FAIL ${artifactPath} against ${schemaPath}:\n  ${errors.join('\n  ')}\n`);
      process.exit(1);
    }
    process.stdout.write(`OK ${artifactPath} conforms to ${schemaPath}\n`);
    return;
  }

  if (args.length !== 0) {
    process.stderr.write('Usage: validate-schema-export.mjs [<schema-file> <artifact-file>]\n');
    process.exit(2);
  }

  for (const { schema, artifact } of KNOWN_PAIRS) {
    if (!existsSync(join(ROOT, artifact))) {
      process.stdout.write(`SKIP ${artifact} (not yet emitted)\n`);
      continue;
    }
    const { valid, errors } = validateArtifact(schema, artifact);
    if (!valid) {
      failed = true;
      process.stderr.write(`FAIL ${artifact} against ${schema}:\n  ${errors.join('\n  ')}\n`);
    } else {
      process.stdout.write(`OK ${artifact} conforms to ${schema}\n`);
    }
  }

  if (failed) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
