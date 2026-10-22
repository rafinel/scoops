import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { AccompanimentPortionDetails } from '#mrp/domain/structures/accompaniment-portion-details.ts'
import type { AccompanimentPortionListParams } from '#mrp/domain/structures/accompaniment-portion-list-params.ts'
import type { AccompanimentPortionsPage } from '#mrp/domain/structures/accompaniment-portions-page.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { AccompanimentPortionDetailsStrategy } from '#mrp/domain/strategies/accompaniment-portion-details-strategy.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

type ItemFacts = {
  readonly portions: readonly Product[]
  readonly types: readonly AccompanimentType[]
  readonly brands: readonly Brand[]
  readonly global?: GlobalAccompaniment
  readonly accompanimentLinksCount: number
}

type Request = Pick<AccompanimentPortionListParams, 'search'> & {
  readonly actor: ProductActor
  readonly productId: string
  readonly page?: number
  readonly pageSize?: number
}

export class ListAccompanimentPortionsUseCase
  implements UseCase<Request, AccompanimentPortionsPage>
{
  private readonly portionDetails = new AccompanimentPortionDetailsStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<AccompanimentPortionsPage> {
    this.validateActor(request.actor)
    const page = this.normalizePage(request.page)
    const pageSize = this.normalizePageSize(request.pageSize)

    return this.database.run((scope) => this.list(scope, request, page, pageSize))
  }

  private async list(
    scope: MrpDatabaseRepositories,
    request: Request,
    page: number,
    pageSize: number,
  ): Promise<AccompanimentPortionsPage> {
    const establishmentId = request.actor.establishmentId
    const accompanimentProduct = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateAccompanimentProduct(accompanimentProduct, establishmentId)

    const result = await this.readPage(scope, {
      establishmentId,
      accompanimentProductId: accompanimentProduct.id,
      search: request.search?.trim() || undefined,
      page,
      pageSize,
    })
    const [items, hasPortionProducts] = await Promise.all([
      this.buildItems(scope, accompanimentProduct, result.items),
      scope.productsRepository.existsByCategory(establishmentId, ProductCategory.Portion),
    ])
    return this.toPage(result, items, hasPortionProducts)
  }

  private toPage(
    result: PaginationResponse<ProductAccompaniment>,
    items: AccompanimentPortionsPage['items'],
    hasPortionProducts: boolean,
  ): AccompanimentPortionsPage {
    return {
      items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      hasPortionProducts,
    }
  }

  private async readPage(
    scope: MrpDatabaseRepositories,
    params: AccompanimentPortionListParams,
  ): Promise<PaginationResponse<ProductAccompaniment>> {
    const result =
      await scope.productAccompanimentsRepository.findPageByAccompanimentProductId(params)
    if (result.totalPages > 0 && params.page > result.totalPages) {
      return scope.productAccompanimentsRepository.findPageByAccompanimentProductId({
        ...params,
        page: result.totalPages,
      })
    }
    return result
  }

  private async buildItems(
    scope: MrpDatabaseRepositories,
    accompanimentProduct: Product,
    links: readonly ProductAccompaniment[],
  ): Promise<AccompanimentPortionsPage['items']> {
    if (links.length === 0) return []

    const facts = await this.loadItemFacts(scope, accompanimentProduct, links)
    return links.map((link) => this.toItem(accompanimentProduct, link, facts))
  }

  private async loadItemFacts(
    scope: MrpDatabaseRepositories,
    accompanimentProduct: Product,
    links: readonly ProductAccompaniment[],
  ): Promise<ItemFacts> {
    const establishmentId = accompanimentProduct.establishmentId
    const [portions, types, brands, global, accompanimentLinksCount] = await Promise.all([
      scope.productsRepository.findManyByIds(
        establishmentId,
        links.map((link) => link.productId),
      ),
      this.findTypes(scope, establishmentId, links),
      scope.brandsRepository.findManyByProductId(
        establishmentId,
        accompanimentProduct.id,
      ),
      scope.globalAccompanimentsRepository.findByAccompanimentProductId(
        establishmentId,
        accompanimentProduct.id,
      ),
      scope.productAccompanimentsRepository.countByAccompanimentProductId(
        establishmentId,
        accompanimentProduct.id,
      ),
    ])
    return { portions, types, brands, global, accompanimentLinksCount }
  }

  private toItem(
    accompanimentProduct: Product,
    link: ProductAccompaniment,
    { portions, types, brands, global, accompanimentLinksCount }: ItemFacts,
  ): AccompanimentPortionDetails {
    const { establishmentId } = accompanimentProduct
    return this.portionDetails.execute({
      link,
      portion: this.requireInTenant(
        portions,
        link.productId,
        establishmentId,
        'Porção não encontrada.',
      ),
      accompanimentProduct,
      accompanimentType: this.requireInTenant(
        types,
        link.accompanimentTypeId,
        establishmentId,
        'Tipo de acompanhamento não encontrado.',
      ),
      brands,
      global: link.globalAccompanimentId === global?.id ? global : undefined,
      accompanimentLinksCount,
    })
  }

  private async findTypes(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    links: readonly ProductAccompaniment[],
  ) {
    const typeIds = [...new Set(links.map((link) => link.accompanimentTypeId))]
    const types = await Promise.all(
      typeIds.map((typeId) =>
        scope.accompanimentTypesRepository.findById(establishmentId, typeId),
      ),
    )
    return types.filter((type) => type !== undefined)
  }

  private requireInTenant<Row extends { id: string; establishmentId: string }>(
    rows: readonly Row[],
    id: string,
    establishmentId: string,
    message: string,
  ): Row {
    const row = rows.find(
      (candidate) => candidate.id === id && candidate.establishmentId === establishmentId,
    )
    if (!row) throw new NotFoundError(message)
    return row
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

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator) {
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar porções.',
      )
    }
  }

  private validateAccompanimentProduct(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
    if (
      !product.categories.includes(ProductCategory.Accompaniment) ||
      product.categories.includes(ProductCategory.Portion)
    ) {
      throw new BadRequestError(
        'O produto não é um acompanhamento elegível para porções.',
      )
    }
  }
}
