import { Module } from '@nestjs/common'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import {
  BetterAuthSecurityControls,
  BetterAuthSessionVerifier,
  BetterAuthSessionIssuer,
  BetterAuthServerAuthProvider,
  createBetterAuth,
} from '@/identity/provision/auth'
import { NodeOnboardingIdentifierProvider } from '@/identity/provision/identifier/node-onboarding-identifier-provider'
import { NodeOnboardingTokenProvider } from '@/identity/provision/token/node-onboarding-token-provider'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [IdentityDatabaseModule, SharedDatabaseModule, ProvisionModule],
  providers: [
    {
      provide: IDENTITY_PROVIDERS.betterAuth,
      inject: [
        EnvProvider,
        DrizzleClient,
        IDENTITY_REPOSITORIES.database,
        BetterAuthSecurityControls,
      ],
      useFactory: (
        envProvider: EnvProvider,
        drizzleClient: DrizzleClient,
        identityDatabase: Parameters<typeof createBetterAuth>[2],
        securityControls: BetterAuthSecurityControls,
      ) =>
        createBetterAuth(
          envProvider,
          drizzleClient.requireDatabase(),
          identityDatabase,
          securityControls,
        ),
    },
    {
      provide: BetterAuthSecurityControls,
      inject: [IDENTITY_REPOSITORIES.database, DrizzleClient, DatabaseTransactionContext],
      useFactory: (
        identityDatabase: Parameters<typeof createBetterAuth>[2],
        drizzleClient: DrizzleClient,
        transactionContext: DatabaseTransactionContext,
      ) =>
        new BetterAuthSecurityControls(
          identityDatabase,
          drizzleClient.requireDatabase(),
          transactionContext,
        ),
    },
    BetterAuthSessionVerifier,
    BetterAuthSessionIssuer,
    BetterAuthServerAuthProvider,
    NodeOnboardingTokenProvider,
    NodeOnboardingIdentifierProvider,
    {
      provide: IDENTITY_PROVIDERS.authIdentity,
      useExisting: BetterAuthServerAuthProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingIdentity,
      useExisting: BetterAuthServerAuthProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingToken,
      useExisting: NodeOnboardingTokenProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingIdentifier,
      useExisting: NodeOnboardingIdentifierProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.userAccessIdentity,
      useExisting: BetterAuthServerAuthProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.betterAuthSessionVerifier,
      useExisting: BetterAuthSessionVerifier,
    },
  ],
  exports: [
    IDENTITY_PROVIDERS.authIdentity,
    IDENTITY_PROVIDERS.onboardingIdentity,
    IDENTITY_PROVIDERS.onboardingToken,
    IDENTITY_PROVIDERS.onboardingIdentifier,
    IDENTITY_PROVIDERS.userAccessIdentity,
    IDENTITY_PROVIDERS.betterAuth,
    IDENTITY_PROVIDERS.betterAuthSessionVerifier,
    BetterAuthSessionIssuer,
  ],
})
export class IdentityProvisionModule {}
