import { Module } from '@nestjs/common'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { CleanupPublishedEventsJob } from '@/shared/messaging/nest/jobs/cleanup-published-events-job'
import { ReprocessEventsJob } from '@/shared/messaging/nest/jobs/reprocess-events-job'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'
import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule],
  providers: [
    InngestClient,
    InngestBroker,
    DrizzleEventsRepository,
    { provide: EVENTS_REPOSITORY, useExisting: DrizzleEventsRepository },
    CleanupPublishedEventsJob,
    ReprocessEventsJob,
  ],
  exports: [
    InngestClient,
    InngestBroker,
    EVENTS_REPOSITORY,
    CleanupPublishedEventsJob,
    ReprocessEventsJob,
    ProvisionModule,
  ],
})
export class SharedMessagingModule {}
