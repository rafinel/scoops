import {
  appendFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_LABELS = {
  analytics: 'Analytics',
  billing: 'Billing',
  communication: 'Communication',
  identity: 'Identity',
  mrp: 'MRP',
  pdv: 'PDV',
}
const MODULES = Object.values(MODULE_LABELS)
export function parseThreshold(value = '70') {
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error('Threshold must be a number from 0 to 100.')
  }
  const threshold = Number(value)
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    throw new Error('Threshold must be a number from 0 to 100.')
  }
  return threshold
}

export function collectMutationReports(rootPath) {
  const reports = []
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name)
      if (entry.isDirectory()) visit(entryPath)
      else if (entry.isFile() && entry.name === 'mutation.json') reports.push(entryPath)
    }
  }
  visit(rootPath)
  if (reports.length !== 4) {
    throw new Error(`Expected exactly 4 mutation.json reports; found ${reports.length}.`)
  }
  return reports.sort()
}

export function aggregateMutationReports(reportPaths) {
  const moduleResults = new Map(
    MODULES.map((label) => [
      label,
      { denominator: 0, files: 0, ignored: 0, killed: 0, noCoverage: 0, totalMutants: 0 },
    ]),
  )
  const seenFiles = new Set()
  const files = new Map()

  for (const reportPath of reportPaths) {
    let report
    try {
      report = JSON.parse(readFileSync(reportPath, 'utf8'))
    } catch (error) {
      throw new Error(`Invalid JSON in ${reportPath}: ${error.message}`)
    }
    if (
      !report ||
      typeof report.files !== 'object' ||
      !report.files ||
      Array.isArray(report.files)
    ) {
      throw new Error(`Mutation report ${reportPath} must contain a files object.`)
    }

    for (const [sourcePath, file] of Object.entries(report.files)) {
      const normalizedPath = sourcePath.replaceAll('\\', '/')
      if (seenFiles.has(normalizedPath)) {
        throw new Error(
          `Duplicate mutation file across shard reports: ${normalizedPath}.`,
        )
      }
      seenFiles.add(normalizedPath)

      const moduleName = normalizedPath.match(/(?:^|\/)src\/([^/]+)\/use-cases\//)?.[1]
      const moduleLabel = MODULE_LABELS[moduleName]
      if (!moduleLabel) {
        throw new Error(
          `Cannot assign mutation file to a required module: ${sourcePath}.`,
        )
      }
      if (!file || !Array.isArray(file.mutants)) {
        throw new Error(`Mutation file ${sourcePath} must contain a mutants array.`)
      }
      const fileResult = { denominator: 0, killed: 0, module: moduleLabel }
      const result = moduleResults.get(moduleLabel)
      if (file.mutants.length > 0) result.files += 1
      for (const mutant of file.mutants) {
        if (!mutant || typeof mutant.status !== 'string' || !mutant.status.trim()) {
          throw new Error(
            `Mutation file ${sourcePath} has a mutant with an invalid status.`,
          )
        }
        result.totalMutants += 1
        if (mutant.status === 'NoCoverage') {
          result.noCoverage += 1
          continue
        }
        if (mutant.status === 'Ignored') {
          result.ignored += 1
          continue
        }
        result.denominator += 1
        fileResult.denominator += 1
        if (mutant.status === 'Killed') {
          result.killed += 1
          fileResult.killed += 1
        }
      }
      files.set(normalizedPath.replace(/^packages\/core\//, ''), fileResult)
    }
  }

  const missingModules = MODULES.filter((module) => moduleResults.get(module).files === 0)
  return { files, missingModules, modules: moduleResults }
}

function fileScore(result) {
  return result.denominator === 0 ? null : result.killed / result.denominator
}

export function parseChangedUseCaseFiles(output) {
  const fields = output.split('\0').filter(Boolean)
  const changed = new Map()
  for (let index = 0; index < fields.length; ) {
    const status = fields[index++]
    const path = fields[index++]
    if (!path || !/^[AMDTUXB]$/.test(status)) {
      throw new Error(`Unexpected git diff name-status entry: ${status} ${path ?? ''}`)
    }
    const packagePath = path.replaceAll('\\', '/')
    const sourcePath = packagePath.replace(/^packages\/core\//, '')
    if (/(?:^|\/)src\/[^/]+\/use-cases\/[^/]+-use-case\.ts$/.test(sourcePath)) {
      changed.set(sourcePath, status)
    }
  }
  return changed
}

function gitChangedUseCaseFiles(baseRef, headRef) {
  const output = execFileSync(
    'git',
    [
      'diff',
      '--no-renames',
      '--name-status',
      '-z',
      baseRef,
      headRef,
      '--',
      'packages/core/src',
    ],
    { encoding: 'utf8' },
  )
  return parseChangedUseCaseFiles(output)
}

export function compareFileScores(
  candidate,
  baseline,
  changedFiles,
  threshold,
  excludedModules = [],
) {
  const paths = new Set([
    ...candidate.files.keys(),
    ...baseline.files.keys(),
    ...changedFiles.keys(),
  ])
  const rows = []
  const failures = []
  for (const path of [...paths].sort()) {
    const current = candidate.files.get(path)
    const previous = baseline.files.get(path)
    const moduleName = path.match(/^src\/([^/]+)\/use-cases\//)?.[1]
    if (changedFiles.has(path) && changedFiles.get(path) !== 'D' && !current) {
      rows.push({
        path,
        current,
        previous,
        passed: false,
        policy: 'missing candidate data',
      })
      failures.push(`${path}: missing candidate mutation data for changed/new file`)
      continue
    }
    if (excludedModules.includes(moduleName)) {
      rows.push({ path, current, previous, passed: true, policy: 'temporarily excluded' })
      continue
    }
    if (changedFiles.has(path)) {
      const status = changedFiles.get(path)
      if (status === 'D') {
        rows.push({ path, current, previous, passed: true, policy: 'deleted' })
        continue
      }
      const score = fileScore(current)
      const passed = score !== null && score * 100 >= threshold
      rows.push({ path, current, previous, passed, policy: 'changed/new ≥ threshold' })
      if (!passed)
        failures.push(
          `${path}: changed/new file is ${score === null ? 'N/A' : `${(score * 100).toFixed(2)}%`}, below ${threshold}%`,
        )
      continue
    }
    if (!current || !previous) {
      const missingSide = !current ? 'candidate' : 'baseline'
      rows.push({
        path,
        current,
        previous,
        passed: false,
        policy: `missing ${missingSide} data`,
      })
      failures.push(`${path}: missing ${missingSide} mutation data for unchanged file`)
      continue
    }
    const currentScore = fileScore(current)
    const previousScore = fileScore(previous)
    let passed
    if (previousScore === null)
      passed = currentScore === null || currentScore * 100 >= threshold
    else
      passed =
        currentScore !== null &&
        current.killed * previous.denominator >= previous.killed * current.denominator
    rows.push({ path, current, previous, passed, policy: 'unchanged: no drop' })
    if (!passed) {
      failures.push(
        `${path}: unchanged file dropped from ${previousScore === null ? 'N/A' : `${(previousScore * 100).toFixed(2)}%`} to ${currentScore === null ? 'N/A' : `${(currentScore * 100).toFixed(2)}%`}`,
      )
    }
  }
  return { failures, rows }
}

export function renderFileScoreTable(comparison, threshold) {
  const rows = comparison.rows.map(({ current, path, passed, policy, previous }) => {
    const format = (result) => {
      const score = result && fileScore(result)
      return score === null || score === undefined
        ? 'N/A'
        : `${(score * 100).toFixed(2)}%`
    }
    return `| ${path} | ${policy} | ${format(previous)} | ${format(current)} | ${passed ? 'PASS' : 'FAIL'} |`
  })
  return [
    '## Core mutation score by use-case file',
    '',
    `Changed/new eligible files must score at least ${threshold}%; unchanged eligible files must not drop from their target-branch score. Scores are compared without rounding.`,
    '',
    '| File | Policy | Target branch | Candidate | Result |',
    '| --- | --- | ---: | ---: | --- |',
    ...rows,
    '',
  ].join('\n')
}

export function renderMutationScoreTable(aggregate, threshold, excludedModules = []) {
  const rows = MODULES.map((module) => {
    const { ignored, killed, noCoverage, denominator, totalMutants } =
      aggregate.modules.get(module)
    const survived = denominator - killed
    const score = denominator === 0 ? null : (killed / denominator) * 100
    const scoreText = score === null ? 'N/A' : `${score.toFixed(2)}%`
    const isExcluded = excludedModules.includes(module.toLowerCase())
    const result = isExcluded
      ? 'TEMPORARILY EXCLUDED'
      : score !== null && score >= threshold
        ? 'PASS'
        : 'FAIL'
    return `| ${module} | ${killed} | ${survived} | ${noCoverage} | ${ignored} | ${totalMutants} | ${scoreText} | ${result} |`
  })
  const exclusionNote = excludedModules.length
    ? `Temporarily excluded from module and per-file thresholds: ${excludedModules.map((module) => MODULE_LABELS[module]).join(', ')}. Mutation results remain visible; remove the exclusion when module coverage is ready.`
    : 'All six modules are included in the threshold gate.'
  return [
    '## Core mutation score by module',
    '',
    `Required score: ${threshold}% per module. Score = killed / (all mutants except NoCoverage and Ignored).`,
    exclusionNote,
    '',
    '| Module | Killed | Survived | NoCoverage | Ignored | Total mutants | Mutation score | Result |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...rows,
    '',
  ].join('\n')
}

function isPassing(aggregate, threshold, excludedModules = []) {
  return MODULES.every((module) => {
    if (excludedModules.includes(module.toLowerCase())) return true
    const { killed, denominator } = aggregate.modules.get(module)
    return denominator > 0 && (killed / denominator) * 100 >= threshold
  })
}

function parseArguments(argumentsList) {
  const usage =
    'Usage: node scripts/check-mutation-score.mjs <candidate-reports-root> --baseline-root <base-reports-root> --base-ref <git-ref> --head-ref <git-ref> [--threshold 70] [--exclude-modules billing] [--output <path>]'
  let rootPath
  let baselineRootPath
  let baseRef
  let headRef
  let outputPath
  let thresholdValue = '70'
  const excludedModules = new Set()
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--threshold') {
      thresholdValue = argumentsList[index + 1]
      if (thresholdValue === undefined) throw new Error('--threshold requires a value.')
      index += 1
    } else if (argument === '--exclude-modules') {
      const value = argumentsList[index + 1]
      if (value === undefined) throw new Error('--exclude-modules requires module keys.')
      for (const module of value.split(',')) {
        if (!Object.hasOwn(MODULE_LABELS, module)) {
          throw new Error(
            `Unknown excluded module '${module}'. Use one of: ${Object.keys(MODULE_LABELS).join(', ')}.`,
          )
        }
        excludedModules.add(module)
      }
      index += 1
    } else if (argument === '--output') {
      outputPath = argumentsList[index + 1]
      if (!outputPath) throw new Error('--output requires a file path.')
      index += 1
    } else if (argument === '--baseline-root') {
      baselineRootPath = argumentsList[index + 1]
      if (!baselineRootPath) throw new Error('--baseline-root requires a path.')
      index += 1
    } else if (argument === '--base-ref') {
      baseRef = argumentsList[index + 1]
      if (!baseRef) throw new Error('--base-ref requires a git ref.')
      index += 1
    } else if (argument === '--head-ref') {
      headRef = argumentsList[index + 1]
      if (!headRef) throw new Error('--head-ref requires a git ref.')
      index += 1
    } else if (argument.startsWith('--')) {
      throw new Error(`Unknown option: ${argument}`)
    } else if (rootPath === undefined) {
      rootPath = argument
    } else {
      throw new Error(usage)
    }
  }
  if (!rootPath) {
    throw new Error(usage)
  }
  if (!baselineRootPath || !baseRef || !headRef) {
    throw new Error(
      'Hybrid mutation gate requires --baseline-root, --base-ref and --head-ref.',
    )
  }
  return {
    baseRef,
    excludedModules: [...excludedModules],
    headRef,
    baselineRootPath: resolve(baselineRootPath),
    outputPath: outputPath ? resolve(outputPath) : undefined,
    rootPath: resolve(rootPath),
    threshold: parseThreshold(thresholdValue),
  }
}

function main() {
  const {
    baseRef,
    excludedModules,
    headRef,
    baselineRootPath,
    outputPath,
    rootPath,
    threshold,
  } = parseArguments(process.argv.slice(2))
  const reports = collectMutationReports(rootPath)
  if (outputPath && reports.some((reportPath) => resolve(reportPath) === outputPath)) {
    throw new Error('Output path must differ from every input mutation report.')
  }
  const aggregate = aggregateMutationReports(reports)
  const baselineReports = collectMutationReports(baselineRootPath)
  const baseline = aggregateMutationReports(baselineReports)
  const comparison = compareFileScores(
    aggregate,
    baseline,
    gitChangedUseCaseFiles(baseRef, headRef),
    threshold,
    excludedModules,
  )
  const markdown = `${renderMutationScoreTable(aggregate, threshold, excludedModules)}\n${renderFileScoreTable(comparison, threshold)}`
  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, markdown)
  }
  process.stdout.write(markdown)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}`)
  }
  if (aggregate.missingModules.length > 0) {
    console.error(
      `Missing mutation data for modules: ${aggregate.missingModules.join(', ')}.`,
    )
  }
  if (!isPassing(aggregate, threshold, excludedModules)) process.exitCode = 1
  if (comparison.failures.length) {
    console.error(
      `Per-file mutation gate failed:\n${comparison.failures.map((failure) => `- ${failure}`).join('\n')}`,
    )
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`Core mutation score: ${error.message}`)
    process.exitCode = 1
  }
}
