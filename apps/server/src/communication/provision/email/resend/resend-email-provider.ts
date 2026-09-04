import { Inject, Injectable, Optional } from '@nestjs/common'
import type {
  EmailMessage,
  EmailDelivery,
} from '@scoops/core/communication/domain/structures'
import { EmailDeliveryUnavailableError } from '@scoops/core/communication/domain/errors'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import { Resend } from 'resend'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type ResendClient = Pick<Resend, 'emails'>

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly client: ResendClient
  private readonly sender: string

  constructor(
    @Inject(EnvProvider) envProvider: EnvProvider,
    @Optional() client?: ResendClient,
  ) {
    // The provider is instantiated by Nest in every mode; startup validation requires
    // a real key only when Resend is selected, while local SMTP mode keeps this adapter unused.
    this.client =
      client ?? new Resend(envProvider.get('RESEND_API_KEY') ?? 're_placeholder')
    this.sender = envProvider.get('EMAIL_FROM')
  }

  async send(message: EmailMessage): Promise<EmailDelivery> {
    try {
      const { data, error } = await this.client.emails.send(
        {
          from: this.sender,
          to: [message.to],
          subject: message.subject,
          html: message.html,
        },
        { idempotencyKey: message.idempotencyKey },
      )

      if (error || !data?.id) {
        throw new Error(error?.message ?? 'Resend did not return a message id')
      }

      return { providerMessageId: data.id }
    } catch {
      throw new EmailDeliveryUnavailableError()
    }
  }
}
