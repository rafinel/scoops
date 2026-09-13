import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { Module } from '@nestjs/common'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { IdentityNotificationAudienceProvider } from '@/shared/provision/notification-audience/identity-notification-audience-provider'

@Module({
  imports: [IdentityDatabaseModule],
  providers: [
    {
      provide: IdentityNotificationAudienceProvider,
      inject: [IDENTITY_REPOSITORIES.users],
      useFactory: (usersRepository: UsersRepository) =>
        new IdentityNotificationAudienceProvider(usersRepository),
    },
    {
      provide: COMMUNICATION_PROVIDERS.notificationAudience,
      useExisting: IdentityNotificationAudienceProvider,
    },
  ],
  exports: [COMMUNICATION_PROVIDERS.notificationAudience],
})
export class NotificationAudienceModule {}
