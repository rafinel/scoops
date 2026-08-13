import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedRestModule } from '@/shared/rest/rest.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [
    ProvisionModule,
    SharedDatabaseModule,
    SharedRestModule,
    SharedMessagingModule,
  ],
})
export class SharedModule {}
