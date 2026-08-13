import { afterEach, describe, expect, it } from 'vitest'

import {
  clearOnboardingSession,
  loadOnboardingSession,
  saveOnboardingSession,
} from '../onboarding-session-storage'

describe('onboardingSessionStorage', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('round-trips only the safe continuation snapshot and restores the Date', () => {
    const expiresAt = new Date('2026-08-20T12:00:00.000Z')
    saveOnboardingSession({
      version: 1,
      continuationToken: 'a'.repeat(43),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt,
      },
    })

    const stored = JSON.parse(
      window.sessionStorage.getItem('scoops.identity.onboarding-session') ?? '{}',
    )
    expect(stored.onboarding.expiresAt).toBe(expiresAt.toISOString())
    expect(stored).not.toHaveProperty('password')
    expect(loadOnboardingSession()?.onboarding.expiresAt).toEqual(expiresAt)
  })

  it('clears malformed or unsafe data instead of returning it', () => {
    window.sessionStorage.setItem(
      'scoops.identity.onboarding-session',
      JSON.stringify({ version: 1, continuationToken: 'unsafe', onboarding: {} }),
    )

    expect(loadOnboardingSession()).toBeUndefined()
    expect(window.sessionStorage.getItem('scoops.identity.onboarding-session')).toBeNull()
  })

  it('clears a saved session explicitly', () => {
    saveOnboardingSession({
      version: 1,
      continuationToken: 'a'.repeat(43),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2026-08-20T12:00:00.000Z'),
      },
    })

    clearOnboardingSession()
    expect(loadOnboardingSession()).toBeUndefined()
  })
})
