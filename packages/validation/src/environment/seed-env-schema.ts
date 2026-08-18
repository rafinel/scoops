import { z } from 'zod'

export const seedEnvSchema = z.object({
  SCOOPS_SERVER_APP_MODE: z.enum(['dev', 'stg']),
})
