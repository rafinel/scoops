import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
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
  private readonly logger = new Logger(ResendEmailProvider.name)
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
    this.sender = envProvider.get('SCOOPS_EMAIL_SENDER')
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
        throw error ?? new Error('Resend did not return a message id')
      }

      return { providerMessageId: data.id }
    } catch (error) {
      this.logDeliveryFailure(message, error)
      throw new EmailDeliveryUnavailableError()
    }
  }

  private logDeliveryFailure(message: EmailMessage, error: unknown): void {
    const details = this.getErrorDetails(error)
    this.logger.error(
      JSON.stringify({
        signal: 'email_delivery_failed',
        provider: 'resend',
        eventId: message.idempotencyKey,
        from: this.sender,
        to: message.to,
        subject: message.subject,
        ...details,
      }),
    )
  }

  private getErrorDetails(error: unknown) {
    if (error instanceof Error) {
      const statusCode = (error as Error & { statusCode?: unknown }).statusCode

      return {
        errorName: error.name,
        errorMessage: error.message,
        statusCode: typeof statusCode === 'number' ? statusCode : undefined,
      }
    }

    if (error && typeof error === 'object') {
      const record = error as Record<string, unknown>
      return {
        errorName: typeof record.name === 'string' ? record.name : 'ResendError',
        errorMessage:
          typeof record.message === 'string' ? record.message : 'Unknown Resend error',
        statusCode: typeof record.statusCode === 'number' ? record.statusCode : undefined,
      }
    }

    return {
      errorName: 'UnknownError',
      errorMessage: String(error),
    }
  }
}
