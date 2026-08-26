import { Module } from '@nestjs/common'

import { PDV_REPOSITORIES } from '@/pdv/constants'
import {
  DrizzleDiscountsRepository,
  DrizzlePdvDatabase,
  DrizzleSalesChannelsRepository,
} from '@/pdv/database/drizzle/repositories'
import { PdvSeeder } from '@/pdv/database/pdv-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleDiscountsRepository,
    DrizzleSalesChannelsRepository,
    DrizzlePdvDatabase,
    PdvSeeder,
    {
      provide: PDV_REPOSITORIES.discounts,
      useExisting: DrizzleDiscountsRepository,
    },
    {
      provide: PDV_REPOSITORIES.salesChannels,
      useExisting: DrizzleSalesChannelsRepository,
    },
    {
      provide: PDV_REPOSITORIES.database,
      useExisting: DrizzlePdvDatabase,
    },
  ],
  exports: [
    PDV_REPOSITORIES.discounts,
    PDV_REPOSITORIES.salesChannels,
    PDV_REPOSITORIES.database,
    PdvSeeder,
  ],
})
export class PdvDatabaseModule {}
