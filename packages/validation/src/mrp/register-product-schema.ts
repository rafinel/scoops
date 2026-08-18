import { z } from 'zod'

import { productBrandSchema } from './product-brand-schema.ts'
import { productCategorySchema } from './product-category-schema.ts'
import { productStockControlSchema } from './product-stock-control-schema.ts'
import { productUnitSchema } from './product-unit-schema.ts'

export const registerProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    unit: productUnitSchema,
    categories: z.array(productCategorySchema).min(1),
    stockControl: productStockControlSchema,
    allowNegativeStock: z.boolean().default(false),
    idealStock: z.number().min(0),
    initialStock: z.number().min(0).optional(),
    brands: z.array(productBrandSchema).optional(),
  })
  .strict()
