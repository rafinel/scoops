import { z } from 'zod'

export const browserEnvSchema = z.object({
  scoopsServerAppUrl: z.url(),
  supabaseUrl: z.url(),
  supabaseAnonKey: z.string(),
})
