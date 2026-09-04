import { Inject, Injectable } from '@nestjs/common'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import { PasswordRecoveryPreparedEvent } from '@scoops/core/identity/domain/events'
import { renderPasswordRecoveryEmail } from '@scoops/email/templates'
import { passwordRecoveryPreparedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

export const sendPasswordRecoveryEmailEvent = eventType(
  PasswordRecoveryPreparedEvent._NAME,
  { schema: passwordRecoveryPreparedEventSchema },
)

@Injectable()
export class SendPasswordRecoveryEmailJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_PROVIDERS.email) private readonly emailProvider: EmailProvider,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/send-password-recovery-email',
        retries: 5,
        triggers: [sendPasswordRecoveryEmailEvent],
      },
      async ({ event, step }) => {
        if (!event.id) throw new Error('Communication event id is required')
        const data = passwordRecoveryPreparedEventSchema.parse(event.data)

        return step.run('send-password-recovery-email', async () => {
          const email = await renderPasswordRecoveryEmail(data)
          return this.emailProvider.send({
            idempotencyKey: event.id,
            to: data.email,
            subject: email.subject,
            html: email.html,
          })
        })
      },
    )
  }
}
