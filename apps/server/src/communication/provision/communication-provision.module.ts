import { Module } from '@nestjs/common'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { ResendEmailProvider } from '@/communication/provision/email/resend/resend-email-provider'
import { SmtpEmailProvider } from '@/communication/provision/email/smtp/smtp-email-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Module({
  imports: [ProvisionModule],
  providers: [
    SmtpEmailProvider,
    ResendEmailProvider,
    {
      provide: COMMUNICATION_PROVIDERS.email,
      inject: [EnvProvider, SmtpEmailProvider, ResendEmailProvider],
      useFactory: (
        envProvider: EnvProvider,
        smtpEmailProvider: SmtpEmailProvider,
        resendEmailProvider: ResendEmailProvider,
      ) =>
        envProvider.get('SCOOPS_EMAIL_PROVIDER') === 'resend'
          ? resendEmailProvider
          : smtpEmailProvider,
    },
  ],
  exports: [COMMUNICATION_PROVIDERS.email],
})
export class CommunicationProvisionModule {}
