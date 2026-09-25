import { Inject, Injectable } from '@nestjs/common'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { OnboardingConfirmationPreparedEvent } from '@scoops/core/identity/domain/events'
import { renderOnboardingConfirmationEmail } from '@scoops/email/templates'
import { onboardingConfirmationPreparedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

export const sendOnboardingConfirmationEmailEvent = eventType(
  OnboardingConfirmationPreparedEvent._NAME,
  { schema: onboardingConfirmationPreparedEventSchema },
)

@Injectable()
export class SendOnboardingConfirmationEmailJob extends InngestJob {
  static readonly ID = 'communication/send-onboarding-confirmation-email'
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_PROVIDERS.email) private readonly emailProvider: EmailProvider,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)

    this.function = this.inngest.createFunction(
      {
        id: SendOnboardingConfirmationEmailJob.ID,
        retries: 5,
        triggers: [sendOnboardingConfirmationEmailEvent],
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            SendOnboardingConfirmationEmailJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
      },
      async ({ event, step, runId }) => {
        if (!event.id)
          throw new Error('O identificador do evento de comunicação é obrigatório')
        const data = onboardingConfirmationPreparedEventSchema.parse(event.data)

        const result = await step.run('send-onboarding-confirmation-email', async () => {
          const email = await renderOnboardingConfirmationEmail(data)
          return this.emailProvider.send({
            idempotencyKey: event.id,
            to: data.email,
            subject: email.subject,
            html: email.html,
          })
        })
        this.recordSuccessfulRun(SendOnboardingConfirmationEmailJob.ID, runId, event.ts)
        return result
      },
    )
  }
}
