import type { RegistrationAttemptsRepository } from '@scoops/core/identity/interfaces'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import {
  managerId,
  managerToken,
  operatorId,
  seedUsers,
  createUser,
  createInvitation,
} from './user-management-controller-test-fixtures'
describe('Resend User Invitation Controller [POST /users/:userId/invitation/resend]', () => {
  const auth = new SupabaseAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  const ids = OnboardingIdentifierProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth, {
      onboardingToken: tokens,
      onboardingIdentifier: ids,
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
  it('resends the invitation and extends its expiry', async () => {
    const before = await fixture
      .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
      .findByUserId(operatorId)
    if (!before) return
    const response = await request(fixture.app.getHttpServer())
      .post(`/users/${operatorId}/invitation/resend`)
      .set('Authorization', `Bearer ${managerToken}`)
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      user: { id: operatorId, status: UserStatus.Pending },
    })
    const after = await fixture
      .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
      .findByUserId(operatorId)
    expect(after?.revision).toBe(1)
    expect(after?.expiresAt.getTime()).toBeGreaterThan(before.expiresAt.getTime())
    expect(response.body.auditRecords).toHaveLength(1)
  })
})
