import * as Sentry from '@sentry/nestjs'
import { serverEnvSchema } from '@scoops/validation'

type SentryInitOptions = NonNullable<Parameters<typeof Sentry.init>[0]>
type SentryEvent = Parameters<NonNullable<SentryInitOptions['beforeSend']>>[0]
type SentryException = NonNullable<
  NonNullable<SentryEvent['exception']>['values']
>[number]
type SentryStackTrace = NonNullable<SentryException['stacktrace']>
type SentryStackFrame = NonNullable<SentryStackTrace['frames']>[number]

const SAFE_ERROR_CLASSES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'NetworkError',
  'SessionProviderError',
])

let isInitialized = false

export function initializeServerSentry(): void {
  const environment = serverEnvSchema.parse(process.env)
  const mode = environment.SCOOPS_SERVER_APP_MODE

  if (mode === 'dev' || mode === 'test' || isInitialized) return

  Sentry.init(
    createServerSentryOptions(
      mode,
      environment.SENTRY_DSN,
      environment.SCOOPS_RELEASE_SHA,
    ),
  )
  isInitialized = true
}

function createServerSentryOptions(
  mode: 'stg' | 'prod',
  dsn: string | undefined,
  release: string | undefined,
): SentryInitOptions {
  return {
    dsn,
    environment: mode === 'stg' ? 'staging' : 'production',
    release,
    tracesSampleRate: mode === 'stg' ? 1 : 0.1,
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
    },
    beforeBreadcrumb: () => null,
    beforeSend: sanitizeSentryEvent,
    beforeSendTransaction: sanitizeSentryTransaction,
    beforeSendSpan: sanitizeSentrySpan,
  }
}

function sanitizeSentryEvent(
  event: Parameters<NonNullable<SentryInitOptions['beforeSend']>>[0],
) {
  event.message = undefined
  event.request = undefined
  event.user = undefined
  event.extra = undefined
  event.breadcrumbs = []
  event.contexts = getSafeTraceContext(event.contexts) as typeof event.contexts
  event.tags = getSafeTags(event.tags)
  event.exception = event.exception?.values
    ? { values: event.exception.values.map(sanitizeException) }
    : undefined

  return event
}

function sanitizeException(exception: SentryException): SentryException {
  const type = getSafeErrorClass(exception.type)
  return {
    type,
    value: `Unexpected ${type}`,
    ...(exception.stacktrace
      ? { stacktrace: sanitizeStackTrace(exception.stacktrace) }
      : {}),
  }
}

function sanitizeStackTrace(stacktrace: SentryStackTrace): SentryStackTrace {
  return {
    frames: stacktrace.frames?.map(sanitizeStackFrame),
  }
}

function sanitizeStackFrame(frame: SentryStackFrame): SentryStackFrame {
  const safeFrame: SentryStackFrame = {}
  if (typeof frame.filename === 'string') safeFrame.filename = frame.filename
  if (typeof frame.function === 'string') safeFrame.function = frame.function
  if (typeof frame.lineno === 'number') safeFrame.lineno = frame.lineno
  if (typeof frame.colno === 'number') safeFrame.colno = frame.colno
  if (typeof frame.in_app === 'boolean') safeFrame.in_app = frame.in_app
  if (typeof frame.platform === 'string') safeFrame.platform = frame.platform
  return safeFrame
}

function sanitizeSentryTransaction(
  event: Parameters<NonNullable<SentryInitOptions['beforeSendTransaction']>>[0],
) {
  event.request = undefined
  event.user = undefined
  event.extra = undefined
  event.breadcrumbs = []
  event.contexts = getSafeTraceContext(event.contexts) as typeof event.contexts
  event.tags = getSafeTags(event.tags)
  event.transaction = getSafeRouteTemplate(event.tags?.route) ?? 'unmatched'

  return event
}

function sanitizeSentrySpan(
  span: Parameters<NonNullable<SentryInitOptions['beforeSendSpan']>>[0],
) {
  const data = span.data ?? {}
  const route = getSafeRouteTemplate(data['http.route'])
  const method = getSafeHttpMethod(data['http.request.method'])
  const status = getSafeStatusCode(data['http.response.status_code'])
  const safeData: Record<string, string | number | boolean> = {}

  if (route) safeData['http.route'] = route
  if (method) safeData['http.request.method'] = method
  if (status) safeData['http.response.status_code'] = status
  if (typeof data['sentry.op'] === 'string') safeData['sentry.op'] = data['sentry.op']

  return {
    ...span,
    description: undefined,
    data: safeData,
  }
}

type SafeTraceContext = {
  trace: {
    trace_id?: string
    span_id?: string
    op?: string
    status?: string
  }
}

function getSafeTraceContext(contexts: unknown): SafeTraceContext | undefined {
  if (!contexts || typeof contexts !== 'object') return undefined
  const contextRecord = contexts as Record<string, unknown>
  const trace = contextRecord.trace
  if (!trace || typeof trace !== 'object') return undefined

  const traceRecord = trace as Record<string, unknown>
  const safeTrace = {
    ...(typeof traceRecord.trace_id === 'string'
      ? { trace_id: traceRecord.trace_id }
      : {}),
    ...(typeof traceRecord.span_id === 'string' ? { span_id: traceRecord.span_id } : {}),
    ...(typeof traceRecord.op === 'string' ? { op: traceRecord.op } : {}),
    ...(typeof traceRecord.status === 'string' ? { status: traceRecord.status } : {}),
  }

  return Object.keys(safeTrace).length > 0 ? { trace: safeTrace } : undefined
}

function getSafeTags(tags: Record<string, unknown> | undefined): Record<string, string> {
  const allowedTags = [
    'route',
    'method',
    'status_class',
    'function_id',
    'outcome',
    'error_class',
  ] as const
  const safeTags: Record<string, string> = {}

  for (const key of allowedTags) {
    const value = tags?.[key]
    if (typeof value !== 'string') continue

    if (key === 'route') {
      const route = getSafeRouteTemplate(value)
      if (route) safeTags[key] = route
      continue
    }

    if (key === 'method') {
      const method = getSafeHttpMethod(value)
      if (method) safeTags[key] = method
      continue
    }

    if (key === 'error_class') {
      safeTags[key] = getSafeErrorClass(value)
      continue
    }

    if (key === 'function_id') {
      safeTags[key] = getSafeFunctionId(value)
      continue
    }

    if (/^[a-z0-9-]{1,32}$/.test(value)) safeTags[key] = value
  }

  return safeTags
}

function getSafeRouteTemplate(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 120 || !value.startsWith('/'))
    return undefined

  const segments = value.split('/').slice(1)
  const isSafe = segments.every(
    (segment) =>
      segment === '' ||
      /^:[a-z][a-zA-Z0-9_]{0,47}$/.test(segment) ||
      /^[a-z][a-z0-9-]{0,47}$/.test(segment),
  )

  return isSafe ? value : undefined
}

function getSafeHttpMethod(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const method = value.toUpperCase()

  return ['GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'DELETE'].includes(method)
    ? method
    : undefined
}

function getSafeStatusCode(value: unknown): number | undefined {
  return typeof value === 'number' && value >= 100 && value <= 599
    ? Math.trunc(value)
    : undefined
}

function getSafeErrorClass(value: unknown): string {
  return typeof value === 'string' && SAFE_ERROR_CLASSES.has(value) ? value : 'Error'
}

function getSafeFunctionId(value: string): string {
  return /^[a-z][a-z0-9_-]{0,39}\/[a-z][a-z0-9_-]{0,79}$/.test(value)
    ? value
    : 'unregistered'
}

initializeServerSentry()
