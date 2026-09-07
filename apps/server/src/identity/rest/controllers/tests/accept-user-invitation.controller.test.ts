import type {
  RegistrationAttemptsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import { UserInvitationAcceptedEvent } from '@scoops/core/identity/domain/events'
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
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'

async function findEvents(fixture: IdentityModuleFixture, eventName: string) {
  return fixture
    .get(DrizzleClient)
    .requireDatabase()
    .select()
    .from(eventModel)
    .where(eq(eventModel.eventName, eventName))
}
describe('Accept User Invitation Controller [POST /registration-attempts/invitation/accept]', () => {
  const { establishmentId, invitationToken, managerId, managerToken, operatorId } =
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
          status: RegistrationAttemptStatus.Pending,
          tokenHash: tokens.hash('u'.repeat(43)),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ],
    )
    betterAuthFixture.setUser('invite-session', {
      id: operatorId,
      email: 'pending@example.com',
    })
  })
  afterAll(async () => {
    await fixture?.close()
  })
  it('activates the invited user after a valid pending session', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/invitation/accept')
      .set('Cookie', betterAuthFixture.cookieFor('invite-session'))
      .send({ confirmationToken: invitationToken, password: 'password123' })
    expect(response.status).toBe(204)
    expect(response.headers['set-cookie']).toEqual([
      expect.stringContaining(`scoops.session_token=fixture-session-${operatorId}`),
    ])
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ status: UserStatus.Active })
    await expect(
      fixture
        .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
        .findByUserId(operatorId),
    ).resolves.toMatchObject({ status: RegistrationAttemptStatus.Confirmed })
    const events = await findEvents(fixture, UserInvitationAcceptedEvent._NAME)
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            userId: operatorId,
            establishmentId,
            userName: 'Pending Operator',
            profile: UserProfile.Operator,
          }),
        }),
      ]),
    )
  })

  it('rolls back activation and invitation confirmation when event publication fails', async () => {
    const addSpy = vi
      .spyOn(DrizzleEventsRepository.prototype, 'add')
      .mockRejectedValueOnce(new Error('Injected identity publication failure.'))

    try {
      const response = await request(fixture.app.getHttpServer())
        .post('/registration-attempts/invitation/accept')
        .set('Cookie', betterAuthFixture.cookieFor('invite-session'))
        .send({ confirmationToken: invitationToken, password: 'password123' })
      expect(response.status).toBe(500)
      await expect(
        fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
      ).resolves.toMatchObject({ status: UserStatus.Pending })
      await expect(
        fixture
          .get<RegistrationAttemptsRepository>(IDENTITY_REPOSITORIES.registrationAttempts)
          .findByUserId(operatorId),
      ).resolves.toMatchObject({ status: RegistrationAttemptStatus.Pending })
    } finally {
      addSpy.mockRestore()
    }
  })

  it('serializes an accept-vs-cancel race so only one transition wins', async () => {
    betterAuthFixture.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })
    const [accept, cancel] = await Promise.all([
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/invitation/accept')
        .set('Cookie', betterAuthFixture.cookieFor('invite-session'))
        .send({ confirmationToken: invitationToken, password: 'password123' }),
      request(fixture.app.getHttpServer())
        .delete(`/users/${operatorId}/invitation`)
        .set('Cookie', betterAuthFixture.cookieFor()),
    ])

    expect([accept.status, cancel.status]).toContain(204)
    expect(
      [accept.status, cancel.status].every((status) => [204, 404, 409].includes(status)),
    ).toBe(true)
  })
})
