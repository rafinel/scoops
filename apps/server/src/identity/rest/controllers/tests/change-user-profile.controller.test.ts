import type { Establishment, User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { TestAuthIdentityProvider } from '@/identity/fixtures/test-auth-identity-provider'

const establishmentId = '20000000-0000-0000-0000-000000000001'
const otherEstablishmentId = '20000000-0000-0000-0000-000000000002'
const managerId = '00000000-0000-0000-0000-000000000010'
const secondManagerId = '00000000-0000-0000-0000-000000000011'
const operatorId = '00000000-0000-0000-0000-000000000012'
const otherTenantUserId = '00000000-0000-0000-0000-000000000013'
const managerToken = 'manager-token'
const operatorToken = 'operator-token'

function createEstablishment(id: string) {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id,
    name: `Establishment ${id}`,
    status: EstablishmentStatus.Active,
    createdAt: now,
    updatedAt: now,
  } satisfies Establishment
}

function createUser(
  id: string,
  establishment: string,
  profile: UserProfile,
  overrides: Partial<User> = {},
) {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id,
    establishmentId: establishment,
    name: `User ${id}`,
    email: `${id}@example.com`,
    profile,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } satisfies User
}

describe('Change User Profile Controller [PATCH /users/:userId/profile]', () => {
  const authIdentityProvider = new TestAuthIdentityProvider()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(authIdentityProvider)
  })

  beforeEach(async () => {
    authIdentityProvider.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  async function seedUsers(users: User[]) {
    await fixture.seeder.run({
      establishments: [
        createEstablishment(establishmentId),
        createEstablishment(otherEstablishmentId),
      ],
      users,
      registrationAttempts: [],
    })
  }

  function authenticateManager() {
    authIdentityProvider.setUser(managerToken, {
      id: managerId,
      email: 'manager@example.com',
    })
  }

  it('rejects an Operator before the target is looked up', async () => {
    const operator = createUser(operatorId, establishmentId, UserProfile.Operator)
    const target = createUser(managerId, establishmentId, UserProfile.Manager)
    await seedUsers([operator, target])
    authIdentityProvider.setUser(operatorToken, {
      id: operator.id,
      email: operator.email,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${target.id}/profile`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ profile: UserProfile.Operator })

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({
      title: 'Access denied',
      message: 'Access denied.',
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(target.id),
    ).resolves.toMatchObject({ profile: UserProfile.Manager })
  })

  it('rejects unknown body fields and invalid profiles', async () => {
    const manager = createUser(managerId, establishmentId, UserProfile.Manager)
    const target = createUser(operatorId, establishmentId, UserProfile.Operator)
    await seedUsers([manager, target])
    authenticateManager()

    const [unknownField, invalidProfile] = await Promise.all([
      request(fixture.app.getHttpServer())
        .patch(`/users/${target.id}/profile`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ profile: UserProfile.Manager, actor: manager.id }),
      request(fixture.app.getHttpServer())
        .patch(`/users/${target.id}/profile`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ profile: 'administrator' }),
    ])

    expect(unknownField.status).toBe(422)
    expect(invalidProfile.status).toBe(422)
    expect(unknownField.body).toMatchObject({
      title: 'Invalid request',
      message: 'Invalid request.',
    })
  })

  it('hides cross-tenant targets and does not mutate them', async () => {
    const manager = createUser(managerId, establishmentId, UserProfile.Manager)
    const target = createUser(
      otherTenantUserId,
      otherEstablishmentId,
      UserProfile.Operator,
    )
    await seedUsers([manager, target])
    authenticateManager()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${target.id}/profile`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ profile: UserProfile.Manager })

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      title: 'Erro de Não Encontrado',
      message: 'User not found',
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(target.id),
    ).resolves.toMatchObject({ profile: UserProfile.Operator })
  })

  it('rejects self-change and demotion of the last active Manager', async () => {
    const manager = createUser(managerId, establishmentId, UserProfile.Manager)
    const target = createUser(operatorId, establishmentId, UserProfile.Operator)
    await seedUsers([manager, target])
    authenticateManager()

    const [selfChange, lastManager] = await Promise.all([
      request(fixture.app.getHttpServer())
        .patch(`/users/${manager.id}/profile`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ profile: UserProfile.Operator }),
      request(fixture.app.getHttpServer())
        .patch(`/users/${target.id}/profile`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ profile: UserProfile.Manager }),
    ])

    expect(selfChange.status).toBe(409)
    expect(lastManager.status).toBe(200)

    const demotion = await request(fixture.app.getHttpServer())
      .patch(`/users/${target.id}/profile`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ profile: UserProfile.Operator })

    expect(demotion.status).toBe(200)
  })

  it('persists a same-tenant profile change for a Manager', async () => {
    const manager = createUser(managerId, establishmentId, UserProfile.Manager)
    const target = createUser(operatorId, establishmentId, UserProfile.Operator)
    await seedUsers([manager, target])
    authenticateManager()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${target.id}/profile`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ profile: UserProfile.Manager })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: target.id,
      establishmentId,
      profile: UserProfile.Manager,
      status: UserStatus.Active,
    })
    await expect(
      fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users).findById(target.id),
    ).resolves.toMatchObject({ profile: UserProfile.Manager })
  })

  it('serializes concurrent Manager demotions without removing every Manager', async () => {
    const firstManager = createUser(managerId, establishmentId, UserProfile.Manager)
    const secondManager = createUser(
      secondManagerId,
      establishmentId,
      UserProfile.Manager,
    )
    await seedUsers([firstManager, secondManager])
    authenticateManager()
    authIdentityProvider.setUser('second-manager-token', {
      id: secondManager.id,
      email: secondManager.email,
    })

    const [firstResponse, secondResponse] = await Promise.all([
      request(fixture.app.getHttpServer())
        .patch(`/users/${secondManager.id}/profile`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ profile: UserProfile.Operator }),
      request(fixture.app.getHttpServer())
        .patch(`/users/${firstManager.id}/profile`)
        .set('Authorization', 'Bearer second-manager-token')
        .send({ profile: UserProfile.Operator }),
    ])

    expect([firstResponse.status, secondResponse.status].sort()).toEqual([200, 409])

    const usersRepository = fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
    const [persistedFirst, persistedSecond] = await Promise.all([
      usersRepository.findById(firstManager.id),
      usersRepository.findById(secondManager.id),
    ])
    expect(
      [persistedFirst, persistedSecond].filter(
        (user) =>
          user?.status === UserStatus.Active && user.profile === UserProfile.Manager,
      ),
    ).toHaveLength(1)
  })

  it('maps provider availability failures to 503 before the use case', async () => {
    const manager = createUser(managerId, establishmentId, UserProfile.Manager)
    const target = createUser(operatorId, establishmentId, UserProfile.Operator)
    await seedUsers([manager, target])
    authIdentityProvider.setUnavailable(true)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${target.id}/profile`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ profile: UserProfile.Manager })

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({ title: 'Authentication service unavailable' })
  })
})
