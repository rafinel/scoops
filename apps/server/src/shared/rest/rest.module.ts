import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { InngestController } from '@/shared/messaging/inngest/inngest-controller'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { CheckHealthController } from '@/shared/rest/controllers'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule, SharedMessagingModule],
  controllers: [CheckHealthController, InngestController],
})
export class SharedRestModule {}
