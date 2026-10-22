import { z } from 'zod'

import { accompanimentPriceSchema } from './accompaniment-price-schema.ts'
import { accompanimentQuantitySchema } from './accompaniment-quantity-schema.ts'

export const linkAccompanimentPortionsSchema = z
  .object({
    portionProductIds: z
      .array(z.uuid())
      .max(500)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: 'As porções não podem se repetir.',
      })
      .optional(),
    accompanimentTypeId: z.uuid(),
    quantityPerPortion: accompanimentQuantitySchema,
    accompanimentPrice: accompanimentPriceSchema.optional(),
    isGlobal: z.boolean().optional(),
  })
  .strict()
