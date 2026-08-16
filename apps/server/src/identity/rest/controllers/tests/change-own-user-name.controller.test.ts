import { UserProfile } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import {
  createEstablishment,
  createUser,
  managerId,
  managerToken,
} from './profile-settings-controller-test-fixtures'

describe('Change Own User Name Controller [PATCH /auth/session/name]', () => {
  const auth = new SupabaseAuthFixture()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth)
  })

  beforeEach(async () => {
    auth.clear()
    await fixture.resetDatabase()
    await fixture.seeder.run({
      establishments: [createEstablishment()],
      users: [createUser(managerId, UserProfile.Manager)],
      registrationAttempts: [],
    })
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('trims and persists the authenticated user name', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/auth/session/name')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: '  Maria Scoops  ' })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: managerId, name: 'Maria Scoops' })

    const session = await request(fixture.app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(session.body.name).toBe('Maria Scoops')
  })

  it('rejects unknown fields and blank names', async () => {
    const [unknownField, blank] = await Promise.all([
      request(fixture.app.getHttpServer())
        .patch('/auth/session/name')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Maria', actor: managerId }),
      request(fixture.app.getHttpServer())
        .patch('/auth/session/name')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: '   ' }),
    ])

    expect(unknownField.status).toBe(422)
    expect(blank.status).toBe(422)
  })
})
