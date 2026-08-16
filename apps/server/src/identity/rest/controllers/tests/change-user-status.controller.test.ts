import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import {
  managerId,
  managerToken,
  operatorId,
  seedUsers,
  createUser,
} from './user-management-controller-test-fixtures'
describe('Change User Status Controller [PATCH /users/:userId/status]', () => {
  const auth = new SupabaseAuthFixture()
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth)
  })
  beforeEach(async () => {
    auth.clear()
    await fixture.resetDatabase()
    await seedUsers(fixture, [
      createUser(managerId, 'Manager', UserProfile.Manager),
      createUser(operatorId, 'Operator', UserProfile.Operator),
    ])
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })
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
