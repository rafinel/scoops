import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { ComboCreate } from '#pdv/domain/structures/combo-create.ts'
import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import { DiscountCreatedEvent } from '#pdv/domain/events/discount-created-event.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'
type Request = Omit<ComboCreate, 'establishmentId'> & { readonly actor: ComboActor }
export class RegisterComboUseCase implements UseCase<Request, ComboDetails> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly catalog: SalesCatalogProvider,
    private readonly broker: Broker,
  ) {}
  async execute(request: Request): Promise<ComboDetails> {
    this.guard(request.actor)
    const name = request.name.trim()
    if (!name || name.length > 120)
      throw new BadRequestError('O nome deve ter entre 1 e 120 caracteres.')
    ListCombosUseCase.validateComponents(request.components)
    ListCombosUseCase.validatePrice(request.fixedPrice)
    if (!Object.values(DiscountStatus).includes(request.status))
      throw new BadRequestError('O status do combo é inválido.')
    const products = await this.products(
      request.actor.establishmentId,
      request.components,
    )
    this.validateAvailability(request.components, products, request.status)
    const combo = await this.database.run(async (scope) => {
      const existing = await scope.discountsRepository.findByNormalizedName(
        request.actor.establishmentId,
        name.toLowerCase(),
      )
      if (existing)
        throw new ConflictError('Já existe um combo com esse nome neste estabelecimento.')
      return scope.discountsRepository.add({
        establishmentId: request.actor.establishmentId,
        name,
        status: request.status,
        fixedPrice: request.fixedPrice,
        components: request.components,
      })
    })
    await this.broker.publish(
      new DiscountCreatedEvent({
        discountId: combo.id,
        establishmentId: combo.establishmentId,
        type: combo.type,
        createdAt: combo.createdAt,
      }),
    )
    return ListCombosUseCase.details(
      combo,
      new Map(products.map((product) => [product.productId, product])),
    )
  }
  private guard(actor: ComboActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
  }
  private async products(
    establishmentId: string,
    components: readonly DiscountComponent[],
  ) {
    try {
      const products = await this.catalog.findByProductIds(establishmentId, [
        ...new Set(components.map((component) => component.productId)),
      ])
      return products
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }
  private validateAvailability(
    components: readonly DiscountComponent[],
    products: readonly import('#pdv/domain/structures/sales-catalog-product.ts').SalesCatalogProduct[],
    status: string,
  ): void {
    if (status !== DiscountStatus.Active) return
    const map = new Map(products.map((product) => [product.productId, product]))
    for (const component of components) {
      const result = ListCombosUseCase.evaluate(component, map.get(component.productId))
      if (!result.valid)
        throw new BadRequestError(
          'Todos os componentes de um combo ativo devem estar disponíveis.',
        )
    }
    const normal = components.reduce(
      (sum, component) =>
        sum +
        ListCombosUseCase.evaluate(component, map.get(component.productId)).unitPrice *
          component.quantity,
      0,
    )
    if (ListCombosUseCase.money(normal) <= 0)
      throw new BadRequestError(
        'O preço fixo deve ser menor que o preço normal dos componentes.',
      )
  }
}
