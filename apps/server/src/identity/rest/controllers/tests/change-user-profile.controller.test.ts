import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import type { User } from '@scoops/core/identity/domain/entities'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'

const establishmentId = '20000000-0000-0000-0000-000000000001'
const otherEstablishmentId = '20000000-0000-0000-0000-000000000002'
const managerId = '00000000-0000-0000-0000-000000000010'
const secondManagerId = '00000000-0000-0000-0000-000000000011'
const operatorId = '00000000-0000-0000-0000-000000000012'
const otherTenantUserId = '00000000-0000-0000-0000-000000000013'
const managerToken = 'manager-token'
const operatorToken = 'operator-token'

describe('Change User Profile Controller [PATCH /users/:userId/profile]', () => {
  const supabaseAuth = new SupabaseAuthFixture()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(supabaseAuth)
  })

  beforeEach(async () => {
    await supabaseAuth.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  async function seedUsers(users: User[]) {
    await fixture.seeder.run({
      establishments: [
        EstablishmentFaker.fake({ id: establishmentId }),
        EstablishmentFaker.fake({ id: otherEstablishmentId }),
      ],
      users,
      registrationAttempts: [],
    })
  }

  function authenticateManager() {
    supabaseAuth.setUser(managerToken, {
      id: managerId,
      email: 'manager@example.com',
    })
  }

  it('rejects an Operator before the target is looked up', async () => {
    const operator = UserFaker.fake({
      id: operatorId,
      establishmentId,
      name: `User ${operatorId}`,
      email: `${operatorId}@example.com`,
      profile: UserProfile.Operator,
    })
    const target = UserFaker.fake({
      id: managerId,
      establishmentId,
      name: `User ${managerId}`,
      email: `${managerId}@example.com`,
      profile: UserProfile.Manager,
    })
    await seedUsers([operator, target])
    supabaseAuth.setUser(operatorToken, {
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
    const manager = UserFaker.fake({
      id: managerId,
      establishmentId,
      name: `User ${managerId}`,
      email: `${managerId}@example.com`,
      profile: UserProfile.Manager,
    })
    const target = UserFaker.fake({
      id: operatorId,
      establishmentId,
      name: `User ${operatorId}`,
      email: `${operatorId}@example.com`,
      profile: UserProfile.Operator,
    })
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
    const manager = UserFaker.fake({
      id: managerId,
      establishmentId,
      name: `User ${managerId}`,
      email: `${managerId}@example.com`,
      profile: UserProfile.Manager,
    })
    const target = UserFaker.fake({
      id: otherTenantUserId,
      establishmentId: otherEstablishmentId,
      name: `User ${otherTenantUserId}`,
      email: `${otherTenantUserId}@example.com`,
      profile: UserProfile.Operator,
    })
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
    const manager = UserFaker.fake({
      id: managerId,
      establishmentId,
      name: `User ${managerId}`,
      email: `${managerId}@example.com`,
      profile: UserProfile.Manager,
    })
    const target = UserFaker.fake({
      id: operatorId,
      establishmentId,
      name: `User ${operatorId}`,
      email: `${operatorId}@example.com`,
      profile: UserProfile.Operator,
    })
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
    const manager = UserFaker.fake({
      id: managerId,
      establishmentId,
      name: `User ${managerId}`,
      email: `${managerId}@example.com`,
      profile: UserProfile.Manager,
    })
    const target = UserFaker.fake({
      id: operatorId,
      establishmentId,
      name: `User ${operatorId}`,
      email: `${operatorId}@example.com`,
      profile: UserProfile.Operator,
    })
    await seedUsers([manager, target])
    authenticateManager()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/users/${target.id}/profile`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ profile: UserProfile.Manager })

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({
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
    const firstManager = UserFaker.fake({
      id: managerId,
      establishmentId,
      name: `User ${managerId}`,
      email: `${managerId}@example.com`,
      profile: UserProfile.Manager,
    })
    const secondManager = UserFaker.fake({
      id: secondManagerId,
      establishmentId,
      name: `User ${secondManagerId}`,
      email: `${secondManagerId}@example.com`,
      profile: UserProfile.Manager,
    })
    await seedUsers([firstManager, secondManager])
    authenticateManager()
    supabaseAuth.setUser('second-manager-token', {
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

    const statuses = [firstResponse.status, secondResponse.status].sort()
    expect(statuses[0]).toBe(200)
    expect([403, 409]).toContain(statuses[1])

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
})
