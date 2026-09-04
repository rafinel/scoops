import { UserFaker } from '@scoops/core/identity/domain/entities/fakers'
import { EstablishmentFaker } from '@scoops/core/identity/domain/entities/fakers'
import { PasswordRecoveryPreparedEvent } from '@scoops/core/identity/domain/events'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { IdentityModule } from '@/identity/identity.module'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SharedModule } from '@/shared/shared.module'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

describe('Reset Password Controller [POST /registration-attempts/password-reset]', () => {
  const userId = '33000000-0000-0000-0000-000000000001'
  const betterAuthFixture = new BetterAuthFixture()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture)
  })

  beforeEach(async () => {
    await betterAuthFixture.clear()
    await fixture.resetDatabase()
    await fixture.seedUsers([
      UserFaker.fake({
        id: userId,
        establishmentId: '33000000-0000-0000-0000-000000000002',
        email: 'reset@example.com',
        profile: UserProfile.Manager,
      }),
    ])
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('expires the current Better Auth session cookie after reset', async () => {
    betterAuthFixture.setUser('reset-session', { id: userId, email: 'reset@example.com' })
    const event = await betterAuthFixture.preparePasswordRecovery({
      providerSubject: userId,
      recoveryRedirectTo: 'http://localhost:4000/reset-password',
    })
    const token = new URL(event.payload.actionUrl).searchParams.get('token')

    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/password-reset')
      .set('Cookie', betterAuthFixture.cookieFor('reset-session'))
      .send({ token, password: 'new-password-123' })

    expect(response.status).toBe(204)
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('scoops.session_token=;'),
    )
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('Max-Age=0'),
    )
  })

  it('consumes a real recovery token, updates the credential and rejects its replay', async () => {
    const realFixture = await RestFixture.register({
      imports: [SharedModule, IdentityModule, InngestModule.forRoot({ functions: [] })],
    })

    try {
      const app = realFixture.app.getHttpServer()
      const userId = '83000000-0000-4000-8000-000000000001'
      const establishmentId = '83000000-0000-4000-8000-000000000002'
      await realFixture.app.get(IdentitySeeder).run({
        establishments: [
          EstablishmentFaker.fake({
            id: establishmentId,
            status: EstablishmentStatus.Active,
          }),
        ],
        users: [
          UserFaker.fake({
            id: userId,
            establishmentId,
            email: 'real-reset@example.com',
            status: UserStatus.Active,
          }),
        ],
        registrationAttempts: [],
      })
      const auth = realFixture.app.get(IDENTITY_PROVIDERS.betterAuth)
      const context = await auth.$context
      await context.internalAdapter.createUser({
        id: userId,
        name: 'Reset Manager',
        email: 'real-reset@example.com',
        emailVerified: true,
      })
      await context.internalAdapter.createAccount({
        id: '83000000-0000-4000-8000-000000000003',
        accountId: userId,
        providerId: 'credential',
        userId,
      })

      const recovery = await request(app)
        .post('/registration-attempts/password-recovery')
        .send({ email: 'real-reset@example.com' })
      expect(recovery.status).toBe(202)

      const database = realFixture.app.get(DrizzleClient).requireDatabase()
      const events = await database.select().from(eventModel)
      const recoveryEvent = events.find(
        (event) => event.eventName === PasswordRecoveryPreparedEvent._NAME,
      )
      expect(recoveryEvent).toBeDefined()
      if (!recoveryEvent) throw new Error('Expected a password recovery outbox event')
      const token = new URL(recoveryEvent.payload.actionUrl as string).searchParams.get(
        'token',
      )
      expect(token).toEqual(expect.any(String))

      const response = await request(app)
        .post('/registration-attempts/password-reset')
        .send({ token, password: 'new-password-123' })

      expect(response.status).toBe(204)
      expect(response.headers['set-cookie']?.[0]).toMatch(
        /^scoops\.session_token=; Path=\/; (?:Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT); HttpOnly; SameSite=Lax$/,
      )

      const replay = await request(app)
        .post('/registration-attempts/password-reset')
        .send({ token, password: 'another-password-123' })
      expect(replay.status).toBe(400)
      expect(replay.body).toMatchObject({ title: 'Requisição Inválida' })
    } finally {
      await realFixture.close()
    }
  })
})
