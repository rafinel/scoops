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

describe('Correct Ice Cream Shop Onboarding Email Controller [PATCH /registration-attempts/onboarding/email]', () => {
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

  it('replaces the pending email and returns the updated safe snapshot', async () => {
    await seedPendingOnboarding(fixture, onboardingTokenProvider)

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
    expect(
      onboardingIdentityProvider.getCalls().registerReplacementIdentity,
    ).toHaveLength(1)
    expect(
      onboardingIdentityProvider.getCalls().registerReplacementIdentity[0]?.[0],
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
    expect(
      onboardingIdentityProvider.getCalls().registerReplacementIdentity,
    ).toHaveLength(0)
  })
})
