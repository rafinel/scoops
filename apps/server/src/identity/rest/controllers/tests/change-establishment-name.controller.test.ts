import type { EstablishmentAuditRecordsRepository } from '@scoops/core/identity/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
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

describe('Change Establishment Name Controller [PATCH /establishments/current/name]', () => {
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

  it('changes the name, persists it, and records an audit row', async () => {
    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })

    const response = await request(fixture.app.getHttpServer())
      .patch('/establishments/current/name')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: '  Scoops Jardins  ' })

    expect(response.status).toBe(200)
    expect(response.body.establishment.name).toBe('Scoops Jardins')

    const settings = await request(fixture.app.getHttpServer())
      .get('/establishments/current')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(settings.body.establishment.name).toBe('Scoops Jardins')

    const records = await fixture
      .get<EstablishmentAuditRecordsRepository>(
        IDENTITY_REPOSITORIES.establishmentAuditRecords,
      )
      .findManyByEstablishment(establishmentId)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      establishmentId,
      actorUserId: managerId,
      action: 'establishment-name-changed',
      affectedEstablishmentName: 'Scoops Jardins',
      previousValue: 'Scoops Centro',
      newValue: 'Scoops Jardins',
    })
  })

  it('rejects an Operator and invalid request bodies', async () => {
    auth.setUser(operatorToken, { id: operatorId, email: `${operatorId}@example.com` })
    const forbidden = await request(fixture.app.getHttpServer())
      .patch('/establishments/current/name')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ name: 'Nope' })
    expect(forbidden.status).toBe(403)

    auth.setUser(managerToken, { id: managerId, email: `${managerId}@example.com` })
    const invalid = await request(fixture.app.getHttpServer())
      .patch('/establishments/current/name')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: '' })
    expect(invalid.status).toBe(422)
  })
})
