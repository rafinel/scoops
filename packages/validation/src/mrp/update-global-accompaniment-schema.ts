import { z } from 'zod'

import { accompanimentPriceSchema } from './accompaniment-price-schema.ts'
import { accompanimentQuantitySchema } from './accompaniment-quantity-schema.ts'

export const updateGlobalAccompanimentSchema = z
  .object({
    accompanimentTypeId: z.uuid(),
    quantityPerPortion: accompanimentQuantitySchema,
    accompanimentPrice: accompanimentPriceSchema.optional(),
  })
  .strict()
