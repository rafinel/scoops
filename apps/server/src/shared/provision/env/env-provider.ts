import { Injectable } from '@nestjs/common'
import { serverEnvSchema } from '@scoops/validation'
import { z } from 'zod'

export const envSchema = serverEnvSchema

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
