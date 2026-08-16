import { UserProfile } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import {
  createEstablishment,
  createUser,
  establishmentId,
  managerId,
  managerToken,
  operatorId,
  operatorToken,
} from './profile-settings-controller-test-fixtures'

describe('Get Establishment Settings Controller [GET /establishments/current]', () => {
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
      users: [
        createUser(managerId, UserProfile.Manager),
        createUser(operatorId, UserProfile.Operator),
      ],
      registrationAttempts: [],
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns the safe establishment projection for a Manager', async () => {
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })

    const response = await request(fixture.app.getHttpServer())
      .get('/establishments/current')
      .set('Authorization', `Bearer ${managerToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      establishment: {
        id: establishmentId,
        name: 'Scoops Centro',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      responsibleManager: { id: managerId, name: 'Maria Manager' },
    })
  })

  it('rejects an Operator before returning settings', async () => {
    auth.setUser(operatorToken, { id: operatorId, email: `${operatorId}@example.com` })

    const response = await request(fixture.app.getHttpServer())
      .get('/establishments/current')
      .set('Authorization', `Bearer ${operatorToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ title: 'Access denied' })
  })
})
