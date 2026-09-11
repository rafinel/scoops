import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'
import { AppError } from '@scoops/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import * as schema from '@/shared/database/drizzle/schema'

export type Database = PostgresJsDatabase<typeof schema>

export type DatabaseListener = {
  unlisten(): Promise<void>
}

type ListenerRegistration = {
  client: Sql
  close(): Promise<void>
  isClosing: boolean
}

function resolveListenerDatabaseUrl(databaseUrl: string, listenerUrl?: string): string {
  if (listenerUrl) return listenerUrl

  const url = new URL(databaseUrl)
  if (url.hostname.endsWith('.neon.tech') && url.hostname.includes('-pooler.')) {
    url.hostname = url.hostname.replace('-pooler.', '.')
  }

  return url.toString()
}

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  private readonly client: Sql
  private readonly database: Database
  private readonly databaseUrl: string
  private readonly listenerDatabaseUrl: string
  private readonly listenerRegistrations = new Map<string, ListenerRegistration>()

  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    this.databaseUrl = envProvider.get('DATABASE_URL')
    this.listenerDatabaseUrl = resolveListenerDatabaseUrl(
      this.databaseUrl,
      envProvider.get('DATABASE_LISTENER_URL'),
    )
    this.client = postgres(this.databaseUrl, {
      connect_timeout: 5,
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
    if (this.listenerRegistrations.has(channel)) {
      throw new AppError('O listener do banco de dados já foi registrado.')
    }

    let listenResult: Awaited<ReturnType<Sql['listen']>> | undefined
    const listenerClient = postgres(this.listenerDatabaseUrl, {
      connect_timeout: 5,
      max: 1,
      max_lifetime: null,
      fetch_types: false,
      prepare: false,
      onclose: () => {
        const registration = this.listenerRegistrations.get(channel)
        if (!registration?.isClosing) onError({ code: 'DATABASE_LISTENER_CLOSED' })
      },
    })

    const registration: ListenerRegistration = {
      client: listenerClient,
      isClosing: false,
      close: async () => {
        if (registration.isClosing) return
        registration.isClosing = true
        this.listenerRegistrations.delete(channel)

        try {
          await listenResult?.unlisten()
        } finally {
          await listenerClient.end({ timeout: 5 })
        }
      },
    }
    this.listenerRegistrations.set(channel, registration)

    try {
      const request = listenerClient.listen(channel, onEvent, onReady)
      listenResult = await request

      return {
        unlisten: () => registration.close(),
      }
    } catch (error) {
      const didStartClosing = registration.isClosing
      await registration.close().catch(() => undefined)
      if (!didStartClosing) onError(error)
      throw error
    }
  }

  async notify(channel: string, payload: string): Promise<void> {
    await this.client.notify(channel, payload)
  }

  async onModuleDestroy() {
    const registrations = [...this.listenerRegistrations.values()]
    await Promise.all(registrations.map((registration) => registration.close()))
    await this.client.end({ timeout: 5 })
  }
}
