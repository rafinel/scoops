import { Module } from '@nestjs/common'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ExpireIceCreamShopOnboardingsJob } from '@/identity/messaging/inngest/jobs'
import { IdentityProvisionModule } from '@/identity/provision/identity-provision.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [
    IdentityDatabaseModule,
    IdentityProvisionModule,
    ProvisionModule,
    SharedMessagingModule,
  ],
  providers: [ExpireIceCreamShopOnboardingsJob],
  exports: [ExpireIceCreamShopOnboardingsJob, SharedMessagingModule],
})
export class IdentityMessagingModule {}
