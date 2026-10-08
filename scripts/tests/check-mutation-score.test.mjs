import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  aggregateMutationReports,
  collectMutationReports,
  compareFileScores,
  parseThreshold,
  parseChangedUseCaseFiles,
  renderMutationScoreTable,
} from '../check-mutation-score.mjs'

const SCRIPT = fileURLToPath(new URL('../check-mutation-score.mjs', import.meta.url))
function createRoot(t) {
  const root = mkdtempSync(join(tmpdir(), 'core-mutation-score-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

function createReport(root, shard, files) {
  const directory = join(root, `shard-${shard}`)
  mkdirSync(directory, { recursive: true })
  const reportPath = join(directory, 'mutation.json')
  writeFileSync(reportPath, JSON.stringify({ files }))
  return reportPath
}

function mutants(...statuses) {
  return { mutants: statuses.map((status) => ({ status })) }
}

function passingReports(root) {
  return [
    createReport(root, 1, {
      'src/analytics/use-cases/a-use-case.ts': mutants(
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
      ),
      'src/billing/use-cases/b-use-case.ts': mutants('Killed', 'Killed'),
    }),
    createReport(root, 2, {
      'src/analytics/use-cases/c-use-case.ts': mutants(
        'Survived',
        'Survived',
        'Survived',
      ),
      'src/billing/use-cases/d-use-case.ts': mutants(
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Survived',
        'Survived',
        'Survived',
      ),
      'src/communication/use-cases/e-use-case.ts': mutants(
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Survived',
        'Survived',
        'Survived',
      ),
    }),
    createReport(root, 3, {
      'src/communication/use-cases/f-use-case.ts': mutants(),
      'src/identity/use-cases/g-use-case.ts': mutants(
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Survived',
        'Survived',
        'Survived',
      ),
    }),
    createReport(root, 4, {
      'src/mrp/use-cases/h-use-case.ts': mutants(
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Survived',
        'Survived',
        'Survived',
      ),
      'src/pdv/use-cases/i-use-case.ts': mutants(
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Killed',
        'Survived',
        'Survived',
        'Survived',
      ),
    }),
  ]
}

test('parses a configurable threshold within zero to one hundred', () => {
  assert.equal(parseThreshold(), 70)
  assert.equal(parseThreshold('70.5'), 70.5)
  for (const value of ['-1', '101', 'NaN', '70x', '']) {
    assert.throws(() => parseThreshold(value), /number from 0 to 100/)
  }
})

test('aggregates files spread over four reports and passes the exact 70 percent boundary', (t) => {
  const root = createRoot(t)
  const reports = passingReports(root)
  assert.equal(collectMutationReports(root).length, 4)
  const aggregate = aggregateMutationReports(reports)
  assert.deepEqual(aggregate.missingModules, [])
  const markdown = renderMutationScoreTable(aggregate, 70)
  for (const module of [
    'Analytics',
    'Billing',
    'Communication',
    'Identity',
    'MRP',
    'PDV',
  ]) {
    assert.match(
      markdown,
      new RegExp(`\\| ${module} \\| 7/10 \\| 0 \\| 0 \\| 10 \\| 70\\.00% \\| PASS \\|`),
    )
  }
})

test('counts timeouts, errors, pending and unknown statuses while excluding uncovered and ignored mutants', (t) => {
  const root = createRoot(t)
  const reports = passingReports(root)
  const path = join(root, 'shard-1', 'mutation.json')
  const report = JSON.parse(readFileSync(path, 'utf8'))
  report.files['src/analytics/use-cases/a-use-case.ts'].mutants.push(
    ...['NoCoverage', 'Ignored'].map((status) => ({ status })),
  )
  report.files['src/analytics/use-cases/a-use-case.ts'].mutants.splice(
    0,
    7,
    ...['Killed', 'Killed', 'Killed', 'Killed', 'Killed', 'Killed', 'Killed'].map(
      (status) => ({ status }),
    ),
  )
  const analyticsSecond = JSON.parse(
    readFileSync(join(root, 'shard-2', 'mutation.json'), 'utf8'),
  )
  analyticsSecond.files['src/analytics/use-cases/c-use-case.ts'] = mutants(
    'Survived',
    'Timeout',
    'RuntimeError',
    'CompileError',
    'Pending',
    'FutureStatus',
  )
  writeFileSync(path, JSON.stringify(report))
  writeFileSync(join(root, 'shard-2', 'mutation.json'), JSON.stringify(analyticsSecond))

  const aggregate = aggregateMutationReports(reports)
  const analytics = aggregate.modules.get('Analytics')
  assert.equal(analytics.killed, 7)
  assert.equal(analytics.denominator, 13)
  assert.match(
    renderMutationScoreTable(aggregate, 70),
    /\| Analytics \| 7\/13 \| 1 \| 1 \| 15 \| 53\.85% \| FAIL \|/,
  )
})

test('fails scores below threshold and marks zero-scored modules N/A', (t) => {
  const root = createRoot(t)
  const reports = passingReports(root)
  const analyticsPath = join(root, 'shard-2', 'mutation.json')
  const report = JSON.parse(readFileSync(analyticsPath, 'utf8'))
  report.files['src/analytics/use-cases/c-use-case.ts'] = mutants(
    'Survived',
    'Survived',
    'Timeout',
    'RuntimeError',
  )
  writeFileSync(analyticsPath, JSON.stringify(report))
  const noCoveragePath = join(root, 'shard-4', 'mutation.json')
  const noCoverageReport = JSON.parse(readFileSync(noCoveragePath, 'utf8'))
  noCoverageReport.files['src/pdv/use-cases/i-use-case.ts'] = mutants(
    'NoCoverage',
    'Ignored',
  )
  writeFileSync(noCoveragePath, JSON.stringify(noCoverageReport))

  const aggregate = aggregateMutationReports(reports)
  const markdown = renderMutationScoreTable(aggregate, 70)
  assert.match(markdown, /\| Analytics \| 7\/11 \| 0 \| 0 \| 11 \| 63\.64% \| FAIL \|/)
  assert.match(markdown, /\| PDV \| 0\/0 \| 1 \| 1 \| 2 \| N\/A \| FAIL \|/)
  assert.equal(aggregate.modules.get('PDV').denominator, 0)
})

test('requires exactly four reports and rejects duplicate files across shards', (t) => {
  const root = createRoot(t)
  const reports = passingReports(root)
  assert.throws(() => collectMutationReports(join(root, 'shard-1')), /exactly 4/)
  const duplicate = createReport(root, 5, {
    'src/analytics/use-cases/a-use-case.ts': mutants('Killed'),
  })
  assert.throws(
    () => aggregateMutationReports([...reports, duplicate]),
    /Duplicate mutation file/,
  )
})

test('fails closed for absent module mutant data and malformed reports or statuses', (t) => {
  const root = createRoot(t)
  const reports = passingReports(root)
  const pdvPath = join(root, 'shard-4', 'mutation.json')
  writeFileSync(
    pdvPath,
    JSON.stringify({
      files: {
        'src/mrp/use-cases/h-use-case.ts': mutants(
          'Killed',
          'Killed',
          'Killed',
          'Killed',
          'Killed',
          'Killed',
          'Killed',
          'Survived',
          'Survived',
          'Survived',
        ),
      },
    }),
  )
  const aggregate = aggregateMutationReports(reports)
  assert.deepEqual(aggregate.missingModules, ['PDV'])
  assert.match(
    renderMutationScoreTable(aggregate, 70),
    /\| PDV \| 0\/0 \| 0 \| 0 \| 0 \| N\/A \| FAIL \|/,
  )

  writeFileSync(pdvPath, '{invalid')
  assert.throws(() => aggregateMutationReports(reports), /Invalid JSON/)
  writeFileSync(pdvPath, JSON.stringify({ files: { 'src/pdv/use-cases/x.ts': {} } }))
  assert.throws(() => aggregateMutationReports(reports), /mutants array/)
  writeFileSync(
    pdvPath,
    JSON.stringify({ files: { 'src/pdv/use-cases/x.ts': { mutants: [{ status: 3 }] } } }),
  )
  assert.throws(() => aggregateMutationReports(reports), /invalid status/)
})

test('requires exact no-drop for unchanged files and a 70 percent floor for changed or newly scoreable files', () => {
  const baseline = {
    files: new Map([
      ['src/analytics/use-cases/existing-use-case.ts', { denominator: 10, killed: 7 }],
      [
        'src/analytics/use-cases/newly-scoreable-use-case.ts',
        { denominator: 0, killed: 0 },
      ],
      ['src/analytics/use-cases/deleted-use-case.ts', { denominator: 10, killed: 8 }],
    ]),
  }
  const candidate = {
    files: new Map([
      ['src/analytics/use-cases/existing-use-case.ts', { denominator: 100, killed: 69 }],
      [
        'src/analytics/use-cases/newly-scoreable-use-case.ts',
        { denominator: 10, killed: 7 },
      ],
      ['src/analytics/use-cases/added-use-case.ts', { denominator: 10, killed: 7 }],
    ]),
  }
  const comparison = compareFileScores(
    candidate,
    baseline,
    new Set([
      'src/analytics/use-cases/deleted-use-case.ts',
      'src/analytics/use-cases/added-use-case.ts',
    ]),
    70,
  )
  assert.equal(comparison.failures.length, 1)
  assert.match(
    comparison.failures[0],
    /existing-use-case.*dropped from 70\.00% to 69\.00%/,
  )
  assert.deepEqual(
    comparison.rows.map(({ path, passed }) => [path, passed]),
    [
      ['src/analytics/use-cases/added-use-case.ts', true],
      ['src/analytics/use-cases/deleted-use-case.ts', true],
      ['src/analytics/use-cases/existing-use-case.ts', false],
      ['src/analytics/use-cases/newly-scoreable-use-case.ts', true],
    ],
  )
})

test('extracts added, modified and deleted eligible source paths from NUL-delimited git changes', () => {
  const changed = parseChangedUseCaseFiles(
    [
      'A',
      'packages/core/src/identity/use-cases/new-use-case.ts',
      'M',
      'packages/core/src/pdv/use-cases/update-use-case.ts',
      'D',
      'packages/core/src/mrp/use-cases/removed-use-case.ts',
      'M',
      'packages/core/src/mrp/entities/product.ts',
      'M',
      'packages/core/src/pdv/use-cases/update-use-case.test.ts',
    ].join('\0'),
  )
  assert.deepEqual([...changed].sort(), [
    'src/identity/use-cases/new-use-case.ts',
    'src/mrp/use-cases/removed-use-case.ts',
    'src/pdv/use-cases/update-use-case.ts',
  ])
})

test('fails closed when unchanged file data is missing on either side', () => {
  const comparison = compareFileScores(
    { files: new Map() },
    {
      files: new Map([
        ['src/analytics/use-cases/a-use-case.ts', { denominator: 1, killed: 1 }],
      ]),
    },
    new Set(),
    70,
  )
  assert.equal(comparison.failures.length, 1)
  assert.match(comparison.failures[0], /missing candidate mutation data/)
})

test('CLI prints and appends the score table and exits nonzero when a module misses the threshold', (t) => {
  const root = createRoot(t)
  const candidateRoot = join(root, 'candidate')
  const baselineRoot = join(root, 'baseline')
  passingReports(candidateRoot)
  cpSync(candidateRoot, baselineRoot, { recursive: true })
  const summaryPath = join(root, 'summary.md')
  const outputPath = join(root, 'artifacts', 'mutation-score-summary.md')
  writeFileSync(summaryPath, 'Existing summary\n')
  const hybridArgs = [
    SCRIPT,
    candidateRoot,
    '--baseline-root',
    baselineRoot,
    '--base-ref',
    'HEAD',
    '--head-ref',
    'HEAD',
  ]
  const passing = spawnSync(process.execPath, hybridArgs, {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath },
  })
  assert.equal(passing.status, 0, passing.stderr)
  assert.match(
    passing.stdout,
    /\| Analytics \| 7\/10 \| 0 \| 0 \| 10 \| 70\.00% \| PASS \|/,
  )
  assert.match(readFileSync(summaryPath, 'utf8'), /Core mutation score by module/)

  const analyticsReportPath = join(candidateRoot, 'shard-2', 'mutation.json')
  const analyticsReport = JSON.parse(readFileSync(analyticsReportPath, 'utf8'))
  analyticsReport.files['src/analytics/use-cases/c-use-case.ts'] = mutants(
    'Survived',
    'Survived',
    'Timeout',
    'RuntimeError',
  )
  writeFileSync(analyticsReportPath, JSON.stringify(analyticsReport))

  const failing = spawnSync(
    process.execPath,
    [...hybridArgs, '--threshold', '70', '--output', outputPath],
    {
      encoding: 'utf8',
    },
  )
  assert.equal(failing.status, 1)
  assert.match(
    failing.stdout,
    /\| Analytics \| 7\/11 \| 0 \| 0 \| 11 \| 63\.64% \| FAIL \|/,
  )
  assert.equal(readFileSync(outputPath, 'utf8'), failing.stdout)
  assert.match(readFileSync(outputPath, 'utf8'), /7\/11/)
  const malformed = spawnSync(process.execPath, [...hybridArgs, '--threshold', '101'], {
    encoding: 'utf8',
  })
  assert.equal(malformed.status, 1)
})

test('CLI can temporarily exclude Billing while keeping its result visible and validating the other modules', (t) => {
  const root = createRoot(t)
  const candidateRoot = join(root, 'candidate')
  const baselineRoot = join(root, 'baseline')
  passingReports(candidateRoot)
  for (const [directory, relativePath] of [
    ['shard-1', 'src/billing/use-cases/b-use-case.ts'],
    ['shard-2', 'src/billing/use-cases/d-use-case.ts'],
  ]) {
    const reportPath = join(candidateRoot, directory, 'mutation.json')
    const report = JSON.parse(readFileSync(reportPath, 'utf8'))
    delete report.files[relativePath]
    writeFileSync(reportPath, JSON.stringify(report))
  }
  const billingReportPath = join(candidateRoot, 'shard-1', 'mutation.json')
  const billingReport = JSON.parse(readFileSync(billingReportPath, 'utf8'))
  billingReport.files['src/billing/use-cases/b-use-case.ts'] = {
    mutants: Array.from({ length: 276 }, () => ({ status: 'NoCoverage' })),
  }
  writeFileSync(billingReportPath, JSON.stringify(billingReport))
  cpSync(candidateRoot, baselineRoot, { recursive: true })

  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      candidateRoot,
      '--baseline-root',
      baselineRoot,
      '--base-ref',
      'HEAD',
      '--head-ref',
      'HEAD',
      '--exclude-modules',
      'billing',
    ],
    {
      encoding: 'utf8',
    },
  )
  assert.equal(result.status, 0, result.stderr)
  assert.match(
    result.stdout,
    /\| Billing \| 0\/0 \| 276 \| 0 \| 276 \| N\/A \| TEMPORARILY EXCLUDED \|/,
  )
  assert.match(
    result.stdout,
    /Temporarily excluded from module and per-file thresholds: Billing/,
  )
  assert.match(
    result.stdout,
    /\| src\/billing\/use-cases\/b-use-case\.ts \| temporarily excluded \|/,
  )
  assert.doesNotMatch(result.stderr, /Missing mutation data/)

  const invalid = spawnSync(
    process.execPath,
    [
      SCRIPT,
      candidateRoot,
      '--baseline-root',
      baselineRoot,
      '--base-ref',
      'HEAD',
      '--head-ref',
      'HEAD',
      '--exclude-modules',
      'unknown',
    ],
    {
      encoding: 'utf8',
    },
  )
  assert.equal(invalid.status, 1)
  assert.match(invalid.stderr, /Unknown excluded module/)
})
