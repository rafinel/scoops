import { describe, expect, it } from 'vitest'

import {
  isAllowedSessionCookie,
  normalizeAuthSessionResolution,
  normalizeBetterAuthSession,
} from '../resolve-auth-session'

const LOOPBACK_CONTEXT = {
  apiOrigin: 'http://127.0.0.1:3336',
  requestHost: '127.0.0.1:4000',
}
const DEPLOYED_CONTEXT = {
  apiOrigin: 'https://api.scoops.example',
  requestHost: 'web.scoops.example',
}

describe('SSR session cookie validation', () => {
  it('accepts the exact non-secure loopback cookie attributes', () => {
    expect(
      isAllowedSessionCookie(
        'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax',
        LOOPBACK_CONTEXT,
      ),
    ).toBe(true)
  })

  it('accepts the exact loopback deletion cookie attributes', () => {
    expect(
      isAllowedSessionCookie(
        'scoops.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
        LOOPBACK_CONTEXT,
      ),
    ).toBe(true)
  })

  it('accepts the exact deployed shared-domain cookie attributes', () => {
    expect(
      isAllowedSessionCookie(
        'scoops.session_token=session; Domain=.scoops.example; Path=/; HttpOnly; SameSite=Lax; Secure',
        DEPLOYED_CONTEXT,
      ),
    ).toBe(true)
  })

  it.each([
    'scoops.session_token=session; Path=/; SameSite=Lax',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=None',
    'scoops.session_token=session; Domain=.scoops.example; Path=/; HttpOnly; SameSite=Lax',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; Secure',
    'scoops.session_token=session; Domain=.scoops.example; Path=/; HttpOnly; SameSite=Lax; Secure=false',
    'scoops.session_token=session; Domain=.evil.example; Path=/; HttpOnly; SameSite=Lax; Secure',
    'scoops.session_token=session; Domain=.scoops.example; Path=/; HttpOnly; SameSite=Lax; Secure; Partitioned',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; Max-Age=forever',
    'scoops.session_token=; Path=/; HttpOnly; SameSite=Lax',
  ])('rejects weakened or mismatched attributes: %s', (cookie) => {
    const context = cookie.includes('Domain=.scoops.example')
      ? DEPLOYED_CONTEXT
      : LOOPBACK_CONTEXT
    expect(isAllowedSessionCookie(cookie, context)).toBe(false)
  })

  it.each([
    'other=session; Path=/; HttpOnly; SameSite=Lax',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; Path=/',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; Priority=High',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; =broken',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; Max-Age=-x',
    'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax; Expires=not-a-date',
  ])('rejects malformed cookie syntax: %s', (cookie) => {
    expect(isAllowedSessionCookie(cookie, LOOPBACK_CONTEXT)).toBe(false)
  })

  it('accepts localhost without a secure cookie', () => {
    const cookie = 'scoops.session_token=session; Path=/; HttpOnly; SameSite=Lax'
    const apiOrigin = 'http://localhost:3336'
    expect(
      isAllowedSessionCookie(cookie, { apiOrigin, requestHost: 'localhost:4000' }),
    ).toBe(true)
  })

  it('rejects deployed cookies when the request host is malformed or outside the shared domain', () => {
    expect(
      isAllowedSessionCookie(
        'scoops.session_token=session; Domain=.scoops.example; Path=/; HttpOnly; SameSite=Lax; Secure',
        { apiOrigin: 'https://api.scoops.example', requestHost: 'not a host' },
      ),
    ).toBe(false)
    expect(
      isAllowedSessionCookie(
        'scoops.session_token=session; Domain=.scoops.example; Path=/; HttpOnly; SameSite=Lax; Secure',
        { apiOrigin: 'https://api.scoops.example', requestHost: 'evil.example' },
      ),
    ).toBe(false)
  })
})

describe('SSR authentication response normalization', () => {
  const account = {
    id: 'user-id',
    establishmentId: 'establishment-id',
    establishmentName: 'Scoops',
    name: 'Manager',
    email: 'manager@example.com',
    profile: 'manager' as const,
  }
  const user = { id: 'user-id', email: 'manager@example.com' }
  const dates = {
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
    absoluteExpiresAt: '2026-01-08T00:00:00.000Z',
  }

  it('normalizes the Scoops projection whether it is wrapped or returned directly', () => {
    expect(normalizeAuthSessionResolution({ account, session: null })).toEqual({
      account,
      session: null,
    })
    expect(normalizeAuthSessionResolution(account)).toEqual({
      account,
      session: null,
    })
    expect(() => normalizeAuthSessionResolution(null)).toThrow(
      'Authentication session response is invalid',
    )
  })

  it('normalizes the current and legacy Better Auth session shapes with Date values', () => {
    const current = normalizeBetterAuthSession({
      session: { sessionId: 'session-id', ...dates },
      user,
    })
    expect(current?.sessionId).toBe('session-id')
    expect(current?.createdAt).toBeInstanceOf(Date)
    expect(current?.absoluteExpiresAt.toISOString()).toBe(dates.absoluteExpiresAt)

    const legacy = normalizeBetterAuthSession({
      session: {
        id: 'legacy-session',
        createdAt: dates.createdAt,
        expiresAt: dates.expiresAt,
      },
      user,
    })
    expect(legacy?.sessionId).toBe('legacy-session')
    expect(legacy?.absoluteExpiresAt.getTime()).toBe(
      new Date(dates.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000,
    )
  })

  it.each([
    null,
    {},
    { session: null, user },
    { session: { id: 'missing-dates' }, user },
    {
      session: { id: 'bad-date', createdAt: 'invalid', expiresAt: dates.expiresAt },
      user,
    },
    {
      session: { id: 'bad-user', createdAt: dates.createdAt, expiresAt: dates.expiresAt },
      user: {},
    },
  ])('returns no session for malformed provider data: %j', (payload) => {
    expect(normalizeBetterAuthSession(payload)).toBeNull()
  })

  it('accepts a user nested inside the provider session and rejects malformed accounts', () => {
    expect(
      normalizeBetterAuthSession({
        session: { id: 'nested-user', ...dates, user },
      })?.user,
    ).toEqual(user)
    expect(
      normalizeAuthSessionResolution({ account: { ...account, profile: 'admin' } }),
    ).toEqual({ account: null, session: null })
  })
})
