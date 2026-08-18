import type {
  EstablishmentsRepository,
  RegistrationAttemptsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import {
  EstablishmentStatus,
  RegistrationAttemptStatus,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

describe('Confirm Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding/confirm]', () => {
  const { accessToken, confirmationToken, userId } = IdentityModuleFixture.onboarding
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

  it('activates the pending account after the provider verifies the confirmation session', async () => {
    const seed = await fixture.seedPendingOnboarding(onboardingTokenProvider)
    supabaseAuth.setUser(accessToken, {
      id: userId,
      email: seed.user.email,
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmationToken })

    expect(response.status).toBe(204)
    expect(response.body).toEqual({})

    const establishmentsRepository = fixture.get<EstablishmentsRepository>(
      IDENTITY_REPOSITORIES.establishments,
    )
    const usersRepository = fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
    const registrationAttemptsRepository = fixture.get<RegistrationAttemptsRepository>(
      IDENTITY_REPOSITORIES.registrationAttempts,
    )

    await expect(
      establishmentsRepository.findById(seed.establishment.id),
    ).resolves.toMatchObject({
      status: EstablishmentStatus.Active,
    })
    await expect(usersRepository.findById(seed.user.id)).resolves.toMatchObject({
      status: UserStatus.Active,
    })
    await expect(
      registrationAttemptsRepository.findById(seed.registrationAttempt.id),
    ).resolves.toMatchObject({ status: RegistrationAttemptStatus.Confirmed })
  })

  it('requires a pending provider session', async () => {
    await fixture.seedPendingOnboarding(onboardingTokenProvider)

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .send({ confirmationToken })

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ title: 'Authentication required' })
  })

  it('rejects malformed confirmation tokens before touching the database', async () => {
    supabaseAuth.setUser(accessToken, {
      id: userId,
      email: 'ana@example.com',
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmationToken: 'short' })

    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ title: 'Invalid request' })
  })
})
