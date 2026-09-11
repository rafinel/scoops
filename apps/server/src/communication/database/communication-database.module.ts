import { Module } from '@nestjs/common'

import {
  COMMUNICATION_PROVIDERS,
  COMMUNICATION_REPOSITORIES,
} from '@/communication/constants'
import { DrizzleNotificationsRepository } from '@/communication/database/drizzle/repositories'
import { PostgresNotificationRealtimeSubscriber } from '@/communication/database/drizzle/subscribers'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleNotificationsRepository,
    PostgresNotificationRealtimeSubscriber,
    CommunicationSeeder,
    {
      provide: COMMUNICATION_REPOSITORIES.notifications,
      useExisting: DrizzleNotificationsRepository,
    },
    {
      provide: COMMUNICATION_PROVIDERS.notificationRealtime,
      useExisting: PostgresNotificationRealtimeSubscriber,
    },
  ],
  exports: [
    COMMUNICATION_PROVIDERS.notificationRealtime,
    COMMUNICATION_REPOSITORIES.notifications,
    CommunicationSeeder,
  ],
})
export class CommunicationDatabaseModule {}
