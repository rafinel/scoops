import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'
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
describe('Correct User Name Controller [PATCH /users/:userId/name]', () => {
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
  it('changes and persists the target user name with audit history', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${operatorId}/name`)
      .set('Authorization', `Bearer ${managerToken}`)
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
