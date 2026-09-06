import { Global, Module } from '@nestjs/common'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants'
import { IdentityNotificationAudienceProvider } from '@/composition/communication-identity/identity-notification-audience-provider'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'

@Global()
@Module({
  imports: [IdentityDatabaseModule],
  providers: [
    IdentityNotificationAudienceProvider,
    {
      provide: COMMUNICATION_PROVIDERS.notificationAudience,
      useExisting: IdentityNotificationAudienceProvider,
    },
  ],
  exports: [COMMUNICATION_PROVIDERS.notificationAudience],
})
export class NotificationAudienceCompositionModule {}
