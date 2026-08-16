import type { Establishment, User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import type {
  EstablishmentsRepository,
  UsersRepository,
} from '@scoops/core/identity/interfaces'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'
})

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'

const managerId = '00000000-0000-0000-0000-000000000001'
const establishmentId = '10000000-0000-0000-0000-000000000001'
const activeToken = 'active-token'

function createActiveEstablishment() {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id: establishmentId,
    name: 'Active Establishment',
    status: EstablishmentStatus.Active,
    createdAt: now,
    updatedAt: now,
  } satisfies Establishment
}

function createActiveManager(overrides: Partial<User> = {}) {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id: managerId,
    establishmentId,
    name: 'Active Manager',
    email: 'manager@example.com',
    profile: UserProfile.Manager,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } satisfies User
}

describe('Get Auth Session Controller [GET /auth/session]', () => {
  const auth = new SupabaseAuthFixture()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth)
  })

  beforeEach(async () => {
    auth.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('rejects a missing or invalid authorization header neutrally', async () => {
    const app = fixture.app.getHttpServer()

    const [missing, invalid] = await Promise.all([
      request(app).get('/auth/session'),
      request(app).get('/auth/session').set('Authorization', 'Basic token'),
    ])

    expect(missing.status).toBe(401)
    expect(invalid.status).toBe(401)
    expect(missing.body).toMatchObject({
      title: 'Authentication required',
      message: 'Authentication required.',
    })
    expect(invalid.body).toMatchObject({
      title: 'Authentication required',
      message: 'Authentication required.',
    })
  })

  it('rejects a valid provider subject without active local access neutrally', async () => {
    const user = createActiveManager()
    const establishmentsRepository = fixture.get<EstablishmentsRepository>(
      IDENTITY_REPOSITORIES.establishments,
    )
    const usersRepository = fixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)

    auth.setUser(activeToken, { id: user.id, email: user.email })

    const response = await request(fixture.app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', `Bearer ${activeToken}`)

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({
      title: 'Authentication required',
      message: 'Authentication required.',
    })
    await expect(
      establishmentsRepository.findById(establishmentId),
    ).resolves.toBeUndefined()
    await expect(usersRepository.findByProviderSubject(user.id)).resolves.toBeUndefined()
  })

  it('returns only the server-derived safe account projection', async () => {
    const establishment = createActiveEstablishment()
    const user = createActiveManager()

    await fixture.seeder.run({
      establishments: [establishment],
      users: [user],
      registrationAttempts: [],
    })
    auth.setUser(activeToken, { id: user.id, email: user.email })

    const response = await request(fixture.app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', `Bearer ${activeToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: user.id,
      establishmentId: user.establishmentId,
      name: user.name,
      email: user.email,
      profile: user.profile,
    })
  })

  it('rejects inactive local access without disclosing its state', async () => {
    const establishment = createActiveEstablishment()
    const user = createActiveManager({ status: UserStatus.Inactive })

    await fixture.seeder.run({
      establishments: [establishment],
      users: [user],
      registrationAttempts: [],
    })
    auth.setUser(activeToken, { id: user.id, email: user.email })

    const response = await request(fixture.app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', `Bearer ${activeToken}`)

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ title: 'Authentication required' })
  })

  it('maps provider availability failures to a retryable response', async () => {
    auth.setUnavailable(true)

    const response = await request(fixture.app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', `Bearer ${activeToken}`)

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({
      title: 'Authentication service unavailable',
      message: 'Try again later.',
    })
  })
})
