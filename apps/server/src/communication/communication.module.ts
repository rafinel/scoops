import { Module } from '@nestjs/common'

import { CommunicationDatabaseModule } from '@/communication/database'
import { CommunicationMessagingModule } from '@/communication/messaging/communication-messaging.module'
import {
  ListNotificationsController,
  MarkNotificationsReadController,
} from '@/communication/rest/controllers'
import { CommunicationProvisionModule } from '@/communication/provision/communication-provision.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    CommunicationDatabaseModule,
    CommunicationProvisionModule,
    CommunicationMessagingModule,
    ProvisionModule,
  ],
  controllers: [ListNotificationsController, MarkNotificationsReadController],
})
export class CommunicationModule {}
