import type { Product } from '@scoops/core/mrp/domain/entities'
import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import {
  ProductCategory,
  ProductSortDirection,
  ProductSortField,
  ProductStatus,
  ProductStockControl,
  type ProductCatalogPage,
} from '@scoops/core/mrp/domain/structures'
import type {
  SaleItemKind,
  SalesCatalogAccompaniment,
  SalesCatalogBrand,
  SalesCatalogProduct,
  SalesCatalogSize,
} from '@scoops/core/pdv/domain/structures'
import type { SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { ServiceUnavailableError } from '@scoops/core/shared/domain/errors'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
type ProductCatalogRow = ProductCatalogPage['items'][number]
type StockBalance = Awaited<
  ReturnType<StockBalancesRepository['findManyByProductId']>
>[number]
type EnrichedSalesCatalogAccompaniment = SalesCatalogAccompaniment & {
  readonly productId: string
  readonly brandId?: string
  readonly availableQuantity: number
}

export class TransactionBoundSalesCatalogProvider implements SalesCatalogProvider {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productSizesRepository: ProductSizesRepository,
    private readonly productAccompanimentsRepository: ProductAccompanimentsRepository,
    private readonly accompanimentTypesRepository: AccompanimentTypesRepository,
    private readonly resaleConfigurationsRepository: ResaleConfigurationsRepository,
    private readonly brandsRepository: BrandsRepository,
    private readonly stockBalancesRepository: StockBalancesRepository,
  ) {}

  async findProductIdsByName(
    establishmentId: string,
    search: string,
  ): Promise<readonly string[]> {
    return this.runSafely(async () => {
      const query = {
        establishmentId,
        search,
        page: 1,
        pageSize: 50,
        sortBy: ProductSortField.Name,
        sortDirection: ProductSortDirection.Ascending,
      } satisfies Parameters<ProductsRepository['findMany']>[0]
      const firstPage = await this.productsRepository.findMany(query)
      const pages = await this.loadProductPages(query, firstPage)
      return [
        ...new Set(
          pages.flatMap((page) =>
            page.items
              .filter(({ product }) => product.establishmentId === establishmentId)
              .map(({ product }) => product.id),
          ),
        ),
      ]
    })
  }

  async findByProductIds(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly SalesCatalogProduct[]> {
    if (productIds.length === 0) return []

    return this.runSafely(async () => {
      const uniqueProductIds = [...new Set(productIds)]
      const products = await Promise.all(
        uniqueProductIds.map((productId) =>
          this.productsRepository.findById(establishmentId, productId),
        ),
      )
      const mappedProducts = await Promise.all(
        products.map((product) =>
          product
            ? this.mapProduct(establishmentId, product)
            : Promise.resolve(undefined),
        ),
      )
      return mappedProducts.filter(
        (product): product is SalesCatalogProduct => product !== undefined,
      )
    })
  }

  async findByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<SalesCatalogProduct | undefined> {
    return this.runSafely(async () => {
      const product = await this.productsRepository.findById(establishmentId, productId)
      if (!product) return undefined
      return this.mapProduct(establishmentId, product)
    })
  }

  async findMany(input: {
    readonly establishmentId: string
    readonly search?: string
    readonly page: number
    readonly pageSize: number
    readonly kind?: SaleItemKind
  }): Promise<PaginationResponse<SalesCatalogProduct>> {
    return this.runSafely(async () => {
      const query = {
        establishmentId: input.establishmentId,
        search: input.search,
        categories: input.kind
          ? [input.kind]
          : [ProductCategory.Portion, ProductCategory.Resale],
        status: ProductStatus.Active,
        page: 1,
        pageSize: input.pageSize,
        sortBy: ProductSortField.Name,
        sortDirection: ProductSortDirection.Ascending,
      } satisfies Parameters<ProductsRepository['findMany']>[0]
      const firstPage = await this.productsRepository.findMany(query)
      const pages = await this.loadProductPages(query, firstPage)
      const products = await Promise.all(
        pages.flatMap((page) =>
          page.items.map((row) =>
            this.mapProduct(input.establishmentId, row.product, row),
          ),
        ),
      )
      const eligibleProducts = products.filter(
        (product): product is SalesCatalogProduct =>
          product !== undefined && this.isEligible(product),
      )
      const start = (input.page - 1) * input.pageSize
      const items = eligibleProducts.slice(start, start + input.pageSize)
      return new PaginationResponse(
        items,
        input.page,
        input.pageSize,
        eligibleProducts.length,
        Math.ceil(eligibleProducts.length / input.pageSize),
      )
    })
  }

  private isEligible(product: SalesCatalogProduct): boolean {
    if (!product.isActive) return false
    if (product.kind === 'portion')
      return product.sizes.some(
        (size) => size.isActive && Number.isFinite(size.basePrice) && size.basePrice >= 0,
      )
    if (product.stockControl === ProductStockControl.Single)
      return (
        product.resalePrice !== undefined &&
        Number.isFinite(product.resalePrice) &&
        product.resalePrice >= 0
      )
    return product.resaleBrands.some(
      (brand) =>
        brand.isActive && Number.isFinite(brand.basePrice) && brand.basePrice >= 0,
    )
  }

  private async mapProduct(
    establishmentId: string,
    product: Product,
    catalogRow?: ProductCatalogRow,
  ): Promise<SalesCatalogProduct | undefined> {
    if (product.establishmentId !== establishmentId) return undefined
    const kind = this.getProductKind(product)
    if (!kind) return undefined

    const stockBalances =
      catalogRow &&
      (kind === 'portion' || product.stockControl === ProductStockControl.Single)
        ? []
        : await this.stockBalancesRepository.findManyByProductId(
            establishmentId,
            product.id,
          )
    const stockQuantity =
      catalogRow?.stockQuantity ?? this.getTotalStockQuantity(stockBalances)
    const productIsActive = product.status === ProductStatus.Active

    if (kind === 'portion') {
      const [rawSizes, links] = await Promise.all([
        this.productSizesRepository.findManyByProductId(establishmentId, product.id),
        this.productAccompanimentsRepository.findManyByProductId(
          establishmentId,
          product.id,
        ),
      ])
      const sizes = rawSizes.filter(
        (size) =>
          size.establishmentId === establishmentId && size.productId === product.id,
      )
      const scopedLinks = links.filter(
        (link) =>
          link.establishmentId === establishmentId && link.productId === product.id,
      )
      const accompaniments = await Promise.all(
        scopedLinks.map((link) => this.mapAccompaniment(establishmentId, link)),
      )
      const mappedSizes = sizes.map((size) =>
        this.mapSize(size, accompaniments, stockQuantity, productIsActive),
      )
      const isAvailable = mappedSizes.some((size) => size.isActive && size.isAvailable)
      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        kind,
        stockControl: product.stockControl,
        isActive: product.status === ProductStatus.Active,
        isAvailable,
        sizes: mappedSizes,
        resaleBrands: [],
      }
    }

    const [rawResaleConfigurations, rawBrands] = await Promise.all([
      this.resaleConfigurationsRepository.findManyByProductId(
        establishmentId,
        product.id,
      ),
      product.stockControl === ProductStockControl.ByBrand
        ? this.brandsRepository.findManyByProductId(establishmentId, product.id)
        : Promise.resolve([]),
    ])
    const resaleConfigurations = rawResaleConfigurations.filter(
      (configuration) =>
        configuration.establishmentId === establishmentId &&
        configuration.productId === product.id,
    )
    const brands = rawBrands.filter((brand) => brand.productId === product.id)

    if (product.stockControl === ProductStockControl.Single) {
      const configuration = resaleConfigurations.find(
        (candidate) => candidate.brandId === undefined,
      )
      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        kind,
        stockControl: product.stockControl,
        isActive: product.status === ProductStatus.Active,
        isAvailable: Boolean(
          productIsActive && configuration?.isActive && stockQuantity >= 1,
        ),
        sizes: [],
        ...(configuration?.isActive ? { resalePrice: configuration.price } : {}),
        resaleBrands: [],
      }
    }

    const mappedBrands = brands.map((brand): SalesCatalogBrand => {
      const configuration = resaleConfigurations.find(
        (candidate) => candidate.brandId === brand.id,
      )
      const isActive = Boolean(configuration?.isActive)
      return {
        brandId: brand.id,
        name: brand.name,
        basePrice: configuration?.price ?? 0,
        isActive,
        isAvailable:
          productIsActive &&
          isActive &&
          this.getStockQuantity(stockBalances, brand.id) >= 1,
      }
    })
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      kind,
      stockControl: product.stockControl,
      isActive: product.status === ProductStatus.Active,
      isAvailable: mappedBrands.some((brand) => brand.isActive && brand.isAvailable),
      sizes: [],
      resaleBrands: mappedBrands,
    }
  }

  private mapSize(
    size: Awaited<ReturnType<ProductSizesRepository['findManyByProductId']>>[number],
    accompaniments: readonly SalesCatalogAccompaniment[],
    stockQuantity: number,
    productIsActive: boolean,
  ): SalesCatalogSize {
    return {
      sizeId: size.id,
      name: size.name,
      quantity: size.quantity,
      basePrice: size.price,
      isActive: size.isActive,
      isAvailable: productIsActive && size.isActive && stockQuantity >= size.quantity,
      accompaniments,
    }
  }

  private async mapAccompaniment(
    establishmentId: string,
    link: Awaited<
      ReturnType<ProductAccompanimentsRepository['findManyByProductId']>
    >[number],
  ): Promise<EnrichedSalesCatalogAccompaniment> {
    const [product, type, brands, balances] = await Promise.all([
      this.productsRepository.findById(establishmentId, link.accompanimentProductId),
      this.accompanimentTypesRepository.findById(
        establishmentId,
        link.accompanimentTypeId,
      ),
      this.brandsRepository.findManyByProductId(
        establishmentId,
        link.accompanimentProductId,
      ),
      this.stockBalancesRepository.findManyByProductId(
        establishmentId,
        link.accompanimentProductId,
      ),
    ])
    const source = this.resolveAccompanimentSource(product, brands)
    const availableQuantity = this.getStockQuantity(balances, source?.brandId)
    const isActive = Boolean(
      type?.establishmentId === establishmentId && source?.isActive,
    )
    return {
      accompanimentId: link.id,
      productId: link.accompanimentProductId,
      ...(source?.brandId ? { brandId: source.brandId } : {}),
      name: product?.name ?? 'Acompanhamento indisponível',
      type: type?.name ?? 'Tipo indisponível',
      quantityPerPortion: link.quantityPerPortion,
      basePrice: source?.price ?? 0,
      isActive,
      isAvailable: isActive && availableQuantity >= link.quantityPerPortion,
      availableQuantity,
    }
  }

  private resolveAccompanimentSource(
    product: Product | undefined,
    brands: Awaited<ReturnType<BrandsRepository['findManyByProductId']>>,
  ):
    | { readonly brandId?: string; readonly price: number; readonly isActive: boolean }
    | undefined {
    if (
      !product ||
      product.status !== ProductStatus.Active ||
      !product.categories.includes(ProductCategory.Accompaniment)
    )
      return undefined

    if (product.stockControl === ProductStockControl.Single) {
      return product.currentUnitCost === undefined
        ? undefined
        : { price: product.currentUnitCost, isActive: true }
    }

    const primaryBrand = brands.find((brand) => brand.isPrimary)
    if (!primaryBrand || primaryBrand.packageQuantity <= 0) return undefined
    return {
      brandId: primaryBrand.id,
      price: primaryBrand.packagePrice / primaryBrand.packageQuantity,
      isActive: true,
    }
  }

  private getProductKind(product: Product): SaleItemKind | undefined {
    if (product.categories.includes(ProductCategory.Portion)) return 'portion'
    if (product.categories.includes(ProductCategory.Resale)) return 'resale'
    return undefined
  }

  private getTotalStockQuantity(stockBalances: readonly StockBalance[]): number {
    return stockBalances.reduce((total, balance) => total + balance.quantity, 0)
  }

  private getStockQuantity(
    stockBalances: readonly StockBalance[],
    brandId?: string,
  ): number {
    if (brandId) {
      return stockBalances
        .filter((balance) => balance.brandId === brandId)
        .reduce((total, balance) => total + balance.quantity, 0)
    }
    return this.getTotalStockQuantity(stockBalances)
  }

  private async loadProductPages(
    query: Parameters<ProductsRepository['findMany']>[0],
    firstPage: ProductCatalogPage,
  ): Promise<readonly ProductCatalogPage[]> {
    if (firstPage.totalPages <= 1) return [firstPage]
    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        this.productsRepository.findMany({
          ...query,
          page: index + 2,
        }),
      ),
    )
    return [firstPage, ...remainingPages]
  }

  private async runSafely<Result>(operation: () => Promise<Result>): Promise<Result> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error
      throw new ServiceUnavailableError('O catálogo de produtos está indisponível.')
    }
  }
}
