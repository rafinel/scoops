import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { TestAuthIdentityProvider } from '@/identity/fixtures/test-auth-identity-provider'
import { TestOnboardingIdentifierProvider } from '@/identity/fixtures/test-onboarding-identifier-provider'
import { TestOnboardingIdentityProvider } from '@/identity/fixtures/test-onboarding-identity-provider'
import { TestOnboardingTokenProvider } from '@/identity/fixtures/test-onboarding-token-provider'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

describe('Register Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding]', () => {
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

  it('creates a pending onboarding and keeps the continuation token in the response only', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding')
      .send({
        establishmentName: '  Gelato Central ',
        managerName: ' Ana Manager ',
        email: ' ANA@example.com ',
        password: 'password123',
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      continuationToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana Manager',
        email: 'ana@example.com',
      },
    })
    expect(response.body.onboarding.expiresAt).toEqual(expect.any(String))
    expect(onboardingIdentityProvider.getCalls().registerPendingIdentity).toHaveLength(1)
    expect(
      onboardingIdentityProvider.getCalls().registerPendingIdentity[0]?.[0],
    ).toMatchObject({
      email: 'ana@example.com',
      password: 'password123',
      confirmationRedirectTo: expect.stringContaining(
        '/onboarding/confirm?confirmationToken=',
      ),
    })
    expect(response.body).not.toHaveProperty('password')
  })

  it('rejects malformed and unknown fields before creating a provider identity', async () => {
    const [malformed, unknownField] = await Promise.all([
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/onboarding')
        .send({
          establishmentName: 'Gelato Central',
          managerName: 'Ana',
          email: 'not-an-email',
          password: 'short',
        }),
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/onboarding')
        .send({
          establishmentName: 'Gelato Central',
          managerName: 'Ana',
          email: 'ana@example.com',
          password: 'password123',
          actor: 'forbidden-client-field',
        }),
    ])

    expect(malformed.status).toBe(422)
    expect(unknownField.status).toBe(422)
    expect(malformed.body).toMatchObject({ title: 'Invalid request' })
    expect(onboardingIdentityProvider.getCalls().registerPendingIdentity).toHaveLength(0)
  })
})
