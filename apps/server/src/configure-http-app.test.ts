import type { INestApplication } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

import { configureHttpApp, sanitizeBetterAuthResponse } from '@/configure-http-app'

describe('configureHttpApp', () => {
  it('registers CORS, auth handling, parsers, and the global error filter', () => {
    const app = {
      enableCors: vi.fn(),
      get: vi.fn().mockReturnValue({}),
      use: vi.fn(),
      useBodyParser: vi.fn(),
      useGlobalFilters: vi.fn(),
    } as unknown as INestApplication

    configureHttpApp(
      app,
      { handler: vi.fn() },
      { trustedOrigins: ['https://web.example.com'], isAllowedRoute: () => true },
    )

    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ['https://web.example.com'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    })
    expect(app.use).toHaveBeenCalledWith('/api/auth', expect.any(Function))
    expect(app.useBodyParser).toHaveBeenNthCalledWith(1, 'json')
    expect(app.useBodyParser).toHaveBeenNthCalledWith(2, 'urlencoded', {
      extended: true,
    })
    expect(app.get).toHaveBeenCalledWith(HttpAdapterHost)
    expect(app.useGlobalFilters).toHaveBeenCalledTimes(1)
  })
})

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
