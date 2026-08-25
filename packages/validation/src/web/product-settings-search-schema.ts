import { z } from 'zod'

import { productCategorySchema } from '../mrp/product-category-schema.ts'

const productCategoryDependencyKindSchema = z.enum([
  'consuming-recipe',
  'owned-recipe',
  'portion-size',
  'portion-accompaniment',
  'accompaniment-user',
  'resale-configuration',
])

export const productSettingsSearchSchema = z.object({
  retryCategory: productCategorySchema.optional().catch(undefined),
  retryDependency: productCategoryDependencyKindSchema.optional().catch(undefined),
  retryProductId: z.uuid().optional().catch(undefined),
})
