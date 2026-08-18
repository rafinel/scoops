import { UserProfile } from '@scoops/core/identity/domain/structures'
import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'

describe('Get Establishment Settings Controller [GET /establishments/current]', () => {
  const { establishmentId, managerId, managerToken, operatorId, operatorToken } =
    IdentityModuleFixture.profileSettings
  const supabaseAuth = new SupabaseAuthFixture()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(supabaseAuth)
  })

  beforeEach(async () => {
    await supabaseAuth.clear()
    await fixture.resetDatabase()
    await fixture.seeder.run({
      establishments: [
        EstablishmentFaker.fake({ id: establishmentId, name: 'Scoops Centro' }),
      ],
      users: [
        UserFaker.fake({
          id: managerId,
          establishmentId,
          name: 'Maria Manager',
          email: `${managerId}@example.com`,
          profile: UserProfile.Manager,
        }),
        UserFaker.fake({
          id: operatorId,
          establishmentId,
          name: 'Otávio Operator',
          email: `${operatorId}@example.com`,
          profile: UserProfile.Operator,
        }),
      ],
      registrationAttempts: [],
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns the safe establishment projection for a Manager', async () => {
    supabaseAuth.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })

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
    supabaseAuth.setUser(operatorToken, {
      id: operatorId,
      email: `${operatorId}@example.com`,
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/establishments/current')
      .set('Authorization', `Bearer ${operatorToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ title: 'Access denied' })
  })
})
