import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { SalesChannelActor } from '#pdv/domain/structures/sales-channel-actor.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: SalesChannelActor
  readonly channelId: string
}

export class InactivateSalesChannelUseCase implements UseCase<Request, SalesChannel> {
  constructor(private readonly repository: SalesChannelsRepository) {}

  async execute(request: Request): Promise<SalesChannel> {
    this.validateActor(request.actor)

    const channel = await this.repository.findById(
      request.actor.establishmentId,
      request.channelId,
    )
    if (!channel || channel.establishmentId !== request.actor.establishmentId) {
      throw new NotFoundError('Canal de venda não encontrado.')
    }
    if (channel.status === SalesChannelStatus.Inactive) return channel

    return this.repository.replace(request.actor.establishmentId, channel.id, {
      status: SalesChannelStatus.Inactive,
    })
  }

  private validateActor(actor: SalesChannelActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem inativar canais de venda.')
    }
  }
}
