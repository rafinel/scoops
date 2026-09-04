import type { EstablishmentAuditRecordsRepository } from '@scoops/core/identity/interfaces'
import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'

describe('Change Establishment Name Controller [PATCH /establishments/current/name]', () => {
  const {
    establishmentId,
    managerId,
    managerToken,
    operatorId,
    operatorToken,
    secondEstablishmentId,
    secondManagerId,
    secondManagerToken,
  } = IdentityModuleFixture.profileSettings
  const betterAuthFixture = new BetterAuthFixture()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture)
  })

  beforeEach(async () => {
    await betterAuthFixture.clear()
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

  it('changes the name, persists it, and records an audit row', async () => {
    betterAuthFixture.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch('/establishments/current/name')
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ name: '  Scoops Jardins  ' })

    expect(response.status).toBe(200)
    expect(response.body.establishment.name).toBe('Scoops Jardins')

    const settings = await request(fixture.app.getHttpServer())
      .get('/establishments/current')
      .set('Cookie', betterAuthFixture.cookieFor())
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
    betterAuthFixture.setUser(operatorToken, {
      id: operatorId,
      email: `${operatorId}@example.com`,
    })
    const forbidden = await request(fixture.app.getHttpServer())
      .patch('/establishments/current/name')
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ name: 'Nope' })
    expect(forbidden.status).toBe(403)

    betterAuthFixture.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })
    const invalid = await request(fixture.app.getHttpServer())
      .patch('/establishments/current/name')
      .set('Cookie', betterAuthFixture.cookieFor())
      .send({ name: '' })
    expect(invalid.status).toBe(422)
  })

  it('keeps concurrent updates atomic and isolated by establishment', async () => {
    await fixture.seeder.run({
      establishments: [
        EstablishmentFaker.fake({
          id: secondEstablishmentId,
          name: 'Outra Sorveteria',
        }),
      ],
      users: [
        UserFaker.fake({
          id: secondManagerId,
          establishmentId: secondEstablishmentId,
          name: 'Second Manager',
          email: `${secondManagerId}@example.com`,
          profile: UserProfile.Manager,
        }),
      ],
      registrationAttempts: [],
    })

    betterAuthFixture.setUser(managerToken, {
      id: managerId,
      email: `${managerId}@example.com`,
    })
    const [first, second] = await Promise.all([
      request(fixture.app.getHttpServer())
        .patch('/establishments/current/name')
        .set('Cookie', betterAuthFixture.cookieFor())
        .send({ name: 'Concurrent A' }),
      request(fixture.app.getHttpServer())
        .patch('/establishments/current/name')
        .set('Cookie', betterAuthFixture.cookieFor())
        .send({ name: 'Concurrent B' }),
    ])

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)

    betterAuthFixture.setUser(secondManagerToken, {
      id: secondManagerId,
      email: `${secondManagerId}@example.com`,
    })
    const isolated = await request(fixture.app.getHttpServer())
      .get('/establishments/current')
      .set('Cookie', betterAuthFixture.cookieFor())
    expect(isolated.status).toBe(200)
    expect(isolated.body.establishment.name).toBe('Outra Sorveteria')

    const records = await fixture
      .get<EstablishmentAuditRecordsRepository>(
        IDENTITY_REPOSITORIES.establishmentAuditRecords,
      )
      .findManyByEstablishment(establishmentId)
    expect(records).toHaveLength(2)
  })
})
