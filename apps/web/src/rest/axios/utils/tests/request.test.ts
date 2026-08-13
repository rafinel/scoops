import { describe, expect, it, vi } from 'vitest'

import type { AxiosInstance } from 'axios'
import type { AuthSession } from '@scoops/core/identity/domain/structures'

import { request } from '../request'

describe('request', () => {
  it('resolves the latest session token for each request without changing defaults', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      data: { ok: true },
      status: 200,
      headers: {},
    })
    const client = { request: requestMock } as unknown as AxiosInstance
    const firstSession = createSession('first-token')
    const secondSession = createSession('second-token')
    const sessionAccessorMock = vi
      .fn<() => Promise<AuthSession | null>>()
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession)

    await request(client, { method: 'get', url: '/auth/session' }, sessionAccessorMock)
    await request(client, { method: 'get', url: '/auth/session' }, sessionAccessorMock)

    expect(requestMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { Authorization: 'Bearer first-token' },
      }),
    )
    expect(requestMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { Authorization: 'Bearer second-token' },
      }),
    )
  })

  it('does not add an authorization header when there is no session', async () => {
    const requestMock = vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} })
    const client = { request: requestMock } as unknown as AxiosInstance

    await request(client, { method: 'get', url: '/public' }, async () => null)

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { Authorization: undefined } }),
    )
  })
})

function createSession(accessToken: string): AuthSession {
  return {
    accessToken,
    user: { id: 'user-id', email: 'user@example.com' },
  }
}
