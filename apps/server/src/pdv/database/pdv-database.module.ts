import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
})
export class PdvDatabaseModule {}
