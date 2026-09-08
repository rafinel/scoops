import { randomUUID } from 'node:crypto'
import { appendFile, readFile } from 'node:fs/promises'

const [, , envFilePath, appName, githubEnvPath] = process.argv
const apiKey = process.env.HEROKU_API_KEY

if (!envFilePath || !appName || !apiKey) {
  throw new Error('Usage: sync-heroku-env.mjs <env-file> <app-name> [github-env-file]')
}

const parsedConfig = parseDotenv(await readFile(envFilePath, 'utf8'))
const config = Object.fromEntries(
  Object.entries(parsedConfig).filter(([key]) => key !== 'PORT'),
)

if (githubEnvPath) await exportGitHubEnvironment(githubEnvPath, config)

const endpoint = `https://api.heroku.com/apps/${encodeURIComponent(appName)}/config-vars`
const headers = {
  Accept: 'application/vnd.heroku+json; version=3',
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}
const currentResponse = await fetch(endpoint, { headers })
if (!currentResponse.ok)
  throw new Error(`Unable to read Heroku config (${currentResponse.status})`)

const current = await currentResponse.json()
const changed = Object.fromEntries(
  Object.entries(config).filter(([key, value]) => current[key] !== value),
)

if (Object.keys(changed).length === 0) {
  console.log(`Heroku config is already current for ${appName}.`)
  process.exit(0)
}

const updateResponse = await fetch(endpoint, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(changed),
})
if (!updateResponse.ok) {
  throw new Error(`Unable to update Heroku config (${updateResponse.status})`)
}

console.log(`Updated ${Object.keys(changed).length} Heroku config vars for ${appName}.`)

function parseDotenv(source) {
  const entries = {}

  for (const [index, rawLine] of source.split(/\r?\n/u).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const assignment = line.startsWith('export ') ? line.slice(7).trim() : line
    const separator = assignment.indexOf('=')
    if (separator < 1) throw new Error(`Invalid dotenv assignment on line ${index + 1}`)

    const key = assignment.slice(0, separator).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)) {
      throw new Error(`Invalid dotenv key on line ${index + 1}`)
    }

    entries[key] = parseValue(assignment.slice(separator + 1).trim(), index + 1)
  }

  return entries
}

function parseValue(value, lineNumber) {
  if (!value.startsWith("'") && !value.startsWith('"')) return value

  const quote = value[0]
  if (!value.endsWith(quote)) throw new Error(`Unclosed quote on line ${lineNumber}`)

  const unquoted = value.slice(1, -1)
  return quote === '"' ? unquoted.replace(/\\n/gu, '\n') : unquoted
}

async function exportGitHubEnvironment(path, config) {
  let output = ''
  for (const [key, value] of Object.entries(config)) {
    const delimiter = `SCOOPS_${randomUUID()}`
    output += `${key}<<${delimiter}\n${value}\n${delimiter}\n`
  }
  await appendFile(path, output, { encoding: 'utf8', mode: 0o600 })
}
