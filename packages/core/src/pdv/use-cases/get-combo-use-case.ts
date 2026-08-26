import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { ComboDetails } from '#pdv/domain/structures/combo-details.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'
type Request = { readonly actor: ComboActor; readonly comboId: string }
export class GetComboUseCase implements UseCase<Request, ComboDetails> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly catalog: SalesCatalogProvider,
  ) {}
  async execute(request: Request): Promise<ComboDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    const combo = await this.database.run((scope) =>
      scope.discountsRepository.findById(request.actor.establishmentId, request.comboId),
    )
    if (!combo || combo.establishmentId !== request.actor.establishmentId)
      throw new NotFoundError('Combo não encontrado.')
    try {
      const products = await this.catalog.findByProductIds(
        request.actor.establishmentId,
        [...new Set(combo.components.map((component) => component.productId))],
      )
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
}
