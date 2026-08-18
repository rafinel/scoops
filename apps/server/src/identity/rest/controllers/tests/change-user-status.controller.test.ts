import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
describe('Change User Status Controller [PATCH /users/:userId/status]', () => {
  const { establishmentId, managerId, managerToken, operatorId } =
    IdentityModuleFixture.userManagement
  const supabaseAuth = new SupabaseAuthFixture()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(supabaseAuth)
  })
  beforeEach(async () => {
    await supabaseAuth.clear()
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
    supabaseAuth.setUser(managerToken, {
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
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: UserStatus.Inactive })
    expect(inactive.status).toBe(200)
    expect(inactive.body.user.status).toBe(UserStatus.Inactive)
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ status: UserStatus.Inactive })
    const active = await request(fixture.app.getHttpServer())
      .patch(url)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: UserStatus.Active })
    expect(active.status).toBe(200)
    expect(active.body.user.status).toBe(UserStatus.Active)
    expect(active.body.auditRecords).toHaveLength(2)
  })
})
