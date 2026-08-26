import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import { DiscountUpdatedEvent } from '#pdv/domain/events/discount-updated-event.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'
type Request = {
  readonly actor: ComboActor
  readonly comboId: string
  readonly expectedUpdatedAt: Date
}
export class ReactivateComboUseCase implements UseCase<Request, ComboDetails> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly catalog: SalesCatalogProvider,
    private readonly broker: Broker,
  ) {}
  async execute(request: Request): Promise<ComboDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    const current = await this.database.run((scope) =>
      scope.discountsRepository.findById(request.actor.establishmentId, request.comboId),
    )
    if (!current || current.establishmentId !== request.actor.establishmentId)
      throw new NotFoundError('Combo não encontrado.')
    if (current.updatedAt.getTime() !== request.expectedUpdatedAt.getTime())
      throw new ConflictError('O combo foi alterado por outra operação.')
    const products = await this.catalog.findByProductIds(request.actor.establishmentId, [
      ...new Set(current.components.map((component) => component.productId)),
    ])
    if (current.status === DiscountStatus.Inactive) {
      const map = new Map(products.map((product) => [product.productId, product]))
      for (const component of current.components)
        if (!ListCombosUseCase.evaluate(component, map.get(component.productId)).valid)
          throw new BadRequestError(
            'Todos os componentes devem estar disponíveis para reativar o combo.',
          )
      const normal = current.components.reduce(
        (sum, component) =>
          sum +
          ListCombosUseCase.evaluate(component, map.get(component.productId)).unitPrice *
            component.quantity,
        0,
      )
      if (ListCombosUseCase.money(normal) <= current.fixedPrice)
        throw new BadRequestError(
          'O preço fixo deve ser menor que o preço normal dos componentes.',
        )
      const combo = await this.database.run((scope) =>
        scope.discountsRepository.setStatus(
          request.actor.establishmentId,
          current.id,
          DiscountStatus.Active,
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
      return ListCombosUseCase.details(combo, map)
    }
    return ListCombosUseCase.details(
      current,
      new Map(products.map((product) => [product.productId, product])),
    )
  }
}
