import type {
  RegistrationAttemptsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import {
  RegistrationAttemptStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import {
  managerId,
  managerToken,
  invitationToken,
  operatorId,
  seedUsers,
  createUser,
  createInvitation,
} from './user-management-controller-test-fixtures'
describe('Accept User Invitation Controller [POST /registration-attempts/invitation/accept]', () => {
  const auth = new SupabaseAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth, { onboardingToken: tokens })
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
    auth.setUser('invite-session', { id: operatorId, email: 'pending@example.com' })
  })
  afterAll(async () => {
    await fixture?.close()
  })
  it('activates the invited user after a valid pending session', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/invitation/accept')
      .set('Authorization', 'Bearer invite-session')
      .send({ confirmationToken: invitationToken })
    expect(response.status).toBe(204)
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ status: UserStatus.Active })
    await expect(
      fixture
        .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
        .findByUserId(operatorId),
    ).resolves.toMatchObject({ status: RegistrationAttemptStatus.Confirmed })
  })

  it('serializes an accept-vs-cancel race so only one transition wins', async () => {
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })
    const [accept, cancel] = await Promise.all([
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/invitation/accept')
        .set('Authorization', 'Bearer invite-session')
        .send({ confirmationToken: invitationToken }),
      request(fixture.app.getHttpServer())
        .delete(`/users/${operatorId}/invitation`)
        .set('Authorization', `Bearer ${managerToken}`),
    ])

    expect([accept.status, cancel.status]).toContain(204)
    expect(
      [accept.status, cancel.status].every((status) => [204, 404, 409].includes(status)),
    ).toBe(true)
  })
})
