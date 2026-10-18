import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { CatalogSearchStrategy } from '#pdv/domain/strategies/catalog-search-strategy.ts'
import { PaginationParamsStrategy } from '#pdv/domain/strategies/pagination-params-strategy.ts'
import { PaginationSliceStrategy } from '#pdv/domain/strategies/pagination-slice-strategy.ts'
import { SalesCatalogAvailabilityStrategy } from '#pdv/domain/strategies/sales-catalog-availability-strategy.ts'
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
  readonly actor: {
    readonly establishmentId: string
    readonly profile: UserProfile
  }
  readonly kind?: SaleItemKind
  readonly page?: number
  readonly pageSize?: number
}

export class ListOrderCatalogUseCase
  implements UseCase<Request, PaginationResponse<SalesCatalogListItem>>
{
  private readonly availability = new SalesCatalogAvailabilityStrategy()
  private readonly catalogSearch = new CatalogSearchStrategy()
  private readonly paginationParams = new PaginationParamsStrategy()
  private readonly paginationSlice = new PaginationSliceStrategy<SalesCatalogListItem>()

  constructor(private readonly catalog: SalesCatalogProvider) {}

  async execute(request: Request): Promise<PaginationResponse<SalesCatalogListItem>> {
    this.validateActor(request.actor.profile)
    const { page, pageSize, isValid } = this.paginationParams.execute(request)
    if (!isValid) throw new BadRequestError('Os parâmetros de catálogo são inválidos.')
    this.validateKind(request.kind)
    const { search, isValid: isValidSearch } = this.catalogSearch.execute(request.search)
    if (!isValidSearch)
      throw new BadRequestError('A busca deve ter no máximo 120 caracteres.')

    try {
      const products = await this.catalog.findAllMatching({
        establishmentId: request.actor.establishmentId,
        search,
        kind: request.kind,
      })
      const items = this.listItems(products, search)
      return this.paginationSlice.execute({ items, page, pageSize })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'Não foi possível consultar o catálogo de produtos.',
      )
    }
  }

  private validateKind(kind: SaleItemKind | undefined): void {
    if (kind === undefined || kind === 'portion' || kind === 'resale') return
    throw new BadRequestError('O tipo do catálogo é inválido.')
  }

  private listItems(
    products: readonly SalesCatalogProduct[],
    search: string | undefined,
  ): readonly SalesCatalogListItem[] {
    return products
      .filter((product) => product.isActive)
      .map((product) => this.toListItem(product))
      .filter((item) => this.isListed(item, search))
  }

  private toListItem(product: SalesCatalogProduct): SalesCatalogListItem {
    const availability = this.availability.execute(product)
    const isAvailable = availability === SalesCatalogAvailability.Available

    return { ...product, availability, isAvailable }
  }

  private isListed(item: SalesCatalogListItem, search: string | undefined): boolean {
    return (
      search !== undefined || item.availability === SalesCatalogAvailability.Available
    )
  }

  private validateActor(profile: UserProfile): void {
    if (profile !== UserProfile.Manager && profile !== UserProfile.Operator)
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar o catálogo.',
      )
  }
}
