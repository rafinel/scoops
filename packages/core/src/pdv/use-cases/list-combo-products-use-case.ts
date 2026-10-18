import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { CatalogSearchStrategy } from '#pdv/domain/strategies/catalog-search-strategy.ts'
import { PaginationParamsStrategy } from '#pdv/domain/strategies/pagination-params-strategy.ts'
import { PaginationSliceStrategy } from '#pdv/domain/strategies/pagination-slice-strategy.ts'
import { SalesCatalogAvailabilityStrategy } from '#pdv/domain/strategies/sales-catalog-availability-strategy.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import { SalesCatalogAvailability } from '#pdv/domain/structures/sales-catalog-availability.ts'
import type { SalesCatalogListItem } from '#pdv/domain/structures/sales-catalog-list-item.ts'
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
  implements UseCase<Request, PaginationResponse<SalesCatalogListItem>>
{
  private readonly availability = new SalesCatalogAvailabilityStrategy()
  private readonly catalogSearch = new CatalogSearchStrategy()
  private readonly paginationParams = new PaginationParamsStrategy()
  private readonly paginationSlice = new PaginationSliceStrategy<SalesCatalogListItem>()

  constructor(private readonly catalog: SalesCatalogProvider) {}

  async execute(request: Request): Promise<PaginationResponse<SalesCatalogListItem>> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    const { page, pageSize, isValid } = this.paginationParams.execute(request)
    const { search, isValid: isValidSearch } = this.catalogSearch.execute(request.search)
    if (!isValid || !isValidSearch)
      throw new BadRequestError('Os parâmetros de catálogo são inválidos.')

    try {
      const products = await this.catalog.findAllMatching({
        establishmentId: request.actor.establishmentId,
        search,
        kind: request.kind,
      })
      const items = this.revealItems(this.classify(products), search)
      return this.paginationSlice.execute({ items, page, pageSize })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }

  private classify(products: readonly SalesCatalogProduct[]): SalesCatalogListItem[] {
    return products.flatMap((product) => (product.isActive ? [this.toItem(product)] : []))
  }

  private toItem(product: SalesCatalogProduct): SalesCatalogListItem {
    const availability = this.availability.execute(product)

    return Object.assign({}, product, {
      availability,
      isAvailable: availability === SalesCatalogAvailability.Available,
    })
  }

  private revealItems(
    items: readonly SalesCatalogListItem[],
    search: string | undefined,
  ): readonly SalesCatalogListItem[] {
    if (search !== undefined) return items

    return items.filter(
      (item) => item.availability === SalesCatalogAvailability.Available,
    )
  }
}
