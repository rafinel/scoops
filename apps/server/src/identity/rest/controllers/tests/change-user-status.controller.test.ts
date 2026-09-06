import type { UsersRepository } from '@scoops/core/identity/interfaces'
import {
  UserInactivatedEvent,
  UserReactivatedEvent,
} from '@scoops/core/identity/domain/events'
import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestMock } from '@/shared/messaging/inngest/inngest-mock'
describe('Change User Status Controller [PATCH /users/:userId/status]', () => {
  const { establishmentId, managerId, managerToken, operatorId } =
    IdentityModuleFixture.userManagement
  const betterAuthFixture = new BetterAuthFixture()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture)
  })
  beforeEach(async () => {
    await betterAuthFixture.clear()
    await fixture.resetDatabase()
    await fixture.seedUsers([
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
        name: 'Operator',
        email: `${operatorId}@example.com`,
        profile: UserProfile.Operator,
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
  it('inactivates and reactivates a user through HTTP', async () => {
    const url = `/users/${operatorId}/status`
    const inactive = await request(fixture.app.getHttpServer())
      .patch(url)
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ status: UserStatus.Inactive })
    expect(inactive.status).toBe(200)
    expect(inactive.body.user.status).toBe(UserStatus.Inactive)
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ status: UserStatus.Inactive })
    const broker = fixture.get(InngestBroker) as unknown as InngestMock
    expect(broker.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: UserInactivatedEvent._NAME,
          payload: expect.objectContaining({
            userId: operatorId,
            userName: 'Operator',
            actorUserId: managerId,
            previousStatus: UserStatus.Active,
            status: UserStatus.Inactive,
          }),
        }),
      ]),
    )
    const active = await request(fixture.app.getHttpServer())
      .patch(url)
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ status: UserStatus.Active })
    expect(active.status).toBe(200)
    expect(active.body.user.status).toBe(UserStatus.Active)
    expect(active.body.auditRecords).toHaveLength(2)
    expect(broker.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: UserReactivatedEvent._NAME,
          payload: expect.objectContaining({
            userId: operatorId,
            userName: 'Operator',
            actorUserId: managerId,
            previousStatus: UserStatus.Inactive,
            status: UserStatus.Active,
            profile: UserProfile.Operator,
          }),
        }),
      ]),
    )
    const eventCount = broker.events.filter(
      (event) =>
        event.name === UserInactivatedEvent._NAME ||
        event.name === UserReactivatedEvent._NAME,
    ).length
    const noOp = await request(fixture.app.getHttpServer())
      .patch(url)
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ status: UserStatus.Active })
    expect(noOp.status).toBe(200)
    expect(
      broker.events.filter(
        (event) =>
          event.name === UserInactivatedEvent._NAME ||
          event.name === UserReactivatedEvent._NAME,
      ),
    ).toHaveLength(eventCount)
  })
})
