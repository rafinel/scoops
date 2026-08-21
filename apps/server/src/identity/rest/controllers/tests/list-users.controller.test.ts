import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'

const establishmentId = '21000000-0000-0000-0000-000000000001'
const managerId = '21000000-0000-0000-0000-000000000002'
const operatorId = '21000000-0000-0000-0000-000000000003'
const colleagueManagerId = '21000000-0000-0000-0000-000000000004'
const secondOperatorId = '21000000-0000-0000-0000-000000000005'
const foreignEstablishmentId = '22000000-0000-0000-0000-000000000001'
const foreignOperatorId = '22000000-0000-0000-0000-000000000002'
const managerToken = 'list-manager-token'

describe('List Users Controller [GET /users]', () => {
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
        EstablishmentFaker.fake({ id: establishmentId }),
        EstablishmentFaker.fake({ id: foreignEstablishmentId }),
      ],
      users: [
        UserFaker.fake({
          id: managerId,
          establishmentId,
          name: 'Manager One',
          email: 'manager.one@example.com',
          profile: UserProfile.Manager,
        }),
        UserFaker.fake({
          id: operatorId,
          establishmentId,
          name: 'Operator One',
          email: 'operator.one@example.com',
          profile: UserProfile.Operator,
        }),
        UserFaker.fake({
          id: colleagueManagerId,
          establishmentId,
          name: 'Manager Colleague',
          email: 'manager.colleague@example.com',
          profile: UserProfile.Manager,
        }),
        UserFaker.fake({
          id: secondOperatorId,
          establishmentId,
          name: 'Another Operator',
          email: 'another.operator@example.com',
          profile: UserProfile.Operator,
        }),
        UserFaker.fake({
          id: foreignOperatorId,
          establishmentId: foreignEstablishmentId,
          name: 'Foreign Operator',
          email: 'foreign.operator@example.com',
          profile: UserProfile.Operator,
        }),
      ],
      registrationAttempts: [],
    })
    supabaseAuth.setUser(managerToken, {
      id: managerId,
      email: 'manager.one@example.com',
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns tenant-scoped, filtered user summaries', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/users?search=Operator%20One&profile=operator&page=1&pageSize=20')
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
      summary: { total: 3, managers: 1, operators: 2 },
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
      total: 3,
      summary: { total: 3, managers: 1, operators: 2 },
    })
    expect(response.body.items.map((user: { id: string }) => user.id)).toEqual([
      secondOperatorId,
      colleagueManagerId,
      operatorId,
    ])
  })
})
