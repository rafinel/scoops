import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { PDV_PROVIDERS } from '@/pdv/constants'
import { MrpSalesCatalogProvider } from '@/pdv/provision/mrp'

@Module({
  imports: [MrpDatabaseModule],
  providers: [
    MrpSalesCatalogProvider,
    {
      provide: PDV_PROVIDERS.salesCatalog,
      useExisting: MrpSalesCatalogProvider,
    },
  ],
  exports: [PDV_PROVIDERS.salesCatalog],
})
export class PdvProvisionModule {}
