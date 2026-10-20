import { z } from 'zod'

import { resalePriceSchema } from './resale-price-schema.ts'

export const saveProductResaleConfigurationSchema = z.strictObject({
  price: resalePriceSchema,
  isActive: z.boolean(),
})
