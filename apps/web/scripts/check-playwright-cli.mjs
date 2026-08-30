import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const WEB_APP_DIRECTORY = resolve(SCRIPT_DIRECTORY, '..')
const PNPM_COMMAND = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const PLAYWRIGHT_HEALTH_TEST = 'tests/health/playwright-cli-health.test.ts'

function runPlaywrightTest() {
  const result = spawnSync(
    PNPM_COMMAND,
    [
      'exec',
      'playwright',
      'test',
      PLAYWRIGHT_HEALTH_TEST,
      '--workers=1',
      '--reporter=line',
    ],
    {
      cwd: WEB_APP_DIRECTORY,
      stdio: 'inherit',
    },
  )

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const playwrightVersion = execFileSync(
  PNPM_COMMAND,
  ['exec', 'playwright', '--version'],
  {
    cwd: WEB_APP_DIRECTORY,
    encoding: 'utf8',
  },
).trim()

console.log(`Playwright CLI: ${playwrightVersion}`)
console.log(
  'Running browser, dev-server, page-load, console, network, keyboard, and screenshot checks...',
)

runPlaywrightTest()

console.log('Playwright CLI health check passed.')
