import { and, eq, gte } from 'drizzle-orm'
import { AppError } from '@scoops/core/shared/domain/errors'
import type { OutboxDatabase } from '@scoops/core/shared/interfaces'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { INestApplicationContext } from '@nestjs/common'

import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { OUTBOX_DATABASE } from '@/shared/database/drizzle/outbox/outbox-database-token'

export type RequeueEventInput = {
  eventId: string
  operatorReference: string
  reason: string
  now?: Date
}

export function parseRequeueArguments(
  args: readonly string[],
): RequeueEventInput | undefined {
  const [eventId, ...options] = args
  if (!eventId || !isUuid(eventId)) return undefined

  const values = new Map<string, string>()
  for (const option of options) {
    const separator = option.indexOf('=')
    if (!option.startsWith('--') || separator < 0) return undefined
    values.set(option.slice(2, separator), option.slice(separator + 1))
  }

  const operatorReference = values.get('operator-reference') ?? values.get('operator')
  const reason = values.get('reason')
  if (!operatorReference?.trim() || !reason?.trim()) return undefined

  return { eventId, operatorReference, reason }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

@Injectable()
export class RequeueEvent {
  private readonly logger = new Logger(RequeueEvent.name)

  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
    @Inject(OUTBOX_DATABASE) private readonly outboxDatabase: OutboxDatabase,
  ) {}

  async execute(input: RequeueEventInput): Promise<boolean> {
    this.validate(input)
    const now = input.now ?? this.datetimeProvider.now()
    const [event] = await this.drizzleClient
      .requireDatabase()
      .update(eventModel)
      .set({
        status: 'pending',
        attempts: 0,
        availableAt: now,
        reservedBy: null,
        reservationExpiresAt: null,
        lastErrorCode: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(eventModel.id, input.eventId),
          eq(eventModel.status, 'failed'),
          gte(eventModel.attempts, 10),
        ),
      )
      .returning({ id: eventModel.id })

    if (!event) return false

    await this.outboxDatabase.wake([event.id])

    this.logger.log(
      JSON.stringify({
        operation: 'events:requeue',
        eventId: event.id,
        operatorReference: input.operatorReference,
        reason: input.reason,
      }),
    )

    return true
  }

  private validate(input: RequeueEventInput): void {
    if (!input.eventId.trim()) throw new AppError('Event ID is required')
    if (!input.operatorReference.trim()) {
      throw new AppError('Operator reference is required')
    }
    if (!input.reason.trim()) throw new AppError('Requeue reason is required')
  }
}

type RequeueCliApplication = Pick<INestApplicationContext, 'get' | 'close'>
type RequeueCliBootstrap = () => Promise<RequeueCliApplication>

export async function runRequeueCli(
  args: readonly string[] = process.argv.slice(2),
  bootstrap: RequeueCliBootstrap = bootstrapRequeueApplication,
): Promise<number> {
  const input = parseRequeueArguments(args)
  if (!input) {
    console.error(
      'Usage: events:requeue <event-uuid> --operator-reference=<operator> --reason=<reason>',
    )
    return 2
  }

  let application: RequeueCliApplication | undefined
  try {
    application = await bootstrap()
    const requeue = application.get(RequeueEvent)
    const requeued = await requeue.execute(input)
    if (!requeued) {
      console.error('The event is not a terminal failed event.')
      return 1
    }
    console.log(JSON.stringify({ eventId: input.eventId, requeued: true }))
    return 0
  } catch {
    console.error('events:requeue failed')
    return 1
  } finally {
    await application?.close()
  }
}

async function bootstrapRequeueApplication(): Promise<RequeueCliApplication> {
  const { AppModule } = await import('../../../app.module.js')
  return NestFactory.createApplicationContext(AppModule, { logger: false })
}

const isDirectExecution =
  process.argv[1]?.endsWith('/requeue-event.ts') ||
  process.argv[1]?.endsWith('/requeue-event.js')

if (isDirectExecution) {
  void runRequeueCli().then((exitCode) => {
    process.exitCode = exitCode
  })
}
