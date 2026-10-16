import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductSize } from '#mrp/domain/entities/product-size.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import type { ProductSalesConfiguration } from '#mrp/domain/structures/product-sales-configuration.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { NotFoundError } from '#shared/domain/errors/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'

type Request = {
  readonly scope: MrpDatabaseRepositories
  readonly establishmentId: string
  readonly productId: string
  readonly affectedProductIds?: readonly string[]
  readonly accompanimentProductIdForInverseLookup?: string
}

type AccompanimentSnapshot = {
  accompanimentId: string
  productId: string
  name: string
  type: string
  basePrice: number
  isActive: boolean
  updatedAt: Date
}

type ProductConfigurationSource = {
  sizes: readonly ProductSize[]
  links: readonly ProductAccompaniment[]
  resaleConfigurations: readonly ResaleConfiguration[]
  brands: readonly Brand[]
  accompanimentDetails: readonly AccompanimentSnapshot[]
}

type ProductConfigurationData = Pick<
  ProductSalesConfiguration,
  'sizes' | 'resaleConfigurations' | 'updatedAt'
>

export class GetAffectedProductSalesConfigurationsUseCase {
  private readonly accompanimentPriceValidation =
    new AccompanimentPriceValidationStrategy()

  async execute(request: Request): Promise<readonly ProductSalesConfiguration[]> {
    const inverseOwnerIds =
      request.affectedProductIds ??
      (await this.findInverseOwnerIds(
        request.scope,
        request.establishmentId,
        request.accompanimentProductIdForInverseLookup ?? request.productId,
      ))
    const productIds = this.uniqueProductIds([request.productId, ...inverseOwnerIds])
    const configurations: ProductSalesConfiguration[] = []

    for (const productId of productIds) {
      const configuration = await this.buildConfiguration(
        request.scope,
        request.establishmentId,
        productId,
      )
      if (configuration) configurations.push(configuration)
    }

    return configurations
  }

  private async findInverseOwnerIds(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<readonly string[]> {
    const links =
      (await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        accompanimentProductId,
      )) ?? []

    return this.uniqueProductIds(
      links
        .filter((link) => link.establishmentId === establishmentId)
        .map((link) => link.productId),
    )
  }

  private async buildConfiguration(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    productId: string,
  ): Promise<ProductSalesConfiguration | undefined> {
    const product = await scope.productsRepository.findById(establishmentId, productId)
    if (!product || product.establishmentId !== establishmentId) return undefined

    const source = await this.loadConfigurationSource(scope, establishmentId, product)
    return {
      establishmentId,
      productId: product.id,
      name: product.name,
      categories: product.categories,
      status: product.status,
      stockControl: product.stockControl,
      ...this.toConfigurationData(establishmentId, product, source),
    }
  }

  private async loadConfigurationSource(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<ProductConfigurationSource> {
    const [rawSizes, rawLinks, rawResaleConfigurations] = await Promise.all([
      scope.productSizesRepository.findManyByProductId(establishmentId, product.id),
      scope.productAccompanimentsRepository.findManyByProductId(
        establishmentId,
        product.id,
      ),
      scope.resaleConfigurationsRepository.findManyByProductId(
        establishmentId,
        product.id,
      ),
    ])
    const sizes = rawSizes ?? []
    const links = rawLinks ?? []
    const resaleConfigurations = rawResaleConfigurations ?? []
    const [brands, accompanimentDetails] = await Promise.all([
      this.loadBrands(scope, establishmentId, product),
      this.loadAccompanimentDetails(scope, establishmentId, product, links),
    ])

    return { sizes, links, resaleConfigurations, brands, accompanimentDetails }
  }

  private async loadBrands(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<readonly Brand[]> {
    if (product.stockControl !== ProductStockControl.ByBrand) return []
    return (
      (await scope.brandsRepository.findManyByProductId(establishmentId, product.id)) ??
      []
    )
  }

  private async loadAccompanimentDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
    links: readonly ProductAccompaniment[],
  ): Promise<readonly AccompanimentSnapshot[]> {
    const productLinks = links.filter(
      (link) => link.establishmentId === establishmentId && link.productId === product.id,
    )
    return Promise.all(
      productLinks.map((link) => this.buildAccompaniment(scope, establishmentId, link)),
    )
  }

  private toConfigurationData(
    establishmentId: string,
    product: Product,
    source: ProductConfigurationSource,
  ): ProductConfigurationData {
    return {
      sizes: this.buildSizeConfigurations(establishmentId, product.id, source),
      resaleConfigurations: this.buildResaleConfigurations(
        establishmentId,
        product.id,
        source,
      ),
      updatedAt: this.findLatestUpdatedAt([
        product.updatedAt,
        ...source.sizes.map((size) => size.updatedAt),
        ...source.links.map((link) => link.updatedAt),
        ...source.accompanimentDetails.map((accompaniment) => accompaniment.updatedAt),
        ...source.resaleConfigurations.map((configuration) => configuration.updatedAt),
        ...source.brands.map((brand) => brand.updatedAt),
      ]),
    }
  }

  private buildSizeConfigurations(
    establishmentId: string,
    productId: string,
    source: ProductConfigurationSource,
  ): ProductSalesConfiguration['sizes'] {
    return source.sizes
      .filter(
        (size) =>
          size.establishmentId === establishmentId && size.productId === productId,
      )
      .map((size) => this.toSizeConfiguration(size, source.accompanimentDetails))
  }

  private toSizeConfiguration(
    size: ProductSize,
    accompanimentDetails: readonly AccompanimentSnapshot[],
  ): ProductSalesConfiguration['sizes'][number] {
    return {
      sizeId: size.id,
      name: size.name,
      price: size.price,
      isActive: size.isActive,
      accompaniments: accompanimentDetails.map(
        ({ updatedAt: _updatedAt, ...accompaniment }) => accompaniment,
      ),
    }
  }

  private buildResaleConfigurations(
    establishmentId: string,
    productId: string,
    source: ProductConfigurationSource,
  ): ProductSalesConfiguration['resaleConfigurations'] {
    return source.resaleConfigurations
      .filter(
        (configuration) =>
          configuration.establishmentId === establishmentId &&
          configuration.productId === productId,
      )
      .map((configuration) => this.toResaleConfiguration(configuration, source.brands))
  }

  private toResaleConfiguration(
    configuration: ResaleConfiguration,
    brands: readonly Brand[],
  ): ProductSalesConfiguration['resaleConfigurations'][number] {
    const brand = configuration.brandId
      ? brands.find((candidate) => candidate.id === configuration.brandId)
      : undefined
    return {
      ...(configuration.brandId ? { brandId: configuration.brandId } : {}),
      ...(brand ? { brandName: brand.name } : {}),
      price: configuration.price,
      isActive: configuration.isActive,
    }
  }

  private async buildAccompaniment(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    link: ProductAccompaniment,
  ): Promise<AccompanimentSnapshot> {
    const [product, type] = await Promise.all([
      scope.productsRepository.findById(establishmentId, link.accompanimentProductId),
      scope.accompanimentTypesRepository.findById(
        establishmentId,
        link.accompanimentTypeId,
      ),
    ])
    if (
      !product ||
      product.establishmentId !== establishmentId ||
      !type ||
      type.establishmentId !== establishmentId
    ) {
      throw new NotFoundError('A configuração de acompanhamento não foi encontrada.')
    }

    const validatedPrice = this.accompanimentPriceValidation.execute(
      product.accompanimentPrice,
    )
    const basePrice = typeof validatedPrice === 'number' ? validatedPrice : undefined
    return {
      accompanimentId: link.id,
      productId: product.id,
      name: product.name,
      type: type.name,
      basePrice: basePrice ?? 0,
      isActive: product.status === 'active' && basePrice !== undefined,
      updatedAt: this.findLatestUpdatedAt([
        link.updatedAt,
        product.updatedAt,
        type.updatedAt,
      ]),
    }
  }

  private uniqueProductIds(productIds: readonly string[]): readonly string[] {
    return [...new Set(productIds)]
  }

  private findLatestUpdatedAt(updatedAts: readonly Date[]): Date {
    return new Date(Math.max(...updatedAts.map((updatedAt) => updatedAt.getTime())))
  }
}

export async function publishAffectedProductSalesConfigurations(request: {
  readonly scope: MrpDatabaseRepositories
  readonly establishmentId: string
  readonly productId: string
  readonly configurations: readonly ProductSalesConfiguration[]
  readonly deleted?: boolean
}): Promise<void> {
  for (const configuration of request.configurations) {
    await request.scope.eventsRepository.add(
      new ProductSalesConfigurationChangedEvent({
        establishmentId: request.establishmentId,
        productId: configuration.productId,
        state: 'available',
        configuration,
      }),
    )
  }
  if (request.deleted) {
    await request.scope.eventsRepository.add(
      new ProductSalesConfigurationChangedEvent({
        establishmentId: request.establishmentId,
        productId: request.productId,
        state: 'deleted',
        configuration: null,
      }),
    )
  }
}
