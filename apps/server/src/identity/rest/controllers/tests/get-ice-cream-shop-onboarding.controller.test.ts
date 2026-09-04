import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

describe('Get Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding/status]', () => {
  const { continuationToken } = IdentityModuleFixture.onboarding
  const betterAuthFixture = new BetterAuthFixture()
  const onboardingIdentifierProvider = OnboardingIdentifierProviderFaker.fake()
  const onboardingTokenProvider = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture, {
      onboardingIdentifier: onboardingIdentifierProvider,
      onboardingToken: onboardingTokenProvider,
    })
  })

  beforeEach(async () => {
    await betterAuthFixture.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns the safe pending onboarding projection for a valid continuation token', async () => {
    await fixture.seedPendingOnboarding(onboardingTokenProvider)

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
