import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { envSchema, EnvProvider } from '@/shared/provision/env/env-provider'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: (configuration) => envSchema.parse(configuration),
    }),
  ],
  providers: [EnvProvider, DatetimeProvider],
  exports: [EnvProvider, DatetimeProvider],
})
export class ProvisionModule {}
