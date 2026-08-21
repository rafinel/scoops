import { describe, expect, it, vi } from 'vitest'

import { IdentityService } from '../identity-service'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

describe('IdentityService', () => {
  it('maps users-management methods to the specified REST contract', async () => {
    const restClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }
    const service = IdentityService(restClient as never)
    const userDetails = createUserDetailsJson()
    const usersPage = {
      items: [userDetails.user],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      summary: { total: 1, managers: 0, operators: 1 },
    }

    restClient.get
      .mockResolvedValueOnce(new RestResponse({ body: usersPage }))
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
    restClient.post
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
      .mockResolvedValueOnce(new RestResponse())
    restClient.patch
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
      .mockResolvedValueOnce(new RestResponse({ body: userDetails }))
    restClient.delete.mockResolvedValueOnce(new RestResponse())

    await service.listUsers({ search: 'Ana', profile: 'operator', page: 1, pageSize: 20 })
    await service.getUserDetails('user-id')
    await service.inviteUser({
      name: 'Ana',
      email: 'ana@example.com',
      profile: 'operator',
    })
    await service.correctUserInvitation('user-id', {
      name: 'Ana',
      email: 'ana@example.com',
      profile: 'operator',
    })
    await service.resendUserInvitation('user-id')
    await service.cancelUserInvitation('user-id')
    await service.acceptUserInvitation({ confirmationToken: 'token' })
    await service.changeUserProfile('user-id', 'manager')
    await service.changeUserStatus('user-id', 'inactive')
    await service.correctUserName('user-id', 'Ana Silva')

    expect(restClient.get).toHaveBeenNthCalledWith(
      1,
      '/users?search=Ana&profile=operator&page=1&pageSize=20',
    )
    expect(restClient.get).toHaveBeenNthCalledWith(2, '/users/user-id')
    expect(restClient.post).toHaveBeenNthCalledWith(1, '/users/invitations', {
      name: 'Ana',
      email: 'ana@example.com',
      profile: 'operator',
    })
    expect(restClient.post).toHaveBeenNthCalledWith(2, '/users/user-id/invitation/resend')
    expect(restClient.post).toHaveBeenNthCalledWith(
      3,
      '/registration-attempts/invitation/accept',
      {
        confirmationToken: 'token',
      },
    )
    expect(restClient.patch).toHaveBeenNthCalledWith(1, '/users/user-id/invitation', {
      name: 'Ana',
      email: 'ana@example.com',
      profile: 'operator',
    })
    expect(restClient.patch).toHaveBeenNthCalledWith(2, '/users/user-id/profile', {
      profile: 'manager',
    })
    expect(restClient.patch).toHaveBeenNthCalledWith(3, '/users/user-id/status', {
      status: 'inactive',
    })
    expect(restClient.delete).toHaveBeenCalledWith('/users/user-id/invitation')
  })

  it('maps user and audit timestamps while preserving failed responses', async () => {
    const restClient = {
      get: vi
        .fn()
        .mockResolvedValueOnce(new RestResponse({ body: createUserDetailsJson() }))
        .mockResolvedValueOnce(new RestResponse({ statusCode: 404 })),
    }
    const service = IdentityService(restClient as never)

    const detailsResponse = await service.getUserDetails('user-id')
    const failedResponse = await service.getUserDetails('missing')

    expect(detailsResponse.body.user.createdAt).toBeInstanceOf(Date)
    expect(detailsResponse.body.auditRecords[0]?.occurredAt).toBeInstanceOf(Date)
    expect(failedResponse.statusCode).toBe(404)
  })
})

function createUserDetailsJson() {
  return {
    user: {
      id: 'user-id',
      establishmentId: 'establishment-id',
      name: 'Ana',
      email: 'ana@example.com',
      profile: 'operator' as const,
      status: 'pending' as const,
      createdAt: '2026-08-14T12:00:00.000Z',
      updatedAt: '2026-08-14T12:00:00.000Z',
      lastAccessAt: undefined,
    },
    auditRecords: [
      {
        id: 'audit-id',
        establishmentId: 'establishment-id',
        affectedUserId: 'user-id',
        affectedUserName: 'Ana',
        actorType: 'user' as const,
        actorUserId: 'manager-id',
        actorName: 'Manager',
        action: 'user-registered' as const,
        occurredAt: '2026-08-14T12:00:00.000Z',
      },
    ],
  }
}
