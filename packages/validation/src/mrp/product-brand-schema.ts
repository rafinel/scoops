import { z } from 'zod'

export const productBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    packageQuantity: z.number().finite().positive(),
    packageValue: z.number().finite().nonnegative(),
    initialQuantity: z.number().finite().nonnegative(),
  })
  .strict()
