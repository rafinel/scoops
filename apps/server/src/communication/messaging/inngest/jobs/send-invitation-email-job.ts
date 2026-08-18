import { Inject, Injectable } from '@nestjs/common'
import { sendInvitationEmailEventSchema } from '@scoops/validation'
import { type Context, eventType, type InngestFunction } from 'inngest'
import { UserRegistrationAttemptCreatedEvent } from '@scoops/core/identity/domain/events'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

export const sendInvitationEmailEvent = eventType(
  UserRegistrationAttemptCreatedEvent._NAME,
  {
    schema: sendInvitationEmailEventSchema,
  },
)

@Injectable()
export class SendInvitationEmailJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(@Inject(InngestClient) inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'communication/send-invitation-email',
        triggers: [sendInvitationEmailEvent],
      },
      SendInvitationEmailJob.handle,
    )
  }

  static async handle(context: Context) {
    return context.event.data
  }
}
