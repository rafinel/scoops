import { z } from 'zod'

export const seedEnvSchema = z.object({
  SCOOPS_SERVER_APP_MODE: z.enum(['dev', 'stg']),
})

export type SeedEnv = z.infer<typeof seedEnvSchema>

export function parseSeedEnv(environment: NodeJS.ProcessEnv = process.env): SeedEnv {
  return seedEnvSchema.parse(environment)
}
