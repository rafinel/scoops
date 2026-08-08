export function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') return {}

  return Object.entries(headers as Record<string, unknown>).reduce(
    (normalizedHeaders, [key, value]) => {
      if (value !== undefined && value !== null) {
        normalizedHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value)
      }

      return normalizedHeaders
    },
    {} as Record<string, string>,
  )
}
