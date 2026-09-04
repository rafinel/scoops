import { Module } from '@nestjs/common'

import { CommunicationMessagingModule } from '@/communication/messaging/communication-messaging.module'

@Module({
  imports: [CommunicationMessagingModule],
})
export class CommunicationModule {}
