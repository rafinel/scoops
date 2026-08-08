import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

export const envSchema = z.object({
  APP_VERSION: z.string().default('development'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  S3_ENDPOINT: z.string().url().default('http://127.0.0.1:9000'),
  SCOOPS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'stg', 'test']).default('dev'),
  SCOOPS_SERVER_APP_PORT: z.coerce.number().int().positive().default(3333),
  SCOOPS_WEB_APP_URL: z.string().url().default('http://127.0.0.1:3000'),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService<Env, true>,
  ) {}

  get<Key extends keyof Env>(key: Key) {
    return this.configService.get<Env[Key]>(key, { infer: true })
  }
}
