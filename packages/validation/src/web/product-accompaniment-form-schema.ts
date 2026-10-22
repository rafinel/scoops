import { z } from 'zod'

import { accompanimentPriceTextSchema } from './accompaniment-price-text-schema.ts'
import { accompanimentQuantityTextSchema } from './accompaniment-quantity-text-schema.ts'

export const productAccompanimentFormSchema = z
  .object({
    accompanimentProductId: z.string().trim().min(1, 'Selecione um acompanhamento.'),
    accompanimentTypeId: z.string().trim().min(1, 'Selecione um tipo.'),
    quantityPerPortion: accompanimentQuantityTextSchema,
    accompanimentPrice: accompanimentPriceTextSchema,
    isGlobal: z.boolean(),
  })
  .strict()
