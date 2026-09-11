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

@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  private readonly client: Sql
  private readonly database: Database
  private readonly listenerDatabaseUrl: string
  private readonly listenerRegistrations = new Map<string, ListenerRegistration>()

  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    const databaseUrl = envProvider.get('DATABASE_URL')
    const listenerUrl = envProvider.get('DATABASE_LISTENER_URL')
    this.listenerDatabaseUrl = resolveListenerDatabaseUrl(databaseUrl, listenerUrl)
    this.client = postgres(databaseUrl, DATABASE_CLIENT_OPTIONS)
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
    this.assertChannelAvailable(channel)
    const registration = this.createListenerRegistration(channel, onError)
    this.listenerRegistrations.set(channel, registration)
    return this.startListener(channel, registration, onEvent, onReady, onError)
  }

  private assertChannelAvailable(channel: string): void {
    if (this.listenerRegistrations.has(channel))
      throw new AppError('O listener do banco de dados já foi registrado.')
  }

  private async startListener(
    channel: string,
    registration: ListenerRegistration,
    onEvent: (payload: string) => void,
    onReady: () => void,
    onError: (error: unknown) => void,
  ): Promise<DatabaseListener> {
    return this.registerListener(registration, channel, onEvent, onReady)
      .then(() => ({
        unlisten: () => this.closeListener(channel, registration),
      }))
      .catch((error: unknown) =>
        this.failListenerRegistration(channel, registration, onError, error),
      )
  }

  private async registerListener(
    registration: ListenerRegistration,
    channel: string,
    onEvent: (payload: string) => void,
    onReady: () => void,
  ): Promise<void> {
    registration.listenResult = await registration.client.listen(
      channel,
      onEvent,
      onReady,
    )
  }

  private createListenerRegistration(
    channel: string,
    onError: (error: unknown) => void,
  ): ListenerRegistration {
    const listenerClient = postgres(this.listenerDatabaseUrl, {
      ...LISTENER_CLIENT_OPTIONS,
      onclose: () => this.handleListenerClose(channel, onError),
    })

    return {
      client: listenerClient,
      isClosing: false,
    }
  }

  private handleListenerClose(
    channel: string,
    onError: (error: unknown) => void,
  ): void {
    const registration = this.listenerRegistrations.get(channel)
    if (!registration?.isClosing) onError({ code: 'DATABASE_LISTENER_CLOSED' })
  }

  private async closeListener(
    channel: string,
    registration: ListenerRegistration,
  ): Promise<void> {
    if (registration.isClosing) return
    this.markListenerClosing(channel, registration)
    await this.stopListener(registration)
  }

  private markListenerClosing(
    channel: string,
    registration: ListenerRegistration,
  ): void {
    registration.isClosing = true
    this.listenerRegistrations.delete(channel)
  }

  private async stopListener(registration: ListenerRegistration): Promise<void> {
    try {
      await registration.listenResult?.unlisten()
    } finally {
      await registration.client.end({ timeout: 5 })
    }
  }

  private async failListenerRegistration(
    channel: string,
    registration: ListenerRegistration,
    onError: (error: unknown) => void,
    error: unknown,
  ): Promise<never> {
    const didStartClosing = registration.isClosing
    await this.closeListener(channel, registration).catch(() => undefined)
    if (!didStartClosing) onError(error)
    throw error
  }

  async notify(channel: string, payload: string): Promise<void> {
    await this.client.notify(channel, payload)
  }

  async onModuleDestroy() {
    const registrations = [...this.listenerRegistrations.entries()]
    await Promise.all(
      registrations.map(([channel, registration]) =>
        this.closeListener(channel, registration),
      ),
    )
    await this.client.end({ timeout: 5 })
  }
}

const DATABASE_CLIENT_OPTIONS = {
  connect_timeout: 5,
  max: 3,
  prepare: false,
}

const LISTENER_CLIENT_OPTIONS = {
  connect_timeout: 5,
  max: 1,
  max_lifetime: null,
  fetch_types: false,
  prepare: false,
}

type ListenerRegistration = {
  client: Sql
  isClosing: boolean
  listenResult?: Awaited<ReturnType<Sql['listen']>>
}

function resolveListenerDatabaseUrl(databaseUrl: string, listenerUrl?: string): string {
  if (listenerUrl) return listenerUrl

  const url = new URL(databaseUrl)
  normalizeNeonPoolerHost(url)
  return url.toString()
}

function normalizeNeonPoolerHost(url: URL): void {
  if (!isNeonPoolerHost(url.hostname)) return
  url.hostname = url.hostname.replace('-pooler.', '.')
}

function isNeonPoolerHost(hostname: string): boolean {
  return hostname.endsWith('.neon.tech') && hostname.includes('-pooler.')
}
