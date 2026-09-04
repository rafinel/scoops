import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { CheckHealthController } from '@/shared/rest/controllers/check-health.controller'

describe('Check Health Controller [GET /health]', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    vi.restoreAllMocks()
    app = undefined
  })

  it('returns healthy status when every dependency is available', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response)
    app = await createHealthApp({ databaseHealthy: true })

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'ok',
      mode: 'test',
      services: { database: 'UP', storage: 'UP' },
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('http://storage.test/minio/health/live'),
      expect.objectContaining({ signal: expect.anything() }),
    )
  })

  it.each([
    {
      dependency: 'database',
      databaseHealthy: false,
      storageHealthy: true,
      expectedServices: { database: 'DOWN', storage: 'UP' },
    },
    {
      dependency: 'storage',
      databaseHealthy: true,
      storageHealthy: false,
      expectedServices: { database: 'UP', storage: 'DOWN' },
    },
  ])(
    'returns unavailable status when the $dependency dependency is unavailable',
    async ({ databaseHealthy, storageHealthy, expectedServices }) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: storageHealthy,
      } as Response)
      app = await createHealthApp({ databaseHealthy })

      const response = await request(app.getHttpServer()).get('/health')

      expect(response.status).toBe(503)
      expect(response.body).toMatchObject({
        statusCode: 503,
        status: 'not_ready',
        mode: 'test',
        services: expectedServices,
      })
      expect(response.body.timestamp).toEqual(expect.any(String))
    },
  )
})

async function createHealthApp({ databaseHealthy }: { databaseHealthy: boolean }) {
  const drizzleClient = {
    isHealthy: vi.fn().mockResolvedValue(databaseHealthy),
  } as unknown as DrizzleClient
  const envProvider = {
    get: vi.fn((key: string) => (key === 'S3_ENDPOINT' ? 'http://storage.test' : 'test')),
  } as unknown as EnvProvider
  const moduleRef = await Test.createTestingModule({
    controllers: [CheckHealthController],
    providers: [
      { provide: DrizzleClient, useValue: drizzleClient },
      { provide: EnvProvider, useValue: envProvider },
    ],
  }).compile()

  const nestApp = moduleRef.createNestApplication()
  await nestApp.init()

  return nestApp
}
