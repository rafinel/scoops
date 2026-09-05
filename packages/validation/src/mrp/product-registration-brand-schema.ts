import { z } from 'zod'

import { productBrandSchema } from './product-brand-schema.ts'

export const productRegistrationBrandSchema = productBrandSchema.extend({
  isPrimary: z.boolean(),
})
