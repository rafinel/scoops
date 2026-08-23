import { z } from 'zod'

export const accompanimentTypesSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
})
