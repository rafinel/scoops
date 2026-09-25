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
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { CreateInProductNotificationsUseCase } from '@scoops/core/communication/use-cases'
import {
  productStockAlertStateEnteredEventSchema,
  userInactivatedEventSchema,
  userInvitationAcceptedEventSchema,
  userProfileUpdatedEventSchema,
  userReactivatedEventSchema,
} from '@scoops/validation'
import { Inject, Injectable } from '@nestjs/common'
import { eventType, type Handler, type InngestFunction } from 'inngest'

import {
  COMMUNICATION_PROVIDERS,
  COMMUNICATION_REPOSITORIES,
} from '@/communication/constants'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

type NotificationFactWithoutSource = InProductNotificationFact extends infer Fact
  ? Fact extends { sourceEventId: string }
    ? Omit<Fact, 'sourceEventId'>
    : never
  : never

type NotificationJobContext = Parameters<Handler<InngestClient>>[0]

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
  static readonly ID = 'communication/create-in-product-notifications'

  readonly function: InngestFunction.Like
  private readonly useCase: CreateInProductNotificationsUseCase

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(COMMUNICATION_REPOSITORIES.notifications)
    notificationsRepository: NotificationsRepository,
    @Inject(COMMUNICATION_PROVIDERS.notificationAudience)
    audienceProvider: NotificationAudienceProvider,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)
    this.useCase = new CreateInProductNotificationsUseCase(
      notificationsRepository,
      audienceProvider,
      datetimeProvider,
    )

    this.function = this.registerInngestFunction(inngest)
  }

  private registerInngestFunction(inngest: InngestClient): InngestFunction.Like {
    return inngest.createFunction(this.createFunctionOptions(), async (context) =>
      this.handleNotificationRun(context),
    )
  }

  private createFunctionOptions() {
    return {
      id: CreateInProductNotificationsJob.ID,
      retries: 5 as const,
      triggers: [...createInProductNotificationsEvents],
      concurrency: { limit: 1, key: 'event.data.establishmentId' },
      onFailure: ({ event, error }) =>
        this.recordTerminalFailure(
          CreateInProductNotificationsJob.ID,
          event.data.run_id,
          event.data.event.ts,
          error,
        ),
    }
  }

  private async handleNotificationRun({ event, step, runId }: NotificationJobContext) {
    const eventId = this.requireEventId(event.id)
    const fact = this.toFact(event.name, event.data)

    const result = await step.run('create-in-product-notifications', () =>
      this.useCase.execute({ fact: { ...fact, sourceEventId: eventId } }),
    )
    this.recordSuccessfulRun(CreateInProductNotificationsJob.ID, runId, event.ts)
    return result
  }

  private requireEventId(eventId: string | undefined): string {
    if (!eventId)
      throw new Error('O identificador do evento de comunicação é obrigatório')
    return eventId
  }

  private toFact(name: string, payload: unknown): NotificationFactWithoutSource {
    if (name === ProductStockAlertStateEnteredEvent._NAME)
      return this.toStockAlertFact(payload)
    if (name === UserInvitationAcceptedEvent._NAME)
      return this.toInvitationAcceptedFact(payload)
    if (name === UserProfileUpdatedEvent._NAME) return this.toProfileUpdatedFact(payload)
    if (name === UserInactivatedEvent._NAME)
      return this.toUserStatusFact(payload, 'inactive')
    if (name === UserReactivatedEvent._NAME)
      return this.toUserStatusFact(payload, 'active')

    throw new Error(`Unsupported communication event: ${name}`)
  }

  private toStockAlertFact(payload: unknown): NotificationFactWithoutSource {
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

  private toInvitationAcceptedFact(payload: unknown): NotificationFactWithoutSource {
    const data = userInvitationAcceptedEventSchema.parse(payload)
    return {
      establishmentId: data.establishmentId,
      occurredAt: new Date(data.occurredAt),
      kind: NotificationKind.UserAdded,
      affectedUserId: data.userId,
      affectedUserName: data.userName,
    }
  }

  private toProfileUpdatedFact(payload: unknown): NotificationFactWithoutSource {
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

  private toUserStatusFact(
    payload: unknown,
    state: 'active' | 'inactive',
  ): NotificationFactWithoutSource {
    const data =
      state === 'inactive'
        ? userInactivatedEventSchema.parse(payload)
        : userReactivatedEventSchema.parse(payload)
    return {
      establishmentId: data.establishmentId,
      occurredAt: new Date(data.updatedAt),
      kind:
        state === 'inactive'
          ? NotificationKind.UserInactivated
          : NotificationKind.UserReactivated,
      affectedUserId: data.userId,
      affectedUserName: data.userName,
    }
  }
}
