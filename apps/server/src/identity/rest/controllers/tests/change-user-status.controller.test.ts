import type { UsersRepository } from '@scoops/core/identity/interfaces'
import {
  UserInactivatedEvent,
  UserReactivatedEvent,
} from '@scoops/core/identity/domain/events'
import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

async function findEvents(fixture: IdentityModuleFixture, eventName: string) {
  return fixture
    .get(DrizzleClient)
    .requireDatabase()
    .select()
    .from(eventModel)
    .where(eq(eventModel.eventName, eventName))
}
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
    const inactivatedEvents = await findEvents(fixture, UserInactivatedEvent._NAME)
    expect(inactivatedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
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
    const reactivatedEvents = await findEvents(fixture, UserReactivatedEvent._NAME)
    expect(reactivatedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
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
    const eventCount = inactivatedEvents.length + reactivatedEvents.length
    const noOp = await request(fixture.app.getHttpServer())
      .patch(url)
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ status: UserStatus.Active })
    expect(noOp.status).toBe(200)
    const eventsAfterNoOp = await Promise.all([
      findEvents(fixture, UserInactivatedEvent._NAME),
      findEvents(fixture, UserReactivatedEvent._NAME),
    ])
    expect(eventsAfterNoOp[0].length + eventsAfterNoOp[1].length).toBe(eventCount)
  })
})
