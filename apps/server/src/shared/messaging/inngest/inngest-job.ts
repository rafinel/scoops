import { AppError } from '@scoops/core/shared/domain/errors'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import type { InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'

export abstract class InngestJob {
  abstract readonly function: InngestFunction.Like

  private readonly observedRunIds = new Set<string>()

  constructor(
    protected readonly inngest: InngestClient,
    private readonly operationalTelemetry: Telemetry,
  ) {}

  protected recordSuccessfulRun(
    functionId: string,
    runId: string,
    eventTimestamp: number | undefined,
  ): void {
    this.recordRun(functionId, runId, eventTimestamp, 'success')
  }

  protected recordTerminalFailure(
    functionId: string,
    runId: string,
    eventTimestamp: number | undefined,
    error: Error,
  ): void {
    const durationMs = this.getDuration(eventTimestamp)
    if (!this.recordRunOnce(runId)) return

    this.runSafely(() =>
      this.operationalTelemetry.recordJobRun({
        functionId,
        outcome: 'failure',
        durationMs,
      }),
    )

    if (error instanceof AppError) return

    const safeContext = {
      functionId,
      outcome: 'failure' as const,
      durationMs,
      errorClass: this.getSafeErrorClass(error),
    }
    this.runSafely(() => this.operationalTelemetry.captureUnexpected(error, safeContext))
    this.runSafely(() => this.operationalTelemetry.logError(safeContext))
  }

  private recordRun(
    functionId: string,
    runId: string,
    eventTimestamp: number | undefined,
    outcome: 'success',
  ): void {
    const durationMs = this.getDuration(eventTimestamp)
    if (!this.recordRunOnce(runId)) return

    this.runSafely(() =>
      this.operationalTelemetry.recordJobRun({ functionId, outcome, durationMs }),
    )
  }

  private recordRunOnce(runId: string): boolean {
    if (!runId || this.observedRunIds.has(runId)) return false

    this.observedRunIds.add(runId)
    if (this.observedRunIds.size > 1000) {
      const oldestRunId = this.observedRunIds.values().next().value
      if (oldestRunId) this.observedRunIds.delete(oldestRunId)
    }

    return true
  }

  private getDuration(eventTimestamp: number | undefined): number {
    if (typeof eventTimestamp !== 'number' || !Number.isFinite(eventTimestamp)) return 0
    return Math.max(0, Date.now() - eventTimestamp)
  }

  private getSafeErrorClass(error: Error): string {
    return /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.constructor.name)
      ? error.constructor.name
      : 'Error'
  }

  private runSafely(operation: () => void): void {
    try {
      operation()
    } catch {
      // Telemetry must never change the Inngest result.
    }
  }
}
