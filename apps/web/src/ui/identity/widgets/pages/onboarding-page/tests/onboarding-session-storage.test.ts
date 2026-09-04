import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearOnboardingSession,
  loadOnboardingSession,
  saveOnboardingSession,
} from '@/ui/identity/storage/onboarding-session-storage'

const validSession = {
  version: 1 as const,
  continuationToken: 'a'.repeat(43),
  onboarding: {
    establishmentName: 'Gelato Central',
    managerName: 'Ana',
    email: 'ana@example.com',
    expiresAt: new Date('2026-08-20T12:00:00.000Z'),
  },
}

describe('onboardingSessionStorage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    window.sessionStorage.clear()
  })

  it('round-trips a safe continuation snapshot and restores its expiry date', () => {
    saveOnboardingSession(validSession)

    const stored = JSON.parse(
      window.sessionStorage.getItem('scoops.identity.onboarding-session') ?? '{}',
    )
    expect(stored.onboarding.expiresAt).toBe(
      validSession.onboarding.expiresAt.toISOString(),
    )
    expect(stored).not.toHaveProperty('password')
    expect(loadOnboardingSession()?.onboarding.expiresAt).toEqual(
      validSession.onboarding.expiresAt,
    )
  })

  it('clears malformed, expired-format, and unsafe data instead of returning it', () => {
    const invalidValues = [
      { ...validSession, version: 2 },
      { ...validSession, continuationToken: 'unsafe' },
      { ...validSession, onboarding: { ...validSession.onboarding, email: '' } },
      {
        ...validSession,
        onboarding: { ...validSession.onboarding, expiresAt: 'not-a-date' },
      },
    ]

    for (const value of invalidValues) {
      window.sessionStorage.setItem(
        'scoops.identity.onboarding-session',
        JSON.stringify(value),
      )
      expect(loadOnboardingSession()).toBeUndefined()
      expect(
        window.sessionStorage.getItem('scoops.identity.onboarding-session'),
      ).toBeNull()
    }
  })

  it('clears a saved session explicitly', () => {
    saveOnboardingSession(validSession)

    clearOnboardingSession()

    expect(loadOnboardingSession()).toBeUndefined()
  })

  it('returns no data during server rendering', () => {
    vi.stubGlobal('window', undefined)

    expect(loadOnboardingSession()).toBeUndefined()
    expect(() => saveOnboardingSession(validSession)).not.toThrow()
    expect(() => clearOnboardingSession()).not.toThrow()
  })
})
