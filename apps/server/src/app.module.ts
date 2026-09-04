import { Module } from '@nestjs/common'
import { serverEnvSchema } from '@scoops/validation'

import { BillingModule } from '@/billing/billing.module'
import { CommunicationModule } from '@/communication/communication.module'
import { IdentityModule } from '@/identity/identity.module'
import { MrpModule } from '@/mrp/mrp.module'
import { PdvModule } from '@/pdv/pdv.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedModule } from '@/shared/shared.module'
import {
  SendInvitationEmailJob,
  SendOnboardingConfirmationEmailJob,
  SendPasswordRecoveryEmailJob,
} from '@/communication/messaging/inngest/jobs'
import { ExpireIceCreamShopOnboardingsJob } from '@/identity/messaging/inngest/jobs'
import { RevalidateCombosForProductJob } from '@/pdv/messaging/inngest/jobs'
import { CleanupPublishedEventsJob } from '@/shared/messaging/outbox/cleanup-published-events-job'
import { ReprocessEventsJob } from '@/shared/messaging/outbox/reprocess-events-job'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

const appMode = serverEnvSchema.shape.SCOOPS_SERVER_APP_MODE.parse(
  process.env.SCOOPS_SERVER_APP_MODE,
)

export type ServerAppMode = 'dev' | 'test' | 'stg' | 'prod'

export function createOutboxMessagingComposition(appMode: ServerAppMode) {
  const isRecoveryEnvironment = appMode === 'dev' || appMode === 'test'

  return {
    providers: isRecoveryEnvironment ? [ReprocessEventsJob] : [],
    functions: isRecoveryEnvironment ? [ReprocessEventsJob] : [],
  }
}

const outboxMessagingComposition = createOutboxMessagingComposition(appMode)

@Module({
  imports: [
    SharedModule,
    SharedDatabaseModule,
    SharedMessagingModule,
    ProvisionModule,
    IdentityModule,
    BillingModule,
    MrpModule,
    PdvModule,
    CommunicationModule,
    InngestModule.forRoot({
      functions: [
        SendInvitationEmailJob,
        SendOnboardingConfirmationEmailJob,
        SendPasswordRecoveryEmailJob,
        ...outboxMessagingComposition.functions,
        CleanupPublishedEventsJob,
        ExpireIceCreamShopOnboardingsJob,
        RevalidateCombosForProductJob,
      ],
    }),
  ],
  providers: outboxMessagingComposition.providers,
})
export class AppModule {}
