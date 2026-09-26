import * as Sentry from '@sentry/tanstackstart-react'

const WEB_MODES = ['dev', 'test', 'stg', 'prod']
const HTTP_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT']
const ERROR_CLASSES = [
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'NetworkError',
  'SessionProviderError',
]

const MODE =
  process.env.SCOOPS_WEB_APP_MODE ??
  (process.env.NODE_ENV === 'test'
    ? 'test'
    : process.env.NODE_ENV === 'production'
      ? ''
      : 'dev')
const SENTRY_DSN = process.env.SENTRY_DSN
const RELEASE_SHA = process.env.SCOOPS_RELEASE_SHA
const SCOOPS_SERVER_APP_URL = process.env.VITE_SCOOPS_SERVER_APP_URL

if (!WEB_MODES.includes(MODE)) {
  throw new Error('SCOOPS_WEB_APP_MODE must be set to dev, test, stg, or prod.')
}

const IS_DEPLOYED = MODE === 'stg' || MODE === 'prod'
if (
  IS_DEPLOYED &&
  (!isValidSentryDsn(SENTRY_DSN) ||
    !/^[a-f0-9]{40}$/i.test(RELEASE_SHA ?? '') ||
    !isValidApiOrigin(SCOOPS_SERVER_APP_URL))
) {
  throw new Error(
    'SENTRY_DSN, SCOOPS_RELEASE_SHA, and VITE_SCOOPS_SERVER_APP_URL are required in deployed modes.',
  )
}

if (IS_DEPLOYED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: MODE === 'stg' ? 'staging' : 'production',
    release: RELEASE_SHA,
    tracesSampleRate: MODE === 'stg' ? 1 : 0.1,
    tracePropagationTargets: [getApiOriginPattern(new URL(SCOOPS_SERVER_APP_URL).origin)],
    sendDefaultPii: false,
    beforeSend: scrubServerEvent,
    beforeSendSpan: scrubServerSpan,
    beforeBreadcrumb: () => null,
  })
}

function scrubServerEvent(event) {
  const errorClass = getErrorClass(
    event.exception?.values?.[0]?.type ?? event.tags?.error_class,
  )
  const operation = getOperation(event.tags?.operation)
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
              function: getFunctionName(frame.function),
              lineno: frame.lineno,
              colno: frame.colno,
              in_app: frame.in_app,
              platform: frame.platform,
            })),
          }
        : undefined,
    }))
  }

  event.transaction = 'web.ssr'
  event.transaction_info = undefined
  event.request = undefined
  event.user = undefined
  event.breadcrumbs = undefined
  event.contexts = undefined
  event.extra = undefined
  event.fingerprint = undefined
  event.modules = undefined
  event.threads = undefined
  event.tags = {
    runtime: 'ssr',
    route: 'web.ssr',
    error_class: errorClass,
    operation,
  }

  return event
}

function scrubServerSpan(span) {
  const method = getMethod(span.attributes['http.request.method'])
  const statusCode = getStatusCode(span.attributes['http.response.status_code'])
  const attributes = {
    'sentry.op': 'web.operation',
    'scoops.route_template': 'web.ssr',
    'scoops.runtime': 'ssr',
  }

  if (method) attributes['http.request.method'] = method
  if (statusCode !== undefined) {
    attributes['http.response.status_code'] = statusCode
    attributes['scoops.status_class'] = `${Math.floor(statusCode / 100)}xx`
  }

  return {
    ...span,
    name: 'web.ssr',
    attributes,
    links: undefined,
  }
}

function getErrorClass(value) {
  return ERROR_CLASSES.includes(value) ? value : 'Error'
}

function getFunctionName(value) {
  return typeof value === 'string' && /^[A-Za-z_$][A-Za-z0-9_.$<>/-]{0,119}$/.test(value)
    ? value
    : 'anonymous'
}

function getMethod(value) {
  const method = typeof value === 'string' ? value.toUpperCase() : undefined
  return HTTP_METHODS.includes(method) ? method : undefined
}

function getStatusCode(value) {
  return Number.isInteger(value) && value >= 100 && value <= 599 ? value : undefined
}

function getOperation(value) {
  return value === 'auth.session' || value === 'rest.request' ? value : 'unexpected'
}

function isValidSentryDsn(value) {
  if (!value) return false

  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      Boolean(url.username) &&
      !url.password &&
      url.pathname.length > 1 &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

function isValidApiOrigin(value) {
  if (!value) return false

  try {
    const url = new URL(value)
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return (
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      (isLoopback ? url.protocol === 'http:' : url.protocol === 'https:')
    )
  } catch {
    return false
  }
}

function getApiOriginPattern(apiOrigin) {
  const escapedOrigin = apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escapedOrigin}(?:/|\\?|#|$)`)
}
