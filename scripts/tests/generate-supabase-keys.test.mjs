import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = fileURLToPath(
  new URL('../generate-supabase-keys.mjs', import.meta.url),
)

function decodeJwtPart(part) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))
}

test('generates valid anonymous and service-role Supabase JWTs', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'scoops-supabase-keys-'))
  const envFile = path.join(temporaryDirectory, '.env')
  const secret = 'a'.repeat(32)

  try {
    await writeFile(envFile, `JWT_SECRET=${secret}\n`)
    const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH, envFile])
    const lines = stdout.trim().split('\n')

    assert.equal(lines.length, 3)
    assert.match(lines[0], /# Generated with the JWT_SECRET from /)

    const anonymousToken = lines[1].slice('ANON_KEY='.length)
    const serviceRoleToken = lines[2].slice('SUPABASE_SERVICE_ROLE_KEY='.length)
    const anonymousParts = anonymousToken.split('.')
    const serviceRoleParts = serviceRoleToken.split('.')

    assert.equal(anonymousParts.length, 3)
    assert.equal(serviceRoleParts.length, 3)
    assert.deepEqual(decodeJwtPart(anonymousParts[0]), { alg: 'HS256', typ: 'JWT' })
    assert.deepEqual(decodeJwtPart(serviceRoleParts[0]), { alg: 'HS256', typ: 'JWT' })
    assert.equal(decodeJwtPart(anonymousParts[1]).role, 'anon')
    assert.equal(decodeJwtPart(serviceRoleParts[1]).role, 'service_role')
    assert.equal(decodeJwtPart(anonymousParts[1]).iss, 'supabase-demo')
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
})

test('rejects an environment file without a sufficiently long JWT secret', async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'scoops-supabase-keys-'))
  const envFile = path.join(temporaryDirectory, '.env')

  try {
    await writeFile(envFile, 'JWT_SECRET=too-short\n')

    await assert.rejects(
      execFileAsync(process.execPath, [SCRIPT_PATH, envFile]),
      (error) => {
        assert.match(error.stderr, /JWT_SECRET must contain at least 32 characters/)
        return true
      },
    )
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
})
