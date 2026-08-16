import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

describe('Register Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding]', () => {
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
    expect(auth.getCalls().registerPendingIdentity).toHaveLength(1)
    expect(auth.getCalls().registerPendingIdentity[0]?.[0]).toMatchObject({
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
    expect(auth.getCalls().registerPendingIdentity).toHaveLength(0)
  })
})
