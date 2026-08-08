import { Injectable } from '@nestjs/common'
import { type Context, eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'
import { UserRegistrationAttemptCreatedEvent } from '@scoops/core/identity/domain/events'
import {
  RegistrationAttemptStatus,
  RegistrationAttemptType,
} from '@scoops/core/identity/domain/structures'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

export const sendInvitationEmailEvent = eventType(
  UserRegistrationAttemptCreatedEvent._NAME,
  {
    schema: z.object({
      registrationAttemptId: z.string(),
      establishmentId: z.string(),
      type: z.enum(RegistrationAttemptType),
      status: z.enum(RegistrationAttemptStatus),
      createdAt: z.iso.datetime(),
      expiresAt: z.iso.datetime(),
    }),
  },
)

@Injectable()
export class SendInvitationEmailJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
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
