import { z } from 'zod'

export const productBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  packageQuantity: z.number().min(0),
  packageValue: z.number().min(0),
  initialQuantity: z.number().min(0),
  isPrimary: z.boolean(),
})
