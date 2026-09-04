import { Inject, Injectable } from '@nestjs/common'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import { OnboardingConfirmationPreparedEvent } from '@scoops/core/identity/domain/events'
import { renderOnboardingConfirmationEmail } from '@scoops/email/templates'
import { onboardingConfirmationPreparedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

export const sendOnboardingConfirmationEmailEvent = eventType(
  OnboardingConfirmationPreparedEvent._NAME,
  { schema: onboardingConfirmationPreparedEventSchema },
)

@Injectable()
export class SendOnboardingConfirmationEmailJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_PROVIDERS.email) private readonly emailProvider: EmailProvider,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/send-onboarding-confirmation-email',
        retries: 5,
        triggers: [sendOnboardingConfirmationEmailEvent],
      },
      async ({ event, step }) => {
        if (!event.id) throw new Error('Communication event id is required')
        const data = onboardingConfirmationPreparedEventSchema.parse(event.data)

        return step.run('send-onboarding-confirmation-email', async () => {
          const email = await renderOnboardingConfirmationEmail(data)
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
