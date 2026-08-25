import { z } from 'zod'

export const productPricingSearchSchema = z.object({
  focus: z.enum(['sizes', 'resale']).optional().catch(undefined),
})
