import { z } from 'zod'

import { accompanimentPriceTextSchema } from './accompaniment-price-text-schema.ts'
import { accompanimentQuantityTextSchema } from './accompaniment-quantity-text-schema.ts'

export const accompanimentPortionsFormSchema = z
  .object({
    portionProductIds: z.array(z.string()).min(1, 'Selecione ao menos uma porção.'),
    accompanimentTypeId: z.string().trim().min(1, 'Selecione um tipo.'),
    quantityPerPortion: accompanimentQuantityTextSchema,
    accompanimentPrice: accompanimentPriceTextSchema,
  })
  .strict()
