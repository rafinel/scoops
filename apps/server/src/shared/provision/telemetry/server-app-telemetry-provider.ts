import { Injectable } from '@nestjs/common'
import * as Sentry from '@sentry/nestjs'
import type { Telemetry } from '@scoops/core/shared/interfaces'

export const TELEMETRY = Symbol('TELEMETRY')

@Injectable()
export class SentryTelemetry implements Telemetry {
  recordHttpRequest(input: {
    route: string
    method: 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'DELETE'
    statusClass: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
    durationMs: number
  }): void {
    const attributes = {
      route: getSafeRouteTemplate(input.route),
      method: input.method,
      status_class: input.statusClass,
    }

    this.runSafely(() => {
      Sentry.metrics.count('scoops.api.request.outcome', 1, { attributes })
      Sentry.metrics.distribution('scoops.api.request.duration', input.durationMs, {
        unit: 'millisecond',
        attributes,
      })
    })
  }

  recordJobRun(input: {
    functionId: string
    outcome: 'success' | 'failure'
    durationMs: number
  }): void {
    const attributes = {
      function_id: getSafeFunctionId(input.functionId),
      outcome: input.outcome,
    }

    this.runSafely(() => {
      Sentry.metrics.count('scoops.job.run.outcome', 1, { attributes })
      Sentry.metrics.distribution('scoops.job.run.duration', input.durationMs, {
        unit: 'millisecond',
        attributes,
      })
    })
  }

  logWarning(context: {
    route?: string
    method?: string
    statusClass?: string
    functionId?: string
    outcome?: string
    durationMs?: number
    errorClass?: string
  }): void {
    this.runSafely(() => {
      Sentry.logger.warn('Server warning', this.toSafeAttributes(context))
    })
  }

  logError(context: {
    route?: string
    method?: string
    statusClass?: string
    functionId?: string
    outcome?: string
    durationMs?: number
    errorClass?: string
  }): void {
    this.runSafely(() => {
      Sentry.logger.error('Server error', this.toSafeAttributes(context))
    })
  }

  captureUnexpected(
    error: unknown,
    safeContext?: {
      route?: string
      method?: string
      statusClass?: string
      functionId?: string
      outcome?: string
      durationMs?: number
      errorClass?: string
    },
  ): void {
    this.runSafely(() => {
      Sentry.withScope((scope) => {
        for (const [key, value] of Object.entries(
          this.toSafeAttributes(safeContext ?? {}),
        )) {
          scope.setTag(key, String(value))
        }
        scope.setTag(
          'error_class',
          getSafeErrorClass(safeContext?.errorClass ?? getErrorClass(error)),
        )
        Sentry.captureException(error)
      })
    })
  }

  private toSafeAttributes(context: {
    route?: string
    method?: string
    statusClass?: string
    functionId?: string
    outcome?: string
    durationMs?: number
    errorClass?: string
  }): Record<string, string | number> {
    const safeAttributes: Record<string, string | number> = {}
    const route = getSafeRouteTemplate(context.route)
    const method = getSafeHttpMethod(context.method)
    const functionId = getSafeFunctionId(context.functionId)
    const errorClass = getSafeErrorClass(context.errorClass)

    if (route) safeAttributes.route = route
    if (method) safeAttributes.method = method
    if (context.statusClass && isSafeStatusClass(context.statusClass))
      safeAttributes.status_class = context.statusClass
    if (context.functionId) safeAttributes.function_id = functionId
    if (context.outcome === 'success' || context.outcome === 'failure')
      safeAttributes.outcome = context.outcome
    if (typeof context.durationMs === 'number' && Number.isFinite(context.durationMs))
      safeAttributes.duration_ms = Math.max(0, context.durationMs)
    if (context.errorClass) safeAttributes.error_class = errorClass

    return safeAttributes
  }

  private runSafely(operation: () => void): void {
    try {
      operation()
    } catch {
      // Telemetry must never change the application result.
    }
  }
}

export function getOperationalRouteTemplate(value: unknown): string {
  return getSafeRouteTemplate(value) ?? 'unmatched'
}

export function getOperationalHttpMethod(
  value: unknown,
): 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' {
  return getSafeHttpMethod(value) ?? 'GET'
}

export function getOperationalStatusClass(
  value: number,
): '1xx' | '2xx' | '3xx' | '4xx' | '5xx' {
  const statusClass = Math.floor(value / 100)
  switch (statusClass) {
    case 1:
      return '1xx'
    case 2:
      return '2xx'
    case 3:
      return '3xx'
    case 4:
      return '4xx'
    default:
      return '5xx'
  }
}

function getSafeRouteTemplate(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 120 || !value.startsWith('/'))
    return undefined

  const segments = value.split('/').slice(1)
  return segments.every(
    (segment) =>
      segment === '' ||
      /^:[a-z][a-zA-Z0-9_]{0,47}$/.test(segment) ||
      /^[a-z][a-z0-9-]{0,47}$/.test(segment),
  )
    ? value
    : undefined
}

function getSafeHttpMethod(
  value: unknown,
): 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | undefined {
  if (typeof value !== 'string') return undefined
  const method = value.toUpperCase()

  return ['GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'DELETE'].includes(method)
    ? (method as ReturnType<typeof getSafeHttpMethod>)
    : undefined
}

function getSafeFunctionId(value: unknown): string {
  return typeof value === 'string' &&
    /^[a-z][a-z0-9_-]{0,39}\/[a-z][a-z0-9_-]{0,79}$/.test(value)
    ? value
    : 'unregistered'
}

function getSafeErrorClass(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(value)
    ? value
    : 'Error'
}

function getErrorClass(error: unknown): string {
  if (!(error instanceof Error)) return 'Error'
  return getSafeErrorClass(error.constructor.name)
}

function isSafeStatusClass(
  value: string,
): value is '1xx' | '2xx' | '3xx' | '4xx' | '5xx' {
  return ['1xx', '2xx', '3xx', '4xx', '5xx'].includes(value)
}
