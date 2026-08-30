import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url))
const SCRIPT_PATH = fileURLToPath(new URL('../sync-agents.mjs', import.meta.url))

async function assertFileExists(filePath) {
  await access(filePath)
}

test('sync-agents generates the Codex, OpenCode and Claude representations', async () => {
  const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH], {
    cwd: ROOT_DIR,
  })

  assert.match(stdout, /Configured agents for Codex, OpenCode and Claude Code\./)
  await assertFileExists(path.join(ROOT_DIR, '.codex', 'agents', 'builder-agent.toml'))
  await assertFileExists(path.join(ROOT_DIR, '.opencode', 'agents', 'builder-agent.md'))
  await assertFileExists(path.join(ROOT_DIR, '.claude', 'agents', 'builder-agent.md'))

  const codexConfig = await readFile(path.join(ROOT_DIR, '.codex', 'config.toml'), 'utf8')
  assert.match(codexConfig, /BEGIN GENERATED AGENTS - scripts\/sync-agents\.mjs/)
  assert.doesNotMatch(codexConfig, /BEGIN GENERATED AGENTS - scripts\/sync-agents\.sh/)
})
