import type { InProductNotificationFact } from '@scoops/core/communication/domain/structures'
import { NotificationKind } from '@scoops/core/communication/domain/structures'
import {
  UserInactivatedEvent,
  UserInvitationAcceptedEvent,
  UserProfileUpdatedEvent,
  UserReactivatedEvent,
} from '@scoops/core/identity/domain/events'
import { ProductStockAlertStateEnteredEvent } from '@scoops/core/mrp/domain/events'
import type {
  NotificationAudienceProvider,
  NotificationsRepository,
} from '@scoops/core/communication/interfaces'
import { CreateInProductNotificationsUseCase } from '@scoops/core/communication/use-cases'
import {
  productStockAlertStateEnteredEventSchema,
  userInactivatedEventSchema,
  userInvitationAcceptedEventSchema,
  userProfileUpdatedEventSchema,
  userReactivatedEventSchema,
} from '@scoops/validation'
import { Inject, Injectable } from '@nestjs/common'
import { eventType, type InngestFunction } from 'inngest'

import {
  COMMUNICATION_PROVIDERS,
  COMMUNICATION_REPOSITORIES,
} from '@/communication/constants'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

type NotificationFactWithoutSource = InProductNotificationFact extends infer Fact
  ? Fact extends { sourceEventId: string }
    ? Omit<Fact, 'sourceEventId'>
    : never
  : never

export const createInProductNotificationsEvents = [
  eventType(ProductStockAlertStateEnteredEvent._NAME, {
    schema: productStockAlertStateEnteredEventSchema,
  }),
  eventType(UserInvitationAcceptedEvent._NAME, {
    schema: userInvitationAcceptedEventSchema,
  }),
  eventType(UserProfileUpdatedEvent._NAME, {
    schema: userProfileUpdatedEventSchema,
  }),
  eventType(UserInactivatedEvent._NAME, {
    schema: userInactivatedEventSchema,
  }),
  eventType(UserReactivatedEvent._NAME, {
    schema: userReactivatedEventSchema,
  }),
] as const

@Injectable()
export class CreateInProductNotificationsJob extends InngestJob {
  readonly function: InngestFunction.Like
  private readonly useCase: CreateInProductNotificationsUseCase

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_REPOSITORIES.notifications)
    notificationsRepository: NotificationsRepository,
    @Inject(COMMUNICATION_PROVIDERS.notificationAudience)
    audienceProvider: NotificationAudienceProvider,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)
    this.useCase = new CreateInProductNotificationsUseCase(
      notificationsRepository,
      audienceProvider,
      datetimeProvider,
    )

    this.function = this.inngest.createFunction(
      {
        id: 'communication/create-in-product-notifications',
        retries: 5,
        triggers: [...createInProductNotificationsEvents],
        concurrency: { limit: 1, key: 'event.data.establishmentId' },
      },
      async ({ event, step }) => {
        const eventId = this.requireEventId(event.id)
        const fact = this.toFact(event.name, event.data)

        return step.run('create-in-product-notifications', () =>
          this.useCase.execute({ fact: { ...fact, sourceEventId: eventId } }),
        )
      },
    )
  }

  private requireEventId(eventId: string | undefined): string {
    if (!eventId) throw new Error('Communication event id is required')
    return eventId
  }

  private toFact(name: string, payload: unknown): NotificationFactWithoutSource {
    if (name === ProductStockAlertStateEnteredEvent._NAME) {
      const data = productStockAlertStateEnteredEventSchema.parse(payload)
      const base = {
        establishmentId: data.establishmentId,
        occurredAt: new Date(data.occurredAt),
        productId: data.productId,
        productName: data.productName,
        unit: data.unit,
        availableQuantity: data.availableQuantity,
      }
      return data.state === 'zero'
        ? { ...base, kind: NotificationKind.StockZero }
        : {
            ...base,
            kind: NotificationKind.StockBelowIdeal,
            idealQuantity: data.idealQuantity as number,
          }
    }

    if (name === UserInvitationAcceptedEvent._NAME) {
      const data = userInvitationAcceptedEventSchema.parse(payload)
      return {
        establishmentId: data.establishmentId,
        occurredAt: new Date(data.occurredAt),
        kind: NotificationKind.UserAdded,
        affectedUserId: data.userId,
        affectedUserName: data.userName,
      }
    }

    if (name === UserProfileUpdatedEvent._NAME) {
      const data = userProfileUpdatedEventSchema.parse(payload)
      return {
        establishmentId: data.establishmentId,
        occurredAt: new Date(data.updatedAt),
        kind:
          data.profile === 'manager'
            ? NotificationKind.UserPromoted
            : NotificationKind.UserDemoted,
        affectedUserId: data.userId,
        affectedUserName: data.userName,
      }
    }

    if (name === UserInactivatedEvent._NAME) {
      const data = userInactivatedEventSchema.parse(payload)
      return {
        establishmentId: data.establishmentId,
        occurredAt: new Date(data.updatedAt),
        kind: NotificationKind.UserInactivated,
        affectedUserId: data.userId,
        affectedUserName: data.userName,
      }
    }

    if (name === UserReactivatedEvent._NAME) {
      const data = userReactivatedEventSchema.parse(payload)
      return {
        establishmentId: data.establishmentId,
        occurredAt: new Date(data.updatedAt),
        kind: NotificationKind.UserReactivated,
        affectedUserId: data.userId,
        affectedUserName: data.userName,
      }
    }

    throw new Error(`Unsupported communication event: ${name}`)
  }
}
