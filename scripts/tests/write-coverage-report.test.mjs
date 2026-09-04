import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = fileURLToPath(
  new URL('../write-coverage-report.mjs', import.meta.url),
)

test('writes a coverage report and appends it to the GitHub step summary', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'scoops-coverage-report-'))
  const summaryPath = path.join(temporaryDirectory, 'coverage-summary.json')
  const outputPath = path.join(temporaryDirectory, 'nested', 'coverage-comment.md')
  const stepSummaryPath = path.join(temporaryDirectory, 'step-summary.md')

  try {
    await writeFile(
      summaryPath,
      JSON.stringify({
        total: {
          statements: { pct: 91, covered: 91, total: 100 },
          branches: { pct: 82, covered: 82, total: 100 },
          functions: { pct: 88, covered: 88, total: 100 },
          lines: { pct: 90, covered: 90, total: 100 },
        },
      }),
    )

    await execFileAsync(process.execPath, [SCRIPT_PATH, 'web', summaryPath, outputPath], {
      env: {
        ...process.env,
        COVERAGE_OUTCOME: 'success',
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: 'scoops/example',
        GITHUB_RUN_ID: '123',
        GITHUB_STEP_SUMMARY: stepSummaryPath,
      },
    })

    const report = await readFile(outputPath, 'utf8')
    const stepSummary = await readFile(stepSummaryPath, 'utf8')
    assert.match(report, /<!-- coverage-report:web -->/)
    assert.match(report, /## Web test coverage/)
    assert.match(report, /\| Statements \| 91% \| 52\.2% \| 91 \/ 100 \|/)
    assert.match(report, /\| Branches \| 82% \| 49\.2% \| 82 \/ 100 \|/)
    assert.match(report, /\| Functions \| 88% \| 49% \| 88 \/ 100 \|/)
    assert.match(report, /\| Lines \| 90% \| 54\.1% \| 90 \/ 100 \|/)
    assert.match(report, /✅ All configured Vitest coverage baselines passed\./)
    assert.match(
      report,
      /\[Open workflow run\]\(https:\/\/github\.com\/scoops\/example\/actions\/runs\/123\)/,
    )
    assert.equal(stepSummary, report)
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
})

test('fails when a coverage summary omits a required metric', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'scoops-coverage-report-'))
  const summaryPath = path.join(temporaryDirectory, 'coverage-summary.json')
  const outputPath = path.join(temporaryDirectory, 'coverage-comment.md')

  try {
    await writeFile(summaryPath, JSON.stringify({ total: {} }))

    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, 'web', summaryPath, outputPath]),
      (error) => {
        assert.match(error.stderr, /Coverage summary is missing the statements metric\./)
        return true
      },
    )
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
})
