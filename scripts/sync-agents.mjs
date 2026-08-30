import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(SCRIPT_DIRECTORY, '..')
const SOURCE_DIR = path.join(ROOT_DIR, 'documentation', 'agents')
const CODEX_DIR = path.join(ROOT_DIR, '.codex')
const CODEX_AGENTS_DIR = path.join(CODEX_DIR, 'agents')
const OPENCODE_AGENTS_DIR = path.join(ROOT_DIR, '.opencode', 'agents')
const CLAUDE_AGENTS_DIR = path.join(ROOT_DIR, '.claude', 'agents')
const CODEX_CONFIG = path.join(CODEX_DIR, 'config.toml')
const CURRENT_BEGIN_MARKER = '# BEGIN GENERATED AGENTS - scripts/sync-agents.mjs'
const CURRENT_END_MARKER = '# END GENERATED AGENTS - scripts/sync-agents.mjs'
const LEGACY_BEGIN_MARKER = '# BEGIN GENERATED AGENTS - scripts/sync-agents.sh'
const LEGACY_END_MARKER = '# END GENERATED AGENTS - scripts/sync-agents.sh'
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function fail(message) {
  console.error(message)
  process.exit(1)
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join('/')
}

function stripWrappingQuotes(value) {
  let unwrappedValue = value
  while (
    (unwrappedValue.startsWith('"') && unwrappedValue.endsWith('"')) ||
    (unwrappedValue.startsWith("'") && unwrappedValue.endsWith("'"))
  ) {
    unwrappedValue = unwrappedValue.slice(1, -1)
  }
  return unwrappedValue
}

function parseAgent(agentPath) {
  const relativeAgentPath = relativePath(agentPath)
  const lines = fs.readFileSync(agentPath, 'utf8').split(/\r?\n/)
  if (!lines.length || lines[0].trim() !== '---') {
    fail(`Missing YAML frontmatter in ${relativeAgentPath}`)
  }

  const frontmatterEnd = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---',
  )
  if (frontmatterEnd === -1) {
    fail(`Unclosed YAML frontmatter in ${relativeAgentPath}`)
  }

  const metadata = {}
  for (const line of lines.slice(1, frontmatterEnd)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim())
    metadata[key] = value
  }

  const name = metadata.name ?? ''
  const description = metadata.description ?? ''
  const expectedName = path.basename(agentPath, path.extname(agentPath))

  if (!name) fail(`Missing name in ${relativeAgentPath}`)
  if (!description) fail(`Missing description in ${relativeAgentPath}`)
  if (name !== expectedName) {
    fail(
      `Agent name '${name}' must match filename '${expectedName}' in ${relativeAgentPath}`,
    )
  }
  if (!NAME_PATTERN.test(name))
    fail(`Invalid agent name '${name}' in ${relativeAgentPath}`)

  const body = `${lines
    .slice(frontmatterEnd + 1)
    .join('\n')
    .trim()}\n`
  if (!body.trim()) fail(`Missing agent instructions in ${relativeAgentPath}`)

  return { name, description, body, source: agentPath }
}

function isJudge(name) {
  return name.startsWith('judge-')
}

function isReviewer(name) {
  return name.endsWith('-reviewer-agent')
}

function generatedMarker(sourcePath) {
  return `<!-- Auto-generated from ${relativePath(sourcePath)} -->`
}

function writeIfChanged(filePath, content, managedToken) {
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf8')
    if (existingContent === content) {
      console.log(`unchanged: ${relativePath(filePath)}`)
      return
    }
    if (managedToken && !existingContent.includes(managedToken)) {
      fail(`Refusing to overwrite unmanaged file: ${relativePath(filePath)}`)
    }
  }

  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`synced:    ${relativePath(filePath)}`)
}

function cleanupStale(directory, suffix, validNames) {
  if (!fs.existsSync(directory)) return

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(suffix)) continue

    const filePath = path.join(directory, entry.name)
    const name = entry.name.slice(0, -suffix.length)
    if (validNames.has(name)) continue

    let sample
    try {
      sample = fs.readFileSync(filePath, 'utf8').slice(0, 2048)
    } catch {
      continue
    }
    if (!sample.includes('Auto-generated from documentation/agents/')) continue

    fs.unlinkSync(filePath)
    console.log(`removed:   ${relativePath(filePath)}`)
  }
}

function removeGeneratedBlock(config, beginMarker, endMarker) {
  const beginCount = config.split(beginMarker).length - 1
  const endCount = config.split(endMarker).length - 1
  if (beginCount !== endCount) {
    fail(`Unbalanced generated-agent markers in ${relativePath(CODEX_CONFIG)}`)
  }
  if (!beginCount) return config

  const beginIndex = config.indexOf(beginMarker)
  const endIndex = config.indexOf(endMarker, beginIndex + beginMarker.length)
  const before = config.slice(0, beginIndex)
  const after = config.slice(endIndex + endMarker.length)
  return `${before.trimEnd()}${after.replace(/^\n+/, '')}`
}

if (!fs.existsSync(SOURCE_DIR)) fail(`Agent source directory not found: ${SOURCE_DIR}`)

fs.mkdirSync(CODEX_AGENTS_DIR, { recursive: true })
fs.mkdirSync(OPENCODE_AGENTS_DIR, { recursive: true })
fs.mkdirSync(CLAUDE_AGENTS_DIR, { recursive: true })

const agents = fs
  .readdirSync(SOURCE_DIR)
  .filter((fileName) => fileName.endsWith('-agent.md'))
  .sort()
  .map((fileName) => parseAgent(path.join(SOURCE_DIR, fileName)))

if (!agents.length) fail('No agent definitions found in documentation/agents/*-agent.md')

const validNames = new Set(agents.map(({ name }) => name))
cleanupStale(CODEX_AGENTS_DIR, '.toml', validNames)
cleanupStale(OPENCODE_AGENTS_DIR, '.md', validNames)
cleanupStale(CLAUDE_AGENTS_DIR, '.md', validNames)

const codexRoles = [CURRENT_BEGIN_MARKER]

for (const { name, description, body, source } of agents) {
  const sourceRelative = relativePath(source)
  const codexPromptRelative = path.posix.join('../..', sourceRelative)
  const sandboxMode = isJudge(name) || isReviewer(name) ? 'read-only' : 'workspace-write'

  const codexRole =
    `# Auto-generated from ${sourceRelative}\n` +
    `model_instructions_file = ${JSON.stringify(codexPromptRelative)}\n` +
    `sandbox_mode = ${JSON.stringify(sandboxMode)}\n`
  writeIfChanged(
    path.join(CODEX_AGENTS_DIR, `${name}.toml`),
    codexRole,
    'Auto-generated from documentation/agents/',
  )

  codexRoles.push(
    '',
    `[agents.${JSON.stringify(name)}]`,
    `description = ${JSON.stringify(description)}`,
    `config_file = ${JSON.stringify(`agents/${name}.toml`)}`,
  )

  let opencodeMode
  let opencodePermissions
  if (name === 'orchestrator-agent') {
    opencodeMode = 'primary'
    opencodePermissions = '  edit: allow\n  bash: allow\n  task: allow'
  } else if (isJudge(name)) {
    opencodeMode = 'subagent'
    opencodePermissions = '  edit: deny\n  bash: deny\n  task: deny'
  } else if (isReviewer(name)) {
    opencodeMode = 'subagent'
    opencodePermissions = '  edit: deny\n  bash: allow\n  task: deny'
  } else if (name === 'builder-agent') {
    opencodeMode = 'subagent'
    opencodePermissions = '  edit: allow\n  bash: allow\n  task: deny'
  } else {
    opencodeMode = 'subagent'
    opencodePermissions = '  edit: allow\n  bash: allow\n  task: allow'
  }

  const opencodeAgent =
    '---\n' +
    `description: ${JSON.stringify(description)}\n` +
    `mode: ${opencodeMode}\n` +
    'permission:\n' +
    `${opencodePermissions}\n` +
    '---\n\n' +
    `${generatedMarker(source)}\n\n` +
    body
  writeIfChanged(
    path.join(OPENCODE_AGENTS_DIR, `${name}.md`),
    opencodeAgent,
    'Auto-generated from documentation/agents/',
  )

  const claudeFields = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
  ]
  if (isJudge(name)) {
    claudeFields.push('tools: Read, Glob, Grep', 'permissionMode: plan')
  } else if (isReviewer(name)) {
    claudeFields.push('disallowedTools: Write, Edit, Agent')
  } else if (name === 'builder-agent') {
    claudeFields.push('disallowedTools: Agent')
  }
  claudeFields.push('---', '', generatedMarker(source), '', body.trimEnd(), '')
  writeIfChanged(
    path.join(CLAUDE_AGENTS_DIR, `${name}.md`),
    claudeFields.join('\n'),
    'Auto-generated from documentation/agents/',
  )
}

codexRoles.push('', CURRENT_END_MARKER)
const managedBlock = `${codexRoles.join('\n')}\n`

let existingConfig = fs.existsSync(CODEX_CONFIG)
  ? fs.readFileSync(CODEX_CONFIG, 'utf8')
  : ''
existingConfig = removeGeneratedBlock(
  existingConfig,
  LEGACY_BEGIN_MARKER,
  LEGACY_END_MARKER,
)
existingConfig = removeGeneratedBlock(
  existingConfig,
  CURRENT_BEGIN_MARKER,
  CURRENT_END_MARKER,
)

let newConfig = existingConfig.trimEnd()
if (newConfig) newConfig += '\n\n'
newConfig += managedBlock
writeIfChanged(CODEX_CONFIG, newConfig)

console.log('Configured agents for Codex, OpenCode and Claude Code.')
