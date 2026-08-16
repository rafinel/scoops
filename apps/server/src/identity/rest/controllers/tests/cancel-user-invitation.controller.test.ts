import type {
  RegistrationAttemptsRepository,
  UserAuditRecordsRepository,
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
describe('Cancel User Invitation Controller [DELETE /users/:userId/invitation]', () => {
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
  it('cancels the invitation, removes the user, and preserves audit history', async () => {
    const response = await request(fixture.app.getHttpServer())
      .delete(`/users/${operatorId}/invitation`)
      .set('Authorization', `Bearer ${managerToken}`)
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
        .set('Authorization', `Bearer ${managerToken}`),
      request(fixture.app.getHttpServer())
        .post(`/users/${operatorId}/invitation/resend`)
        .set('Authorization', `Bearer ${managerToken}`),
    ])

    expect([cancel.status, resend.status].sort((a, b) => a - b)).toEqual(
      expect.arrayContaining([204]),
    )
    expect(
      [cancel.status, resend.status].every((status) =>
        [200, 204, 404, 409].includes(status),
      ),
    ).toBe(true)
  })
})
