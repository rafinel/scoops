import { z } from 'zod'

export const updateProductBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    packageQuantity: z.number().finite().positive(),
    packageValue: z.number().finite().nonnegative(),
  })
  .strict()
