import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

describe('Correct Ice Cream Shop Onboarding Email Controller [PATCH /registration-attempts/onboarding/email]', () => {
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

  it('replaces the pending email and returns the updated safe snapshot', async () => {
    await fixture.seedPendingOnboarding(onboardingTokenProvider)
    await betterAuthFixture.createUnconfirmedUser({
      email: 'ana@example.com',
      password: 'password123',
    })

    const response = await request(fixture.app.getHttpServer())
      .patch('/registration-attempts/onboarding/email')
      .send({
        continuationToken,
        email: '  manager.new@example.com ',
        password: 'password123',
      })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      establishmentName: 'Gelato Central',
      managerName: 'Ana Manager',
      email: 'manager.new@example.com',
    })
    expect(betterAuthFixture.getCalls().registerReplacementIdentity).toHaveLength(1)
    expect(
      betterAuthFixture.getCalls().registerReplacementIdentity[0]?.[0],
    ).toMatchObject({
      currentEmail: 'ana@example.com',
      email: 'manager.new@example.com',
      password: 'password123',
      confirmationRedirectTo: expect.stringContaining(
        '/onboarding/confirm?confirmationToken=',
      ),
    })
  })

  it('rejects invalid request fields before invoking the provider', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/registration-attempts/onboarding/email')
      .send({ continuationToken: 'short', email: 'invalid', password: '' })

    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ title: 'Invalid request' })
    expect(betterAuthFixture.getCalls().registerReplacementIdentity).toHaveLength(0)
  })
})
