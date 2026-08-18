import { seedEnvSchema } from '@scoops/validation'
import { z } from 'zod'

export type SeedEnv = z.infer<typeof seedEnvSchema>

export function parseSeedEnv(environment: NodeJS.ProcessEnv = process.env): SeedEnv {
  return seedEnvSchema.parse(environment)
}
