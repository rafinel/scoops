import { Module } from '@nestjs/common'

import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [InngestClient, InngestBroker],
  exports: [InngestClient, InngestBroker],
})
export class SharedMessagingModule {}
