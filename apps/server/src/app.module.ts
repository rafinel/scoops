import { Module } from '@nestjs/common'

import { BillingModule } from '@/billing/billing.module'
import { CommunicationModule } from '@/communication/communication.module'
import { IdentityModule } from '@/identity/identity.module'
import { MrpModule } from '@/mrp/mrp.module'
import { PdvModule } from '@/pdv/pdv.module'
import { inngest } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { SharedModule } from '@/shared/shared.module'
import { communicationInngestFunctions } from './communication/messaging/inngest/jobs'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    BillingModule,
    MrpModule,
    PdvModule,
    CommunicationModule,
    InngestModule.forRoot({
      client: inngest,
      functions: [...communicationInngestFunctions],
    }),
  ],
})
export class AppModule {}
