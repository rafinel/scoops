import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const [, , workspace, summaryPath, outputPath] = process.argv

if (!workspace || !summaryPath || !outputPath) {
  throw new Error(
    'Usage: node scripts/write-coverage-report.mjs <workspace> <summary-path> <output-path>',
  )
}

const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
const metrics = ['statements', 'branches', 'functions', 'lines']
const workspaceName = workspace[0].toUpperCase() + workspace.slice(1)
const coveragePassed = (process.env.COVERAGE_OUTCOME ?? 'success') === 'success'
const runUrl = process.env.GITHUB_SERVER_URL
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : undefined
const rows = metrics.map((metric) => {
  const result = summary.total?.[metric]
  if (!result) throw new Error(`Coverage summary is missing the ${metric} metric.`)
  const label = metric[0].toUpperCase() + metric.slice(1)
  return `| ${label} | ${result.pct}% | ${result.covered} / ${result.total} |`
})
const report = [
  `<!-- coverage-report:${workspace} -->`,
  `## ${workspaceName} test coverage`,
  '',
  '| Metric | Coverage | Covered / Total |',
  '| --- | ---: | ---: |',
  ...rows,
  '',
  coveragePassed
    ? '✅ All configured Vitest coverage baselines passed.'
    : '❌ Tests or configured Vitest coverage baselines failed. This is a blocking CI result.',
  ...(runUrl ? ['', `[Open workflow run](${runUrl})`] : []),
  '',
].join('\n')

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, report)

if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, report, { flag: 'a' })
}
