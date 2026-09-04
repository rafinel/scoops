import type { INestApplication, Type } from '@nestjs/common'
import type { User, UserRegistrationAttempt } from '@scoops/core/identity/domain/entities'
import type {
  ServerAuthProvider,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
} from '@scoops/core/identity/interfaces'
import {
  EstablishmentFaker,
  UserFaker,
  UserRegistrationAttemptFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { IdentityModule } from '@/identity/identity.module'
import { SharedModule } from '@/shared/shared.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestMock } from '@/shared/messaging/inngest/inngest-mock'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'

export class IdentityModuleFixture {
  static readonly onboarding = {
    continuationToken: 'c'.repeat(43),
    confirmationToken: 'f'.repeat(43),
    accessToken: 'pending-access-token',
    establishmentId: '50000000-0000-0000-0000-000000000001',
    userId: '50000000-0000-0000-0000-000000000002',
    attemptId: '50000000-0000-0000-0000-000000000003',
  }

  static readonly profileSettings = {
    establishmentId: '30000000-0000-0000-0000-000000000001',
    secondEstablishmentId: '30000000-0000-0000-0000-000000000002',
    managerId: '00000000-0000-0000-0000-000000000021',
    secondManagerId: '00000000-0000-0000-0000-000000000023',
    operatorId: '00000000-0000-0000-0000-000000000022',
    managerToken: 'profile-settings-manager-token',
    secondManagerToken: 'profile-settings-second-manager-token',
    operatorToken: 'profile-settings-operator-token',
  }

  static readonly userManagement = {
    establishmentId: '31000000-0000-0000-0000-000000000001',
    managerId: '31000000-0000-0000-0000-000000000002',
    operatorId: '31000000-0000-0000-0000-000000000003',
    invitationId: '31000000-0000-0000-0000-000000000004',
    managerToken: 'users-manager-token',
    invitationToken: 'u'.repeat(43),
  }

  private constructor(
    private readonly restFixture: RestFixture,
    private readonly authProvider: ServerAuthProvider,
    private readonly originalWebAppUrl: string | undefined,
  ) {}

  static async register(
    authProvider: ServerAuthProvider,
    overrides: Partial<{
      onboardingIdentifier: OnboardingIdentifierProvider
      onboardingToken: OnboardingTokenProvider
    }> = {},
  ) {
    const originalWebAppUrl = process.env.SCOOPS_WEB_APP_URL
    process.env.SCOOPS_WEB_APP_URL ??= 'http://localhost:4000'
    const restFixture = await RestFixture.register(
      {
        imports: [SharedModule, IdentityModule, InngestModule.forRoot({ functions: [] })],
      },
      (builder: TestingModuleBuilder) => {
        builder
          .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
          .useValue(authProvider)
          .overrideProvider(IDENTITY_PROVIDERS.onboardingIdentity)
          .useValue(authProvider)
          .overrideProvider(IDENTITY_PROVIDERS.userAccessIdentity)
          .useValue(authProvider)
          .overrideProvider(InngestBroker)
          .useValue(new InngestMock())
        if (authProvider instanceof BetterAuthFixture) {
          // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
          builder
            .overrideProvider(IDENTITY_PROVIDERS.betterAuthSessionVerifier)
            .useValue(authProvider)
            .overrideProvider(BetterAuthSessionIssuer)
            .useValue(authProvider)
        }

        if (overrides.onboardingIdentifier) {
          // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
          builder
            .overrideProvider(IDENTITY_PROVIDERS.onboardingIdentifier)
            .useValue(overrides.onboardingIdentifier)
        }
        if (overrides.onboardingToken) {
          // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
          builder
            .overrideProvider(IDENTITY_PROVIDERS.onboardingToken)
            .useValue(overrides.onboardingToken)
        }
        return builder
      },
    )

    return new IdentityModuleFixture(restFixture, authProvider, originalWebAppUrl)
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  get seeder(): IdentitySeeder {
    return this.restFixture.get(IdentitySeeder)
  }

  get<T>(typeOrToken: Type<T> | string | symbol) {
    return this.restFixture.get(typeOrToken)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async seedUsers(users: User[], registrationAttempts: UserRegistrationAttempt[] = []) {
    const establishmentIds = [...new Set(users.map((user) => user.establishmentId))]
    await this.seeder.run({
      establishments: establishmentIds.map((establishmentId) =>
        EstablishmentFaker.fake({ id: establishmentId, name: 'Users Establishment' }),
      ),
      users,
      registrationAttempts,
    })
  }

  async seedPendingOnboarding(tokenProvider: OnboardingTokenProvider) {
    const { continuationToken, confirmationToken } = IdentityModuleFixture.onboarding
    const { establishmentId, userId, attemptId } = IdentityModuleFixture.onboarding
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const establishment = EstablishmentFaker.fake({
      id: establishmentId,
      name: 'Gelato Central',
      status: EstablishmentStatus.Pending,
      createdAt: now,
      updatedAt: now,
    })
    const user = UserFaker.fake({
      id: userId,
      establishmentId,
      name: 'Ana Manager',
      email: 'ana@example.com',
      profile: UserProfile.Manager,
      status: UserStatus.Pending,
      createdAt: now,
      updatedAt: now,
    })
    const registrationAttempt = UserRegistrationAttemptFaker.fake({
      id: attemptId,
      userId,
      establishmentId,
      name: user.name,
      email: user.email,
      profile: user.profile,
      tokenHash: tokenProvider.hash(continuationToken),
      confirmationTokenHash: tokenProvider.hash(confirmationToken),
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })

    await this.seeder.run({
      establishments: [establishment],
      users: [user],
      registrationAttempts: [registrationAttempt],
    })

    if (this.authProvider instanceof BetterAuthFixture) {
      await this.authProvider.createUnconfirmedUser({
        id: user.id,
        email: user.email,
        name: user.name,
        password: 'password123',
      })
      this.authProvider.registerOnboardingConfirmation(confirmationToken, user.id)
    }

    return { establishment, user, registrationAttempt }
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      if (this.originalWebAppUrl === undefined) delete process.env.SCOOPS_WEB_APP_URL
      else process.env.SCOOPS_WEB_APP_URL = this.originalWebAppUrl
      const close = this.authProvider as ServerAuthProvider & {
        close?: () => Promise<void>
      }
      await close.close?.()
    }
  }
}
