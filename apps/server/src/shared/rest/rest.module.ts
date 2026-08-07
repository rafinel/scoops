import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { CheckHealthController } from '@/shared/rest/controllers'

@Module({
  imports: [SharedDatabaseModule],
  controllers: [CheckHealthController],
})
export class SharedRestModule {}
