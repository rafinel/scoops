import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { envSchema, EnvProvider } from '@/shared/provision/env/env-provider'
import {
  TELEMETRY,
  SentryTelemetry,
} from '@/shared/provision/telemetry/sentry-telemetry-provider'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
      validate: (configuration) => envSchema.parse(configuration),
    }),
  ],
  providers: [
    EnvProvider,
    DatetimeProvider,
    SentryTelemetry,
    { provide: TELEMETRY, useExisting: SentryTelemetry },
  ],
  exports: [EnvProvider, DatetimeProvider, TELEMETRY, SentryTelemetry],
})
export class ProvisionModule {}
