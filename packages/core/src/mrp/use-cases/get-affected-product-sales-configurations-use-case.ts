import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductSalesConfiguration } from '#mrp/domain/structures/product-sales-configuration.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { NotFoundError } from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'

type Request = {
  readonly scope: MrpDatabaseScope
  readonly establishmentId: string
  readonly productId: string
  readonly affectedProductIds?: readonly string[]
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

export class GetAffectedProductSalesConfigurationsUseCase {
  async execute(request: Request): Promise<readonly ProductSalesConfiguration[]> {
    const inverseOwnerIds =
      request.affectedProductIds ??
      (await this.findInverseOwnerIds(
        request.scope,
        request.establishmentId,
        request.productId,
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
    scope: MrpDatabaseScope,
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
    scope: MrpDatabaseScope,
    establishmentId: string,
    productId: string,
  ): Promise<ProductSalesConfiguration | undefined> {
    const product = await scope.productsRepository.findById(establishmentId, productId)
    if (!product || product.establishmentId !== establishmentId) return undefined

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
    const brands =
      product.stockControl === ProductStockControl.ByBrand
        ? ((await scope.brandsRepository.findManyByProductId(
            establishmentId,
            product.id,
          )) ?? [])
        : []
    const accompanimentDetails = await Promise.all(
      links
        .filter(
          (link) =>
            link.establishmentId === establishmentId && link.productId === product.id,
        )
        .map((link) => this.buildAccompaniment(scope, establishmentId, link)),
    )

    const updatedAt = this.findLatestUpdatedAt([
      product.updatedAt,
      ...sizes.map((size) => size.updatedAt),
      ...links.map((link) => link.updatedAt),
      ...accompanimentDetails.map((accompaniment) => accompaniment.updatedAt),
      ...resaleConfigurations.map((configuration) => configuration.updatedAt),
      ...brands.map((brand) => brand.updatedAt),
    ])

    return {
      establishmentId,
      productId: product.id,
      name: product.name,
      categories: product.categories,
      status: product.status,
      stockControl: product.stockControl,
      sizes: sizes
        .filter(
          (size) =>
            size.establishmentId === establishmentId && size.productId === product.id,
        )
        .map((size) => ({
          sizeId: size.id,
          name: size.name,
          price: size.price,
          isActive: size.isActive,
          accompaniments: accompanimentDetails.map(
            ({ updatedAt: _updatedAt, ...accompaniment }) => accompaniment,
          ),
        })),
      resaleConfigurations: resaleConfigurations
        .filter(
          (configuration) =>
            configuration.establishmentId === establishmentId &&
            configuration.productId === product.id,
        )
        .map((configuration) => {
          const brand = configuration.brandId
            ? brands.find((candidate) => candidate.id === configuration.brandId)
            : undefined

          return {
            ...(configuration.brandId ? { brandId: configuration.brandId } : {}),
            ...(brand ? { brandName: brand.name } : {}),
            price: configuration.price,
            isActive: configuration.isActive,
          }
        }),
      updatedAt,
    }
  }

  private async buildAccompaniment(
    scope: MrpDatabaseScope,
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

    const basePrice = await this.resolveBasePrice(scope, establishmentId, product)
    return {
      accompanimentId: link.id,
      productId: product.id,
      name: product.name,
      type: type.name,
      basePrice,
      isActive: product.status === 'active',
      updatedAt: this.findLatestUpdatedAt([
        link.updatedAt,
        product.updatedAt,
        type.updatedAt,
      ]),
    }
  }

  private async resolveBasePrice(
    scope: MrpDatabaseScope,
    establishmentId: string,
    product: Product,
  ): Promise<number> {
    if (
      product.currentUnitCost !== undefined &&
      Number.isFinite(product.currentUnitCost) &&
      product.currentUnitCost >= 0
    ) {
      return product.currentUnitCost
    }

    if (product.stockControl !== ProductStockControl.ByBrand) return 0

    const brands =
      (await scope.brandsRepository.findManyByProductId(establishmentId, product.id)) ??
      []
    const primaryBrand = brands.find((brand) => brand.isPrimary)
    if (!primaryBrand || primaryBrand.packageQuantity <= 0) return 0

    return primaryBrand.packagePrice / primaryBrand.packageQuantity
  }

  private uniqueProductIds(productIds: readonly string[]): readonly string[] {
    return [...new Set(productIds)]
  }

  private findLatestUpdatedAt(updatedAts: readonly Date[]): Date {
    return new Date(Math.max(...updatedAts.map((updatedAt) => updatedAt.getTime())))
  }
}

export async function publishAffectedProductSalesConfigurations(request: {
  readonly broker: Broker | undefined
  readonly establishmentId: string
  readonly productId: string
  readonly configurations: readonly ProductSalesConfiguration[]
  readonly deleted?: boolean
}): Promise<void> {
  if (!request.broker) return
  for (const configuration of request.configurations) {
    await request.broker.publish(
      new ProductSalesConfigurationChangedEvent({
        establishmentId: request.establishmentId,
        productId: configuration.productId,
        state: 'available',
        configuration,
      }),
    )
  }
  if (request.deleted) {
    await request.broker.publish(
      new ProductSalesConfigurationChangedEvent({
        establishmentId: request.establishmentId,
        productId: request.productId,
        state: 'deleted',
        configuration: null,
      }),
    )
  }
}
