import { Module } from '@nestjs/common'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { SupabaseServerAuthProvider } from '@/identity/provision/supabase/supabase-server-auth-provider'
import { NodeOnboardingIdentifierProvider } from '@/identity/provision/identifier/node-onboarding-identifier-provider'
import { NodeOnboardingTokenProvider } from '@/identity/provision/token/node-onboarding-token-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [
    SupabaseServerAuthProvider,
    NodeOnboardingTokenProvider,
    NodeOnboardingIdentifierProvider,
    {
      provide: IDENTITY_PROVIDERS.authIdentity,
      useExisting: SupabaseServerAuthProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingIdentity,
      useExisting: SupabaseServerAuthProvider,
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
      useExisting: SupabaseServerAuthProvider,
    },
  ],
  exports: [
    IDENTITY_PROVIDERS.authIdentity,
    IDENTITY_PROVIDERS.onboardingIdentity,
    IDENTITY_PROVIDERS.onboardingToken,
    IDENTITY_PROVIDERS.onboardingIdentifier,
    IDENTITY_PROVIDERS.userAccessIdentity,
  ],
})
export class IdentityProvisionModule {}
