import type { ProductCatalogPage } from '#mrp/domain/structures/product-catalog-page.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import {
  ProductSortDirection,
  ProductSortField,
  type ProductListParams,
} from '#mrp/domain/structures/product-list-params.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = Omit<ProductListParams, 'establishmentId' | 'page' | 'pageSize'> & {
  actor: ProductActor
  page?: number
  pageSize?: number
}

export class ListProductsUseCase implements UseCase<Request, ProductCatalogPage> {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(request: Request): Promise<ProductCatalogPage> {
    this.validateActor(request.actor)

    const { actor, ...filters } = request

    return this.productsRepository.findMany({
      ...filters,
      establishmentId: actor.establishmentId,
      search: request.search?.trim() || undefined,
      categories: request.categories ? [...new Set(request.categories)] : undefined,
      usedAsAccompanimentId: request.usedAsAccompanimentId?.trim() || undefined,
      page: this.normalizePage(request.page),
      pageSize: this.normalizePageSize(request.pageSize),
      sortBy: request.sortBy ?? ProductSortField.CreatedAt,
      sortDirection: request.sortDirection ?? ProductSortDirection.Descending,
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem consultar os produtos.')
    }
  }

  private normalizePage(page = 1): number {
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestError('A página deve ser um número inteiro positivo.')
    }

    return page
  }

  private normalizePageSize(pageSize = 10): number {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestError('O tamanho da página deve estar entre 1 e 100.')
    }

    return pageSize
  }
}
