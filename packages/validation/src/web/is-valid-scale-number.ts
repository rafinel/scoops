export function isValidScaleNumber(
  value: string,
  pattern: RegExp,
  predicate: (value: number) => boolean,
): boolean {
  const normalizedValue = value.trim().replace(',', '.')
  const number = Number(normalizedValue)
  return pattern.test(normalizedValue) && Number.isFinite(number) && predicate(number)
}
