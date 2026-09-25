import {
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RestFixture } from '@/shared/rest/tests/rest-fixture'

const { countMetric, warningLog } = vi.hoisted(() => ({
  countMetric: vi.fn(),
  warningLog: vi.fn(),
}))

vi.mock('@sentry/nestjs', async (importOriginal) => {
  const sentry = await importOriginal<typeof import('@sentry/nestjs')>()

  return {
    ...sentry,
    metrics: {
      ...sentry.metrics,
      count: countMetric,
    },
    logger: {
      ...sentry.logger,
      warn: warningLog,
    },
  }
})

describe('Check Health Controller [GET /health]', () => {
  let fixture: RestFixture | undefined
  let originalMode: string | undefined
  let originalEmailProvider: string | undefined
  let operationalTelemetry: Telemetry
  let captureUnexpected: ReturnType<typeof vi.spyOn>
  let recordHttpRequest: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    // This suite disables file isolation, so Sentry may be cached by earlier tests.
    vi.resetModules()
    originalMode = process.env.SCOOPS_SERVER_APP_MODE
    originalEmailProvider = process.env.SCOOPS_EMAIL_PROVIDER
    process.env.SCOOPS_SERVER_APP_MODE = 'test'
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'
    fixture = await createHealthFixture()
    const { TELEMETRY } = await import(
      '@/shared/provision/telemetry/server-app-telemetry-provider'
    )
    operationalTelemetry = getFixture(fixture).get<Telemetry>(TELEMETRY)
    captureUnexpected = vi.spyOn(operationalTelemetry, 'captureUnexpected')
    recordHttpRequest = vi.spyOn(operationalTelemetry, 'recordHttpRequest')
  })

  afterEach(async () => {
    await fixture?.close()
    vi.restoreAllMocks()
    if (originalMode === undefined) delete process.env.SCOOPS_SERVER_APP_MODE
    else process.env.SCOOPS_SERVER_APP_MODE = originalMode
    if (originalEmailProvider === undefined) delete process.env.SCOOPS_EMAIL_PROVIDER
    else process.env.SCOOPS_EMAIL_PROVIDER = originalEmailProvider
    fixture = undefined
  })

  it('redirects root traffic to the health endpoint', async () => {
    const response = await request(getFixture(fixture).app.getHttpServer()).get('/')
    const postResponse = await request(getFixture(fixture).app.getHttpServer()).post('/')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/health')
    expect(postResponse.status).toBe(302)
    expect(postResponse.headers.location).toBe('/health')
  })

  it('returns healthy status when the database is available', async () => {
    const response = await request(getFixture(fixture).app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'ok',
      mode: 'test',
      services: { database: 'UP' },
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
    expect(captureUnexpected).not.toHaveBeenCalled()
    expect(recordHttpRequest).toHaveBeenCalledTimes(1)
    expect(recordHttpRequest).toHaveBeenCalledWith({
      route: '/health',
      method: 'GET',
      statusClass: '2xx',
      durationMs: expect.any(Number),
    })
  })

  it('keeps the health response available when metric export fails', async () => {
    countMetric.mockClear()
    const countMetricMock = countMetric.mockImplementationOnce(() => {
      throw new Error('telemetry unavailable')
    })

    const response = await request(getFixture(fixture).app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(countMetricMock).toHaveBeenCalled()
  })

  it('sends warnings with only safe attributes', () => {
    warningLog.mockClear()
    operationalTelemetry.logWarning({
      route: '/users/123?email=private@example.com',
      method: 'get',
      statusClass: '4xx',
      functionId: 'private function',
      outcome: 'private outcome',
      durationMs: -12,
      errorClass: 'Error with private details',
    })

    expect(warningLog).toHaveBeenCalledWith('Server warning', {
      method: 'GET',
      status_class: '4xx',
      function_id: 'unregistered',
      duration_ms: 0,
      error_class: 'Error',
    })
  })

  it('returns handled unavailable status without capturing an issue', async () => {
    const { DrizzleClient } = await import('@/shared/database/drizzle/drizzle-client')
    await getFixture(fixture).get(DrizzleClient).onModuleDestroy()

    const response = await request(getFixture(fixture).app.getHttpServer()).get('/health')

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({
      statusCode: 503,
      title: 'SERVICE_UNAVAILABLE',
      message: 'Service Unavailable Exception',
      path: '/health',
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
    expect(captureUnexpected).not.toHaveBeenCalled()
    expect(recordHttpRequest).toHaveBeenCalledTimes(1)
    expect(recordHttpRequest).toHaveBeenCalledWith({
      route: '/health',
      method: 'GET',
      statusClass: '5xx',
      durationMs: expect.any(Number),
    })
  })

  it('keeps unknown failures generic and captures them once', async () => {
    UnexpectedFailureInterceptor.throwOnNextRequest()

    const response = await request(getFixture(fixture).app.getHttpServer()).get('/health')

    expect(response.status).toBe(500)
    expect(response.body).toMatchObject({
      statusCode: 500,
      title: 'Erro Interno da Aplicação',
      message: 'Ocorreu um erro inesperado.',
      path: '/health',
    })
    expect(JSON.stringify(response.body)).not.toContain('private diagnostic')
    expect(captureUnexpected).toHaveBeenCalledTimes(1)
    expect(captureUnexpected).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        route: '/health',
        method: 'GET',
        statusClass: '5xx',
        errorClass: 'Error',
      }),
    )
    expect(recordHttpRequest).toHaveBeenCalledTimes(1)
    expect(recordHttpRequest).toHaveBeenCalledWith({
      route: '/health',
      method: 'GET',
      statusClass: '5xx',
      durationMs: expect.any(Number),
    })
  })
})

async function createHealthFixture() {
  const [
    { APP_INTERCEPTOR },
    { SharedDatabaseModule },
    { ProvisionModule },
    { RestFixture },
    { CheckHealthController },
  ] = await Promise.all([
    import('@nestjs/core'),
    import('@/shared/database/drizzle/database.module'),
    import('@/shared/provision/provision.module'),
    import('@/shared/rest/tests/rest-fixture'),
    import('@/shared/rest/controllers/check-health.controller'),
  ])

  return RestFixture.register({
    imports: [ProvisionModule, SharedDatabaseModule],
    controllers: [CheckHealthController],
    providers: [{ provide: APP_INTERCEPTOR, useClass: UnexpectedFailureInterceptor }],
  })
}

function getFixture(fixture: RestFixture | undefined): RestFixture {
  if (!fixture) throw new Error('Health controller fixture has not been registered.')
  return fixture
}

class UnexpectedFailureInterceptor implements NestInterceptor {
  private static shouldFailNextRequest = false

  static throwOnNextRequest(): void {
    UnexpectedFailureInterceptor.shouldFailNextRequest = true
  }

  intercept(_context: ExecutionContext, next: CallHandler) {
    if (UnexpectedFailureInterceptor.shouldFailNextRequest) {
      UnexpectedFailureInterceptor.shouldFailNextRequest = false
      throw new Error('private diagnostic detail')
    }

    return next.handle()
  }
}
