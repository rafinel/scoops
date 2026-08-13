import { describe, expect, it } from 'vitest'

import { sanitizeReturnTo } from '../sanitize-return-to'

describe('sanitizeReturnTo', () => {
  it.each([
    ['/app', '/app'],
    ['/app?tab=overview', '/app?tab=overview'],
    ['/', '/'],
  ])('keeps the safe relative value %s', (value, expected) => {
    expect(sanitizeReturnTo(value)).toBe(expected)
  })

  it.each([
    undefined,
    null,
    ['/app', '/other'],
    'https://example.com/account',
    '//example.com/account',
    '/login',
    '/login?returnTo=%2Fapp',
    '/app?access_token=secret',
    '/app?session=private',
    '/app\u0000',
    '/\\example.com',
  ])('rejects unsafe return value %j', (value) => {
    expect(sanitizeReturnTo(value)).toBeUndefined()
  })
})
