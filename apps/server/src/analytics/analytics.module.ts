import { Module } from '@nestjs/common'

import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { PdvDatabaseModule } from '@/pdv/database/pdv-database.module'
import { AnalyticsProvisionModule } from '@/shared/provision/analytics/analytics-provision.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import {
  GetSalesAnalyticsController,
  GetStockAttentionController,
} from '@/analytics/rest/controllers'

@Module({
  imports: [
    AnalyticsProvisionModule.register({
      imports: [
        PdvDatabaseModule,
        MrpDatabaseModule,
        ProvisionModule,
        IdentityDatabaseModule,
      ],
      pdvDatabaseToken: PDV_REPOSITORIES.database,
      mrpDatabaseToken: MRP_REPOSITORIES.database,
      identityEstablishmentsToken: IDENTITY_REPOSITORIES.establishments,
      datetimeProviderToken: DatetimeProvider,
    }),
  ],
  controllers: [GetSalesAnalyticsController, GetStockAttentionController],
})
export class AnalyticsModule {}
