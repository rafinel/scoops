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
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'

describe('Confirm Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding/confirm]', () => {
  const { accessToken, confirmationToken, userId } = IdentityModuleFixture.onboarding
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

  it('activates the pending account after the provider verifies the confirmation session', async () => {
    const seed = await fixture.seedPendingOnboarding(onboardingTokenProvider)
    betterAuthFixture.setUser(accessToken, {
      id: userId,
      email: seed.user.email,
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ confirmationToken })

    expect(response.status).toBe(204)
    expect(response.body).toEqual({})
    expect(response.headers['set-cookie']).toEqual([
      expect.stringContaining(`scoops.session_token=fixture-session-${userId}`),
    ])

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

  it('rejects an unknown confirmation token without issuing a session', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .send({ confirmationToken: 'u'.repeat(43) })

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ title: 'Erro de Não Encontrado' })
    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('rejects malformed confirmation tokens before touching the database', async () => {
    betterAuthFixture.setUser(accessToken, {
      id: userId,
      email: 'ana@example.com',
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ confirmationToken: 'short' })

    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ title: 'Invalid request' })
  })
})
