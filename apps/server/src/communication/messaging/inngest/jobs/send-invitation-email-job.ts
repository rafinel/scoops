import { Inject, Injectable } from '@nestjs/common'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import { UserInvitationPreparedEvent } from '@scoops/core/identity/domain/events'
import { renderUserInvitationEmail } from '@scoops/email/templates'
import { userInvitationPreparedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

export const sendInvitationEmailEvent = eventType(UserInvitationPreparedEvent._NAME, {
  schema: userInvitationPreparedEventSchema,
})

@Injectable()
export class SendInvitationEmailJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_PROVIDERS.email) private readonly emailProvider: EmailProvider,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/send-invitation-email',
        retries: 5,
        triggers: [sendInvitationEmailEvent],
      },
      async ({ event, step }) => {
        const eventId = this.requireEventId(event.id)
        const data = userInvitationPreparedEventSchema.parse(event.data)

        return step.run('send-invitation-email', async () => {
          const email = await renderUserInvitationEmail(data)
          return this.emailProvider.send({
            idempotencyKey: eventId,
            to: data.email,
            subject: email.subject,
            html: email.html,
          })
        })
      },
    )
  }

  private requireEventId(eventId: string | undefined): string {
    if (!eventId) throw new Error('Communication event id is required')
    return eventId
  }
}
