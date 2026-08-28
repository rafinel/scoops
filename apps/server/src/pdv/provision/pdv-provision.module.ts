import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { PDV_PROVIDERS } from '@/pdv/constants'
import { MrpSalesCatalogProvider } from '@/pdv/provision/mrp'
import { NodePreviewTokenService } from '@/pdv/provision/preview-token/node-preview-token-service'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [MrpDatabaseModule, ProvisionModule],
  providers: [
    MrpSalesCatalogProvider,
    NodePreviewTokenService,
    {
      provide: PDV_PROVIDERS.salesCatalog,
      useExisting: MrpSalesCatalogProvider,
    },
    {
      provide: PDV_PROVIDERS.previewToken,
      useExisting: NodePreviewTokenService,
    },
  ],
  exports: [PDV_PROVIDERS.previewToken, PDV_PROVIDERS.salesCatalog],
})
export class PdvProvisionModule {}
