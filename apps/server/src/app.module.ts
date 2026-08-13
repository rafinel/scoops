import { Module } from '@nestjs/common'

import { BillingModule } from '@/billing/billing.module'
import { CommunicationModule } from '@/communication/communication.module'
import { IdentityModule } from '@/identity/identity.module'
import { MrpModule } from '@/mrp/mrp.module'
import { PdvModule } from '@/pdv/pdv.module'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { SharedModule } from '@/shared/shared.module'
import { SendInvitationEmailJob } from '@/communication/messaging/inngest/jobs'
import { ExpireIceCreamShopOnboardingsJob } from '@/identity/messaging/inngest/jobs'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    BillingModule,
    MrpModule,
    PdvModule,
    CommunicationModule,
    InngestModule.forRoot({
      functions: [SendInvitationEmailJob, ExpireIceCreamShopOnboardingsJob],
    }),
  ],
})
export class AppModule {}
