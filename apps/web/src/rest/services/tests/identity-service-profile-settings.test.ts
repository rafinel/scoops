import { describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { IdentityService } from '../identity-service'

describe('IdentityService profile and shop settings operations', () => {
  it('maps account and establishment settings operations to the REST contract', async () => {
    const restClient = {
      get: vi.fn(),
      patch: vi.fn(),
    }
    const service = IdentityService(restClient as never)
    const settings = {
      establishment: {
        id: 'establishment-id',
        name: 'Scoops Centro',
        status: 'active' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-16T14:00:00.000Z',
      },
      responsibleManager: { id: 'manager-id', name: 'Manager' },
    }

    restClient.get.mockResolvedValueOnce(new RestResponse({ body: settings }))
    restClient.patch
      .mockResolvedValueOnce(new RestResponse({ body: { name: 'Updated' } }))
      .mockResolvedValueOnce(new RestResponse({ body: settings }))

    await service.getEstablishmentSettings()
    await service.changeOwnUserName('Updated')
    await service.changeEstablishmentName('Scoops Centro')

    expect(restClient.get).toHaveBeenCalledWith('/establishments/current')
    expect(restClient.patch).toHaveBeenNthCalledWith(1, '/auth/session/name', {
      name: 'Updated',
    })
    expect(restClient.patch).toHaveBeenNthCalledWith(2, '/establishments/current/name', {
      name: 'Scoops Centro',
    })
  })

  it('maps establishment dates and preserves failed responses', async () => {
    const restClient = {
      get: vi
        .fn()
        .mockResolvedValueOnce(
          new RestResponse({
            body: {
              establishment: {
                id: 'establishment-id',
                name: 'Scoops',
                status: 'active' as const,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-08-16T14:00:00.000Z',
              },
              responsibleManager: { id: 'manager-id', name: 'Manager' },
            },
          }),
        )
        .mockResolvedValueOnce(new RestResponse({ statusCode: 403 })),
      patch: vi.fn(),
    }
    const service = IdentityService(restClient as never)

    const success = await service.getEstablishmentSettings()
    const failure = await service.getEstablishmentSettings()

    expect(success.body.establishment.createdAt).toBeInstanceOf(Date)
    expect(success.body.establishment.updatedAt).toBeInstanceOf(Date)
    expect(failure.statusCode).toBe(403)
  })
})
