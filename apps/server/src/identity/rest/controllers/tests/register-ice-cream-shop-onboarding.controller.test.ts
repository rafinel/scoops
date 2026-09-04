import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { OnboardingConfirmationPreparedEvent } from '@scoops/core/identity/domain/events'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityModule } from '@/identity/identity.module'
import { getTrustedOrigins } from '@/identity/provision/auth'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { OnboardingIdentifierProviderFaker } from '@/identity/fixtures/onboarding-identifier-faker'
import { OnboardingTokenProviderFaker } from '@/identity/fixtures/onboarding-token-faker'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SharedModule } from '@/shared/shared.module'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { EnvProvider } from '@/shared/provision/env/env-provider'

describe('Register Ice Cream Shop Onboarding Controller [POST /registration-attempts/onboarding]', () => {
  const betterAuthFixture = new BetterAuthFixture()
  const onboardingIdentifierProvider = OnboardingIdentifierProviderFaker.fake()
  const onboardingTokenProvider = OnboardingTokenProviderFaker.fake()
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(betterAuthFixture, {
      onboardingIdentifier: onboardingIdentifierProvider,
      onboardingToken: onboardingTokenProvider,
    })
  })

  beforeEach(async () => {
    await betterAuthFixture.clear()
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('creates a pending onboarding and keeps the continuation token in the response only', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/registration-attempts/onboarding')
      .send({
        establishmentName: '  Gelato Central ',
        managerName: ' Ana Manager ',
        email: ' ANA@example.com ',
        password: 'password123',
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      continuationToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana Manager',
        email: 'ana@example.com',
      },
    })
    expect(response.body.onboarding.expiresAt).toEqual(expect.any(String))
    expect(betterAuthFixture.getCalls().registerPendingIdentity).toHaveLength(1)
    expect(betterAuthFixture.getCalls().registerPendingIdentity[0]?.[0]).toMatchObject({
      email: 'ana@example.com',
      password: 'password123',
      confirmationRedirectTo: expect.stringContaining(
        '/onboarding/confirm?confirmationToken=',
      ),
    })
    expect(response.body).not.toHaveProperty('password')
  })

  it('rejects malformed and unknown fields before creating a provider identity', async () => {
    const [malformed, unknownField] = await Promise.all([
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/onboarding')
        .send({
          establishmentName: 'Gelato Central',
          managerName: 'Ana',
          email: 'not-an-email',
          password: 'short',
        }),
      request(fixture.app.getHttpServer())
        .post('/registration-attempts/onboarding')
        .send({
          establishmentName: 'Gelato Central',
          managerName: 'Ana',
          email: 'ana@example.com',
          password: 'password123',
          actor: 'forbidden-client-field',
        }),
    ])

    expect(malformed.status).toBe(422)
    expect(unknownField.status).toBe(422)
    expect(malformed.body).toMatchObject({ title: 'Invalid request' })
    expect(betterAuthFixture.getCalls().registerPendingIdentity).toHaveLength(0)
  })

  it('runs the Better Auth, cookie and transactional outbox path through the HTTP consumers', async () => {
    const realFixture = await RestFixture.register({
      imports: [SharedModule, IdentityModule, InngestModule.forRoot({ functions: [] })],
    })

    try {
      const app = realFixture.app.getHttpServer()
      const registration = await request(app)
        .post('/registration-attempts/onboarding')
        .send({
          establishmentName: '  Real Gelato ',
          managerName: ' Real Manager ',
          email: 'REAL@example.com',
          password: 'password123',
        })

      expect(registration.status).toBe(201)
      expect(registration.body).toMatchObject({
        onboarding: {
          establishmentName: 'Real Gelato',
          managerName: 'Real Manager',
          email: 'real@example.com',
        },
      })

      const users = realFixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
      const pendingUser = await users.findByEmail('real@example.com')
      expect(pendingUser).toMatchObject({ status: 'pending', email: 'real@example.com' })

      const database = realFixture.app.get(DrizzleClient).requireDatabase()
      const [outboxEvent] = await database.select().from(eventModel)
      expect(outboxEvent).toMatchObject({
        eventName: OnboardingConfirmationPreparedEvent._NAME,
        status: expect.stringMatching(/pending|published/),
      })
      expect(outboxEvent).toBeDefined()
      if (!outboxEvent) throw new Error('The registration did not enqueue an event')
      expect(outboxEvent?.payload).toMatchObject({
        email: 'real@example.com',
        name: 'Real Manager',
      })
      const confirmationToken = new URL(
        String((outboxEvent.payload as { actionUrl: string }).actionUrl),
      ).searchParams.get('confirmationToken')
      expect(confirmationToken).toBe(registration.body.continuationToken)

      const confirmation = await request(app)
        .post('/registration-attempts/onboarding/confirm')
        .send({ confirmationToken })

      expect(confirmation.status).toBe(204)
      expect(confirmation.headers['set-cookie']?.[0]).toMatch(
        /^scoops\.session_token=.+; Path=\/; HttpOnly; SameSite=Lax$/,
      )
      expect(confirmation.headers['set-cookie']?.[0]).not.toContain('accessToken')
      expect(confirmation.headers['set-cookie']?.[0]).not.toContain('refreshToken')

      const auth = realFixture.app.get(IDENTITY_PROVIDERS.betterAuth)
      const envProvider = realFixture.app.get(EnvProvider)
      const signInResponse = await auth.handler(
        new Request(
          `${envProvider.get('SCOOPS_SERVER_APP_URL')}/api/auth/sign-in/email`,
          {
            method: 'POST',
            headers: {
              Origin: getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL'))[0] ?? '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'real@example.com', password: 'password123' }),
          },
        ),
      )
      expect(signInResponse.status).toBe(200)
      const signIn = await signInResponse.json()
      expect(signIn).toMatchObject({
        redirect: false,
        user: { email: 'real@example.com', name: 'Real Manager' },
      })
      expect(signIn).toHaveProperty('token')

      const sessionCookie = confirmation.headers['set-cookie']?.[0]?.split(';', 1)[0]
      const session = await request(app)
        .get('/auth/session')
        .set('Cookie', sessionCookie ?? '')

      expect(session.status).toBe(200)
      expect(session.body).toMatchObject({
        id: pendingUser?.id,
        email: 'real@example.com',
        name: 'Real Manager',
      })
    } finally {
      await realFixture.close()
    }
  })
})
