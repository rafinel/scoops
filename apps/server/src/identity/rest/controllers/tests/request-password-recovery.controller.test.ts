import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
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

describe('Request Password Recovery Controller [POST /registration-attempts/password-recovery]', () => {
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
        id: '32000000-0000-0000-0000-000000000001',
        establishmentId: '32000000-0000-0000-0000-000000000002',
        email: 'recovery@example.com',
        profile: UserProfile.Manager,
      }),
    ])
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('prepares recovery without creating or changing a session cookie', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/password-recovery')
      .send({ email: 'RECOVERY@example.com' })

    expect(response.status).toBe(202)
    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('uses the real Better Auth recovery provider and enqueues only the prepared event', async () => {
    const realFixture = await RestFixture.register({
      imports: [SharedModule, IdentityModule, InngestModule.forRoot({ functions: [] })],
    })

    try {
      const app = realFixture.app.getHttpServer()
      const userId = '82000000-0000-4000-8000-000000000001'
      const establishmentId = '82000000-0000-4000-8000-000000000002'
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
            email: 'real-recovery@example.com',
            status: UserStatus.Active,
          }),
        ],
        registrationAttempts: [],
      })
      const auth = realFixture.app.get(IDENTITY_PROVIDERS.betterAuth)
      const context = await auth.$context
      await context.internalAdapter.createUser({
        id: userId,
        name: 'Recovery Manager',
        email: 'real-recovery@example.com',
        emailVerified: true,
      })
      await context.internalAdapter.createAccount({
        id: '82000000-0000-4000-8000-000000000003',
        accountId: userId,
        providerId: 'credential',
        userId,
      })

      const response = await request(app)
        .post('/registration-attempts/password-recovery')
        .send({ email: 'REAL-RECOVERY@example.com' })

      expect(response.status).toBe(202)
      expect(response.headers['set-cookie']).toBeUndefined()

      const database = realFixture.app.get(DrizzleClient).requireDatabase()
      const events = await database.select().from(eventModel)
      const recoveryEvent = events.find(
        (event) => event.eventName === PasswordRecoveryPreparedEvent._NAME,
      )
      expect(recoveryEvent).toMatchObject({
        eventName: PasswordRecoveryPreparedEvent._NAME,
        payload: expect.objectContaining({
          email: 'real-recovery@example.com',
          name: 'Recovery Manager',
        }),
      })
      expect(recoveryEvent?.payload).not.toHaveProperty('password')
      expect(recoveryEvent?.payload).not.toHaveProperty('token')
    } finally {
      await realFixture.close()
    }
  })
})
