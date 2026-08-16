import type {
  RegistrationAttemptsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import {
  managerId,
  managerToken,
  operatorId,
  seedUsers,
  createUser,
  createInvitation,
} from './user-management-controller-test-fixtures'

describe('Correct User Invitation Controller [PATCH /users/:userId/invitation]', () => {
  const auth = new SupabaseAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth, {
      onboardingToken: tokens,
    })
  })
  beforeEach(async () => {
    auth.clear()
    await fixture.resetDatabase()
    await seedUsers(
      fixture,
      [
        createUser(managerId, 'Manager', UserProfile.Manager),
        createUser(
          operatorId,
          'Pending Operator',
          UserProfile.Operator,
          UserStatus.Pending,
        ),
      ],
      [createInvitation(tokens)],
    )
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })
  })
  afterAll(async () => {
    await fixture?.close()
  })
  it('corrects the pending invitation and persists its new data', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${operatorId}/invitation`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Corrected Name',
        email: 'corrected@example.com',
        profile: UserProfile.Manager,
      })
    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({
      id: operatorId,
      name: 'Corrected Name',
      email: 'corrected@example.com',
      profile: UserProfile.Manager,
      status: UserStatus.Pending,
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ name: 'Corrected Name', email: 'corrected@example.com' })
    await expect(
      fixture
        .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
        .findByUserId(operatorId),
    ).resolves.toMatchObject({
      email: 'corrected@example.com',
      profile: UserProfile.Manager,
    })
  })
})
