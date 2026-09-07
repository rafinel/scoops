import type { NotificationListParams } from '#communication/domain/structures/notification-list-params.ts'
import {
  NotificationActorProfile,
  type NotificationActor,
} from '#communication/domain/structures/notification-actor.ts'
import type { NotificationPage } from '#communication/domain/structures/notification-page.ts'
import type { NotificationsRepository } from '#communication/interfaces/notifications-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export type ListNotificationsRequest = Omit<
  NotificationListParams,
  'establishmentId' | 'recipientUserId'
> & {
  readonly actor: NotificationActor
}

export class ListNotificationsUseCase
  implements UseCase<ListNotificationsRequest, NotificationPage>
{
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async execute(request: ListNotificationsRequest): Promise<NotificationPage> {
    this.validateActor(request.actor)
    this.validateParams(request)

    return this.notificationsRepository.findPage({
      limit: request.limit,
      ...(request.occurredFrom === undefined
        ? {}
        : { occurredFrom: request.occurredFrom }),
      ...(request.occurredTo === undefined ? {} : { occurredTo: request.occurredTo }),
      ...(request.cursor === undefined ? {} : { cursor: request.cursor }),
      establishmentId: request.actor.establishmentId,
      recipientUserId: request.actor.id,
    })
  }

  private validateActor(actor: NotificationActor): void {
    if (
      actor.profile !== NotificationActorProfile.Manager &&
      actor.profile !== NotificationActorProfile.Operator
    )
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar notificações.',
      )
  }

  private validateParams(request: ListNotificationsRequest): void {
    if (!Number.isInteger(request.limit) || request.limit < 1 || request.limit > 50)
      throw new BadRequestError('O limite de notificações deve estar entre 1 e 50.')

    if (
      request.occurredFrom !== undefined &&
      request.occurredTo !== undefined &&
      request.occurredFrom > request.occurredTo
    )
      throw new BadRequestError('O início não pode ser posterior ao fim do período.')

    if (request.cursor) {
      if (!(request.cursor.occurredAt instanceof Date) || !request.cursor.id.trim())
        throw new BadRequestError('O cursor de notificações é inválido.')
    }
  }
}
