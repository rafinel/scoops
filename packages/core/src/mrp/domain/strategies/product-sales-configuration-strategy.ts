import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductSize } from '#mrp/domain/entities/product-size.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import type { ProductSalesConfigurationSource } from '#mrp/domain/structures/product-sales-configuration-source.ts'
import type { ProductSalesConfiguration } from '#mrp/domain/structures/product-sales-configuration.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import { NotFoundError } from '#shared/domain/errors/index.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export type ProductSalesConfigurationStrategyInput = {
  readonly establishmentId: string
  readonly sources: readonly ProductSalesConfigurationSource[]
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

export class ProductSalesConfigurationStrategy
  implements
    BusinessRuleStrategy<
      ProductSalesConfigurationStrategyInput,
      readonly ProductSalesConfiguration[]
    >
{
  constructor(
    private readonly accompanimentPriceValidation = new AccompanimentPriceValidationStrategy(),
  ) {}

  execute({
    establishmentId,
    sources,
  }: ProductSalesConfigurationStrategyInput): readonly ProductSalesConfiguration[] {
    return sources
      .filter((source) => source.product.establishmentId === establishmentId)
      .map((source) => this.buildConfiguration(establishmentId, source))
  }

  private buildConfiguration(
    establishmentId: string,
    source: ProductSalesConfigurationSource,
  ): ProductSalesConfiguration {
    const { product } = source
    const brands = this.resolveBrands(source)
    const accompaniments = this.buildAccompanimentSnapshots(establishmentId, source)

    return {
      establishmentId,
      productId: product.id,
      name: product.name,
      categories: product.categories,
      status: product.status,
      stockControl: product.stockControl,
      sizes: this.buildSizeConfigurations(establishmentId, source, accompaniments),
      resaleConfigurations: this.buildResaleConfigurations(
        establishmentId,
        source,
        brands,
      ),
      updatedAt: this.findLatestFactUpdatedAt(source, accompaniments, brands),
    }
  }

  private findLatestFactUpdatedAt(
    source: ProductSalesConfigurationSource,
    accompaniments: readonly AccompanimentSnapshot[],
    brands: readonly Brand[],
  ): Date {
    return this.findLatestUpdatedAt([
      source.product.updatedAt,
      ...source.sizes.map((size) => size.updatedAt),
      ...source.links.map((link) => link.updatedAt),
      ...accompaniments.map((accompaniment) => accompaniment.updatedAt),
      ...source.resaleConfigurations.map((configuration) => configuration.updatedAt),
      ...brands.map((brand) => brand.updatedAt),
    ])
  }

  private resolveBrands(source: ProductSalesConfigurationSource): readonly Brand[] {
    return source.product.stockControl === ProductStockControl.ByBrand
      ? source.brands
      : []
  }

  private buildSizeConfigurations(
    establishmentId: string,
    source: ProductSalesConfigurationSource,
    accompaniments: readonly AccompanimentSnapshot[],
  ): ProductSalesConfiguration['sizes'] {
    return source.sizes
      .filter((size) => this.belongsToProduct(size, establishmentId, source.product))
      .map((size) => this.toSizeConfiguration(size, accompaniments))
  }

  private toSizeConfiguration(
    size: ProductSize,
    accompaniments: readonly AccompanimentSnapshot[],
  ): ProductSalesConfiguration['sizes'][number] {
    return {
      sizeId: size.id,
      name: size.name,
      price: size.price,
      isActive: size.isActive,
      accompaniments: accompaniments.map(
        ({ updatedAt: _updatedAt, ...accompaniment }) => accompaniment,
      ),
    }
  }

  private buildResaleConfigurations(
    establishmentId: string,
    source: ProductSalesConfigurationSource,
    brands: readonly Brand[],
  ): ProductSalesConfiguration['resaleConfigurations'] {
    return source.resaleConfigurations
      .filter((configuration) =>
        this.belongsToProduct(configuration, establishmentId, source.product),
      )
      .map((configuration) => this.toResaleConfiguration(configuration, brands))
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

  private buildAccompanimentSnapshots(
    establishmentId: string,
    source: ProductSalesConfigurationSource,
  ): readonly AccompanimentSnapshot[] {
    return source.links
      .filter((link) => this.belongsToProduct(link, establishmentId, source.product))
      .map((link) => this.buildAccompanimentSnapshot(establishmentId, source, link))
  }

  private buildAccompanimentSnapshot(
    establishmentId: string,
    source: ProductSalesConfigurationSource,
    link: ProductAccompaniment,
  ): AccompanimentSnapshot {
    const product = this.findInTenant(
      source.accompanimentProducts,
      link.accompanimentProductId,
      establishmentId,
    )
    const type = this.findInTenant(
      source.accompanimentTypes,
      link.accompanimentTypeId,
      establishmentId,
    )
    const global =
      link.globalAccompanimentId === undefined
        ? undefined
        : this.findInTenant(source.globals, link.globalAccompanimentId, establishmentId)
    const isMissingGlobal = link.globalAccompanimentId !== undefined && !global
    if (!product || !type || isMissingGlobal) {
      throw new NotFoundError('A configuração de acompanhamento não foi encontrada.')
    }

    return this.toAccompanimentSnapshot(link, product, type, global)
  }

  private toAccompanimentSnapshot(
    link: ProductAccompaniment,
    product: Product,
    type: AccompanimentType,
    global: GlobalAccompaniment | undefined,
  ): AccompanimentSnapshot {
    const validatedPrice = this.accompanimentPriceValidation.execute(
      (global ?? link).accompanimentPrice,
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
        ...(global ? [global.updatedAt] : []),
      ]),
    }
  }

  private belongsToProduct(
    row: { establishmentId: string; productId: string },
    establishmentId: string,
    product: Product,
  ): boolean {
    return row.establishmentId === establishmentId && row.productId === product.id
  }

  private findInTenant<Row extends { id: string; establishmentId: string }>(
    rows: readonly Row[],
    id: string,
    establishmentId: string,
  ): Row | undefined {
    return rows.find((row) => row.id === id && row.establishmentId === establishmentId)
  }

  private findLatestUpdatedAt(updatedAts: readonly Date[]): Date {
    return new Date(Math.max(...updatedAts.map((updatedAt) => updatedAt.getTime())))
  }
}
