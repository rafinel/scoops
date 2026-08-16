import { AppError } from '@scoops/core/shared/domain/errors'

export const IdentityDateMapper = (value: string, fallbackMessage: string): Date => {
  if (typeof value !== 'string') throw new AppError(fallbackMessage)

  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new AppError(fallbackMessage)

  return date
}

export const OptionalIdentityDateMapper = (
  value: string | undefined,
  fallbackMessage: string,
) => {
  return value === undefined ? undefined : IdentityDateMapper(value, fallbackMessage)
}
