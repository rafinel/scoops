import { Inject, Injectable } from '@nestjs/common'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { PasswordRecoveryPreparedEvent } from '@scoops/core/identity/domain/events'
import { renderPasswordRecoveryEmail } from '@scoops/email/templates'
import { passwordRecoveryPreparedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

export const sendPasswordRecoveryEmailEvent = eventType(
  PasswordRecoveryPreparedEvent._NAME,
  { schema: passwordRecoveryPreparedEventSchema },
)

@Injectable()
export class SendPasswordRecoveryEmailJob extends InngestJob {
  static readonly ID = 'communication/send-password-recovery-email'
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_PROVIDERS.email) private readonly emailProvider: EmailProvider,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)

    this.function = this.inngest.createFunction(
      {
        id: SendPasswordRecoveryEmailJob.ID,
        retries: 5,
        triggers: [sendPasswordRecoveryEmailEvent],
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            SendPasswordRecoveryEmailJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
      },
      async ({ event, step, runId }) => {
        if (!event.id)
          throw new Error('O identificador do evento de comunicação é obrigatório')
        const data = passwordRecoveryPreparedEventSchema.parse(event.data)

        const result = await step.run('send-password-recovery-email', async () => {
          const email = await renderPasswordRecoveryEmail(data)
          return this.emailProvider.send({
            idempotencyKey: event.id,
            to: data.email,
            subject: email.subject,
            html: email.html,
          })
        })
        this.recordSuccessfulRun(SendPasswordRecoveryEmailJob.ID, runId, event.ts)
        return result
      },
    )
  }
}
