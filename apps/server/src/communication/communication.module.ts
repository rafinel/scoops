import { Module } from '@nestjs/common'

import { ProvisionModule } from '@/shared/provision/provision.module'
import { CommunicationMessagingModule } from '@/communication/messaging/communication-messaging.module'

@Module({
  imports: [ProvisionModule, CommunicationMessagingModule],
})
export class CommunicationModule {}
