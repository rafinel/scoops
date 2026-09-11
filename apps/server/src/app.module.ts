import { Module } from '@nestjs/common'
import { serverEnvSchema } from '@scoops/validation'

import { BillingModule } from '@/billing/billing.module'
import { CommunicationModule } from '@/communication/communication.module'
import { CreateInProductNotificationsJob } from '@/communication/messaging/inngest/jobs'
import { CommunicationIdentityCompositionModule } from '@/compositions/communication-identity/communication-identity-composition.module'
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
import { CleanupPublishedEventsJob } from '@/shared/messaging/inngest/jobs/cleanup-published-events-job'
import { ReprocessEventsJob } from '@/shared/messaging/inngest/jobs/reprocess-events-job'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

const appMode = serverEnvSchema.shape.SCOOPS_SERVER_APP_MODE.parse(
  process.env.SCOOPS_SERVER_APP_MODE,
)

export type ServerAppMode = 'dev' | 'test' | 'stg' | 'prod'

const isRecoveryEnvironment = appMode === 'dev' || appMode === 'test'

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
    CommunicationIdentityCompositionModule,
    InngestModule.forRoot({
      functions: [
        SendInvitationEmailJob,
        SendOnboardingConfirmationEmailJob,
        SendPasswordRecoveryEmailJob,
        CreateInProductNotificationsJob,
        CleanupPublishedEventsJob,
        ExpireIceCreamShopOnboardingsJob,
        RevalidateCombosForProductJob,
        ...(isRecoveryEnvironment ? [ReprocessEventsJob] : []),
      ],
    }),
  ],
  providers: isRecoveryEnvironment ? [ReprocessEventsJob] : [],
})
export class AppModule {}
