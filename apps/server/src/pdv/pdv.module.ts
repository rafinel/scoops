import { Module } from '@nestjs/common'

import { PdvDatabaseModule } from '@/pdv/database/pdv-database.module'
import { SalesChannelControllers } from '@/pdv/rest/controllers'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [PdvDatabaseModule, ProvisionModule],
  controllers: SalesChannelControllers,
  exports: [PdvDatabaseModule],
})
export class PdvModule {}
