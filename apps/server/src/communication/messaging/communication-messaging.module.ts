import { Module } from '@nestjs/common'

import { SendInvitationEmailJob } from '@/communication/messaging/inngest/jobs/send-invitation-email-job'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [SharedMessagingModule],
  providers: [SendInvitationEmailJob],
  exports: [SendInvitationEmailJob],
})
export class CommunicationMessagingModule {}
