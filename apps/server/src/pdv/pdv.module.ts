import { Module } from '@nestjs/common'

import { PdvDatabaseModule } from '@/pdv/database/pdv-database.module'
import { PdvMessagingModule } from '@/pdv/messaging/pdv-messaging.module'
import { PdvProvisionModule } from '@/pdv/provision/pdv-provision.module'
import {
  DiscountControllers,
  OrderControllers,
  SalesChannelControllers,
} from '@/pdv/rest/controllers'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [PdvDatabaseModule, PdvProvisionModule, PdvMessagingModule, ProvisionModule],
  controllers: [...DiscountControllers, ...SalesChannelControllers, ...OrderControllers],
  exports: [PdvDatabaseModule],
})
export class PdvModule {}
