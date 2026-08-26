import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import { DiscountUpdatedEvent } from '#pdv/domain/events/discount-updated-event.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'
type Request = {
  readonly actor: ComboActor
  readonly comboId: string
  readonly expectedUpdatedAt: Date
}
export class InactivateComboUseCase implements UseCase<Request, ComboDetails> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly catalog: SalesCatalogProvider,
    private readonly broker: Broker,
  ) {}
  async execute(request: Request): Promise<ComboDetails> {
    this.guard(request.actor)
    const current = await this.database.run((scope) =>
      scope.discountsRepository.findById(request.actor.establishmentId, request.comboId),
    )
    if (!current || current.establishmentId !== request.actor.establishmentId)
      throw new NotFoundError('Combo não encontrado.')
    if (current.updatedAt.getTime() !== request.expectedUpdatedAt.getTime())
      throw new ConflictError('O combo foi alterado por outra operação.')
    let combo = current
    if (current.status === DiscountStatus.Active) {
      combo = await this.database.run((scope) =>
        scope.discountsRepository.setStatus(
          request.actor.establishmentId,
          current.id,
          DiscountStatus.Inactive,
          request.expectedUpdatedAt,
        ),
      )
      await this.broker.publish(
        new DiscountUpdatedEvent({
          discountId: combo.id,
          establishmentId: combo.establishmentId,
          type: combo.type,
          updatedAt: combo.updatedAt,
        }),
      )
    }
    return this.details(combo, request.actor.establishmentId)
  }
  private async details(
    combo: import('#pdv/domain/entities/combo.ts').Combo,
    establishmentId: string,
  ) {
    try {
      const products = await this.catalog.findByProductIds(establishmentId, [
        ...new Set(combo.components.map((component) => component.productId)),
      ])
      return ListCombosUseCase.details(
        combo,
        new Map(products.map((product) => [product.productId, product])),
      )
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }
  private guard(actor: ComboActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
  }
}
