import { Module } from '@nestjs/common'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { SupabaseAuthIdentityProvider } from '@/identity/provision/supabase/supabase-auth-identity-provider'
import { SupabaseOnboardingIdentityProvider } from '@/identity/provision/supabase/supabase-onboarding-identity-provider'
import { NodeOnboardingIdentifierProvider } from '@/identity/provision/identifier/node-onboarding-identifier-provider'
import { NodeOnboardingTokenProvider } from '@/identity/provision/token/node-onboarding-token-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [
    SupabaseAuthIdentityProvider,
    SupabaseOnboardingIdentityProvider,
    NodeOnboardingTokenProvider,
    NodeOnboardingIdentifierProvider,
    {
      provide: IDENTITY_PROVIDERS.authIdentity,
      useExisting: SupabaseAuthIdentityProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingIdentity,
      useExisting: SupabaseOnboardingIdentityProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingToken,
      useExisting: NodeOnboardingTokenProvider,
    },
    {
      provide: IDENTITY_PROVIDERS.onboardingIdentifier,
      useExisting: NodeOnboardingIdentifierProvider,
    },
  ],
  exports: [
    IDENTITY_PROVIDERS.authIdentity,
    IDENTITY_PROVIDERS.onboardingIdentity,
    IDENTITY_PROVIDERS.onboardingToken,
    IDENTITY_PROVIDERS.onboardingIdentifier,
  ],
})
export class IdentityProvisionModule {}
