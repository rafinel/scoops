import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  lstatSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export function parseArguments(args) {
  const options = {
    all: false,
    dryRun: false,
    force: false,
    base: undefined,
    shard: undefined,
    files: [],
  }
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--') continue
    if (argument === '--all') options.all = true
    else if (argument === '--dry-run') options.dryRun = true
    else if (argument === '--force') options.force = true
    else if (argument === '--shard') {
      const match = args[++index]?.match(/^([1-9]\d*)\/([1-9]\d*)$/)
      if (!match || options.shard) throw new Error('--shard requires N/M once')
      const [, shardIndex, shardCount] = match.map(Number)
      if (
        !Number.isSafeInteger(shardIndex) ||
        !Number.isSafeInteger(shardCount) ||
        shardIndex > shardCount
      )
        throw new Error('--shard requires 1 <= N <= M with safe integers')
      options.shard = { index: shardIndex, count: shardCount }
    } else if (
      argument === '--base' &&
      args[index + 1] &&
      !args[index + 1].startsWith('--')
    )
      options.base = args[++index]
    else if (argument === '--files') {
      const previousCount = options.files.length
      while (args[index + 1] && !args[index + 1].startsWith('--')) {
        options.files.push(args[++index])
      }
      if (options.files.length === previousCount)
        throw new Error('--files requires package-relative paths')
    } else throw new Error(`Unknown or incomplete argument: ${argument}`)
  }
  if (
    (options.all && (options.base || options.files.length)) ||
    (options.base && options.files.length)
  ) {
    throw new Error('Choose only one of --all, --base or --files')
  }
  if (options.shard && !options.all) throw new Error('--shard requires --all')
  return options
}

export function partitionMutationFiles(files, shardCount) {
  const buckets = Array.from({ length: shardCount }, () => ({ bytes: 0, paths: [] }))
  const ordered = [...files].sort(
    (a, b) => b.bytes - a.bytes || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
  )
  for (const { path, bytes } of ordered) {
    let target = buckets[0]
    for (const bucket of buckets) {
      if (bucket.bytes < target.bytes) target = bucket
    }
    target.paths.push(path)
    target.bytes += bytes
  }
  return buckets.map(({ paths }) => paths.sort())
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function nulPaths(output) {
  return output.split('\0').filter(Boolean)
}

export function isUseCaseFile(path, sourceRoot) {
  return (
    path.startsWith(`${sourceRoot}/`) &&
    /\/use-cases\/[^/]+-use-case\.ts$/.test(path) &&
    !/(^|\/)(tests?|__tests__|fakers?|fixtures?|mocks?|__mocks__)(\/|$)/.test(path) &&
    !/\.(test|spec|gen|d)\.[cm]?[jt]sx?$/.test(path) &&
    !/(^|\/)(generated|__generated__)\//.test(path) &&
    !/(^|\/)index\.ts$/.test(path)
  )
}

export function selectMutationFiles(candidates, changed, sourceRoot) {
  const selected = new Set()
  for (const path of changed) {
    if (candidates.includes(path)) selected.add(path)
    const testBoundary = path.match(/^(.*?)\/(?:tests|__tests__)\//)
    if (testBoundary) {
      for (const candidate of candidates) {
        if (candidate.startsWith(`${testBoundary[1]}/`)) selected.add(candidate)
      }
    }
    if (
      /^(vitest(?:\.[\w-]+)?\.config\.|stryker\.config\.|tsconfig|package\.json|tests\/setup)/.test(
        path,
      )
    ) {
      throw new Error(
        'Shared test/configuration changes require explicit --files; CI uses --all',
      )
    }
  }
  return [...selected].filter((path) => isUseCaseFile(path, sourceRoot)).sort()
}

function defaultBase(root) {
  const branch = git(root, ['branch', '--show-current'])
  if (branch === 'main') return 'HEAD'
  for (const reference of ['origin/main', 'main']) {
    try {
      return git(root, ['merge-base', 'HEAD', reference])
    } catch {
      // A clone may have only one local branch; HEAD still includes working changes.
    }
  }
  throw new Error('No main reference available; supply --base explicitly')
}

export function mutationContext(root, environment = process.env) {
  const paths = nulPaths(
    git(root, [
      'ls-files',
      '-z',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      '.',
    ]),
  ).filter(
    (path) =>
      !path.includes('/') ||
      ['packages/core/', 'scripts/'].some((prefix) => path.startsWith(prefix)),
  )
  const hash = createHash('sha256')
  hash.update(JSON.stringify([process.version, process.platform, process.arch]))
  hash.update(
    JSON.stringify(Object.entries(environment).sort(([a], [b]) => a.localeCompare(b))),
  )

  for (const path of [...new Set(paths)].sort()) {
    // Design documents are not runtime inputs and must only be accessed through Pencil.
    if (
      path.endsWith('.pen') ||
      /(^|\/)\.env(?:\.|$)/.test(path) ||
      !existsSync(resolve(root, path)) ||
      !lstatSync(resolve(root, path)).isFile()
    )
      continue
    hash.update(JSON.stringify(path))
    hash.update(readFileSync(resolve(root, path)))
    hash.update('\0')
  }

  return hash.digest('hex')
}

export async function runMutation(args, cwd = process.cwd()) {
  const options = parseArguments(args)
  const root = git(cwd, ['rev-parse', '--show-toplevel'])
  const packagePath = relative(root, cwd).split(sep).join('/')
  const sourceRoot = { 'packages/core': 'src' }[packagePath]
  if (!sourceRoot) throw new Error('Run test:mutation from packages/core')
  const prefix = `${packagePath}/`
  const tracked = nulPaths(
    git(root, [
      'ls-files',
      '-z',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      packagePath,
    ]),
  )
  const candidates = [...new Set(tracked)]
    .map((path) => path.slice(prefix.length))
    .filter(
      (path) =>
        isUseCaseFile(path, sourceRoot) &&
        existsSync(resolve(cwd, path)) &&
        lstatSync(resolve(cwd, path)).isFile(),
    )
  let selected
  if (options.all) selected = candidates
  else if (options.files.length) {
    selected = options.files.map((path) =>
      relative(cwd, resolve(cwd, path)).split(sep).join('/'),
    )
    for (const path of selected) {
      if (!candidates.includes(path) || /[*?{}[\],!]/.test(path)) {
        throw new Error(`Not an eligible Core use-case file: ${path}`)
      }
    }
  } else {
    const base = git(root, [
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${options.base ?? defaultBase(root)}^{commit}`,
    ])
    const changed = nulPaths(git(root, ['diff', '--name-only', '-z', base, '--']))
    changed.push(
      ...nulPaths(git(root, ['ls-files', '--others', '--exclude-standard', '-z'])),
    )
    const local = changed
      .filter((path) => path.startsWith(prefix))
      .map((path) => path.slice(prefix.length))
    // Workspace dependency and compiler changes can affect every source file in this package.
    if (
      changed.some((path) =>
        [
          'pnpm-lock.yaml',
          'pnpm-workspace.yaml',
          'package.json',
          'scripts/test-mutation.mjs',
        ].includes(path),
      )
    ) {
      local.push('package.json')
    }
    selected = selectMutationFiles(candidates, local, sourceRoot)
  }
  selected = [...new Set(selected)].sort()
  if (options.shard) {
    selected =
      options.shard.index > selected.length
        ? []
        : partitionMutationFiles(
            selected.map((path) => ({ path, bytes: lstatSync(resolve(cwd, path)).size })),
            Math.min(options.shard.count, selected.length),
          )[options.shard.index - 1]
  }
  if (!selected.length) {
    throw new Error(
      'No eligible Core use-case files selected. Use --files for an explicit scope or --all; no mutation check was performed.',
    )
  }
  console.log(
    `Mutation scope (${options.all ? 'all Core use cases' : 'scoped Core use cases'}${options.shard ? `, shard ${options.shard.index}/${options.shard.count}` : ''}): ${selected.join(', ')}`,
  )
  for (const path of selected) {
    if (/[*?{}[\],!]/.test(path))
      throw new Error(`Unsupported glob characters in path: ${path}`)
  }
  if (options.dryRun) return 0

  const reportDirectory = resolve(cwd, 'reports/mutation')
  const reportName = `incremental-${randomUUID()}.json`
  const incrementalFile = resolve(reportDirectory, reportName)
  const contextFile = resolve(reportDirectory, 'context.json')
  const context = mutationContext(root)
  let previous
  try {
    previous = JSON.parse(readFileSync(contextFile, 'utf8'))
  } catch {
    // A missing or invalid manifest requires fresh mutation results.
  }
  const previousFile =
    typeof previous?.reportName === 'string' &&
    /^incremental-[a-f0-9-]+\.json$/.test(previous.reportName)
      ? resolve(reportDirectory, previous.reportName)
      : undefined
  let isReusable = false
  mkdirSync(reportDirectory, { recursive: true })

  if (
    !options.force &&
    previous?.context === context &&
    JSON.stringify(previous?.scope) === JSON.stringify(selected) &&
    previousFile
  ) {
    try {
      copyFileSync(previousFile, incrementalFile)
      isReusable = true
    } catch {
      // Another completed run may have replaced and removed the old cache.
    }
  }

  console.log(
    isReusable
      ? 'Incremental mutation results: reusing unchanged inputs.'
      : 'Incremental mutation results: fresh run (inputs/scope changed or --force).',
  )

  // Public reports must describe this invocation, including early runner failures.
  for (const report of ['index.html', 'mutation.json']) {
    rmSync(resolve(reportDirectory, report), { force: true })
  }

  const result = spawnSync(
    process.execPath,
    [
      resolve(cwd, 'node_modules/@stryker-mutator/core/bin/stryker.js'),
      'run',
      'stryker.config.mjs',
      '--mutate',
      selected.join(','),
      '--incremental',
      '--incrementalFile',
      incrementalFile,
    ],
    {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_COMPILE_CACHE:
          process.env.NODE_COMPILE_CACHE ??
          resolve(cwd, 'node_modules/.cache/stryker-compile'),
      },
    },
  )
  if (result.error) throw result.error

  if (
    result.status === 0 &&
    existsSync(incrementalFile) &&
    mutationContext(root) === context
  ) {
    // Publish an immutable report and its context together, even with overlapping runs.
    const pendingContext = `${incrementalFile}.context`
    writeFileSync(
      pendingContext,
      JSON.stringify({ context, reportName, scope: selected }),
    )
    renameSync(pendingContext, contextFile)
    if (previousFile) rmSync(previousFile, { force: true })
  } else {
    rmSync(contextFile, { force: true })
    rmSync(incrementalFile, { force: true })
  }

  return result.status ?? 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await runMutation(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
