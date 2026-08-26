import { Module } from '@nestjs/common'

import { PdvDatabaseModule } from '@/pdv/database/pdv-database.module'
import { RevalidateCombosForProductJob } from '@/pdv/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [PdvDatabaseModule, SharedMessagingModule],
  providers: [RevalidateCombosForProductJob],
  exports: [RevalidateCombosForProductJob, SharedMessagingModule],
})
export class PdvMessagingModule {}
