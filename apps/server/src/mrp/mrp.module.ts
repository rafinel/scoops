import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [MrpDatabaseModule, ProvisionModule],
  exports: [MrpDatabaseModule],
})
export class MrpModule {}
