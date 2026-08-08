import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { CheckHealthController } from '@/shared/rest/controllers'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule],
  controllers: [CheckHealthController],
})
export class SharedRestModule {}
