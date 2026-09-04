import { z } from 'zod'

export const browserEnvSchema = z
  .object({
    scoopsServerAppUrl: z.url(),
  })
  .strict()
