import { Module } from '@nestjs/common'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'
import { DrizzleNotificationsRepository } from '@/communication/database/drizzle/repositories'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleNotificationsRepository,
    CommunicationSeeder,
    {
      provide: COMMUNICATION_REPOSITORIES.notifications,
      useExisting: DrizzleNotificationsRepository,
    },
  ],
  exports: [COMMUNICATION_REPOSITORIES.notifications, CommunicationSeeder],
})
export class CommunicationDatabaseModule {}
