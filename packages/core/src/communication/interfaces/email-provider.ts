import type { EmailDelivery } from '#communication/domain/structures/email-delivery.ts'
import type { EmailMessage } from '#communication/domain/structures/email-message.ts'

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDelivery>
}
