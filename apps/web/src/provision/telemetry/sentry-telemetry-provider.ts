import * as Sentry from '@sentry/tanstackstart-react'

import { BROWSER_ENV } from '@/constants'

const WEB_OPERATIONS = ['auth.session', 'rest.request'] as const
const HTTP_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'] as const

export type WebOperation = (typeof WEB_OPERATIONS)[number]
export type WebRuntime = 'browser' | 'ssr'
export type WebErrorClass =
  | 'Error'
  | 'TypeError'
  | 'RangeError'
  | 'ReferenceError'
  | 'SyntaxError'
  | 'URIError'
  | 'EvalError'
  | 'NetworkError'
  | 'SessionProviderError'

interface WebTelemetryConfiguration {
  dsn: string
  environment: 'staging' | 'production'
  release: string
  tracesSampleRate: 1 | 0.1
  replaysSessionSampleRate: 0.1 | 0.01
  replaysOnErrorSampleRate: 1
}

interface SentryTelemetryProviderDependencies {
  sentry?: typeof Sentry
  browserEnv?: typeof BROWSER_ENV
}

interface SentryTelemetryProviderOperations {
  getWebTelemetryConfiguration(): WebTelemetryConfiguration | null
  getSafeErrorClass(error: unknown): WebErrorClass
  logWebWarning(
    operation: WebOperation,
    errorClass: WebErrorClass,
    runtime?: WebRuntime,
  ): void
  logWebError(
    operation: WebOperation,
    errorClass: WebErrorClass,
    runtime?: WebRuntime,
  ): void
  recordWebRequestDuration(
    durationMs: number,
    method: string | undefined,
    statusCode: number,
    runtime?: WebRuntime,
  ): void
  recordWebNavigationDuration(durationMs: number, route: string): void
}

export const SentryTelemetryProvider = ({
  sentry = Sentry,
  browserEnv = BROWSER_ENV,
}: SentryTelemetryProviderDependencies = {}): SentryTelemetryProviderOperations => {
  const getConfiguration = () => createWebTelemetryConfiguration(browserEnv)

  return {
    getWebTelemetryConfiguration: getConfiguration,
    getSafeErrorClass: getSafeWebErrorClass,
    logWebWarning: (operation, errorClass, runtime = getWebRuntime()) =>
      captureSafeLog(sentry, getConfiguration, 'warning', operation, errorClass, runtime),
    logWebError: (operation, errorClass, runtime = getWebRuntime()) =>
      captureSafeLog(sentry, getConfiguration, 'error', operation, errorClass, runtime),
    recordWebRequestDuration: (
      durationMs,
      method,
      statusCode,
      runtime = getWebRuntime(),
    ) =>
      captureWebRequestDuration(
        sentry,
        getConfiguration,
        durationMs,
        method,
        statusCode,
        runtime,
      ),
    recordWebNavigationDuration: (durationMs, route) =>
      captureWebNavigationDuration(
        sentry,
        getConfiguration,
        browserEnv,
        durationMs,
        route,
      ),
  }
}

const sentryTelemetryProvider = SentryTelemetryProvider()

export const {
  getWebTelemetryConfiguration,
  getSafeErrorClass,
  logWebWarning,
  logWebError,
  recordWebRequestDuration,
  recordWebNavigationDuration,
} = sentryTelemetryProvider

function createWebTelemetryConfiguration(
  browserEnv: typeof BROWSER_ENV,
): WebTelemetryConfiguration | null {
  const { scoopsWebAppMode, sentryDsn, scoopsReleaseSha } = browserEnv
  if (
    (scoopsWebAppMode !== 'stg' && scoopsWebAppMode !== 'prod') ||
    !sentryDsn ||
    !scoopsReleaseSha
  ) {
    return null
  }

  return {
    dsn: sentryDsn,
    environment: scoopsWebAppMode === 'stg' ? 'staging' : 'production',
    release: scoopsReleaseSha,
    tracesSampleRate: scoopsWebAppMode === 'stg' ? 1 : 0.1,
    replaysSessionSampleRate: scoopsWebAppMode === 'stg' ? 0.1 : 0.01,
    replaysOnErrorSampleRate: 1,
  }
}

function getSafeWebErrorClass(error: unknown): WebErrorClass {
  if (!(error instanceof Error)) return 'Error'

  const errorClass = error.name
  if (
    errorClass === 'Error' ||
    errorClass === 'TypeError' ||
    errorClass === 'RangeError' ||
    errorClass === 'ReferenceError' ||
    errorClass === 'SyntaxError' ||
    errorClass === 'URIError' ||
    errorClass === 'EvalError'
  ) {
    return errorClass
  }

  return 'Error'
}

function captureSafeLog(
  sentry: typeof Sentry,
  getConfiguration: () => WebTelemetryConfiguration | null,
  level: 'warning' | 'error',
  operation: WebOperation,
  errorClass: WebErrorClass,
  runtime: WebRuntime,
): void {
  if (!getConfiguration()) return

  try {
    sentry.withScope((scope) => {
      scope.setLevel(level)
      scope.setTag('runtime', runtime)
      scope.setTag('operation', operation)
      scope.setTag('error_class', errorClass)
      sentry.captureMessage(`web.${level}.${operation}.${errorClass}`)
    })
  } catch {
    // Telemetry must not change application behavior.
  }
}

function captureWebRequestDuration(
  sentry: typeof Sentry,
  getConfiguration: () => WebTelemetryConfiguration | null,
  durationMs: number,
  method: string | undefined,
  statusCode: number,
  runtime: WebRuntime,
): void {
  if (!getConfiguration()) return

  try {
    sentry.metrics.distribution('scoops.web.request.duration', durationMs, {
      unit: 'millisecond',
      attributes: {
        route: 'api.request',
        method: normalizeMethod(method),
        status_class: getStatusClass(statusCode),
        runtime,
      },
    })
  } catch {
    // Telemetry must not change request behavior.
  }
}

function captureWebNavigationDuration(
  sentry: typeof Sentry,
  getConfiguration: () => WebTelemetryConfiguration | null,
  browserEnv: typeof BROWSER_ENV,
  durationMs: number,
  route: string,
): void {
  if (!getConfiguration()) return

  try {
    sentry.metrics.distribution('scoops.web.navigation.duration', durationMs, {
      unit: 'millisecond',
      attributes: {
        route,
        environment: browserEnv.scoopsWebAppMode === 'stg' ? 'staging' : 'production',
      },
    })
  } catch {
    // Telemetry must not change navigation behavior.
  }
}

function getWebRuntime(): WebRuntime {
  return typeof window === 'undefined' ? 'ssr' : 'browser'
}

function normalizeMethod(method: string | undefined): string {
  const normalizedMethod = method?.toUpperCase()
  return (
    HTTP_METHODS.find((allowedMethod) => allowedMethod === normalizedMethod) ?? 'OTHER'
  )
}

function getStatusClass(statusCode: number): string {
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    return 'network_error'
  }

  return `${Math.floor(statusCode / 100)}xx`
}
