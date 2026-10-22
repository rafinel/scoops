import { z } from 'zod'

export const removeGlobalAccompanimentQuerySchema = z.strictObject({
  keepPortionLinks: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
})
