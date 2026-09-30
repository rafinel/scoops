import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { serverEnvSchema } from '@scoops/validation'

import { BillingModule } from '@/billing/billing.module'
import { CommunicationModule } from '@/communication/communication.module'
import { CreateInProductNotificationsJob } from '@/communication/messaging/inngest/jobs'
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
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { AnalyticsModule } from '@/analytics/analytics.module'

serverEnvSchema.shape.SCOOPS_SERVER_APP_MODE.parse(process.env.SCOOPS_SERVER_APP_MODE)

@Module({
  imports: [
    SharedModule,
    SharedDatabaseModule,
    SharedMessagingModule,
    ScheduleModule.forRoot(),
    ProvisionModule,
    IdentityModule,
    BillingModule,
    MrpModule,
    PdvModule,
    CommunicationModule,
    AnalyticsModule,
    InngestModule.forRoot({
      functions: [
        SendInvitationEmailJob,
        SendOnboardingConfirmationEmailJob,
        SendPasswordRecoveryEmailJob,
        CreateInProductNotificationsJob,
        ExpireIceCreamShopOnboardingsJob,
        RevalidateCombosForProductJob,
      ],
    }),
  ],
})
export class AppModule {}
