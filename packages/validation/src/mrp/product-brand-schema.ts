import { z } from 'zod'

import { productUnitSchema } from './product-unit-schema.ts'

export const productBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    unit: productUnitSchema.optional(),
    packageQuantity: z.number().finite().positive(),
    packageValue: z.number().finite().nonnegative(),
    initialQuantity: z.number().finite(),
  })
  .strict()
