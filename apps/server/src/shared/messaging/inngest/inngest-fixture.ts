import { createServer, type RequestListener, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { randomUUID } from 'node:crypto'

import { AppError } from '@scoops/core/shared/domain/errors'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { EventPayload, InngestFunction } from 'inngest'
import postgres from 'postgres'
import { serve } from 'inngest/node'
import {
  GenericContainer,
  TestContainers,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { DatabaseFixture } from '@/shared/database/fixtures/database-fixture'
import * as schema from '@/shared/database/drizzle/schema'
import type { EnvProvider } from '@/shared/provision/env/env-provider'

const INNGEST_IMAGE = 'inngest/inngest:v1.36.0'
const INNGEST_PORT = 8288
const INNGEST_SERVE_PATH = '/api/inngest'
const TERMINAL_RUN_STATUSES = new Set(['completed', 'failed', 'cancelled'])

export type InngestTestDatabase = PostgresJsDatabase<typeof schema>

export type InngestRun = {
  readonly id: string
  readonly status: string
  readonly output?: unknown
  readonly function?: {
    readonly id?: string
    readonly name?: string
  }
}

export type InngestFixtureOptions = {
  readonly functionId: string
  readonly createJob: (client: InngestClient) => InngestJob | Promise<InngestJob>
  readonly timeoutMs?: number
}

type DevServerResponse = {
  readonly functions: readonly {
    readonly id: string
    readonly slug: string
  }[]
}

type DevServerRun = {
  readonly run_id: string
  readonly status: string
  readonly output?: unknown
  readonly function_id?: string
}

type EventRunsResponse = {
  readonly data: readonly DevServerRun[]
}

type RunResponse = {
  readonly data: DevServerRun | null
}

type InvokeResponse = {
  readonly id?: string
  readonly ids?: readonly string[]
  readonly data?: {
    readonly id?: string
    readonly ids?: readonly string[]
  }
}

export class InngestFixture {
  private readonly timeoutMs: number
  private endpointServer: Server | undefined
  private endpointHandler: RequestListener | undefined
  private container: StartedTestContainer | undefined
  private databaseFixture: DatabaseFixture | undefined
  private databaseClient: postgres.Sql | undefined
  private databaseConnection: InngestTestDatabase | undefined
  private inngestBaseUrl: string | undefined
  private inngestClient: InngestClient | undefined
  private inngestFunctionOptions: InngestFunction.Options | undefined
  private registeredFunctionId: string | undefined
  private registeredFunctionSlug: string | undefined

  constructor(private readonly options: InngestFixtureOptions) {
    this.timeoutMs = options.timeoutMs ?? 60_000
  }

  get client() {
    if (!this.inngestClient) {
      throw new AppError('O fixture do job do Inngest não foi iniciado.')
    }

    return this.inngestClient
  }

  get functionOptions() {
    if (!this.inngestFunctionOptions) {
      throw new AppError('O fixture do Inngest não registrou uma função.')
    }

    return this.inngestFunctionOptions
  }

  get database() {
    if (!this.databaseConnection) {
      throw new AppError('O banco de dados do fixture do Inngest não foi iniciado.')
    }

    return this.databaseConnection
  }

  async setup() {
    try {
      this.databaseFixture = await DatabaseFixture.register()
      this.databaseClient = postgres(process.env.DATABASE_URL as string)
      this.databaseConnection = drizzle(this.databaseClient, { schema })

      const endpointPort = await this.startEndpointServer()

      await TestContainers.exposeHostPorts(endpointPort)

      this.container = await new GenericContainer(INNGEST_IMAGE)
        .withCommand([
          'inngest',
          'dev',
          '--no-discovery',
          '-u',
          `http://host.testcontainers.internal:${endpointPort}${INNGEST_SERVE_PATH}`,
        ])
        .withExposedPorts(INNGEST_PORT)
        .withWaitStrategy(Wait.forHttp('/dev', INNGEST_PORT).forStatusCode(200))
        .withStartupTimeout(this.timeoutMs)
        .start()

      this.inngestBaseUrl = `http://${this.container.getHost()}:${this.container.getMappedPort(INNGEST_PORT)}`
      this.inngestClient = this.createInngestClient(this.inngestBaseUrl)

      const job = await this.options.createJob(this.inngestClient)
      const inngestFunction = job.function as InngestFunction.Any
      this.inngestFunctionOptions = {
        ...inngestFunction.opts,
        triggers: [...inngestFunction.opts.triggers],
      }
      if (inngestFunction.opts.triggers.every((trigger) => 'cron' in trigger)) {
        inngestFunction.opts.triggers = inngestFunction.opts.triggers.map(() => ({
          cron: '0 0 1 1 *',
        }))
      }
      this.endpointHandler = serve({
        client: this.inngestClient,
        functions: [inngestFunction],
        serveOrigin: `http://host.testcontainers.internal:${endpointPort}`,
        servePath: INNGEST_SERVE_PATH,
      })

      await this.syncFunctions(endpointPort)
      await this.waitForFunctionRegistration()
    } catch (error) {
      await this.teardown().catch(() => undefined)
      throw error
    }
  }

  async teardown() {
    const container = this.container
    const endpointServer = this.endpointServer
    const databaseClient = this.databaseClient
    const databaseFixture = this.databaseFixture

    this.container = undefined
    this.endpointServer = undefined
    this.endpointHandler = undefined
    this.databaseClient = undefined
    this.databaseFixture = undefined
    this.databaseConnection = undefined
    this.inngestBaseUrl = undefined
    this.inngestClient = undefined
    this.inngestFunctionOptions = undefined
    this.registeredFunctionId = undefined
    this.registeredFunctionSlug = undefined

    const errors: unknown[] = []
    try {
      await container?.stop()
    } catch (error) {
      errors.push(error)
    }

    try {
      if (endpointServer) await this.closeServer(endpointServer)
    } catch (error) {
      errors.push(error)
    }

    try {
      await databaseClient?.end()
    } catch (error) {
      errors.push(error)
    }

    try {
      await databaseFixture?.close()
    } catch (error) {
      errors.push(error)
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to stop the Inngest job fixture.')
    }
  }

  async send(event: EventPayload) {
    const response = await this.client.send(event)
    const eventId = response.ids[0]

    if (!eventId) {
      throw new Error(`Inngest did not return an event ID for ${event.name}.`)
    }

    return eventId
  }

  async run(event: EventPayload) {
    const eventId = await this.send(event)
    return this.waitForRun(eventId)
  }

  async invoke(data: Record<string, unknown> = {}) {
    if (!this.registeredFunctionSlug) {
      throw new Error('A função do Inngest não está registrada.')
    }

    const response = await this.fetchJson<InvokeResponse>(
      `/invoke/${encodeURIComponent(this.registeredFunctionSlug)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data }),
      },
    )
    const eventId =
      response.ids?.[0] ?? response.id ?? response.data?.ids?.[0] ?? response.data?.id

    if (!eventId) {
      throw new Error(
        `Inngest did not return an event ID for the function invocation: ${JSON.stringify(response)}`,
      )
    }

    return this.waitForRun(eventId)
  }

  async waitForRun(eventId: string) {
    const run = await this.waitFor(async () => {
      const response = await this.fetchJson<EventRunsResponse>(
        `/v1/events/${eventId}/runs?limit=40`,
      )

      return response.data[0]
    })

    return this.waitForRunId(run.run_id)
  }

  resetDatabase() {
    if (!this.databaseFixture) {
      throw new AppError('O banco de dados do fixture do Inngest não foi iniciado.')
    }

    return this.databaseFixture.reset()
  }

  async insertOutboxEvent(overrides: Partial<typeof eventModel.$inferInsert> = {}) {
    const now = new Date('2026-09-02T12:00:00.000Z')
    const [event] = await this.database
      .insert(eventModel)
      .values({
        id: randomUUID(),
        eventName: 'identity/onboarding-confirmation.prepared',
        payload: {
          userId: '00000000-0000-4000-8000-000000000001',
          email: 'test@example.com',
          name: 'Test User',
          actionUrl: 'http://localhost:4000/onboarding/confirm?confirmationToken=test',
          expiresAt: '2026-09-09T12:00:00.000Z',
          occurredAt: '2026-09-02T12:00:00.000Z',
        },
        occurredAt: now,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
        ...overrides,
      })
      .returning()

    return event
  }

  private async startEndpointServer() {
    this.endpointServer = createServer((request, response) => {
      if (!this.endpointHandler) {
        response.writeHead(503)
        response.end()
        return
      }

      this.endpointHandler(request, response)
    })

    await new Promise<void>((resolve, reject) => {
      this.endpointServer?.once('error', reject)
      this.endpointServer?.listen(0, '127.0.0.1', resolve)
    })

    const address = this.endpointServer.address()

    if (!address || typeof address === 'string') {
      throw new Error('O fixture do Inngest não conseguiu resolver a porta do endpoint.')
    }

    return (address as AddressInfo).port
  }

  private createInngestClient(baseUrl: string) {
    const values = {
      INNGEST_DEV: '1',
      INNGEST_BASE_URL: baseUrl,
      INNGEST_EVENT_KEY: 'test-event-key',
      INNGEST_SIGNING_KEY: undefined,
    }
    const envProvider = {
      get(key: keyof typeof values) {
        return values[key]
      },
    } as EnvProvider

    return new InngestClient(envProvider)
  }

  private async syncFunctions(endpointPort: number) {
    const response = await fetch(
      `http://127.0.0.1:${endpointPort}${INNGEST_SERVE_PATH}`,
      { method: 'PUT' },
    )
    const body = await response.text()

    if (!response.ok) {
      throw new Error(`Failed to sync the Inngest job: ${response.status} ${body}`)
    }
  }

  private async waitForFunctionRegistration() {
    await this.waitFor(async () => {
      const response = await this.fetchJson<DevServerResponse>('/dev')
      const registeredFunction = response.functions.find((candidate) =>
        this.matchesFunctionId(candidate.slug),
      )

      if (!registeredFunction) return undefined

      this.registeredFunctionId = registeredFunction.id
      this.registeredFunctionSlug = registeredFunction.slug
      return true
    })
  }

  private matchesFunctionId(functionId: string | undefined) {
    return (
      functionId === this.options.functionId ||
      functionId === this.registeredFunctionId ||
      functionId?.endsWith(`-${this.options.functionId}`) === true
    )
  }

  private waitForRunId(runId: string) {
    return this.waitFor(async () => {
      const response = await this.fetchJson<RunResponse>(
        `/v1/runs/${runId}?includeOutput=true`,
      )

      return response.data &&
        TERMINAL_RUN_STATUSES.has(response.data.status.toLowerCase())
        ? this.normalizeRun(response.data)
        : undefined
    })
  }

  private normalizeRun(run: DevServerRun): InngestRun {
    return {
      id: run.run_id,
      status: run.status,
      output: run.output === '' ? undefined : run.output,
      function: {
        id: this.matchesFunctionId(run.function_id)
          ? this.options.functionId
          : run.function_id,
      },
    }
  }

  private async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.inngestBaseUrl) {
      throw new Error('O fixture do job do Inngest não foi iniciado.')
    }

    const response = await fetch(`${this.inngestBaseUrl}${path}`, init)
    const body = await response.text()

    if (!response.ok) {
      throw new Error(`Inngest returned ${response.status} for ${path}: ${body}`)
    }

    return JSON.parse(body) as T
  }

  private async waitFor<T>(operation: () => Promise<T | undefined>) {
    const deadline = Date.now() + this.timeoutMs
    let lastError: unknown

    while (Date.now() < deadline) {
      try {
        const value = await operation()

        if (value !== undefined) return value
      } catch (error) {
        lastError = error
      }

      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    throw new Error(
      `Timed out waiting for Inngest${lastError ? `: ${String(lastError)}` : ''}`,
    )
  }

  private async closeServer(server: Server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}
