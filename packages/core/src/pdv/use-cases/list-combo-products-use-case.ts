import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogListParams } from '#pdv/domain/structures/sales-catalog-list-params.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AppError,
  AuthorizationError,
  BadRequestError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
type Request = Omit<SalesCatalogListParams, 'establishmentId' | 'page' | 'pageSize'> & {
  readonly actor: ComboActor
  readonly kind?: SaleItemKind
  readonly page?: number
  readonly pageSize?: number
}
export class ListComboProductsUseCase
  implements UseCase<Request, PaginationResponse<SalesCatalogProduct>>
{
  constructor(private readonly catalog: SalesCatalogProvider) {}
  async execute(request: Request): Promise<PaginationResponse<SalesCatalogProduct>> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    const page = request.page ?? 1,
      pageSize = request.pageSize ?? 20,
      search = request.search?.trim()
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50 ||
      (search && search.length > 120)
    )
      throw new BadRequestError('Os parâmetros de catálogo são inválidos.')
    try {
      return await this.catalog.findMany({
        establishmentId: request.actor.establishmentId,
        search,
        kind: request.kind,
        page,
        pageSize,
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }
}
