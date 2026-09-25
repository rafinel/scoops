import * as Sentry from '@sentry/tanstackstart-react'
import type { AnyRouter } from '@tanstack/react-router'

import { BROWSER_ENV } from '@/constants'

import {
  getWebTelemetryConfiguration,
  recordWebNavigationDuration,
} from './sentry-telemetry-provider'

const HTTP_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'] as const

interface SentryBrowserDependencies {
  sentry?: typeof Sentry
  browserEnv?: typeof BROWSER_ENV
  getWebTelemetryConfiguration?: typeof getWebTelemetryConfiguration
  recordWebNavigationDuration?: typeof recordWebNavigationDuration
}

export const SentryBrowser = ({
  sentry = Sentry,
  browserEnv = BROWSER_ENV,
  getWebTelemetryConfiguration: getTelemetryConfiguration = getWebTelemetryConfiguration,
  recordWebNavigationDuration: recordNavigationDuration = recordWebNavigationDuration,
}: SentryBrowserDependencies = {}) => {
  return {
    initializeBrowserSentry(router: AnyRouter): void {
      if (router.isServer) return

      const configuration = getTelemetryConfiguration()
      if (!configuration) return

      sentry.init({
        ...configuration,
        tracePropagationTargets: [getApiOriginPattern(browserEnv.scoopsServerAppUrl)],
        integrations: [
          sentry.tanstackRouterBrowserTracingIntegration(router),
          sentry.replayIntegration({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
            networkCaptureBodies: false,
            networkRequestHeaders: [],
            networkResponseHeaders: [],
            networkDetailDenyUrls: [/.*/],
          }),
        ],
        beforeSend: (event) => scrubBrowserEvent(event, getSafeRouteTemplate(router)),
        beforeSendSpan: (span) => scrubBrowserSpan(span, getSafeRouteTemplate(router)),
        beforeBreadcrumb: () => null,
      })

      let navigationStartedAt: number | undefined
      router.subscribe('onBeforeNavigate', () => {
        navigationStartedAt = performance.now()
      })
      router.subscribe('onResolved', () => {
        if (navigationStartedAt === undefined) return

        const durationMs = performance.now() - navigationStartedAt
        navigationStartedAt = undefined
        recordNavigationDuration(durationMs, getSafeRouteTemplate(router))
      })
    },
  }
}

const sentryBrowser = SentryBrowser()

export const { initializeBrowserSentry } = sentryBrowser

function scrubBrowserEvent(event: Sentry.ErrorEvent, route: string): Sentry.ErrorEvent {
  const errorClass = getEventErrorClass(event)
  const operation = getSafeOperation(event.tags?.operation)
  const level = event.level === 'warning' ? 'warning' : 'error'

  event.message = `web.${level}.${operation}.${errorClass}`
  if (event.logentry) event.logentry = { message: event.message }
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exception) => ({
      ...exception,
      type: errorClass,
      value: errorClass,
      module: undefined,
      mechanism: undefined,
      stacktrace: exception.stacktrace
        ? {
            ...exception.stacktrace,
            frames: exception.stacktrace.frames?.map((frame) => ({
              filename: frame.filename,
              function: getSafeFunctionName(frame.function),
              lineno: frame.lineno,
              colno: frame.colno,
              in_app: frame.in_app,
              platform: frame.platform,
            })),
          }
        : undefined,
    }))
  }

  event.transaction = route
  event.transaction_info = undefined
  event.request = undefined
  event.user = undefined
  event.breadcrumbs = undefined
  event.contexts = getSafeTraceContext(event.contexts)
  event.extra = undefined
  event.fingerprint = undefined
  event.modules = undefined
  event.threads = undefined
  event.tags = { runtime: 'browser', route, error_class: errorClass }

  return event
}

function scrubBrowserSpan<
  Span extends { attributes: Record<string, unknown>; is_segment: boolean },
>(span: Span, route: string): Span {
  const method = getSafeMethod(span.attributes['http.request.method'])
  const statusCode = getSafeStatusCode(span.attributes['http.response.status_code'])
  const attributes: Record<string, string | number | boolean> = {
    'sentry.op': 'web.operation',
    'scoops.route_template': route,
    'scoops.runtime': 'browser',
  }

  if (method) attributes['http.request.method'] = method
  if (statusCode !== undefined) {
    attributes['http.response.status_code'] = statusCode
    attributes['scoops.status_class'] = `${Math.floor(statusCode / 100)}xx`
  }

  return {
    ...span,
    name: `${span.is_segment ? 'web.navigation' : 'web.operation'} ${route}`,
    attributes,
    links: undefined,
  } as Span
}

function getSafeRouteTemplate(router: AnyRouter): string {
  const routeId = router.state.matches.at(-1)?.routeId
  if (
    typeof routeId !== 'string' ||
    routeId.length > 160 ||
    !/^\/(?:[A-Za-z0-9_$-]+(?:\/[A-Za-z0-9_$-]+)*)?$/.test(routeId)
  ) {
    return 'unknown'
  }

  return routeId || '/'
}

function getApiOriginPattern(apiOrigin: string): RegExp {
  const escapedOrigin = apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escapedOrigin}(?:/|\\?|#|$)`)
}

function getEventErrorClass(event: Sentry.ErrorEvent): string {
  const errorClass = event.exception?.values?.[0]?.type ?? event.tags?.error_class
  return getSafeErrorClass(errorClass)
}

function getSafeErrorClass(value: unknown): string {
  if (
    value === 'Error' ||
    value === 'TypeError' ||
    value === 'RangeError' ||
    value === 'ReferenceError' ||
    value === 'SyntaxError' ||
    value === 'URIError' ||
    value === 'EvalError' ||
    value === 'NetworkError' ||
    value === 'SessionProviderError'
  ) {
    return value
  }

  return 'Error'
}

function getSafeFunctionName(value: string | undefined): string {
  if (!value || !/^[A-Za-z_$][A-Za-z0-9_.$<>/-]{0,119}$/.test(value)) return 'anonymous'
  return value
}

function getSafeOperation(value: unknown): string {
  return value === 'auth.session' || value === 'rest.request' ? value : 'unexpected'
}

function getSafeTraceContext(contexts: Sentry.ErrorEvent['contexts']) {
  const trace = contexts?.trace
  if (!trace || typeof trace !== 'object') return undefined

  return {
    trace: {
      trace_id: trace.trace_id,
      span_id: trace.span_id,
      parent_span_id: trace.parent_span_id,
      op: 'web.operation',
      status: trace.status,
    },
  }
}

function getSafeMethod(value: unknown): string | undefined {
  const method = typeof value === 'string' ? value.toUpperCase() : undefined
  return HTTP_METHODS.find((allowedMethod) => allowedMethod === method)
}

function getSafeStatusCode(value: unknown): number | undefined {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 599
    ? value
    : undefined
}
