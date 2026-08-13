import { ROUTES } from '@/constants/routes'

export function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return undefined
  }

  if (containsControlCharacter(value) || value.includes('\\')) return undefined

  try {
    const url = new URL(value, 'https://scoops.invalid')

    if (
      url.origin !== 'https://scoops.invalid' ||
      url.pathname === ROUTES.login ||
      url.pathname.startsWith(`${ROUTES.login}/`) ||
      hasSensitiveQuery(url)
    ) {
      return undefined
    }

    return `${url.pathname}${url.search}`
  } catch {
    return undefined
  }
}

function hasSensitiveQuery(url: URL): boolean {
  for (const key of url.searchParams.keys()) {
    if (/(auth|account|password|secret|session|token|user)/i.test(key)) return true
  }

  return false
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)

    if (codePoint !== undefined && (codePoint <= 31 || codePoint === 127)) {
      return true
    }
  }

  return false
}
