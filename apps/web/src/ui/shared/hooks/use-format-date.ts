const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
}

type FormatDateValue = Date | string

function parseDate(value: FormatDateValue) {
  if (value instanceof Date) return value

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }

  return new Date(value)
}

export function useFormatDate() {
  function formatDate(
    value: FormatDateValue,
    options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
  ) {
    const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    const formatOptions = dateOnly ? { ...options, timeZone: 'UTC' } : options
    return new Intl.DateTimeFormat('pt-BR', formatOptions).format(parseDate(value))
  }

  return formatDate
}
