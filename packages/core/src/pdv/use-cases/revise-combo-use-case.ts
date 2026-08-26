import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { ComboUpdate } from '#pdv/domain/structures/combo-update.ts'
import { DiscountUpdatedEvent } from '#pdv/domain/events/discount-updated-event.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'
type Request = {
  readonly actor: ComboActor
  readonly comboId: string
  readonly input: ComboUpdate
}
export class ReviseComboUseCase implements UseCase<Request, ComboDetails> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly catalog: SalesCatalogProvider,
    private readonly broker: Broker,
  ) {}
  async execute(request: Request): Promise<ComboDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    const name = request.input.name.trim()
    if (!name || name.length > 120)
      throw new BadRequestError('O nome deve ter entre 1 e 120 caracteres.')
    ListCombosUseCase.validateComponents(request.input.components)
    ListCombosUseCase.validatePrice(request.input.fixedPrice)
    const products = await this.loadProducts(
      request.actor.establishmentId,
      request.input.components,
    )
    const combo = await this.database.run(async (scope) => {
      const current = await scope.discountsRepository.findById(
        request.actor.establishmentId,
        request.comboId,
      )
      if (!current || current.establishmentId !== request.actor.establishmentId)
        throw new NotFoundError('Combo não encontrado.')
      if (current.updatedAt.getTime() !== request.input.expectedUpdatedAt.getTime())
        throw new ConflictError('O combo foi alterado por outra operação.')
      const existing = await scope.discountsRepository.findByNormalizedName(
        request.actor.establishmentId,
        name.toLowerCase(),
      )
      if (existing && existing.id !== current.id)
        throw new ConflictError('Já existe um combo com esse nome neste estabelecimento.')
      if (current.status === 'active')
        this.validateActive(request.input.components, request.input.fixedPrice, products)
      return scope.discountsRepository.replace(
        request.actor.establishmentId,
        current.id,
        { ...request.input, name },
      )
    })
    await this.broker.publish(
      new DiscountUpdatedEvent({
        discountId: combo.id,
        establishmentId: combo.establishmentId,
        type: combo.type,
        updatedAt: combo.updatedAt,
      }),
    )
    return ListCombosUseCase.details(
      combo,
      new Map(products.map((product) => [product.productId, product])),
    )
  }
  private async loadProducts(
    establishmentId: string,
    components: readonly { productId: string }[],
  ) {
    try {
      return await this.catalog.findByProductIds(establishmentId, [
        ...new Set(components.map((component) => component.productId)),
      ])
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }
  private validateActive(
    components: Parameters<typeof ListCombosUseCase.validateComponents>[0],
    fixedPrice: number,
    products: Awaited<ReturnType<ReviseComboUseCase['loadProducts']>>,
  ): void {
    const map = new Map(products.map((product) => [product.productId, product]))
    for (const component of components)
      if (!ListCombosUseCase.evaluate(component, map.get(component.productId)).valid)
        throw new BadRequestError(
          'Todos os componentes de um combo ativo devem estar disponíveis.',
        )
    const normal = components.reduce(
      (sum, component) =>
        sum +
        ListCombosUseCase.evaluate(component, map.get(component.productId)).unitPrice *
          component.quantity,
      0,
    )
    if (ListCombosUseCase.money(normal) <= fixedPrice)
      throw new BadRequestError(
        'O preço fixo deve ser menor que o preço normal dos componentes.',
      )
  }
}
