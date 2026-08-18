import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
describe('Get User Details Controller [GET /users/:userId]', () => {
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
  it('returns user details and audit history for a Manager', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get(`/users/${operatorId}`)
      .set('Authorization', `Bearer ${managerToken}`)
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      user: { id: operatorId, name: 'Operator', profile: UserProfile.Operator },
      auditRecords: [],
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ name: 'Operator' })
  })

  it('does not expose the authenticated Manager own details', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get(`/users/${managerId}`)
      .set('Authorization', `Bearer ${managerToken}`)

    expect(response.status).toBe(404)
  })
})
