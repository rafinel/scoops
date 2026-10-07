import type { Page, Request } from '@playwright/test'
import { gunzipSync } from 'node:zlib'

type CapturedTransportPayload = Record<string, unknown>
type TransportSummary = {
  pathname: string
  contentType: string | undefined
  bodyLength: number
  bodyFormat: 'json' | 'gzip' | 'base64' | 'unparsed' | 'empty'
  bodyKeys: readonly string[]
  eventNames: readonly string[]
}

export type AnalyticsTransportFixture = {
  failOnceForEvent: (eventName: string) => void
  install: () => Promise<void>
  eventAttempts: (eventName: string) => readonly CapturedTransportPayload[]
  events: () => readonly CapturedTransportPayload[]
  requests: () => readonly Request[]
  sentryRequests: () => readonly Request[]
  summaries: () => readonly TransportSummary[]
}

export const AnalyticsTransportFixture = (page: Page): AnalyticsTransportFixture => {
  const capturedEvents: CapturedTransportPayload[] = []
  const posthogRequests: Request[] = []
  const sentryRequests: Request[] = []
  const summaries: TransportSummary[] = []
  let eventToFailOnce: string | undefined

  return {
    failOnceForEvent: (eventName) => {
      eventToFailOnce = eventName
    },
    events: () => capturedEvents,
    eventAttempts: (eventName) =>
      capturedEvents.filter(({ event }) => event === eventName),
    requests: () => posthogRequests,
    sentryRequests: () => sentryRequests,
    summaries: () => summaries,

    async install() {
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        const isLocalApplication =
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          url.hostname === '::1'
        const isAllowedTelemetry =
          url.hostname === 'posthog.invalid' || url.hostname === 'sentry.invalid'

        if (isLocalApplication || isAllowedTelemetry) {
          await route.continue()
          return
        }

        await route.fulfill({ status: 204, body: '' })
      })

      await page.route(
        (url) => new URL(url).hostname === 'posthog.invalid',
        async (route) => {
          const request = route.request()
          posthogRequests.push(request)
          const body = request.postDataBuffer()
          const parsedBody = parseRequestPayload(body)
          const payload = parsedBody.payload
          const events = readEvents(payload)
          summaries.push({
            pathname: new URL(request.url()).pathname,
            contentType: request.headers()['content-type'],
            bodyLength: body?.length ?? 0,
            bodyFormat: parsedBody.format,
            bodyKeys: isRecord(payload) ? Object.keys(payload) : [],
            eventNames: events.map(({ event }) => String(event)),
          })
          for (const event of events) capturedEvents.push(event)
          if (eventToFailOnce && events.some(({ event }) => event === eventToFailOnce)) {
            eventToFailOnce = undefined
            await route.fulfill({ status: 503, body: 'synthetic transient failure' })
            return
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 1 }),
          })
        },
      )

      await page.route(
        (url) => new URL(url).hostname === 'sentry.invalid',
        async (route) => {
          sentryRequests.push(route.request())
          await route.fulfill({ status: 200, body: 'ok' })
        },
      )
    },
  }
}

function parseRequestPayload(body: Buffer | null): {
  payload: unknown
  format: TransportSummary['bodyFormat']
} {
  if (!body) return { payload: undefined, format: 'empty' }
  const rawBody = body.toString('utf8')
  try {
    return { payload: JSON.parse(rawBody), format: 'json' }
  } catch {
    // PostHog sends batched events as gzip when browser compression is available.
  }

  if (body.length > 2 && body[0] === 0x1f && body[1] === 0x8b) {
    try {
      return { payload: JSON.parse(gunzipSync(body).toString('utf8')), format: 'gzip' }
    } catch {
      return { payload: undefined, format: 'unparsed' }
    }
  }

  const encodedData = new URLSearchParams(rawBody).get('data')
  if (encodedData) {
    try {
      const decoded = Buffer.from(encodedData, 'base64').toString('utf8')
      return { payload: JSON.parse(decoded), format: 'base64' }
    } catch {
      return { payload: undefined, format: 'unparsed' }
    }
  }

  return { payload: undefined, format: 'unparsed' }
}

function readEvents(payload: unknown): CapturedTransportPayload[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((candidate) => readEvents(candidate))
  }

  if (typeof payload !== 'object' || payload === null) return []
  const record = payload as Record<string, unknown>
  if (typeof record.event === 'string' && typeof record.properties === 'object') {
    return [record]
  }
  if (Array.isArray(record.batch)) {
    return record.batch.flatMap((candidate) => readEvents(candidate))
  }
  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
