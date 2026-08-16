import type { Establishment, User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'

const establishmentId = '21000000-0000-0000-0000-000000000001'
const managerId = '21000000-0000-0000-0000-000000000002'
const operatorId = '21000000-0000-0000-0000-000000000003'
const managerToken = 'list-manager-token'

function createEstablishment(): Establishment {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: establishmentId,
    name: 'List Establishment',
    status: EstablishmentStatus.Active,
    createdAt: now,
    updatedAt: now,
  }
}

function createUser(id: string, name: string, profile: UserProfile): User {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id,
    establishmentId,
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
    profile,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
  }
}

describe('List Users Controller [GET /users]', () => {
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
        createUser(managerId, 'Manager One', UserProfile.Manager),
        createUser(operatorId, 'Operator One', UserProfile.Operator),
      ],
      registrationAttempts: [],
    })
    auth.setUser(managerToken, {
      id: managerId,
      email: 'manager.one@example.com',
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns tenant-scoped, filtered user summaries', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/users?profile=operator&page=1&pageSize=20')
      .set('Authorization', `Bearer ${managerToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      items: [
        {
          id: operatorId,
          name: 'Operator One',
          profile: UserProfile.Operator,
          status: UserStatus.Active,
        },
      ],
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(operatorId),
    ).resolves.toMatchObject({ establishmentId })
  })

  it('does not include the authenticated Manager in the management list', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/users?page=1&pageSize=20')
      .set('Authorization', `Bearer ${managerToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      total: 1,
      items: [{ id: operatorId }],
    })
  })
})
