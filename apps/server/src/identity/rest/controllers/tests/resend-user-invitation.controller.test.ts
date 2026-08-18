import type { RegistrationAttemptsRepository } from '@scoops/core/identity/interfaces'
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
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
describe('Resend User Invitation Controller [POST /users/:userId/invitation/resend]', () => {
  const { establishmentId, managerId, managerToken, operatorId } =
    IdentityModuleFixture.userManagement
  const supabaseAuth = new SupabaseAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  const ids = OnboardingIdentifierProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(supabaseAuth, {
      onboardingToken: tokens,
      onboardingIdentifier: ids,
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
          status: 'pending',
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
