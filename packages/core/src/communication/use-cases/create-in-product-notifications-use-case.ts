import type { NotificationCreate } from '#communication/domain/structures/notification-create.ts'
import type { NotificationAudienceMember } from '#communication/domain/structures/notification-audience-member.ts'
import {
  NotificationKind,
  type InProductNotificationFact,
} from '#communication/domain/structures/index.ts'
import type { NotificationAudienceProvider } from '#communication/interfaces/notification-audience-provider.ts'
import type { NotificationsRepository } from '#communication/interfaces/notifications-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly fact: InProductNotificationFact
}

export class CreateInProductNotificationsUseCase implements UseCase<Request> {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly audienceProvider: NotificationAudienceProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<void> {
    const audience = await this.audienceProvider.findManyActiveByEstablishment(
      request.fact.establishmentId,
    )
    const recipientIds = this.resolveRecipientIds(request.fact, audience)
    if (recipientIds.length === 0) return

    const createdAt = this.datetimeProvider.now()
    const content = this.renderContent(request.fact)
    const notifications: NotificationCreate[] = recipientIds.map((recipientUserId) => ({
      sourceEventId: request.fact.sourceEventId,
      establishmentId: request.fact.establishmentId,
      recipientUserId,
      kind: request.fact.kind,
      title: content.title,
      message: content.message,
      occurredAt: request.fact.occurredAt,
      createdAt,
    }))

    await this.notificationsRepository.addMany(notifications)
  }

  private resolveRecipientIds(
    fact: InProductNotificationFact,
    audience: readonly NotificationAudienceMember[],
  ): string[] {
    const recipientIds = new Set<string>()
    const activeManagers = audience
      .filter((member) => member.profile === 'manager')
      .map((member) => member.userId)

    if (fact.kind === NotificationKind.UserAdded) {
      for (const userId of activeManagers) {
        if (userId !== fact.affectedUserId) recipientIds.add(userId)
      }
      return [...recipientIds]
    }

    if (fact.kind === NotificationKind.UserInactivated) {
      for (const userId of activeManagers) recipientIds.add(userId)
      recipientIds.add(fact.affectedUserId)
      return [...recipientIds]
    }

    if (
      fact.kind === NotificationKind.UserPromoted ||
      fact.kind === NotificationKind.UserDemoted ||
      fact.kind === NotificationKind.UserReactivated
    ) {
      for (const userId of activeManagers) recipientIds.add(userId)
      recipientIds.add(fact.affectedUserId)
      return [...recipientIds]
    }

    for (const member of audience) recipientIds.add(member.userId)
    return [...recipientIds]
  }

  private renderContent(fact: InProductNotificationFact): {
    title: string
    message: string
  } {
    switch (fact.kind) {
      case NotificationKind.StockBelowIdeal:
        return {
          title: 'Estoque abaixo do ideal',
          message: `${fact.productName} está com ${this.formatQuantity(fact.availableQuantity)} ${fact.unit} disponíveis. Ideal: ${this.formatQuantity(fact.idealQuantity)} ${fact.unit}.`,
        }
      case NotificationKind.StockZero:
        return {
          title: 'Estoque zerado',
          message: `${fact.productName} está com ${this.formatQuantity(fact.availableQuantity)} ${fact.unit} disponíveis.`,
        }
      case NotificationKind.UserAdded:
        return {
          title: 'Novo usuário adicionado',
          message: `${fact.affectedUserName} agora faz parte do estabelecimento.`,
        }
      case NotificationKind.UserPromoted:
        return {
          title: 'Usuário promovido',
          message: `${fact.affectedUserName} agora possui o perfil Gerente.`,
        }
      case NotificationKind.UserDemoted:
        return {
          title: 'Usuário alterado para Operador',
          message: `${fact.affectedUserName} agora possui o perfil Operador.`,
        }
      case NotificationKind.UserInactivated:
        return {
          title: 'Usuário inativado',
          message: `O acesso de ${fact.affectedUserName} foi inativado.`,
        }
      case NotificationKind.UserReactivated:
        return {
          title: 'Usuário reativado',
          message: `O acesso de ${fact.affectedUserName} foi reativado.`,
        }
    }
  }

  private formatQuantity(quantity: number): string {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 3,
      useGrouping: false,
    }).format(quantity)
  }
}
