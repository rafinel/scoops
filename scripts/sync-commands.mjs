import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(SCRIPT_DIRECTORY, '..')
const PROMPTS_DIR = path.join(ROOT_DIR, 'documentation', 'prompts')
const OUTPUT_DIRECTORIES = [
  path.join(ROOT_DIR, '.cursor', 'commands'),
  path.join(ROOT_DIR, '.claude', 'commands'),
  path.join(ROOT_DIR, '.opencode', 'commands'),
]
const SKILLS_DIR = path.join(ROOT_DIR, '.agents', 'skills')
const GENERATED_PROMPT_PATTERN =
  /^<!-- Auto-generated from (documentation\/prompts\/[^ ]+)( \(symlink not available\))? -->$/m

function fail(message) {
  console.error(message)
  process.exit(1)
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join('/')
}

function readGeneratedPromptSource(filePath) {
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }

  const match = content.match(GENERATED_PROMPT_PATTERN)
  return match?.[1] ?? null
}

function removeIfGenerated(filePath, source, reason) {
  fs.rmSync(filePath, { force: true })
  console.log(`removed: ${relativePath(filePath)} (${reason}: ${source})`)
}

function cleanupStaleGeneratedArtifacts() {
  for (const directory of OUTPUT_DIRECTORIES) {
    if (!fs.existsSync(directory)) continue

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.name.endsWith('.md')) continue

      const destination = path.join(directory, entry.name)
      if (entry.isSymbolicLink()) {
        const source = fs.readlinkSync(destination)
        if (
          /^\.\.\/\.\.\/documentation\/prompts\/[^/]+\.md$/.test(source) &&
          !fs.existsSync(destination)
        ) {
          removeIfGenerated(destination, source, 'missing source')
        }
        continue
      }

      const source = readGeneratedPromptSource(destination)
      if (source && !fs.existsSync(path.join(ROOT_DIR, source))) {
        removeIfGenerated(destination, source, 'missing source')
      }
    }
  }

  if (!fs.existsSync(SKILLS_DIR)) return

  for (const skillEntry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!skillEntry.isDirectory()) continue

    const skillDirectory = path.join(SKILLS_DIR, skillEntry.name)
    const skillFile = path.join(skillDirectory, 'SKILL.md')
    if (!fs.existsSync(skillFile)) continue

    const source = readGeneratedPromptSource(skillFile)
    if (!source || fs.existsSync(path.join(ROOT_DIR, source))) continue

    fs.rmSync(skillFile, { force: true })
    try {
      fs.rmdirSync(skillDirectory)
    } catch {
      // Preserve directories containing unmanaged files.
    }
    console.log(`removed: ${relativePath(skillDirectory)} (missing source)`)
  }
}

function linkOrCopy(source, destination) {
  const relativeSource = `../../${relativePath(source)}`
  fs.rmSync(destination, { force: true })

  try {
    fs.symlinkSync(relativeSource, destination)
    console.log(`linked:  ${relativePath(destination)} -> ${relativeSource}`)
  } catch {
    const content =
      `<!-- Auto-generated from ${relativePath(source)} (symlink not available) -->\n\n` +
      fs.readFileSync(source, 'utf8')
    fs.writeFileSync(destination, content, 'utf8')
    console.log(`copied:  ${relativePath(destination)} <- ${relativePath(source)}`)
  }
}

function extractDescription(source) {
  const content = fs.readFileSync(source, 'utf8')
  const description = content.match(/^description:\s*(.*)$/m)?.[1] ?? ''
  if (!description) fail(`Missing description in '${relativePath(source)}'`)
  return description
}

function syncSkill(source, name, description) {
  const skillDirectory = path.join(SKILLS_DIR, name)
  const skillFile = path.join(skillDirectory, 'SKILL.md')
  fs.mkdirSync(skillDirectory, { recursive: true })

  const content =
    '---\n' +
    `name: ${name}\n` +
    `description: ${description}\n` +
    '---\n\n' +
    `<!-- Auto-generated from ${relativePath(source)} -->\n\n` +
    fs.readFileSync(source, 'utf8')
  fs.writeFileSync(skillFile, content, 'utf8')

  console.log(`synced:  ${relativePath(skillFile)} <- ${relativePath(source)}`)
}

if (!fs.existsSync(PROMPTS_DIR)) fail(`Prompts directory not found: ${PROMPTS_DIR}`)

const prompts = fs
  .readdirSync(PROMPTS_DIR)
  .filter((fileName) => fileName.endsWith('.md'))
  .sort()
  .map((fileName) => path.join(PROMPTS_DIR, fileName))
if (!prompts.length) fail("No prompts found in 'documentation/prompts/*.md'")

for (const directory of OUTPUT_DIRECTORIES) fs.mkdirSync(directory, { recursive: true })
fs.mkdirSync(SKILLS_DIR, { recursive: true })

cleanupStaleGeneratedArtifacts()

for (const source of prompts) {
  const filename = path.basename(source)
  let name = filename.slice(0, -path.extname(filename).length)
  if (name.endsWith('-prompt')) name = name.slice(0, -'-prompt'.length)

  const description = extractDescription(source)
  for (const directory of OUTPUT_DIRECTORIES) {
    linkOrCopy(source, path.join(directory, `${name}.md`))
  }
  syncSkill(source, name, description)
}
