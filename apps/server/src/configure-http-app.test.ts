import { describe, expect, it } from 'vitest'

import { sanitizeBetterAuthResponse } from '@/configure-http-app'

describe('sanitizeBetterAuthResponse', () => {
  it('preserves a Better Auth error response body', async () => {
    const body = { code: 'INVALID_ORIGIN', message: 'Invalid origin' }
    const response = new Response(JSON.stringify(body), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })

    const sanitized = await sanitizeBetterAuthResponse(
      new Request('https://server.example.com/api/auth/sign-in/email'),
      Promise.resolve(response),
    )

    expect(sanitized.status).toBe(403)
    await expect(sanitized.json()).resolves.toEqual(body)
  })

  it('removes a sign-in token without consuming the sanitized body', async () => {
    const response = new Response(
      JSON.stringify({ token: 'sensitive-token', user: { id: 'user-id' } }),
      { headers: { 'content-type': 'application/json', 'content-length': '64' } },
    )

    const sanitized = await sanitizeBetterAuthResponse(
      new Request('https://server.example.com/api/auth/sign-in/email'),
      Promise.resolve(response),
    )

    expect(sanitized.headers.has('content-length')).toBe(false)
    await expect(sanitized.json()).resolves.toEqual({ user: { id: 'user-id' } })
  })
})
