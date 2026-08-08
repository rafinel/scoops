import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedRestModule } from '@/shared/rest/rest.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedRestModule],
})
export class SharedModule {}
