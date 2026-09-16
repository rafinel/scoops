import { Module } from '@nestjs/common'

import { MRP_PROVIDERS, MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { MrpProvisionModule } from '@/mrp/provision/mrp-provision.module'
import { PDV_PROVIDERS } from '@/pdv/constants'
import { NodePreviewTokenService } from '@/pdv/provision/preview-token/node-preview-token-service'
import { PdvOrderRegistrationProvisionModule } from '@/shared/provision/pdv-order-registration/pdv-order-registration-provision.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    MrpDatabaseModule,
    MrpProvisionModule,
    PdvOrderRegistrationProvisionModule.register({
      imports: [MrpDatabaseModule, MrpProvisionModule],
      databaseToken: MRP_REPOSITORIES.database,
      consumeOrderStockToken: MRP_PROVIDERS.consumeOrderStock,
      restoreOrderStockToken: MRP_PROVIDERS.restoreOrderStock,
      providerTokens: PDV_PROVIDERS,
    }),
    ProvisionModule,
  ],
  providers: [
    NodePreviewTokenService,
    {
      provide: PDV_PROVIDERS.previewToken,
      useExisting: NodePreviewTokenService,
    },
  ],
  exports: [
    PdvOrderRegistrationProvisionModule,
    PDV_PROVIDERS.previewToken,
    NodePreviewTokenService,
  ],
})
export class PdvProvisionModule {}
