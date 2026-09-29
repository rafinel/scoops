import { Module } from '@nestjs/common'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { PdvDatabaseModule } from '@/pdv/database/pdv-database.module'
import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { IdentityGlobalSearchProviderAdapter } from '@/shared/provision/global-search/identity-global-search-provider'
import { MrpGlobalSearchProviderAdapter } from '@/shared/provision/global-search/mrp-global-search-provider'
import { PdvGlobalSearchProviderAdapter } from '@/shared/provision/global-search/pdv-global-search-provider'

@Module({
  imports: [IdentityDatabaseModule, MrpDatabaseModule, PdvDatabaseModule],
  providers: [
    IdentityGlobalSearchProviderAdapter,
    MrpGlobalSearchProviderAdapter,
    PdvGlobalSearchProviderAdapter,
    {
      provide: IDENTITY_PROVIDERS.globalSearchIdentity,
      useExisting: IdentityGlobalSearchProviderAdapter,
    },
    {
      provide: IDENTITY_PROVIDERS.globalSearchMrp,
      useExisting: MrpGlobalSearchProviderAdapter,
    },
    {
      provide: IDENTITY_PROVIDERS.globalSearchPdv,
      useExisting: PdvGlobalSearchProviderAdapter,
    },
  ],
  exports: [
    IDENTITY_PROVIDERS.globalSearchIdentity,
    IDENTITY_PROVIDERS.globalSearchMrp,
    IDENTITY_PROVIDERS.globalSearchPdv,
  ],
})
export class GlobalSearchProvisionModule {}
