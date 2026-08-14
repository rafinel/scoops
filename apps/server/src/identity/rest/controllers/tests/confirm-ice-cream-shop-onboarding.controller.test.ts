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
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { TestAuthIdentityProvider } from '@/identity/fixtures/test-auth-identity-provider'
import { TestOnboardingIdentifierProvider } from '@/identity/fixtures/test-onboarding-identifier-provider'
import { TestOnboardingIdentityProvider } from '@/identity/fixtures/test-onboarding-identity-provider'
import { TestOnboardingTokenProvider } from '@/identity/fixtures/test-onboarding-token-provider'

import {
  accessToken,
  confirmationToken,
  seedPendingOnboarding,
  userId,
} from './onboarding-controller-test-fixtures'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

describe('Confirm Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding/confirm]', () => {
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

  it('activates the pending account after the provider verifies the confirmation session', async () => {
    const seed = await seedPendingOnboarding(fixture, onboardingTokenProvider)
    authIdentityProvider.setUser(accessToken, {
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
    await seedPendingOnboarding(fixture, onboardingTokenProvider)

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding/confirm')
      .send({ confirmationToken })

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ title: 'Authentication required' })
  })

  it('rejects malformed confirmation tokens before touching the database', async () => {
    authIdentityProvider.setUser(accessToken, {
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
