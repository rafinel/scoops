import { z } from 'zod'

import { registerProductSizeSchema } from './register-product-size-schema.ts'

export const updateProductSizeSchema = registerProductSizeSchema.extend({
  isActive: z.boolean(),
})
