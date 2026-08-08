import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import * as schema from '@/shared/database/drizzle/schema'

export type Database = PostgresJsDatabase<typeof schema>

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  private readonly client: Sql
  private readonly database: Database

  constructor(envProvider: EnvProvider) {
    this.client = postgres(envProvider.get('DATABASE_URL'), {
      connect_timeout: 5,
      idle_timeout: 10,
      max: 3,
    })
    this.database = drizzle(this.client, { schema })
  }

  requireDatabase() {
    return this.database
  }

  async isHealthy() {
    try {
      await this.client`select 1`
      return true
    } catch {
      return false
    }
  }

  async onModuleDestroy() {
    await this.client.end({ timeout: 5 })
  }
}
