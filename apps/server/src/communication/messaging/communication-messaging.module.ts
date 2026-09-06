import { Module } from '@nestjs/common'

import {
  CreateInProductNotificationsJob,
  SendInvitationEmailJob,
  SendOnboardingConfirmationEmailJob,
  SendPasswordRecoveryEmailJob,
} from '@/communication/messaging/inngest/jobs'
import { CommunicationDatabaseModule } from '@/communication/database'
import { CommunicationProvisionModule } from '@/communication/provision/communication-provision.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [
    CommunicationDatabaseModule,
    CommunicationProvisionModule,
    ProvisionModule,
    SharedMessagingModule,
  ],
  providers: [
    CreateInProductNotificationsJob,
    SendInvitationEmailJob,
    SendOnboardingConfirmationEmailJob,
    SendPasswordRecoveryEmailJob,
  ],
  exports: [
    CreateInProductNotificationsJob,
    SendInvitationEmailJob,
    SendOnboardingConfirmationEmailJob,
    SendPasswordRecoveryEmailJob,
  ],
})
export class CommunicationMessagingModule {}
