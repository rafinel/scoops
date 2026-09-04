import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = fileURLToPath(new URL('../check-test-integrity.mjs', import.meta.url))

async function runGit(argumentsList, cwd) {
  await execFileAsync('git', argumentsList, { cwd })
}

async function createRepositoryFixture({
  sourcePath,
  testPath,
  sourcePolicy,
  boundaryTestPatterns = [],
}) {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), 'scoops-test-integrity-'))
  await runGit(['init', '--initial-branch=main'], repositoryRoot)
  await runGit(['config', 'user.email', 'test@example.com'], repositoryRoot)
  await runGit(['config', 'user.name', 'Test Integrity'], repositoryRoot)
  await mkdir(path.dirname(path.join(repositoryRoot, sourcePath)), { recursive: true })
  await mkdir(path.dirname(path.join(repositoryRoot, testPath)), { recursive: true })
  await writeFile(path.join(repositoryRoot, 'package.json'), '{}\n')
  await writeFile(path.join(repositoryRoot, sourcePath), sourcePolicy)
  await writeFile(
    path.join(repositoryRoot, testPath),
    "test('keeps the contract', () => expect(true).toBe(true))\n",
  )
  await writeFile(
    path.join(repositoryRoot, 'test-integrity.config.mjs'),
    `export default ${JSON.stringify({
      sourcePatterns: {
        required: ['apps/example/src/value.ts'],
        allowed: [],
        indirect: ['apps/example/src/broker.ts'],
        excluded: [],
      },
      boundaryTestPatterns,
      forbiddenTestPatterns: [],
    })}\n`,
  )
  await runGit(['add', '.'], repositoryRoot)
  await runGit(['commit', '-m', 'test: create baseline'], repositoryRoot)
  return repositoryRoot
}

test('passes when a required source has its direct test', async () => {
  const repositoryRoot = await createRepositoryFixture({
    sourcePath: 'apps/example/src/value.ts',
    sourcePolicy: 'export const value = 1\n',
    testPath: 'apps/example/src/value.test.ts',
  })
  try {
    await writeFile(
      path.join(repositoryRoot, 'apps/example/src/value.ts'),
      'export const value = 2\n',
    )
    const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH, '--json'], {
      cwd: repositoryRoot,
    })
    const result = JSON.parse(stdout)
    assert.equal(result.status, 'passed')
    assert.deepEqual(result.errors, [])
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})

test('fails when an indirect source receives a direct test', async () => {
  const repositoryRoot = await createRepositoryFixture({
    sourcePath: 'apps/example/src/broker.ts',
    sourcePolicy: 'export const broker = {}\n',
    testPath: 'apps/example/src/broker.test.ts',
  })
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, '--json'], { cwd: repositoryRoot }),
      (error) => {
        const result = JSON.parse(error.stdout)
        assert.equal(result.status, 'failed')
        assert.match(result.errors.join('\n'), /broker\.test\.ts.*indirect/)
        return true
      },
    )
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})

test('fails when a forbidden test path exists even without a matching source', async () => {
  const repositoryRoot = await createRepositoryFixture({
    sourcePath: 'apps/example/src/value.ts',
    sourcePolicy: 'export const value = 1\n',
    testPath: 'apps/example/src/value.test.ts',
  })
  try {
    const configPath = path.join(repositoryRoot, 'test-integrity.config.mjs')
    await writeFile(
      configPath,
      `export default ${JSON.stringify({
        sourcePatterns: {
          required: ['apps/example/src/value.ts'],
          allowed: [],
          indirect: [],
          excluded: [],
        },
        boundaryTestPatterns: [],
        forbiddenTestPatterns: ['apps/example/src/value.test.ts'],
      })}\n`,
    )
    await unlink(path.join(repositoryRoot, 'apps/example/src/value.ts'))
    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, '--json'], { cwd: repositoryRoot }),
      (error) => {
        const result = JSON.parse(error.stdout)
        assert.equal(result.status, 'failed')
        assert.match(result.errors.join('\n'), /direct test path is forbidden/)
        return true
      },
    )
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})

test('does not inspect deleted tracked tests as current files', async () => {
  const repositoryRoot = await createRepositoryFixture({
    sourcePath: 'apps/example/src/broker.ts',
    sourcePolicy: 'export const broker = {}\n',
    testPath: 'apps/example/src/broker.test.ts',
  })
  try {
    await unlink(path.join(repositoryRoot, 'apps/example/src/broker.test.ts'))
    const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH, '--json'], {
      cwd: repositoryRoot,
    })
    const result = JSON.parse(stdout)
    assert.equal(result.status, 'passed')
    assert.deepEqual(result.errors, [])
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})

test('rejects real-service browser integration tests', async () => {
  const repositoryRoot = await createRepositoryFixture({
    sourcePath: 'apps/example/src/value.ts',
    sourcePolicy: 'export const value = 1\n',
    testPath:
      'apps/web/tests/integration/identity/authentication.real.integration.test.ts',
  })
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, '--json'], { cwd: repositoryRoot }),
      (error) => {
        const result = JSON.parse(error.stdout)
        assert.equal(result.status, 'failed')
        assert.match(result.errors.join('\n'), /test subject is not an allowed source file/)
        return true
      },
    )
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})

test('rejects generic browser tests under the integration directory', async () => {
  const repositoryRoot = await createRepositoryFixture({
    sourcePath: 'apps/example/src/value.ts',
    sourcePolicy: 'export const value = 1\n',
    testPath: 'apps/web/tests/integration/identity/authentication.test.ts',
  })
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, '--json'], { cwd: repositoryRoot }),
      (error) => {
        const result = JSON.parse(error.stdout)
        assert.equal(result.status, 'failed')
        assert.match(result.errors.join('\n'), /test subject is not an allowed source file/)
        return true
      },
    )
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})
