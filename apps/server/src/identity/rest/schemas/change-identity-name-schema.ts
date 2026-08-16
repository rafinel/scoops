import { z } from 'zod'

export const changeIdentityNameSchema = z
  .object({ name: z.string().trim().min(1).max(120) })
  .strict()
