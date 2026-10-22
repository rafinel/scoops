/** Converts an optional domain number into its numeric column value; `undefined` stays undefined (keep) and `null` stays null (clear). */
export function toNumericValue(value: number): string
export function toNumericValue(value: number | null): string | null
export function toNumericValue(value: number | undefined): string | undefined
export function toNumericValue(
  value: number | null | undefined,
): string | null | undefined
export function toNumericValue(value: number | null | undefined) {
  if (value === undefined || value === null) return value
  return String(value)
}
