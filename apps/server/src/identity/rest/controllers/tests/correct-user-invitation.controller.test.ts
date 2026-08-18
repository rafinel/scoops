import type {
  RegistrationAttemptsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import {
  UserFaker,
  UserRegistrationAttemptFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import {
  RegistrationAttemptStatus,
  RegistrationAttemptType,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
describe('Correct User Invitation Controller [PATCH /users/:userId/invitation]', () => {
  const { establishmentId, managerId, managerToken, operatorId } =
    IdentityModuleFixture.userManagement
  const supabaseAuth = new SupabaseAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(supabaseAuth, {
      onboardingToken: tokens,
    })
  })
  beforeEach(async () => {
    await supabaseAuth.clear()
    await fixture.resetDatabase()
    await fixture.seedUsers(
      [
        UserFaker.fake({
          id: managerId,
          establishmentId,
          name: 'Manager',
          email: `${managerId}@example.com`,
          profile: UserProfile.Manager,
        }),
        UserFaker.fake({
          id: operatorId,
          establishmentId,
          name: 'Pending Operator',
          email: 'pending@example.com',
          profile: UserProfile.Operator,
          status: UserStatus.Pending,
        }),
      ],
      [
        UserRegistrationAttemptFaker.fake({
          id: '31000000-0000-0000-0000-000000000004',
          userId: operatorId,
          establishmentId,
          name: 'Pending Operator',
          email: 'pending@example.com',
          profile: UserProfile.Operator,
          type: RegistrationAttemptType.UserInvitation,
          status: RegistrationAttemptStatus.Pending,
          tokenHash: tokens.hash('u'.repeat(43)),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ],
    )
    supabaseAuth.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })
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
