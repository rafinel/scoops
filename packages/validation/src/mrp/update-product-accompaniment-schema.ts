import { accompanimentPriceSchema } from './accompaniment-price-schema.ts'
import { accompanimentQuantitySchema } from './accompaniment-quantity-schema.ts'
import { z } from 'zod'

export const updateProductAccompanimentSchema = z
  .object({
    accompanimentTypeId: z.uuid(),
    quantityPerPortion: accompanimentQuantitySchema,
    accompanimentPrice: accompanimentPriceSchema.optional(),
  })
  .strict()
