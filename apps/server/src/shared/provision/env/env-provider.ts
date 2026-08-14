import { Injectable } from '@nestjs/common'
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  PORT: z.coerce.number().int().positive().optional(),
  S3_ENDPOINT: z.string().url().default('http://127.0.0.1:9000'),
  INNGEST_DEV: z.enum(['0', '1']).default('0'),
  INNGEST_BASE_URL: z
    .string()
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.string().url().optional()),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  SCOOPS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'stg', 'test']).default('dev'),
  SCOOPS_SERVER_APP_PORT: z.coerce.number().int().positive().default(3333),
  SCOOPS_WEB_APP_URL: z.string().url().default('http://127.0.0.1:3000'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  private readonly environment: Env

  constructor() {
    this.environment = envSchema.parse(process.env)
  }

  get<Key extends keyof Env>(key: Key): Env[Key] {
    return this.environment[key]
  }
}
