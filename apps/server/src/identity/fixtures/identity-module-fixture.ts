import type { INestApplication, Type } from '@nestjs/common'
import type { User, UserRegistrationAttempt } from '@scoops/core/identity/domain/entities'
import type { EventPayload, InngestFunction } from 'inngest'
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
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { SharedModule } from '@/shared/shared.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'

const PENDING_ONBOARDING_USER = {
  name: 'Ana Manager',
  email: 'ana@example.com',
  profile: UserProfile.Manager,
  status: UserStatus.Pending,
}

type IdentityJobType<T extends InngestJob> = Type<T> & { readonly ID: string }

type IdentityModuleOverrides<T extends InngestJob = InngestJob> = Partial<{
  onboardingIdentifier: OnboardingIdentifierProvider
  onboardingToken: OnboardingTokenProvider
  inngestJob: IdentityJobType<T>
}>

type IdentityJobOverrides<T extends InngestJob> = Omit<
  IdentityModuleOverrides<T>,
  'inngestJob'
> & { readonly inngestJob: IdentityJobType<T> }

type IdentityJobRegistration = {
  restFixture?: RestFixture
}

type IdentityEnvironment = {
  readonly webAppUrl: string | undefined
  readonly serverAppMode: string | undefined
  readonly emailProvider: string | undefined
}

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
    private readonly inngestFixture?: InngestFixture,
    private readonly originalServerAppMode?: string,
    private readonly originalEmailProvider?: string,
  ) {}

  static async register<T extends InngestJob = InngestJob>(
    authProvider: ServerAuthProvider,
    overrides: IdentityModuleOverrides<T> = {},
  ) {
    if (overrides.inngestJob)
      return IdentityModuleFixture.registerInngestJob(
        authProvider,
        overrides as IdentityJobOverrides<T>,
      )

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

  private static async registerInngestJob<T extends InngestJob>(
    authProvider: ServerAuthProvider,
    overrides: IdentityJobOverrides<T>,
  ) {
    const environment = IdentityModuleFixture.captureJobEnvironment()
    process.env.SCOOPS_WEB_APP_URL ??= 'http://localhost:4000'
    process.env.SCOOPS_SERVER_APP_MODE = 'test'
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'
    const registration: IdentityJobRegistration = {}
    const inngestFixture = IdentityModuleFixture.createInngestFixture(
      authProvider,
      overrides,
      registration,
    )
    const restFixture = await IdentityModuleFixture.startInngestFixture(
      inngestFixture,
      registration,
      environment,
    )

    return new IdentityModuleFixture(
      restFixture,
      authProvider,
      environment.webAppUrl,
      inngestFixture,
      environment.serverAppMode,
      environment.emailProvider,
    )
  }

  private static captureJobEnvironment(): IdentityEnvironment {
    return {
      webAppUrl: process.env.SCOOPS_WEB_APP_URL,
      serverAppMode: process.env.SCOOPS_SERVER_APP_MODE,
      emailProvider: process.env.SCOOPS_EMAIL_PROVIDER,
    }
  }

  private static createInngestFixture<T extends InngestJob>(
    authProvider: ServerAuthProvider,
    overrides: IdentityJobOverrides<T>,
    registration: IdentityJobRegistration,
  ) {
    return new InngestFixture({
      functionId: overrides.inngestJob.ID,
      createJob: async (client) => {
        registration.restFixture = await IdentityModuleFixture.registerJobApplication(
          authProvider,
          overrides,
          client,
        )
        return registration.restFixture.get(overrides.inngestJob)
      },
    })
  }

  private static registerJobApplication<T extends InngestJob>(
    authProvider: ServerAuthProvider,
    overrides: IdentityJobOverrides<T>,
    client: InngestClient,
  ) {
    return RestFixture.register(
      {
        imports: [SharedModule, IdentityModule, InngestModule.forRoot({ functions: [] })],
      },
      (builder) =>
        IdentityModuleFixture.configureJobProviders(
          builder,
          authProvider,
          overrides,
          client,
        ),
    )
  }

  private static configureJobProviders<T extends InngestJob>(
    builder: TestingModuleBuilder,
    authProvider: ServerAuthProvider,
    overrides: IdentityJobOverrides<T>,
    client: InngestClient,
  ) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
    let configuredBuilder = builder
      .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
      .useValue(authProvider)
      .overrideProvider(IDENTITY_PROVIDERS.onboardingIdentity)
      .useValue(authProvider)
      .overrideProvider(IDENTITY_PROVIDERS.userAccessIdentity)
      .useValue(authProvider)
      .overrideProvider(InngestClient)
      .useValue(client)

    if (authProvider instanceof BetterAuthFixture) {
      // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
      configuredBuilder = configuredBuilder
        .overrideProvider(IDENTITY_PROVIDERS.betterAuthSessionVerifier)
        .useValue(authProvider)
        .overrideProvider(BetterAuthSessionIssuer)
        .useValue(authProvider)
    }
    if (overrides.onboardingIdentifier) {
      // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
      configuredBuilder = configuredBuilder
        .overrideProvider(IDENTITY_PROVIDERS.onboardingIdentifier)
        .useValue(overrides.onboardingIdentifier)
    }
    if (overrides.onboardingToken) {
      // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
      configuredBuilder = configuredBuilder
        .overrideProvider(IDENTITY_PROVIDERS.onboardingToken)
        .useValue(overrides.onboardingToken)
    }

    return configuredBuilder
  }

  private static async startInngestFixture(
    inngestFixture: InngestFixture,
    registration: IdentityJobRegistration,
    environment: IdentityEnvironment,
  ): Promise<RestFixture> {
    try {
      await inngestFixture.setup()
    } catch (error) {
      await IdentityModuleFixture.cleanupFailedInngestSetup(
        error,
        registration.restFixture,
        environment,
      )
    }

    if (!registration.restFixture) {
      try {
        await inngestFixture.teardown()
      } finally {
        IdentityModuleFixture.restoreEnvironment(environment)
      }
      throw new Error('O fixture de Identidade não foi registrado no Inngest.')
    }

    return registration.restFixture
  }

  private static async cleanupFailedInngestSetup(
    error: unknown,
    restFixture: RestFixture | undefined,
    environment: IdentityEnvironment,
  ): Promise<never> {
    const cleanupErrors: unknown[] = [error]
    try {
      await restFixture?.close()
    } catch (closeError) {
      cleanupErrors.push(closeError)
    } finally {
      IdentityModuleFixture.restoreEnvironment(environment)
    }
    if (cleanupErrors.length > 1)
      throw new AggregateError(
        cleanupErrors,
        'Failed to register the Identity job fixture.',
      )

    throw error
  }

  private static restoreEnvironment(environment: IdentityEnvironment) {
    if (environment.webAppUrl === undefined) delete process.env.SCOOPS_WEB_APP_URL
    else process.env.SCOOPS_WEB_APP_URL = environment.webAppUrl
    if (environment.serverAppMode === undefined) delete process.env.SCOOPS_SERVER_APP_MODE
    else process.env.SCOOPS_SERVER_APP_MODE = environment.serverAppMode
    if (environment.emailProvider === undefined) delete process.env.SCOOPS_EMAIL_PROVIDER
    else process.env.SCOOPS_EMAIL_PROVIDER = environment.emailProvider
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

  get inngestFunctionOptions(): InngestFunction.Options {
    if (!this.inngestFixture)
      throw new Error('O fixture de Identidade não possui um job do Inngest.')
    return this.inngestFixture.functionOptions
  }

  invokeInngest(data?: Record<string, unknown>) {
    if (!this.inngestFixture)
      throw new Error('O fixture de Identidade não possui um job do Inngest.')
    return this.inngestFixture.invoke(data)
  }

  runInngest(event: EventPayload) {
    if (!this.inngestFixture)
      throw new Error('O fixture de Identidade não possui um job do Inngest.')
    return this.inngestFixture.run(event)
  }

  async seedUsers(users: User[], registrationAttempts: UserRegistrationAttempt[] = []) {
    const establishmentIds = [...new Set(users.map((user) => user.establishmentId))]
    await this.seeder.run({
      establishments: establishmentIds.map((establishmentId) =>
        EstablishmentFaker.fake({
          id: establishmentId,
          name: 'Users Establishment',
          timeZone: 'America/Sao_Paulo',
        }),
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
    const establishment = this.createPendingOnboardingEstablishment(establishmentId, now)
    const user = this.createPendingOnboardingUser(establishmentId, userId, now)
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

  private createPendingOnboardingEstablishment(establishmentId: string, now: Date) {
    return EstablishmentFaker.fake({
      id: establishmentId,
      name: 'Gelato Central',
      status: EstablishmentStatus.Pending,
      createdAt: now,
      updatedAt: now,
    })
  }

  private createPendingOnboardingUser(
    establishmentId: string,
    userId: string,
    now: Date,
  ) {
    return UserFaker.fake({
      ...PENDING_ONBOARDING_USER,
      id: userId,
      establishmentId,
      createdAt: now,
      updatedAt: now,
    })
  }

  async close() {
    try {
      await this.inngestFixture?.teardown()
    } finally {
      try {
        await this.restFixture.close()
      } finally {
        if (this.inngestFixture) {
          IdentityModuleFixture.restoreEnvironment({
            webAppUrl: this.originalWebAppUrl,
            serverAppMode: this.originalServerAppMode,
            emailProvider: this.originalEmailProvider,
          })
        } else if (this.originalWebAppUrl === undefined) {
          delete process.env.SCOOPS_WEB_APP_URL
        } else {
          process.env.SCOOPS_WEB_APP_URL = this.originalWebAppUrl
        }
        const close = this.authProvider as ServerAuthProvider & {
          close?: () => Promise<void>
        }
        await close.close?.()
      }
    }
  }
}
