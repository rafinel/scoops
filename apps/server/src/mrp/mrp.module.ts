import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ListProductsController, RegisterProductController } from '@/mrp/rest/controllers'

@Module({
  imports: [MrpDatabaseModule, ProvisionModule, SharedMessagingModule],
  controllers: [ListProductsController, RegisterProductController],
  exports: [MrpDatabaseModule],
})
export class MrpModule {}
