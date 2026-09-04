import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import * as schema from '@/shared/database/drizzle/schema'

export type Database = PostgresJsDatabase<typeof schema>

export type DatabaseListener = {
  unlisten(): Promise<void>
}

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  private readonly client: Sql
  private readonly database: Database
  private readonly databaseUrl: string
  private listenerClient: Sql | undefined
  private listenerClosing = false

  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    this.databaseUrl = envProvider.get('DATABASE_URL')
    this.client = postgres(this.databaseUrl, {
      connect_timeout: 5,
      idle_timeout: 10,
      max: 3,
      prepare: false,
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

  async listen(
    channel: string,
    onEvent: (payload: string) => void,
    onReady: () => void,
    onError: (error: unknown) => void,
  ): Promise<DatabaseListener> {
    if (this.listenerClient) {
      throw new Error('Database listener is already registered')
    }

    this.listenerClosing = false
    const listenerClient = postgres(this.databaseUrl, {
      connect_timeout: 5,
      max: 1,
      max_lifetime: null,
      fetch_types: false,
      prepare: false,
      onclose: () => {
        if (!this.listenerClosing) onError({ code: 'DATABASE_LISTENER_CLOSED' })
      },
    })
    this.listenerClient = listenerClient

    try {
      const request = listenerClient.listen(channel, onEvent, onReady)
      const result = await request

      return {
        unlisten: async () => {
          if (this.listenerClient !== listenerClient) return
          this.listenerClosing = true
          await result.unlisten()
          await listenerClient.end({ timeout: 5 })
          this.listenerClient = undefined
        },
      }
    } catch (error) {
      this.listenerClosing = true
      this.listenerClient = undefined
      await listenerClient.end({ timeout: 5 }).catch(() => undefined)
      onError(error)
      throw error
    }
  }

  async notify(channel: string, payload: string): Promise<void> {
    await this.client.notify(channel, payload)
  }

  async onModuleDestroy() {
    this.listenerClosing = true
    await this.listenerClient?.end({ timeout: 5 })
    this.listenerClient = undefined
    await this.client.end({ timeout: 5 })
  }
}
