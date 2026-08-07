import { Module } from '@nestjs/common'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'

@Module({
  imports: [IdentityDatabaseModule],
  controllers: [],
  providers: [],
  exports: [IdentityDatabaseModule],
})
export class IdentityModule {}
