import { Module } from '@nestjs/common'

import { PdvDatabaseModule } from '@/pdv/database/pdv-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [PdvDatabaseModule, ProvisionModule],
  exports: [PdvDatabaseModule],
})
export class PdvModule {}
