import { z } from 'zod'

import { productCategorySchema } from './product-category-schema.ts'

export const productCategoryRemovalQuerySchema = z.strictObject({
  category: productCategorySchema,
})
