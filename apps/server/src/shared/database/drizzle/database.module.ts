import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [DrizzleClient, DatabaseTransactionContext],
  exports: [DrizzleClient, DatabaseTransactionContext],
})
export class SharedDatabaseModule {}
