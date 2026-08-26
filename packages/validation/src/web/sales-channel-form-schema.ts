import { z } from 'zod'

import { nameSchema } from '../identity/name-schema.ts'
import { salesChannelStatusSchema } from '../pdv/sales-channel-status-schema.ts'

const percentageInputSchema = z
  .string({ error: 'Informe uma porcentagem válida.' })
  .trim()
  .refine(
    isValidPercentageInput,
    'Informe uma porcentagem válida, com até duas casas decimais.',
  )
  .transform(parsePercentageInput)

export const salesChannelFormSchema = z.discriminatedUnion('variant', [
  z.strictObject({
    variant: z.literal('add'),
    name: nameSchema,
    percentage: percentageInputSchema,
    status: salesChannelStatusSchema,
  }),
  z.strictObject({
    variant: z.literal('edit'),
    name: nameSchema,
    percentage: percentageInputSchema,
  }),
])

function isValidPercentageInput(value: string): boolean {
  const normalizedValue = value.replace(',', '.')

  if (!/^[+-]?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(normalizedValue)) {
    return false
  }

  const percentage = Number(normalizedValue)

  return Number.isFinite(percentage) && percentage >= -99.99 && percentage <= 100
}

function parsePercentageInput(value: string): number {
  return Number(value.replace(',', '.'))
}
