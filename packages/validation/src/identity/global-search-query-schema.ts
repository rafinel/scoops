import { z } from 'zod'

export const globalSearchQuerySchema = z.strictObject({
  q: z.string().trim().min(1).max(100),
})
