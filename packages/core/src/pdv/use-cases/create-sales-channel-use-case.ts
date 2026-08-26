import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { SalesChannelActor } from '#pdv/domain/structures/sales-channel-actor.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: SalesChannelActor
  readonly name: string
  readonly percentage: number
  readonly status: SalesChannelStatus
}

export class CreateSalesChannelUseCase implements UseCase<Request, SalesChannel> {
  constructor(private readonly repository: SalesChannelsRepository) {}

  async execute(request: Request): Promise<SalesChannel> {
    this.validateActor(request.actor)
    const name = this.normalizeName(request.name)
    this.validatePercentage(request.percentage)
    this.validateStatus(request.status)

    const existing = await this.repository.findByNormalizedName(
      request.actor.establishmentId,
      name.toLowerCase(),
    )
    if (existing && existing.establishmentId === request.actor.establishmentId) {
      throw new ConflictError(
        'Já existe um canal de venda com esse nome neste estabelecimento.',
      )
    }

    return this.repository.add({
      establishmentId: request.actor.establishmentId,
      name,
      percentage: request.percentage,
      status: request.status,
    })
  }

  private validateActor(actor: SalesChannelActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem criar canais de venda.')
    }
  }

  private normalizeName(name: string): string {
    const normalizedName = name.trim()
    if (normalizedName.length < 1 || normalizedName.length > 120) {
      throw new BadRequestError('O nome deve ter entre 1 e 120 caracteres.')
    }
    return normalizedName
  }

  private validatePercentage(percentage: number): void {
    if (
      !Number.isFinite(percentage) ||
      percentage < -99.99 ||
      percentage > 100 ||
      Math.abs(percentage * 100 - Math.round(percentage * 100)) > 1e-8
    ) {
      throw new BadRequestError(
        'O percentual deve estar entre -99,99 e 100 e ter no máximo duas casas decimais.',
      )
    }
  }

  private validateStatus(status: SalesChannelStatus): void {
    if (!Object.values(SalesChannelStatus).includes(status)) {
      throw new BadRequestError('O status do canal de venda é inválido.')
    }
  }
}
