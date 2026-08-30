import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url))
const SCRIPT_PATH = fileURLToPath(new URL('../sync-commands.mjs', import.meta.url))

async function assertFileExists(filePath) {
  await access(filePath)
}

test('sync-commands generates command and skill representations', async () => {
  const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH], {
    cwd: ROOT_DIR,
  })

  assert.match(stdout, /(?:linked|copied):/)
  await assertFileExists(path.join(ROOT_DIR, '.cursor', 'commands', 'create-pr.md'))

  const skill = await readFile(
    path.join(ROOT_DIR, '.agents', 'skills', 'create-pr', 'SKILL.md'),
    'utf8',
  )
  assert.match(skill, /Auto-generated from documentation\/prompts\/create-pr-prompt\.md/)
})
