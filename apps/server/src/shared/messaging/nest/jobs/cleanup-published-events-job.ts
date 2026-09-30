import { AppError } from '@scoops/core/shared/domain/errors'
import type { EventsRepository, TelemetryProvider } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/sentry-telemetry-provider'

const RETENTION_DAYS = 30

@Injectable()
export class CleanupPublishedEventsJob {
  static readonly ID = 'shared/outbox-cleanup-published-events'

  constructor(
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepository: EventsRepository,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
    @Inject(TELEMETRY) private readonly telemetry: TelemetryProvider,
  ) {}

  @Cron('0 3 * * *', { name: CleanupPublishedEventsJob.ID, timeZone: 'UTC' })
  async cleanup(now = this.datetimeProvider.now()): Promise<number> {
    const startedAt = Date.now()

    try {
      const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
      const deletedCount = await this.eventsRepository.deleteDeliveredBefore(cutoff)
      this.recordRun(startedAt, 'success')

      return deletedCount
    } catch (error) {
      this.recordRun(startedAt, 'failure')

      if (!(error instanceof AppError)) {
        const safeContext = {
          functionId: CleanupPublishedEventsJob.ID,
          outcome: 'failure' as const,
          durationMs: this.getDuration(startedAt),
          errorClass: this.getSafeErrorClass(error),
        }
        this.runSafely(() => this.telemetry.captureUnexpected(error, safeContext))
        this.runSafely(() => this.telemetry.logError(safeContext))
      }

      throw error
    }
  }

  private recordRun(startedAt: number, outcome: 'success' | 'failure'): void {
    this.runSafely(() =>
      this.telemetry.recordJobRun({
        functionId: CleanupPublishedEventsJob.ID,
        outcome,
        durationMs: this.getDuration(startedAt),
      }),
    )
  }

  private getDuration(startedAt: number): number {
    return Math.max(0, Date.now() - startedAt)
  }

  private getSafeErrorClass(error: unknown): string {
    if (!(error instanceof Error)) return 'Error'

    return /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.constructor.name)
      ? error.constructor.name
      : 'Error'
  }

  private runSafely(operation: () => void): void {
    try {
      operation()
    } catch (error) {
      try {
        this.telemetry.logError({
          signal: 'job_telemetry_failure',
          functionId: CleanupPublishedEventsJob.ID,
          outcome: 'failure',
          errorClass: this.getSafeErrorClass(error),
        })
      } catch {
        // Observability failures must not change the cleanup result.
      }
    }
  }
}
