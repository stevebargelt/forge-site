/**
 * FW-16 — forge-docs JSON export contract, schema v1.
 *
 * Validates:
 *   - the sample CLI fixture conforms to src/schemas/cli.schema-v1.schema.json
 *   - the validator correctly rejects the documented negative cases:
 *       missing schema_version, unrecognized schema_version,
 *       and a missing required field on a non-hidden command node
 *   - a hidden command node is exempt from the full required-field set
 *   - the workflow-manifest meta-schema accepts a minimal valid manifest
 *     and rejects the same class of negative cases
 *   - the validate-schema-export CLI script exits 0 for the sample fixture
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateArtifact } from '../../scripts/validate-schema-export.mjs';
import Ajv from 'ajv';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function compileCliSchema() {
  const schema = readJson('src/schemas/cli.schema-v1.schema.json');
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
  return ajv.compile(schema);
}

function compileWorkflowsSchema() {
  const schema = readJson('src/schemas/workflows.schema-v1.schema.json');
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
  return ajv.compile(schema);
}

// ── CLI schema: sample fixture is valid ────────────────────────────────────

describe('cli.schema-v1 sample fixture', () => {
  it('conforms to the meta-schema', () => {
    const { valid, errors } = validateArtifact(
      'src/schemas/cli.schema-v1.schema.json',
      'fixtures/cli.schema-v1.sample.json',
    );
    assert.ok(valid, `sample fixture should be valid, got errors: ${errors.join('; ')}`);
  });

  it('has at least one hidden command and one deprecated command', () => {
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    assert.ok(sample.commands.some((c) => c.hidden === true), 'expected at least one hidden command');
    assert.ok(
      sample.commands.some((c) => typeof c.deprecated === 'string'),
      'expected at least one command with a deprecation message',
    );
  });
});

// ── CLI schema: negative cases ─────────────────────────────────────────────

describe('cli.schema-v1 negative cases', () => {
  it('rejects an artifact missing schema_version', () => {
    const validate = compileCliSchema();
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    delete sample.schema_version;
    assert.equal(validate(sample), false, 'expected validation to fail when schema_version is missing');
  });

  it('rejects an artifact with an unrecognized schema_version', () => {
    const validate = compileCliSchema();
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    sample.schema_version = 2;
    assert.equal(validate(sample), false, 'expected validation to fail for schema_version: 2');
  });

  it('rejects a non-hidden command node missing a required field (summary)', () => {
    const validate = compileCliSchema();
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    const visible = sample.commands.find((c) => c.hidden === false);
    delete visible.summary;
    assert.equal(validate(sample), false, 'expected validation to fail when a visible command lacks summary');
  });

  it('rejects a non-hidden command node missing a required field (ordering)', () => {
    const validate = compileCliSchema();
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    const visible = sample.commands.find((c) => c.hidden === false);
    delete visible.ordering;
    assert.equal(validate(sample), false, 'expected validation to fail when a visible command lacks ordering');
  });

  it('accepts a hidden command node that omits summary/description/examples/ordering', () => {
    const validate = compileCliSchema();
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    sample.commands = sample.commands.filter((c) => c.hidden === true);
    const stub = sample.commands[0];
    assert.ok(stub, 'fixture must contain a hidden command to exercise this case');
    delete stub.summary;
    delete stub.description;
    delete stub.ordering;
    assert.equal(validate(sample), true, `expected hidden-only stub to validate, got: ${JSON.stringify(validate.errors)}`);
  });
});

// ── Workflow-manifest meta-schema (shape settled for FW-21) ────────────────

describe('workflows.schema-v1 meta-schema', () => {
  const minimalManifest = {
    schema_version: 1,
    forge_sha: 'bbb1c136b5723e63d653a05d100f00b3d1a40fc8',
    generated_at: '2026-06-25T09:00:00Z',
    workflows: [
      {
        id: 'deploy',
        name: 'deploy',
        path: 'workflows/deploy.yml',
        summary: 'Deploy the current build.',
        description: 'Runs the deploy workflow against the target environment.',
        schema_ref: '#/definitions/deploy',
        hidden: false,
        deprecated: false,
      },
    ],
  };

  it('accepts a minimal valid manifest', () => {
    const validate = compileWorkflowsSchema();
    assert.equal(validate(minimalManifest), true, `expected valid, got: ${JSON.stringify(validate.errors)}`);
  });

  it('rejects a manifest missing schema_version', () => {
    const validate = compileWorkflowsSchema();
    const manifest = structuredClone(minimalManifest);
    delete manifest.schema_version;
    assert.equal(validate(manifest), false);
  });

  it('rejects a manifest with an unrecognized schema_version', () => {
    const validate = compileWorkflowsSchema();
    const manifest = structuredClone(minimalManifest);
    manifest.schema_version = 99;
    assert.equal(validate(manifest), false);
  });

  it('rejects a non-hidden workflow entry missing schema_ref', () => {
    const validate = compileWorkflowsSchema();
    const manifest = structuredClone(minimalManifest);
    delete manifest.workflows[0].schema_ref;
    assert.equal(validate(manifest), false);
  });

  it('accepts a hidden workflow entry that omits summary/description/schema_ref', () => {
    const validate = compileWorkflowsSchema();
    const manifest = structuredClone(minimalManifest);
    manifest.workflows[0].hidden = true;
    delete manifest.workflows[0].summary;
    delete manifest.workflows[0].description;
    delete manifest.workflows[0].schema_ref;
    assert.equal(validate(manifest), true, `expected hidden-only stub to validate, got: ${JSON.stringify(validate.errors)}`);
  });
});

// ── validate-schema-export.mjs CLI wrapper ─────────────────────────────────

describe('validate-schema-export.mjs CLI', () => {
  it('exits 0 and reports OK for the sample fixture', () => {
    const output = execFileSync(
      'node',
      ['scripts/validate-schema-export.mjs', 'src/schemas/cli.schema-v1.schema.json', 'fixtures/cli.schema-v1.sample.json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.match(output, /^OK /);
  });

  it('exits non-zero for a broken artifact', () => {
    const broken = join(ROOT, 'fixtures/.tmp-broken-cli-sample.json');
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    delete sample.schema_version;
    writeFileSync(broken, JSON.stringify(sample));
    try {
      assert.throws(() => {
        execFileSync('node', ['scripts/validate-schema-export.mjs', 'src/schemas/cli.schema-v1.schema.json', 'fixtures/.tmp-broken-cli-sample.json'], {
          cwd: ROOT,
          encoding: 'utf8',
        });
      });
    } finally {
      unlinkSync(broken);
    }
  });

  it('skips gracefully with exit 0 when no generated artifacts exist yet', () => {
    const output = execFileSync('node', ['scripts/validate-schema-export.mjs'], { cwd: ROOT, encoding: 'utf8' });
    assert.match(output, /SKIP/);
  });
});

// ── cli.schema-v1: positive field-shape coverage ────────────────────────────
// The engineer's suite confirms the *sample fixture* validates and that hidden
// commands are exempt from most requirements, but never asserts, in isolation,
// that the specific field shapes called out in the FW-16 acceptance criteria
// (inherited_options, deprecated as bool/string, examples) actually pass ajv.
// A schema typo in any one of these (e.g. wrong 'deprecated' type union) would
// still let the full fixture pass as long as no field in the fixture happened
// to exercise the broken branch, so we pin each shape down directly.

describe('cli.schema-v1 positive field-shape coverage', () => {
  function minimalValidCommand(overrides = {}) {
    return {
      id: 'widget',
      name: 'widget',
      path: 'forge widget',
      summary: 'Do widget things.',
      description: 'Full description of widget things.',
      aliases: [],
      arguments: [],
      options: [],
      inherited_options: ['--verbose'],
      examples: [{ description: 'Run it', command: 'forge widget' }],
      hidden: false,
      deprecated: false,
      ordering: { arguments: 'declaration', options: 'declaration' },
      ...overrides,
    };
  }

  function artifactWith(command) {
    return {
      schema_version: 1,
      forge_sha: 'bbb1c136b5723e63d653a05d100f00b3d1a40fc8',
      generated_at: '2026-06-25T09:00:00Z',
      global_options: [
        {
          name: '--verbose',
          aliases: ['-v'],
          description: 'Print debug-level logging.',
          type: 'boolean',
          default: false,
          required: false,
          variadic: false,
          repeatable: false,
        },
      ],
      commands: [command],
    };
  }

  it('validates a command whose inherited_options names an entry present in global_options', () => {
    const validate = compileCliSchema();
    const artifact = artifactWith(minimalValidCommand({ inherited_options: ['--verbose'] }));
    assert.equal(validate(artifact), true, `expected valid, got: ${JSON.stringify(validate.errors)}`);
  });

  it('validates deprecated: false (boolean form)', () => {
    const validate = compileCliSchema();
    const artifact = artifactWith(minimalValidCommand({ deprecated: false }));
    assert.equal(validate(artifact), true, `expected valid, got: ${JSON.stringify(validate.errors)}`);
  });

  it('validates deprecated as a message string', () => {
    const validate = compileCliSchema();
    const artifact = artifactWith(minimalValidCommand({ deprecated: 'Use `forge widget2` instead.' }));
    assert.equal(validate(artifact), true, `expected valid, got: ${JSON.stringify(validate.errors)}`);
  });

  it('validates an examples entry shaped as { description, command }', () => {
    const validate = compileCliSchema();
    const artifact = artifactWith(
      minimalValidCommand({ examples: [{ description: 'List widgets', command: 'forge widget list' }] }),
    );
    assert.equal(validate(artifact), true, `expected valid, got: ${JSON.stringify(validate.errors)}`);
  });

  it('is not cross-validated: inherited_options may name an entry absent from global_options', () => {
    // Documents current, intentional schema behavior: inherited_options is a
    // plain string array (see cli.schema-v1.schema.json definitions.command),
    // not cross-checked against global_options by ajv. If this ever starts
    // failing, someone added referential-integrity validation — update this
    // test's expectation (and the schema description) rather than "fixing" it.
    const validate = compileCliSchema();
    const artifact = artifactWith(minimalValidCommand({ inherited_options: ['--does-not-exist'] }));
    assert.equal(validate(artifact), true, `expected valid (no cross-check), got: ${JSON.stringify(validate.errors)}`);
  });

  it('accepts a truly minimal hidden command carrying only id/name/path/hidden', () => {
    const validate = compileCliSchema();
    const artifact = artifactWith({ id: 'stub', name: 'stub', path: 'forge stub', hidden: true });
    assert.equal(validate(artifact), true, `expected minimal hidden stub to validate, got: ${JSON.stringify(validate.errors)}`);
  });

  it('rejects an examples entry missing the required "command" field', () => {
    const validate = compileCliSchema();
    const artifact = artifactWith(minimalValidCommand({ examples: [{ description: 'Missing command field' }] }));
    assert.equal(validate(artifact), false, 'expected validation to fail when an example omits "command"');
  });
});

// ── validate-schema-export.mjs: mixed presence under src/data/generated/ ───
// The engineer's suite only covers the "nothing emitted yet" all-SKIP case.
// FW-16 explicitly requires the build to fail once an artifact IS emitted and
// invalid, while continuing to SKIP artifacts that still don't exist — these
// are the two states the prebuild gate will actually see once the forge-side
// emitter starts landing artifacts one at a time.

describe('validate-schema-export.mjs CLI — mixed generated-artifact presence', () => {
  const GENERATED_DIR = join(ROOT, 'src/data/generated');
  const CLI_ARTIFACT = join(GENERATED_DIR, 'cli.schema-v1.json');

  after(() => {
    if (existsSync(CLI_ARTIFACT)) unlinkSync(CLI_ARTIFACT);
    if (existsSync(GENERATED_DIR)) rmSync(GENERATED_DIR, { recursive: true, force: true });
  });

  it('validates a present-and-valid cli artifact while skipping the not-yet-emitted workflows artifact', () => {
    mkdirSync(GENERATED_DIR, { recursive: true });
    writeFileSync(CLI_ARTIFACT, readFileSync(join(ROOT, 'fixtures/cli.schema-v1.sample.json'), 'utf8'));
    try {
      const output = execFileSync('node', ['scripts/validate-schema-export.mjs'], { cwd: ROOT, encoding: 'utf8' });
      assert.match(output, /OK src\/data\/generated\/cli\.schema-v1\.json/);
      assert.match(output, /SKIP src\/data\/generated\/workflows\.schema-v1\.json/);
    } finally {
      unlinkSync(CLI_ARTIFACT);
    }
  });

  it('fails the build when a present cli artifact is invalid (missing schema_version)', () => {
    mkdirSync(GENERATED_DIR, { recursive: true });
    const sample = readJson('fixtures/cli.schema-v1.sample.json');
    delete sample.schema_version;
    writeFileSync(CLI_ARTIFACT, JSON.stringify(sample));
    try {
      assert.throws(() => {
        execFileSync('node', ['scripts/validate-schema-export.mjs'], { cwd: ROOT, encoding: 'utf8' });
      }, /Command failed/);
    } finally {
      unlinkSync(CLI_ARTIFACT);
    }
  });
});
