#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-$PROJECT_ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  echo "Usage: $0 [path-to-env-file]" >&2
  exit 1
fi

node - "$ENV_FILE" <<'NODE'
const fs = require('node:fs')
const crypto = require('node:crypto')

const envFile = process.argv[2]
const values = {}

for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const trimmedLine = line.trim()
  if (!trimmedLine || trimmedLine.startsWith('#')) continue

  const separatorIndex = trimmedLine.indexOf('=')
  if (separatorIndex < 1) continue

  const key = trimmedLine.slice(0, separatorIndex).trim()
  let value = trimmedLine.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  values[key] = value
}

const secret = values.JWT_SECRET
if (!secret) throw new Error(`JWT_SECRET is missing from ${envFile}`)
if (secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters')

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const issuedAt = Math.floor(Date.now() / 1000)
const expiresAt = issuedAt + 10 * 365 * 24 * 60 * 60

function createKey(role) {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({
    role,
    iss: 'supabase-demo',
    iat: issuedAt,
    exp: expiresAt,
  })
  const unsignedToken = `${header}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url')

  return `${unsignedToken}.${signature}`
}

console.log('# Generated with the JWT_SECRET from ' + envFile)
console.log('ANON_KEY=' + createKey('anon'))
console.log('SUPABASE_SERVICE_ROLE_KEY=' + createKey('service_role'))
NODE
