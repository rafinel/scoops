import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createCliArguments,
  getScopePatterns,
  materializeBaseline,
  normalizeBaseline,
} from '../check-complexity.mjs'

const ROOT_DIRECTORY = fileURLToPath(new URL('../..', import.meta.url))

function createMetric(name, severity) {
  return { name, value: 20, threshold: 15, severity }
}

function createFunction(name, severity) {
  return {
    name,
    startLine: 10,
    endLine: 20,
    metrics: [createMetric('cyclomaticComplexity', severity)],
    maintainabilityIndex: 80,
    maintainabilityRating: 'ok',
    healthScore: 80,
    smells: [],
  }
}

test('normalizes a CodeMultiVitals baseline to repository-relative paths and violations', () => {
  const baseline = {
    analysedAt: '2026-09-07T00:00:00.000Z',
    files: [
      {
        filePath: path.join(ROOT_DIRECTORY, 'apps/server/src/app.module.ts'),
        functions: [createFunction('healthy', 'ok'), createFunction('legacy', 'warn')],
      },
    ],
    clones: [
      {
        blockA: { filePath: path.join(ROOT_DIRECTORY, 'apps/server/src/a.ts') },
        blockB: { filePath: path.join(ROOT_DIRECTORY, 'apps/server/src/b.ts') },
      },
    ],
  }

  const normalized = normalizeBaseline(baseline)

  assert.equal(normalized.files.length, 1)
  assert.equal(normalized.files[0].filePath, 'apps/server/src/app.module.ts')
  assert.deepEqual(
    normalized.files[0].functions.map(({ name }) => name),
    ['legacy'],
  )
  assert.equal(normalized.clones[0].blockA.filePath, 'apps/server/src/a.ts')
})

test('materializes repository-relative baseline paths for the current runner', () => {
  const materialized = materializeBaseline({
    files: [{ filePath: 'apps/server/src/app.module.ts', functions: [] }],
    clones: [
      {
        blockA: { filePath: 'apps/server/src/a.ts' },
        blockB: { filePath: 'apps/server/src/b.ts' },
      },
    ],
  })

  assert.equal(
    materialized.files[0].filePath,
    path.join(ROOT_DIRECTORY, 'apps/server/src/app.module.ts'),
  )
  assert.equal(
    materialized.clones[0].blockB.filePath,
    path.join(ROOT_DIRECTORY, 'apps/server/src/b.ts'),
  )
})

test('builds the CodeMultiVitals CLI arguments with source exclusions and quality gates', () => {
  const argumentsList = createCliArguments('/tmp/baseline.json', null)

  assert.equal(argumentsList[0], 'exec')
  assert.equal(argumentsList[1], 'code-multivitals')
  assert.ok(argumentsList.includes('!**/*.test.ts'))
  assert.ok(argumentsList.includes('!**/routeTree.gen.ts'))
  assert.deepEqual(argumentsList.slice(-4), [
    '--max-warnings',
    '0',
    '--baseline',
    '/tmp/baseline.json',
  ])
  assert.equal(argumentsList.at(-1), '/tmp/baseline.json')
})

test('builds a scoped source pattern list for an app or package', () => {
  assert.deepEqual(getScopePatterns('apps/server'), [
    'apps/server/src/**/*.ts',
    '!**/*.test.ts',
    '!**/*.test.tsx',
    '!**/tests/**',
    '!**/routeTree.gen.ts',
  ])
  assert.ok(
    createCliArguments(null, null, getScopePatterns('packages/core')).includes(
      'packages/core/src/**/*.ts',
    ),
  )
  assert.deepEqual(getScopePatterns('packages/email'), [
    'packages/email/templates/**/*.{ts,tsx}',
    '!**/*.test.ts',
    '!**/*.test.tsx',
    '!**/tests/**',
    '!**/routeTree.gen.ts',
  ])
})

test('rejects an unknown complexity scope', () => {
  assert.throws(() => getScopePatterns('apps/unknown'), /Unknown complexity scope/)
})
