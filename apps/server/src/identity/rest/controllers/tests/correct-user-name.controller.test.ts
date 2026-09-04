import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
describe('Correct User Name Controller [PATCH /users/:userId/name]', () => {
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
  it('changes and persists the target user name with audit history', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${operatorId}/name`)
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ name: '  Updated Operator  ' })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      user: { id: operatorId, name: 'Updated Operator' },
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ name: 'Updated Operator' })
    expect(response.body.auditRecords).toHaveLength(1)
  })
})
