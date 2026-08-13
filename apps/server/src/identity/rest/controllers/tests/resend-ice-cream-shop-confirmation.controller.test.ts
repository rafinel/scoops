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

describe('Resend Ice Cream Shop Confirmation Controller [POST /registration-attempts/onboarding/resend]', () => {
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

  it('resends confirmation with the server-owned redirect and returns 202', async () => {
    await seedPendingOnboarding(fixture, onboardingTokenProvider)

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/resend')
      .send({ continuationToken })

    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      establishmentName: 'Gelato Central',
      managerName: 'Ana Manager',
      email: 'ana@example.com',
    })
    expect(onboardingIdentityProvider.getCalls().resendConfirmation).toHaveLength(1)
    expect(
      onboardingIdentityProvider.getCalls().resendConfirmation[0]?.[0],
    ).toMatchObject({
      email: 'ana@example.com',
      confirmationRedirectTo: expect.stringContaining(
        '/onboarding/confirm?confirmationToken=',
      ),
    })
  })

  it('rejects an invalid continuation token before sending a message', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/resend')
      .send({ continuationToken: 'invalid' })

    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ title: 'Invalid request' })
    expect(onboardingIdentityProvider.getCalls().resendConfirmation).toHaveLength(0)
  })
})
