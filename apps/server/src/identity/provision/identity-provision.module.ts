import { Module } from '@nestjs/common'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { SupabaseAuthIdentityProvider } from '@/identity/provision/supabase/supabase-auth-identity-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [
    SupabaseAuthIdentityProvider,
    {
      provide: IDENTITY_PROVIDERS.authIdentity,
      useExisting: SupabaseAuthIdentityProvider,
    },
  ],
  exports: [IDENTITY_PROVIDERS.authIdentity],
})
export class IdentityProvisionModule {}
