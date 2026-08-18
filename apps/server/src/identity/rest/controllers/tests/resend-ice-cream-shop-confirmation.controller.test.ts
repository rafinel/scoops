import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

describe('Resend Ice Cream Shop Confirmation Controller [POST /registration-attempts/onboarding/resend]', () => {
  const { continuationToken } = IdentityModuleFixture.onboarding
  const supabaseAuth = new SupabaseAuthFixture()
  const onboardingIdentifierProvider = OnboardingIdentifierProviderFaker.fake()
  const onboardingTokenProvider = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(supabaseAuth, {
      onboardingIdentifier: onboardingIdentifierProvider,
      onboardingToken: onboardingTokenProvider,
    })
  })

  beforeEach(async () => {
    await supabaseAuth.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('resends confirmation with the server-owned redirect and returns 202', async () => {
    await fixture.seedPendingOnboarding(onboardingTokenProvider)

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/resend')
      .send({ continuationToken })

    expect(response.status).toBe(202)
    expect(response.body).toMatchObject({
      establishmentName: 'Gelato Central',
      managerName: 'Ana Manager',
      email: 'ana@example.com',
    })
    expect(supabaseAuth.getCalls().resendConfirmation).toHaveLength(1)
    expect(supabaseAuth.getCalls().resendConfirmation[0]?.[0]).toMatchObject({
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
    expect(supabaseAuth.getCalls().resendConfirmation).toHaveLength(0)
  })
})
