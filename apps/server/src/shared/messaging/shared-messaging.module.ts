import { Module } from '@nestjs/common'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestBroker } from '@/shared/messaging/inngest/jobs/inngest-broker'
import { CleanupPublishedEventsJob } from '@/shared/messaging/inngest/jobs/cleanup-published-events-job'
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
  ],
  exports: [InngestClient, InngestBroker, EVENTS_REPOSITORY, CleanupPublishedEventsJob],
})
export class SharedMessagingModule {}
