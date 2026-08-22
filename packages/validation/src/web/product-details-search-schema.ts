import { z } from 'zod'

export const productDetailsSearchSchema = z.object({
  tab: z.enum(['stock', 'recipe']).optional().catch(undefined),
})
