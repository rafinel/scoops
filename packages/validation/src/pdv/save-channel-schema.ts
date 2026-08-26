import { z } from 'zod'

import { nameSchema } from '../identity/name-schema.ts'
import { salesChannelStatusSchema } from './sales-channel-status-schema.ts'

export const saveChannelSchema = z.strictObject({
  name: nameSchema,
  percentage: z
    .number({ error: 'Informe uma porcentagem válida.' })
    .finite('Informe uma porcentagem válida.')
    .min(-99.99, 'A porcentagem mínima é -99,99%.')
    .max(100, 'A porcentagem máxima é 100%.')
    .refine(hasAtMostTwoDecimalPlaces, 'Use no máximo duas casas decimais.'),
  status: salesChannelStatusSchema,
})

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}
