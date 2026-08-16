import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

import {
  continuationToken,
  seedPendingOnboarding,
} from './onboarding-controller-test-fixtures'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

describe('Correct Ice Cream Shop Onboarding Email Controller [PATCH /registration-attempts/onboarding/email]', () => {
  const auth = new SupabaseAuthFixture()
  const onboardingIdentifierProvider = OnboardingIdentifierProviderFaker.fake()
  const onboardingTokenProvider = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth, {
      onboardingIdentifier: onboardingIdentifierProvider,
      onboardingToken: onboardingTokenProvider,
    })
  })

  beforeEach(async () => {
    auth.clear()
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
    expect(auth.getCalls().registerReplacementIdentity).toHaveLength(1)
    expect(auth.getCalls().registerReplacementIdentity[0]?.[0]).toMatchObject({
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
    expect(auth.getCalls().registerReplacementIdentity).toHaveLength(0)
  })
})
