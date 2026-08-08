import { Module } from '@nestjs/common'

import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
})
export class CommunicationModule {}
