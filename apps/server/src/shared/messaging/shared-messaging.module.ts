import { Module } from '@nestjs/common'

import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { CleanupPublishedEventsJob } from '@/shared/messaging/outbox/cleanup-published-events-job'
import { DrizzleOutboxDatabase } from '@/shared/database/drizzle/drizzle-outbox-database'
import { OUTBOX_DATABASE } from '@/shared/database/drizzle/outbox/outbox-database-token'
import { PublishEventJob } from '@/shared/messaging/outbox/publish-event-job'
import { RequeueEvent } from '@/shared/messaging/outbox/requeue-event'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule, SharedDatabaseModule],
  providers: [
    InngestClient,
    InngestBroker,
    DrizzleOutboxDatabase,
    { provide: OUTBOX_DATABASE, useExisting: DrizzleOutboxDatabase },
    PublishEventJob,
    CleanupPublishedEventsJob,
    RequeueEvent,
  ],
  exports: [
    InngestClient,
    InngestBroker,
    OUTBOX_DATABASE,
    PublishEventJob,
    CleanupPublishedEventsJob,
    RequeueEvent,
  ],
})
export class SharedMessagingModule {}
