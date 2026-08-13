import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { TestAuthIdentityProvider } from '@/identity/fixtures/test-auth-identity-provider'
import { TestOnboardingIdentifierProvider } from '@/identity/fixtures/test-onboarding-identifier-provider'
import { TestOnboardingIdentityProvider } from '@/identity/fixtures/test-onboarding-identity-provider'
import { TestOnboardingTokenProvider } from '@/identity/fixtures/test-onboarding-token-provider'

import {
  continuationToken,
  seedPendingOnboarding,
} from './onboarding-controller-test-fixtures'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

describe('Get Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding/status]', () => {
  const authIdentityProvider = new TestAuthIdentityProvider()
  const onboardingIdentityProvider = new TestOnboardingIdentityProvider()
  const onboardingIdentifierProvider = new TestOnboardingIdentifierProvider()
  const onboardingTokenProvider = new TestOnboardingTokenProvider()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(authIdentityProvider, {
      onboardingIdentity: onboardingIdentityProvider,
      onboardingIdentifier: onboardingIdentifierProvider,
      onboardingToken: onboardingTokenProvider,
    })
  })

  beforeEach(async () => {
    authIdentityProvider.clear()
    onboardingIdentityProvider.clear()
    onboardingIdentifierProvider.clear()
    onboardingTokenProvider.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns the safe pending onboarding projection for a valid continuation token', async () => {
    await seedPendingOnboarding(fixture, onboardingTokenProvider)

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/status')
      .send({ continuationToken })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      establishmentName: 'Gelato Central',
      managerName: 'Ana Manager',
      email: 'ana@example.com',
    })
    expect(response.body).not.toHaveProperty('continuationToken')
    expect(response.body).not.toHaveProperty('password')
  })

  it('rejects malformed tokens and does not disclose unknown onboarding state', async () => {
    const [malformed, unknown] = await Promise.all([
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/onboarding/status')
        .send({ continuationToken: 'short' }),
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/onboarding/status')
        .send({ continuationToken: 'z'.repeat(43) }),
    ])

    expect(malformed.status).toBe(422)
    expect(unknown.status).toBe(404)
    expect(malformed.body).toMatchObject({ title: 'Invalid request' })
    expect(unknown.body).toMatchObject({ message: 'Onboarding not found' })
  })
})
