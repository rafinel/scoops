import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import {
  mutationContext,
  parseArguments,
  partitionMutationFiles,
  runMutation,
} from '../test-mutation.mjs'

function createRepository(t) {
  const root = mkdtempSync(join(tmpdir(), 'scoops-mutation-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const cwd = join(root, 'packages/core')
  function write(path, contents = 'export const value = 1\n') {
    const destination = join(root, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, contents)
  }
  function git(...args) {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
  }
  write('.gitignore', 'node_modules/\nreports/\n.env*\n')
  write('packages/core/src/catalog/use-cases/register-product-use-case.ts')
  write('packages/core/src/catalog/use-cases/other-use-case.ts')
  write('packages/core/src/catalog/use-cases/tests/register-product-use-case.test.ts')
  write('packages/core/src/catalog/fakers/product-faker.ts')
  write('packages/core/src/catalog/index.ts')
  write('packages/core/src/catalog/generated/schema.ts')
  write('packages/core/src/catalog/product.d.ts')
  write('packages/core/src/catalog/use-cases/order-pricing.ts')
  write('packages/core/src/catalog/domain/entities/product.ts')
  write('packages/core/src/catalog/domain/events/product-created-event.ts')
  write('packages/core/src/catalog/domain/errors/product-not-found-error.ts')
  write('packages/core/src/catalog/interfaces/products-repository.ts')
  write('packages/core/src/catalog/domain/entities/product-use-case.ts')
  git('init', '--initial-branch=main', '--quiet')
  git('config', 'user.email', 'mutation-test@example.invalid')
  git('config', 'user.name', 'Mutation Tests')
  git('add', '.')
  git('commit', '--quiet', '-m', 'initial')
  write(
    'packages/core/node_modules/@stryker-mutator/core/bin/stryker.js',
    `
const fs = require('node:fs')
const args = process.argv.slice(2)
const incrementalFile = args[args.indexOf('--incrementalFile') + 1]
const entry = { args, reused: fs.existsSync(incrementalFile) }
fs.appendFileSync('reports/mutation/invocations.jsonl', JSON.stringify(entry) + '\\n')
fs.writeFileSync(incrementalFile, '{}')
const status = Number(process.env.MUTATION_TEST_EXIT_STATUS ?? 0)
if (status === 0) {
  fs.writeFileSync('reports/mutation/index.html', '<html>current run</html>')
  fs.writeFileSync('reports/mutation/mutation.json', '{}')
}
process.exit(status)
`,
  )
  return { root, cwd, write, git }
}

function readInvocations(cwd) {
  return readFileSync(join(cwd, 'reports/mutation/invocations.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
}

test('rejects ambiguous, incomplete and unsupported command arguments', () => {
  for (const args of [
    ['--all', '--base', 'HEAD'],
    ['--base', 'HEAD', '--files', 'src/a.ts'],
    ['--all', '--files', 'src/a.ts'],
    ['--base'],
    ['--files'],
    ['--files', 'src/a.ts', '--files'],
    ['--unknown'],
  ])
    assert.throws(() => parseArguments(args))
  assert.deepEqual(
    parseArguments(['--', '--files', 'src/a.ts', '--force', '--dry-run']),
    {
      all: false,
      dryRun: true,
      force: true,
      base: undefined,
      shard: undefined,
      files: ['src/a.ts'],
    },
  )
})

test('shards require an explicit full scope and valid one-based N/M arguments', () => {
  for (const args of [
    ['--shard', '1/2'],
    ['--files', 'src/a.ts', '--shard', '1/2'],
    ['--all', '--shard'],
    ['--all', '--shard', '0/2'],
    ['--all', '--shard', '3/2'],
    ['--all', '--shard', '1/0'],
    ['--all', '--shard', '1.5/2'],
    ['--all', '--shard', '1/2x'],
    ['--all', '--shard', '01/2'],
    ['--all', '--shard', '1/9007199254740992'],
    ['--all', '--shard', '1/2', '--shard', '2/2'],
  ])
    assert.throws(() => parseArguments(args), /--shard/)
  assert.deepEqual(parseArguments(['--all', '--shard', '2/3']).shard, {
    index: 2,
    count: 3,
  })
})

test('shards balance source bytes deterministically without losing or duplicating targets', () => {
  const files = [
    { path: 'a.ts', bytes: 80 },
    { path: 'b.ts', bytes: 70 },
    { path: 'c.ts', bytes: 60 },
    { path: 'd.ts', bytes: 50 },
    { path: 'e.ts', bytes: 40 },
    { path: 'f.ts', bytes: 30 },
  ]
  const shards = partitionMutationFiles(files, 3)
  assert.deepEqual(shards, [
    ['a.ts', 'f.ts'],
    ['b.ts', 'e.ts'],
    ['c.ts', 'd.ts'],
  ])
  assert.deepEqual(partitionMutationFiles([...files].reverse(), 3), shards)
  assert.deepEqual(
    shards.flat().sort(),
    files.map(({ path }) => path),
  )
  assert.equal(new Set(shards.flat()).size, files.length)
  assert.deepEqual(
    shards.map((paths) =>
      files
        .filter(({ path }) => paths.includes(path))
        .reduce((sum, file) => sum + file.bytes, 0),
    ),
    [110, 110, 110],
  )
  assert.deepEqual(
    partitionMutationFiles(
      files.map((file) => ({ ...file, bytes: 1 })),
      3,
    ),
    [
      ['a.ts', 'd.ts'],
      ['b.ts', 'e.ts'],
      ['c.ts', 'f.ts'],
    ],
  )
})

test('sharded invocations pass each target once and cache only their final selected scope', async (t) => {
  const { cwd } = createRepository(t)
  for (const index of [1, 2]) {
    assert.equal(await runMutation(['--all', '--shard', `${index}/2`], cwd), 0)
    const manifest = JSON.parse(
      readFileSync(join(cwd, 'reports/mutation/context.json'), 'utf8'),
    )
    assert.deepEqual(manifest.scope, readInvocations(cwd).at(-1).args[3].split(','))
  }
  const invocations = readInvocations(cwd)
  assert.deepEqual(
    invocations.map(({ reused }) => reused),
    [false, false],
  )
  assert.deepEqual(invocations.flatMap(({ args }) => args[3].split(',')).sort(), [
    'src/catalog/use-cases/other-use-case.ts',
    'src/catalog/use-cases/register-product-use-case.ts',
  ])
  await assert.rejects(
    runMutation(['--all', '--shard', '3/3', '--dry-run'], cwd),
    /No eligible Core/,
  )
})

test('sharded dry runs identify the shard and leave reports untouched', async (t) => {
  const { cwd } = createRepository(t)
  const log = t.mock.method(console, 'log', () => {})
  assert.equal(await runMutation(['--all', '--shard', '2/2', '--dry-run'], cwd), 0)
  assert.match(log.mock.calls[0].arguments[0], /shard 2\/2/)
  assert.equal(existsSync(join(cwd, 'reports')), false)
  await assert.rejects(
    runMutation(
      ['--all', '--shard', '9007199254740991/9007199254740991', '--dry-run'],
      cwd,
    ),
    /No eligible Core/,
  )
})

test('full Core run targets only use-case files and passes exact scope to Stryker', async (t) => {
  const { cwd } = createRepository(t)
  assert.equal(await runMutation(['--all'], cwd), 0)
  const [{ args }] = readInvocations(cwd)
  assert.deepEqual(args.slice(0, 4), [
    'run',
    'stryker.config.mjs',
    '--mutate',
    'src/catalog/use-cases/other-use-case.ts,src/catalog/use-cases/register-product-use-case.ts',
  ])
})

test('default scope includes staged, unstaged and untracked use-case files', async (t) => {
  const { cwd, write, git } = createRepository(t)
  write(
    'packages/core/src/catalog/use-cases/register-product-use-case.ts',
    'export const value = 2\n',
  )
  git('add', 'packages/core/src/catalog/use-cases/register-product-use-case.ts')
  write(
    'packages/core/src/catalog/use-cases/other-use-case.ts',
    'export const value = 3\n',
  )
  write('packages/core/src/catalog/use-cases/new-use-case.ts')
  assert.equal(await runMutation([], cwd), 0)
  const [{ args }] = readInvocations(cwd)
  assert.equal(
    args[3],
    'src/catalog/use-cases/new-use-case.ts,src/catalog/use-cases/other-use-case.ts,src/catalog/use-cases/register-product-use-case.ts',
  )
})

test('explicit base includes committed changes beyond the current working tree', async (t) => {
  const { cwd, write, git } = createRepository(t)
  write(
    'packages/core/src/catalog/use-cases/register-product-use-case.ts',
    'export const value = 2\n',
  )
  git('add', '.')
  git('commit', '--quiet', '-m', 'change')
  assert.equal(await runMutation(['--base', 'HEAD~1'], cwd), 0)
  assert.equal(
    readInvocations(cwd)[0].args[3],
    'src/catalog/use-cases/register-product-use-case.ts',
  )
})

test('a test-only change selects its owning production boundary', async (t) => {
  const { cwd, write } = createRepository(t)
  write(
    'packages/core/src/catalog/use-cases/tests/register-product-use-case.test.ts',
    '// changed test\n',
  )
  assert.equal(await runMutation([], cwd), 0)
  assert.equal(
    readInvocations(cwd)[0].args[3],
    'src/catalog/use-cases/other-use-case.ts,src/catalog/use-cases/register-product-use-case.ts',
  )
})

test('empty selection and shared config changes cannot claim a passing mutation check', async (t) => {
  const { cwd, write } = createRepository(t)
  await assert.rejects(runMutation(['--dry-run'], cwd), /No eligible Core/)
  write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
  await assert.rejects(runMutation([], cwd), /Shared test\/configuration changes/)
  assert.equal(await runMutation(['--all', '--dry-run'], cwd), 0)
})

test('explicit scope rejects excluded, missing, escaping and glob paths', async (t) => {
  const { cwd } = createRepository(t)
  for (const path of [
    'src/catalog/use-cases/tests/register-product-use-case.test.ts',
    'src/catalog/fakers/product-faker.ts',
    'src/catalog/index.ts',
    'src/catalog/product.d.ts',
    'src/catalog/use-cases/order-pricing.ts',
    'src/catalog/domain/entities/product.ts',
    'src/catalog/domain/events/product-created-event.ts',
    'src/catalog/domain/errors/product-not-found-error.ts',
    'src/catalog/interfaces/products-repository.ts',
    'src/catalog/domain/entities/product-use-case.ts',
    'src/catalog/generated/schema.ts',
    'src/missing.ts',
    '../../outside.ts',
    'src/**/*.ts',
  ])
    await assert.rejects(
      runMutation(['--files', path, '--dry-run'], cwd),
      /Not an eligible/,
    )
})

test('incremental results are reused only for unchanged inputs and --force bypasses reuse', async (t) => {
  const { cwd, write } = createRepository(t)
  const args = ['--files', 'src/catalog/use-cases/register-product-use-case.ts']
  await runMutation(args, cwd)
  await runMutation(args, cwd)
  await runMutation([...args, '--force'], cwd)
  write(
    'packages/core/src/catalog/use-cases/tests/register-product-use-case.test.ts',
    '// revised assertions\n',
  )
  await runMutation(args, cwd)
  assert.deepEqual(
    readInvocations(cwd).map(({ reused }) => reused),
    [false, true, false, false],
  )
})

test('incremental results never carry mutants across different mutation scopes', async (t) => {
  const { cwd } = createRepository(t)
  await runMutation(['--all'], cwd)
  await runMutation(
    ['--files', 'src/catalog/use-cases/register-product-use-case.ts'],
    cwd,
  )
  await runMutation(['--files', 'src/catalog/use-cases/other-use-case.ts'], cwd)
  await runMutation(['--files', 'src/catalog/use-cases/other-use-case.ts'], cwd)
  assert.deepEqual(
    readInvocations(cwd).map(({ reused }) => reused),
    [false, false, false, true],
  )
  const manifest = JSON.parse(
    readFileSync(join(cwd, 'reports/mutation/context.json'), 'utf8'),
  )
  assert.deepEqual(manifest.scope, ['src/catalog/use-cases/other-use-case.ts'])
})

test('context invalidates environment and source changes without reading secret files', (t) => {
  const { root, write } = createRepository(t)
  const before = mutationContext(root, { TEST_MODE: 'a' })
  assert.notEqual(mutationContext(root, { TEST_MODE: 'b' }), before)
  write('packages/core/.env', 'SECRET=value\n')
  assert.equal(mutationContext(root, { TEST_MODE: 'a' }), before)
  write(
    'packages/core/src/catalog/use-cases/register-product-use-case.ts',
    'export const value = 4\n',
  )
  assert.notEqual(mutationContext(root, { TEST_MODE: 'a' }), before)
})

test('dry-run validates scope without starting Stryker or creating reports', async (t) => {
  const { cwd } = createRepository(t)
  assert.equal(await runMutation(['--all', '--dry-run'], cwd), 0)
  assert.equal(existsSync(join(cwd, 'reports')), false)
})

test('failed Stryker execution propagates status and invalidates cached evidence', async (t) => {
  const { cwd } = createRepository(t)
  const args = ['--files', 'src/catalog/use-cases/register-product-use-case.ts']
  await runMutation(args, cwd)
  for (const report of ['index.html', 'mutation.json']) {
    assert.equal(existsSync(join(cwd, 'reports/mutation', report)), true)
  }
  const previousStatus = process.env.MUTATION_TEST_EXIT_STATUS
  process.env.MUTATION_TEST_EXIT_STATUS = '7'
  try {
    assert.equal(await runMutation(args, cwd), 7)
  } finally {
    if (previousStatus === undefined) delete process.env.MUTATION_TEST_EXIT_STATUS
    else process.env.MUTATION_TEST_EXIT_STATUS = previousStatus
  }
  assert.equal(existsSync(join(cwd, 'reports/mutation/context.json')), false)
  for (const report of ['index.html', 'mutation.json']) {
    assert.equal(existsSync(join(cwd, 'reports/mutation', report)), false)
  }
  await runMutation(args, cwd)
  assert.equal(readInvocations(cwd).at(-1).reused, false)
})

test('rejects invocation outside Core', async (t) => {
  const { root } = createRepository(t)
  await assert.rejects(runMutation(['--all'], root), /from packages\/core/)
})
