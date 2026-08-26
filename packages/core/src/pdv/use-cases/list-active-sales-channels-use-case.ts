import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { SalesChannelActor } from '#pdv/domain/structures/sales-channel-actor.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: SalesChannelActor
}

export class ListActiveSalesChannelsUseCase
  implements UseCase<Request, readonly SalesChannel[]>
{
  constructor(private readonly repository: SalesChannelsRepository) {}

  async execute(request: Request): Promise<readonly SalesChannel[]> {
    this.validateActor(request.actor)

    const channels = await this.repository.findActive(request.actor.establishmentId)

    return this.sortChannels(
      channels.filter(
        (channel) =>
          channel.establishmentId === request.actor.establishmentId &&
          channel.status === SalesChannelStatus.Active,
      ),
    )
  }

  private validateActor(actor: SalesChannelActor): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator) {
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar canais ativos.',
      )
    }
  }

  private sortChannels(channels: readonly SalesChannel[]): readonly SalesChannel[] {
    return [...channels].sort((left, right) => {
      const nameOrder = this.normalizeName(left.name).localeCompare(
        this.normalizeName(right.name),
      )
      return nameOrder || left.id.localeCompare(right.id)
    })
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase()
  }
}
