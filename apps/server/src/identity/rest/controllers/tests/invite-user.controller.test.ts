import type {
  RegistrationAttemptsRepository,
  UserAuditRecordsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import { UserInvitationPreparedEvent } from '@scoops/core/identity/domain/events'
import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModule } from '@/identity/identity.module'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SharedModule } from '@/shared/shared.module'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
describe('Invite User Controller [POST /users/invitations]', () => {
  const { establishmentId, managerId, managerToken } =
    IdentityModuleFixture.userManagement
  const betterAuthFixture = new BetterAuthFixture()
  const tokens = OnboardingTokenProviderFaker.fake()
  const identifiers = OnboardingIdentifierProviderFaker.fake()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture, {
      onboardingToken: tokens,
      onboardingIdentifier: identifiers,
    })
  })
  beforeEach(async () => {
    await betterAuthFixture.clear()
    betterAuthFixture.getCalls().inviteIdentity.length = 0
    await fixture.resetDatabase()
    await fixture.seedUsers([
      UserFaker.fake({
        id: managerId,
        establishmentId,
        name: 'Manager',
        email: `${managerId}@example.com`,
        profile: UserProfile.Manager,
      }),
    ])
    betterAuthFixture.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })
  })
  afterAll(async () => {
    await fixture?.close()
  })
  it('creates a pending user, invitation attempt, and audit record', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/users/invitations')
      .set('Cookie', betterAuthFixture.cookieFor())
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

  it('uses the real cookie-backed Better Auth consumer before creating the invitation event', async () => {
    const realFixture = await RestFixture.register({
      imports: [SharedModule, IdentityModule, InngestModule.forRoot({ functions: [] })],
    })

    try {
      const app = realFixture.app.getHttpServer()
      const registration = await request(app)
        .post('/registration-attempts/onboarding')
        .send({
          establishmentName: 'Invitation Gelato',
          managerName: 'Invitation Manager',
          email: 'real-manager@example.com',
          password: 'password123',
        })
      expect(registration.status).toBe(201)

      const confirmation = await request(app)
        .post('/registration-attempts/onboarding/confirm')
        .send({ confirmationToken: registration.body.continuationToken })
      expect(confirmation.status).toBe(204)
      const managerCookie = confirmation.headers['set-cookie']?.[0]?.split(';', 1)[0]
      expect(managerCookie).toMatch(/^scoops\.session_token=.+$/)

      const invitation = await request(app)
        .post('/users/invitations')
        .set('Cookie', managerCookie ?? '')
        .send({
          name: 'Real Operator',
          email: 'REAL-OPERATOR@example.com',
          profile: UserProfile.Operator,
        })

      expect(invitation.status).toBe(201)
      expect(invitation.body.user).toMatchObject({
        email: 'real-operator@example.com',
        name: 'Real Operator',
        status: UserStatus.Pending,
      })

      const database = realFixture.app.get(DrizzleClient).requireDatabase()
      const events = await database.select().from(eventModel)
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventName: UserInvitationPreparedEvent._NAME,
            payload: expect.objectContaining({
              email: 'real-operator@example.com',
              name: 'Real Operator',
              operation: 'initial',
            }),
          }),
        ]),
      )

      const invitationEvent = events.find(
        (event) =>
          event.eventName === UserInvitationPreparedEvent._NAME &&
          (event.payload as { email?: string }).email === 'real-operator@example.com',
      )
      expect(invitationEvent).toBeDefined()
      if (!invitationEvent) throw new Error('Expected the invitation outbox event')
      const confirmationToken = new URL(
        invitationEvent.payload.actionUrl as string,
      ).searchParams.get('confirmationToken')
      const accepted = await request(app)
        .post('/registration-attempts/invitation/accept')
        .send({ confirmationToken, password: 'operator-password-123' })

      expect(accepted.status).toBe(204)
      expect(accepted.headers['set-cookie']?.[0]).toMatch(
        /^scoops\.session_token=.+; Path=\/; HttpOnly; SameSite=Lax$/,
      )
      expect(invitation.body.user.status).toBe(UserStatus.Pending)
    } finally {
      await realFixture.close()
    }
  })
})
