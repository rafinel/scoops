import { AppError } from '@scoops/core/shared/domain/errors'
import type { EventsRepository, TelemetryProvider } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/sentry-telemetry-provider'

@Injectable()
export class ReprocessEventsJob {
  static readonly ID = 'shared/reprocess-events'

  constructor(
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepository: EventsRepository,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
    @Inject(TELEMETRY) private readonly telemetry: TelemetryProvider,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: ReprocessEventsJob.ID })
  async reprocess(): Promise<{ failed: number; expiredPublishing: number }> {
    const startedAt = Date.now()

    try {
      const result = await this.eventsRepository.recover(this.datetimeProvider.now())
      await this.eventsRepository.notify(result.recoveredIds)
      this.recordRun(startedAt, 'success')

      return {
        failed: result.failed,
        expiredPublishing: result.expiredPublishing,
      }
    } catch (error) {
      this.recordRun(startedAt, 'failure')

      if (!(error instanceof AppError)) {
        const safeContext = {
          functionId: ReprocessEventsJob.ID,
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
        functionId: ReprocessEventsJob.ID,
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
          functionId: ReprocessEventsJob.ID,
          outcome: 'failure',
          errorClass: this.getSafeErrorClass(error),
        })
      } catch {
        // Observability failures must not change the recovery result.
      }
    }
  }
}
