import { Module } from '@nestjs/common'

import {
  SendInvitationEmailJob,
  SendOnboardingConfirmationEmailJob,
  SendPasswordRecoveryEmailJob,
} from '@/communication/messaging/inngest/jobs'
import { CommunicationProvisionModule } from '@/communication/provision/communication-provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [CommunicationProvisionModule, SharedMessagingModule],
  providers: [
    SendInvitationEmailJob,
    SendOnboardingConfirmationEmailJob,
    SendPasswordRecoveryEmailJob,
  ],
  exports: [
    SendInvitationEmailJob,
    SendOnboardingConfirmationEmailJob,
    SendPasswordRecoveryEmailJob,
  ],
})
export class CommunicationMessagingModule {}
