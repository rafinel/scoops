import { z } from 'zod'

import { productUnitSchema } from './product-unit-schema.ts'

export const previewProductUnitChangeSchema = z.strictObject({
  targetUnit: productUnitSchema,
})

export const changeProductUnitSchema = z.strictObject({
  targetUnit: productUnitSchema,
  expectedUpdatedAt: z.iso.datetime().transform((value) => new Date(value)),
})
