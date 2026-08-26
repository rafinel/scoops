import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesChannelActor } from '#pdv/domain/structures/sales-channel-actor.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: SalesChannelActor
  readonly channelId: string
}

export class DeleteSalesChannelUseCase implements UseCase<Request, void> {
  constructor(private readonly repository: SalesChannelsRepository) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)

    const channel = await this.repository.findById(
      request.actor.establishmentId,
      request.channelId,
    )
    if (!channel || channel.establishmentId !== request.actor.establishmentId) {
      throw new NotFoundError('Canal de venda não encontrado.')
    }

    await this.repository.remove(request.actor.establishmentId, channel.id)
  }

  private validateActor(actor: SalesChannelActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem excluir canais de venda.')
    }
  }
}
