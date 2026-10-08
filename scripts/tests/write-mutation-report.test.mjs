import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { renderMutationReport } from '../write-mutation-report.mjs'

const SCRIPT = fileURLToPath(new URL('../write-mutation-report.mjs', import.meta.url))

function createFile(...statuses) {
  return { mutants: statuses.map((status) => ({ status })) }
}

test('groups files by module and preserves every status without counting errors as kills', () => {
  const markdown = renderMutationReport(
    {
      files: {
        'src/mrp/use-cases/a-use-case.ts': createFile(
          'Killed',
          'RuntimeError',
          'CompileError',
        ),
        'packages/core/src/mrp/use-cases/b-use-case.ts': createFile(
          'Survived',
          'Timeout',
        ),
        'src/pdv/use-cases/c-use-case.ts': createFile(
          'NoCoverage',
          'Ignored',
          'Pending',
          'FutureStatus',
        ),
        'src/billing/use-cases/d-use-case.ts': createFile(),
      },
    },
    '2/4',
  )
  assert.match(markdown, /shard 2\/4/)
  assert.match(
    markdown,
    /\| MRP \| 2 \| 5 \| 1 \| 1 \| 0 \| 1 \| 1 \| 1 \| 0 \| 0 \| 0 \|/,
  )
  assert.match(
    markdown,
    /\| PDV \| 1 \| 4 \| 0 \| 0 \| 1 \| 0 \| 0 \| 0 \| 1 \| 1 \| 1 \|/,
  )
  assert.match(
    markdown,
    /\| Total \(this shard\) \| 3 \| 9 \| 1 \| 1 \| 1 \| 1 \| 1 \| 1 \| 1 \| 1 \| 1 \|/,
  )
  assert.doesNotMatch(markdown, /\| Billing \|/)
  assert.match(markdown, /Absent modules have no reported mutants/)
  assert.match(markdown, /FutureStatus/)
})

test('handles all known labels and retains unclassified mutants', () => {
  const files = Object.fromEntries(
    ['analytics', 'billing', 'communication', 'identity', 'mrp', 'pdv'].map((module) => [
      `src/${module}/use-cases/a.ts`,
      createFile('Killed'),
    ]),
  )
  files['unexpected.ts'] = createFile('Survived')
  const markdown = renderMutationReport({ files }, '1/4')
  for (const label of [
    'Analytics',
    'Billing',
    'Communication',
    'Identity',
    'MRP',
    'PDV',
    'Other (unclassified)',
  ])
    assert.ok(markdown.includes(`| ${label} |`))
  assert.match(markdown, /Total \(this shard\) \| 7 \| 7/)
})

test('rejects malformed reports and invalid shard identifiers', () => {
  for (const report of [
    null,
    {},
    { files: [] },
    { files: { a: {} } },
    { files: { a: createFile(null) } },
  ])
    assert.throws(() => renderMutationReport(report, '1/4'))
  for (const shard of ['0/4', '5/4', '1', '1/0', '1/9007199254740993'])
    assert.throws(() => renderMutationReport({ files: {} }, shard))
  assert.match(
    renderMutationReport({ files: {} }, '1/4'),
    /Total \(this shard\) \| 0 \| 0/,
  )
})

test('CLI writes an artifact and appends to the existing GitHub summary; rejects invalid input', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mutation-module-report-'))
  try {
    const input = join(directory, 'mutation.json')
    const output = join(directory, 'nested', 'modules.md')
    const summary = join(directory, 'summary.md')
    writeFileSync(
      input,
      JSON.stringify({
        files: { 'src/identity/use-cases/a.ts': createFile('RuntimeError') },
      }),
    )
    writeFileSync(summary, 'Existing timing\n')
    const result = spawnSync(process.execPath, [SCRIPT, input, output, '1/4'], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_STEP_SUMMARY: summary },
    })
    assert.equal(result.status, 0, result.stderr)
    const markdown = readFileSync(output, 'utf8')
    assert.equal(readFileSync(summary, 'utf8'), `Existing timing\n\n${markdown}`)
    assert.match(markdown, /Identity \| 1 \| 1 \| 0 \| 0 \| 0 \| 0 \| 1/)
    assert.equal(spawnSync(process.execPath, [SCRIPT, input, input, '1/4']).status, 1)
    writeFileSync(input, 'invalid json')
    assert.equal(spawnSync(process.execPath, [SCRIPT, input, output, '1/4']).status, 1)
    assert.equal(
      spawnSync(process.execPath, [
        SCRIPT,
        join(directory, 'missing.json'),
        output,
        '1/4',
      ]).status,
      1,
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('scores partial shard results with errors in the denominator and excludes uncovered and ignored mutants', () => {
  const markdown = renderMutationReport(
    {
      files: {
        'src/mrp/use-cases/a.ts': createFile(
          'Killed',
          'Killed',
          'Survived',
          'Timeout',
          'RuntimeError',
          'CompileError',
          'NoCoverage',
          'Ignored',
          'Pending',
          'FutureStatus',
        ),
        'src/pdv/use-cases/b.ts': createFile('NoCoverage', 'Ignored'),
        'src/identity/use-cases/c.ts': createFile('Killed'),
      },
    },
    '1/4',
  )
  const rows = markdown.split('\n')
  assert.ok(rows.find((row) => row.startsWith('| MRP |')).endsWith('| 25.00% |'))
  assert.ok(rows.find((row) => row.startsWith('| PDV |')).endsWith('| N/A |'))
  assert.ok(rows.find((row) => row.startsWith('| Identity |')).endsWith('| 100.00% |'))
  assert.ok(
    rows.find((row) => row.startsWith('| Total (this shard) |')).endsWith('| 33.33% |'),
  )
  assert.match(markdown, /Partial shard score/)
  assert.match(markdown, /not final module CI scores/)
  assert.ok(
    renderMutationReport({ files: {} }, '1/4')
      .split('\n')
      .find((row) => row.startsWith('| Total (this shard) |'))
      .endsWith('| N/A |'),
  )
})
