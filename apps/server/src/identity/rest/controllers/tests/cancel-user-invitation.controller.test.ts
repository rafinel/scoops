import type {
  RegistrationAttemptsRepository,
  UserAuditRecordsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import {
  UserFaker,
  UserRegistrationAttemptFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import {
  RegistrationAttemptType,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
describe('Cancel User Invitation Controller [DELETE /users/:userId/invitation]', () => {
  const { establishmentId, managerId, managerToken, operatorId } =
    IdentityModuleFixture.userManagement
  const betterAuthFixture = new BetterAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture, {
      onboardingToken: tokens,
    })
  })
  beforeEach(async () => {
    await betterAuthFixture.clear()
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
          status: 'pending',
          tokenHash: tokens.hash('u'.repeat(43)),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ],
    )
    betterAuthFixture.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })
  })
  afterAll(async () => {
    await fixture?.close()
  })
  it('cancels the invitation, removes the user, and preserves audit history', async () => {
    const response = await request(fixture.app.getHttpServer())
      .delete(`/users/${operatorId}/invitation`)
      .set('Cookie', betterAuthFixture.cookieFor())
    expect(response.status).toBe(204)
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toBeUndefined()
    await expect(
      fixture
        .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
        .findByUserId(operatorId),
    ).resolves.toBeUndefined()
    await expect(
      fixture
        .get<UserAuditRecordsRepository>(IDENTITY_REPOSITORIES.userAuditRecords)
        .findManyByUser({
          establishmentId: '31000000-0000-0000-0000-000000000001',
          affectedUserId: operatorId,
        }),
    ).resolves.toHaveLength(1)
  })

  it('serializes a resend-vs-cancel race through the invitation operation claim', async () => {
    const [cancel, resend] = await Promise.all([
      request(fixture.app.getHttpServer())
        .delete(`/users/${operatorId}/invitation`)
        .set('Cookie', betterAuthFixture.cookieFor()),
      request(fixture.app.getHttpServer())
        .post(`/users/${operatorId}/invitation/resend`)
        .set('Cookie', betterAuthFixture.cookieFor()),
    ])

    expect(
      [cancel.status, resend.status].some((status) => [200, 204].includes(status)),
    ).toBe(true)
    expect(
      [cancel.status, resend.status].every((status) =>
        [200, 204, 404, 409].includes(status),
      ),
    ).toBe(true)
  })
})
