import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_LABELS = {
  analytics: 'Analytics',
  billing: 'Billing',
  communication: 'Communication',
  identity: 'Identity',
  mrp: 'MRP',
  pdv: 'PDV',
}
const STATUSES = [
  'Killed',
  'Survived',
  'NoCoverage',
  'Timeout',
  'RuntimeError',
  'CompileError',
  'Ignored',
  'Pending',
]

export function renderMutationReport(report, shard) {
  if (!/^([1-9]\d*)\/([1-9]\d*)$/.test(shard ?? '')) {
    throw new Error('Shard must have the form N/M, with positive integers.')
  }
  const [index, count] = shard.split('/').map(Number)
  if (!Number.isSafeInteger(count) || index > count) {
    throw new Error('Shard index must not exceed the shard count.')
  }
  if (
    !report ||
    typeof report.files !== 'object' ||
    !report.files ||
    Array.isArray(report.files)
  ) {
    throw new Error('Mutation report must contain a files object.')
  }

  const modules = new Map()
  const statuses = new Set(STATUSES)
  for (const [path, file] of Object.entries(report.files)) {
    if (!file || !Array.isArray(file.mutants)) {
      throw new Error(`Missing mutants array for ${path}.`)
    }
    if (file.mutants.length === 0) continue
    const module = path
      .replaceAll('\\', '/')
      .match(/(?:^|\/)src\/([^/]+)\/use-cases\//)?.[1]
    const label = MODULE_LABELS[module] ?? `Other (${module ?? 'unclassified'})`
    const result = modules.get(label) ?? { files: 0, total: 0, statuses: new Map() }
    result.files += 1
    for (const mutant of file.mutants) {
      if (!mutant || typeof mutant.status !== 'string' || !mutant.status.trim()) {
        throw new Error(`Missing mutant status for ${path}.`)
      }
      statuses.add(mutant.status)
      result.total += 1
      result.statuses.set(mutant.status, (result.statuses.get(mutant.status) ?? 0) + 1)
    }
    modules.set(label, result)
  }
  const columns = [
    ...STATUSES,
    ...[...statuses].filter((status) => !STATUSES.includes(status)).sort(),
  ]
  const totals = { files: 0, total: 0, statuses: new Map() }
  const rows = []
  for (const [label, result] of [...modules].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    rows.push(renderRow(label, result, columns))
    totals.files += result.files
    totals.total += result.total
    for (const [status, count] of result.statuses) {
      totals.statuses.set(status, (totals.statuses.get(status) ?? 0) + count)
    }
  }
  return [
    `## Core mutation results by module — shard ${shard}`,
    '',
    'Partial shard results only. Files count includes only files with reported mutants.',
    'Absent modules have no reported mutants in this shard; this does not establish their test coverage or a zero mutation count across all shards.',
    'Statuses are reported separately; execution errors are not killed mutants. These counts do not establish acceptance.',
    'Partial shard score = Killed / (total mutants − NoCoverage − Ignored). Errors, timeouts and other statuses remain in the denominator. A zero denominator is N/A. These are partial shard scores, not final module CI scores.',
    '',
    `| Module | Files | Total mutants | ${columns.map(escapeCell).join(' | ')} | Partial shard score |`,
    `| --- | ---: | ---: | ${columns.map(() => '---:').join(' | ')} | ---: |`,
    ...rows,
    renderRow('Total (this shard)', totals, columns),
    '',
  ].join('\n')
}

function renderRow(label, result, columns) {
  const denominator =
    result.total -
    (result.statuses.get('NoCoverage') ?? 0) -
    (result.statuses.get('Ignored') ?? 0)
  const score =
    denominator === 0
      ? 'N/A'
      : `${(((result.statuses.get('Killed') ?? 0) / denominator) * 100).toFixed(2)}%`
  return `| ${escapeCell(label)} | ${result.files} | ${result.total} | ${columns.map((status) => result.statuses.get(status) ?? 0).join(' | ')} | ${score} |`
}

function escapeCell(value) {
  return value.replaceAll('|', '\\|').replace(/[\r\n]/g, ' ')
}

function main() {
  const [reportPath, outputPath, shard, ...extra] = process.argv.slice(2)
  if (!reportPath || !outputPath || !shard || extra.length) {
    throw new Error(
      'Usage: node scripts/write-mutation-report.mjs <report-path> <output-path> <shard>',
    )
  }
  const input = resolve(reportPath)
  const output = resolve(outputPath)
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (input === output || (summary && input === resolve(summary))) {
    throw new Error('Output and summary paths must differ from the input report.')
  }
  const markdown = renderMutationReport(JSON.parse(readFileSync(input, 'utf8')), shard)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, markdown)
  if (summary && output !== resolve(summary)) appendFileSync(summary, `\n${markdown}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`Mutation module summary: ${error.message}`)
    process.exitCode = 1
  }
}
