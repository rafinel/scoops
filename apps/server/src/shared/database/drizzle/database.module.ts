import { Module } from '@nestjs/common'

import { ProvisionModule } from '@/shared/provision/provision.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Module({
  imports: [ProvisionModule],
  providers: [DrizzleClient],
  exports: [DrizzleClient],
})
export class SharedDatabaseModule {}
