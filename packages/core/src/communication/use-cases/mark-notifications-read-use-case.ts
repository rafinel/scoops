import {
  NotificationActorProfile,
  type NotificationActor,
} from '#communication/domain/structures/notification-actor.ts'
import type { NotificationsRepository } from '#communication/interfaces/notifications-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export type MarkNotificationsReadRequest = {
  readonly actor: NotificationActor
  readonly notificationIds: readonly string[]
}

export class MarkNotificationsReadUseCase
  implements UseCase<MarkNotificationsReadRequest, readonly string[]>
{
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: MarkNotificationsReadRequest): Promise<readonly string[]> {
    this.validateActor(request.actor)
    const notificationIds = this.normalizeIds(request.notificationIds)
    if (notificationIds.length === 0 || notificationIds.length > 50)
      throw new BadRequestError('Informe entre 1 e 50 notificações.')

    return this.notificationsRepository.markRead({
      establishmentId: request.actor.establishmentId,
      recipientUserId: request.actor.id,
      notificationIds,
      readAt: this.datetimeProvider.now(),
    })
  }

  private validateActor(actor: NotificationActor): void {
    if (
      actor.profile !== NotificationActorProfile.Manager &&
      actor.profile !== NotificationActorProfile.Operator
    )
      throw new AuthorizationError(
        'Somente gestores e operadores podem marcar notificações como lidas.',
      )
  }

  private normalizeIds(notificationIds: readonly string[]): string[] {
    return [...new Set(notificationIds.map((notificationId) => notificationId.trim()))]
  }
}
