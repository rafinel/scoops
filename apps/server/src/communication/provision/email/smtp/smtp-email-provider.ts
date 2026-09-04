import { Inject, Injectable, Optional } from '@nestjs/common'
import type {
  EmailDelivery,
  EmailMessage,
} from '@scoops/core/communication/domain/structures'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import nodemailer from 'nodemailer'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type SmtpTransport = Pick<ReturnType<typeof nodemailer.createTransport>, 'sendMail'>

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transport: SmtpTransport
  private readonly sender: string

  constructor(
    @Inject(EnvProvider) envProvider: EnvProvider,
    @Optional() transport?: SmtpTransport,
  ) {
    this.transport =
      transport ??
      nodemailer.createTransport({
        host: envProvider.get('SMTP_HOST'),
        port: envProvider.get('SMTP_PORT'),
        secure: false,
      })
    this.sender = envProvider.get('EMAIL_FROM')
  }

  async send(message: EmailMessage): Promise<EmailDelivery> {
    const messageId = `<${message.idempotencyKey}@scoops.local>`

    try {
      const result = await this.transport.sendMail({
        from: this.sender,
        to: message.to,
        subject: message.subject,
        html: message.html,
        messageId,
      })

      return { providerMessageId: result.messageId ?? messageId }
    } catch {
      throw new Error('Email delivery is unavailable')
    }
  }
}
