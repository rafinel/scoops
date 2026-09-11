import { Global, Module } from '@nestjs/common'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants'
import { IdentityNotificationAudienceProvider } from '@/compositions/communication-identity/provision/notification-audience'
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
export class CommunicationIdentityCompositionModule {}
