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
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import {
  managerId,
  managerToken,
  seedUsers,
  createUser,
} from './user-management-controller-test-fixtures'

describe('Invite User Controller [POST /users/invitations]', () => {
  const auth = new SupabaseAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  const identifiers = OnboardingIdentifierProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth, {
      onboardingToken: tokens,
      onboardingIdentifier: identifiers,
    })
  })
  beforeEach(async () => {
    auth.clear()
    auth.getCalls().inviteIdentity.length = 0
    await fixture.resetDatabase()
    await seedUsers(fixture, [createUser(managerId, 'Manager', UserProfile.Manager)])
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })
  })
  afterAll(async () => {
    await fixture?.close()
  })
  it('creates a pending user, invitation attempt, and audit record', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/users/invitations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: '  Pending Operator ',
        email: 'PENDING@EXAMPLE.COM',
        profile: UserProfile.Operator,
      })
    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      name: 'Pending Operator',
      email: 'pending@example.com',
      status: UserStatus.Pending,
      profile: UserProfile.Operator,
    })
    expect(response.body.auditRecords).toHaveLength(1)
    const user = await fixture
      .get<UsersRepository>(IDENTITY_REPOSITORIES.users)
      .findByEmail('pending@example.com')
    expect(user).toBeDefined()
    if (!user) return
    expect(user?.status).toBe(UserStatus.Pending)
    await expect(
      fixture
        .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
        .findByUserId(user.id),
    ).resolves.toMatchObject({ status: 'pending' })
    await expect(
      fixture
        .get<UserAuditRecordsRepository>(IDENTITY_REPOSITORIES.userAuditRecords)
        .findManyByUser({
          establishmentId: user.establishmentId,
          affectedUserId: user.id,
        }),
    ).resolves.toHaveLength(1)
  })
})
