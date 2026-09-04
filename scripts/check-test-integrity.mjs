import { execFile } from 'node:child_process'
import { lstat, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'

const DEFAULT_BASE = 'main'
const execFileAsync = promisify(execFile)
const SOURCE_PATH_PATTERN = /^(?:apps|packages)\/[^/]+\/src\/.*\.[cm]?[jt]sx?$/
const TEST_PATH_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']

function parseArguments(argumentsList) {
  const positionalArguments = []
  let base = DEFAULT_BASE
  let shouldPrintJson = false

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--') continue
    if (argument === '--help') return { shouldPrintHelp: true }
    if (argument === '--json') {
      shouldPrintJson = true
      continue
    }
    if (argument === '--base') {
      const baseArgument = argumentsList[index + 1]
      if (!baseArgument || baseArgument.startsWith('--')) {
        throw new Error('--base requires a Git ref')
      }
      base = baseArgument
      index += 1
      continue
    }
    if (argument.startsWith('--')) throw new Error(`Unknown option: ${argument}`)
    positionalArguments.push(argument)
  }

  if (positionalArguments.length > 0) {
    throw new Error('Usage: pnpm check:test-integrity -- [--base <git-ref>] [--json]')
  }
  return { base, shouldPrintHelp: false, shouldPrintJson }
}

function printHelp() {
  console.log('Usage: pnpm check:test-integrity -- [--base <git-ref>] [--json]')
  console.log(
    'Checks test weakening and enforces direct-test ownership from test-integrity.config.mjs.',
  )
}

async function runGit(argumentsList, cwd) {
  const { stdout } = await execFileAsync('git', argumentsList, {
    cwd,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
  })
  return stdout
}

function parseNullSeparated(output) {
  return output.toString('utf8').split('\0').filter(Boolean)
}

function parseChangedPaths(output) {
  const values = parseNullSeparated(output)
  const changedPaths = new Map()
  for (let index = 0; index < values.length; index += 2) {
    const status = values[index]
    const changedPath = values[index + 1]
    if (status && changedPath) changedPaths.set(changedPath, status)
  }
  return changedPaths
}

function globToRegExp(pattern) {
  let expression = '^'
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    if (character === '*') {
      const isGlobstar = pattern[index + 1] === '*'
      if (isGlobstar) {
        index += 1
        if (pattern[index + 1] === '/') {
          index += 1
          expression += '(?:.*/)?'
        } else {
          expression += '.*'
        }
      } else {
        expression += '[^/]*'
      }
      continue
    }
    if (character === '?') {
      expression += '[^/]'
      continue
    }
    expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
  }
  return new RegExp(`${expression}$`)
}

function matchesPattern(filePath, pattern) {
  return globToRegExp(pattern).test(filePath)
}

function matchesAnyPattern(filePath, patterns) {
  return patterns.some((pattern) => matchesPattern(filePath, pattern))
}

function isTestPath(filePath) {
  return TEST_PATH_PATTERN.test(filePath)
}

function isSourcePath(filePath) {
  return SOURCE_PATH_PATTERN.test(filePath) && !isTestPath(filePath)
}

function sourcePolicy(filePath, testIntegrityPolicy) {
  const { sourcePatterns } = testIntegrityPolicy
  if (matchesAnyPattern(filePath, sourcePatterns.excluded)) return 'excluded'
  if (matchesAnyPattern(filePath, sourcePatterns.indirect)) return 'indirect'
  if (matchesAnyPattern(filePath, sourcePatterns.required)) return 'required'
  if (matchesAnyPattern(filePath, sourcePatterns.allowed)) return 'allowed'
  return 'unlisted'
}

function removeTestSuffix(filePath) {
  return filePath.replace(/\.(?:test|spec)\.[cm]?[jt]sx?$/, '')
}

function sourceCandidatesForTest(testPath, sourcePaths) {
  const stem = removeTestSuffix(testPath)
  const candidateStems = [stem]
  const testsIndex = stem.lastIndexOf('/tests/')
  if (testsIndex >= 0) {
    candidateStems.push(`${stem.slice(0, testsIndex)}/${stem.slice(testsIndex + 7)}`)
  }
  const candidatePaths = candidateStems.flatMap((candidateStem) =>
    SOURCE_EXTENSIONS.map((extension) => `${candidateStem}${extension}`),
  )
  return sourcePaths.filter((sourcePath) => candidatePaths.includes(sourcePath))
}

function countMatches(content, pattern) {
  return [...content.matchAll(pattern)].length
}

function testMetrics(content) {
  return {
    assertions: countMatches(content, /\bexpect\s*\(|\bassert\.[A-Za-z]+\s*\(/g),
    disabled: countMatches(content, /\b(?:it|test|describe)\.(?:skip|todo)\s*\(/g),
    cases: countMatches(content, /\b(?:it|test)(?:\.each)?\s*\(/g),
  }
}

async function inspectCurrentPath(repositoryRoot, filePath) {
  try {
    const stats = await lstat(path.join(repositoryRoot, filePath))
    return { exists: true, isDirectory: stats.isDirectory() }
  } catch (error) {
    if (error?.code === 'ENOENT') return { exists: false, isDirectory: false }
    throw error
  }
}

async function readBaseFile(repositoryRoot, baseSha, filePath) {
  try {
    return (await runGit(['show', `${baseSha}:${filePath}`], repositoryRoot)).toString(
      'utf8',
    )
  } catch {
    return null
  }
}

async function listRepositoryPaths(repositoryRoot) {
  const [trackedOutput, deletedOutput] = await Promise.all([
    runGit(
      ['ls-files', '-co', '--exclude-standard', '-z', '--', 'apps', 'packages'],
      repositoryRoot,
    ),
    runGit(['ls-files', '--deleted', '-z', '--', 'apps', 'packages'], repositoryRoot),
  ])
  const deletedPaths = new Set(parseNullSeparated(deletedOutput))
  return parseNullSeparated(trackedOutput).filter(
    (filePath) => !deletedPaths.has(filePath),
  )
}

async function loadPolicy(repositoryRoot) {
  const policyPath = path.join(repositoryRoot, 'test-integrity.config.mjs')
  const policyModule = await import(pathToFileURL(policyPath).href)
  if (!policyModule.default) {
    throw new Error(`${policyPath}: default test-integrity policy export is required`)
  }
  return policyModule.default
}

function checkTestOwnership(testPaths, sourcePaths, testIntegrityPolicy) {
  const errors = []
  const ownedTestPaths = []
  const indirectTestPaths = []
  const unownedTestPaths = []

  for (const testPath of testPaths) {
    if (matchesAnyPattern(testPath, testIntegrityPolicy.forbiddenTestPatterns)) {
      errors.push(`${testPath}: direct test path is forbidden by policy`)
      continue
    }

    const subjects = sourceCandidatesForTest(testPath, sourcePaths)
    const subjectPolicies = subjects.map((sourcePath) => ({
      policy: sourcePolicy(sourcePath, testIntegrityPolicy),
      sourcePath,
    }))
    const forbiddenSubject = subjectPolicies.find(({ policy }) =>
      ['indirect', 'unlisted'].includes(policy),
    )
    if (forbiddenSubject) {
      errors.push(
        `${testPath}: direct test is not allowed for ${forbiddenSubject.sourcePath} (${forbiddenSubject.policy})`,
      )
      indirectTestPaths.push(testPath)
      continue
    }

    if (
      subjects.length > 0 ||
      matchesAnyPattern(testPath, testIntegrityPolicy.boundaryTestPatterns)
    ) {
      ownedTestPaths.push(testPath)
      continue
    }

    errors.push(`${testPath}: test subject is not an allowed source file`)
    unownedTestPaths.push(testPath)
  }

  return {
    errors,
    indirectTestPaths,
    ownedTestPaths,
    unownedTestPaths,
  }
}

async function checkTestIntegrity({ base }) {
  const repositoryRoot = (await runGit(['rev-parse', '--show-toplevel'], process.cwd()))
    .toString('utf8')
    .trim()
  const testIntegrityPolicy = await loadPolicy(repositoryRoot)
  const baseSha = (
    await runGit(
      ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`],
      repositoryRoot,
    )
  )
    .toString('utf8')
    .trim()
  const [diffOutput, repositoryPaths] = await Promise.all([
    runGit(
      ['diff', '--name-status', '-z', '--no-renames', baseSha, '--'],
      repositoryRoot,
    ),
    listRepositoryPaths(repositoryRoot),
  ])
  const changedPaths = parseChangedPaths(diffOutput)
  const testPaths = repositoryPaths.filter(isTestPath)
  const sourcePaths = repositoryPaths.filter(isSourcePath)
  const ownership = checkTestOwnership(testPaths, sourcePaths, testIntegrityPolicy)
  const errors = [...ownership.errors]
  const warnings = []
  const changedTestPaths = new Set(
    [...changedPaths.entries()]
      .filter(([filePath, status]) => isTestPath(filePath) && status !== 'D')
      .map(([filePath]) => filePath),
  )

  for (const [filePath, status] of changedPaths) {
    if (!isTestPath(filePath)) continue
    if (status === 'D') continue
    const currentPath = await inspectCurrentPath(repositoryRoot, filePath)
    if (!currentPath.exists || currentPath.isDirectory) {
      errors.push(`${filePath}: changed test file is missing`)
      continue
    }
    if (!status.startsWith('M')) continue
    const baseContent = await readBaseFile(repositoryRoot, baseSha, filePath)
    if (baseContent === null) continue
    const before = testMetrics(baseContent)
    const after = testMetrics(await readFile(path.join(repositoryRoot, filePath), 'utf8'))
    if (after.cases < before.cases) {
      errors.push(`${filePath}: test cases decreased (${after.cases} < ${before.cases})`)
    }
    if (after.assertions < before.assertions) {
      errors.push(
        `${filePath}: assertions decreased (${after.assertions} < ${before.assertions})`,
      )
    }
    if (after.disabled > before.disabled) {
      errors.push(
        `${filePath}: disabled or todo tests increased (${after.disabled} > ${before.disabled})`,
      )
    }
  }

  const changedSourcePaths = [...changedPaths.entries()]
    .filter(([filePath, status]) => isSourcePath(filePath) && status !== 'D')
    .map(([filePath]) => filePath)
    .filter((filePath) =>
      ['required', 'allowed'].includes(sourcePolicy(filePath, testIntegrityPolicy)),
    )
  for (const sourcePath of changedSourcePaths) {
    const hasTest = testPaths.some(
      (testPath) => sourceCandidatesForTest(testPath, [sourcePath]).length > 0,
    )
    if (!hasTest && sourcePolicy(sourcePath, testIntegrityPolicy) === 'required') {
      errors.push(`${sourcePath}: required direct test is missing`)
    }
  }

  const sourceCounts = sourcePaths.reduce((counts, sourcePath) => {
    const policy = sourcePolicy(sourcePath, testIntegrityPolicy)
    counts[policy] = (counts[policy] ?? 0) + 1
    return counts
  }, {})

  return {
    base,
    baseSha,
    changedTestPaths: changedTestPaths.size,
    errors,
    indirectTestPaths: ownership.indirectTestPaths.sort(),
    ownedTestPaths: ownership.ownedTestPaths.sort(),
    sourceCounts,
    status: errors.length === 0 ? 'passed' : 'failed',
    unownedTestPaths: ownership.unownedTestPaths.sort(),
    warnings,
  }
}

function printResult(result, shouldPrintJson) {
  if (shouldPrintJson) {
    console.log(JSON.stringify(result, null, 2))
    return
  }
  console.log(`Test integrity: ${result.status.toUpperCase()}`)
  console.log(`Baseline: ${result.base} (${result.baseSha})`)
  console.log(
    `Tracked test files: ${result.ownedTestPaths.length + result.indirectTestPaths.length}`,
  )
  console.log(`Changed test files: ${result.changedTestPaths}`)
  for (const error of result.errors) console.error(`ERROR: ${error}`)
  console.log(
    'Boundary: only required/allowed source policies may own direct tests; indirect and unlisted sources are covered through consumers.',
  )
}

async function main() {
  try {
    const argumentsResult = parseArguments(process.argv.slice(2))
    if (argumentsResult.shouldPrintHelp) {
      printHelp()
      return
    }
    const result = await checkTestIntegrity(argumentsResult)
    printResult(result, argumentsResult.shouldPrintJson)
    process.exitCode = result.status === 'passed' ? 0 : 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 2
  }
}

await main()
