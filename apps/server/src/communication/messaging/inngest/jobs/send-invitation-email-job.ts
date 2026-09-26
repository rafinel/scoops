import { Inject, Injectable } from '@nestjs/common'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { UserInvitationPreparedEvent } from '@scoops/core/identity/domain/events'
import { renderUserInvitationEmail } from '@scoops/email/templates'
import { userInvitationPreparedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

export const sendInvitationEmailEvent = eventType(UserInvitationPreparedEvent._NAME, {
  schema: userInvitationPreparedEventSchema,
})

@Injectable()
export class SendInvitationEmailJob extends InngestJob {
  static readonly ID = 'communication/send-invitation-email'
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_PROVIDERS.email) private readonly emailProvider: EmailProvider,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)

    this.function = this.inngest.createFunction(
      {
        id: SendInvitationEmailJob.ID,
        retries: 5,
        triggers: [sendInvitationEmailEvent],
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            SendInvitationEmailJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
      },
      async ({ event, step, runId }) => {
        const eventId = this.requireEventId(event.id)
        const data = userInvitationPreparedEventSchema.parse(event.data)

        const result = await step.run('send-invitation-email', async () => {
          const email = await renderUserInvitationEmail(data)
          return this.emailProvider.send({
            idempotencyKey: eventId,
            to: data.email,
            subject: email.subject,
            html: email.html,
          })
        })
        this.recordSuccessfulRun(SendInvitationEmailJob.ID, runId, event.ts)
        return result
      },
    )
  }

  private requireEventId(eventId: string | undefined): string {
    if (!eventId)
      throw new Error('O identificador do evento de comunicação é obrigatório')
    return eventId
  }
}
