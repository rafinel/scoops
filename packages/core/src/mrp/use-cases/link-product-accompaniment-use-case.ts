import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductSize } from '#mrp/domain/entities/product-size.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { LinkProductAccompanimentInput } from '#mrp/domain/structures/link-product-accompaniment-input.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductSalesConfiguration } from '#mrp/domain/structures/product-sales-configuration.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: LinkProductAccompanimentInput
}

type LinkContext = {
  readonly owner: Product
  readonly target: Product
  readonly accompanimentTypeId: string
}

type AccompanimentSalesSnapshot =
  ProductSalesConfiguration['sizes'][number]['accompaniments'][number] & {
    readonly updatedAt: Date
  }

type PortionSalesConfigurationSource = {
  readonly portion: Product
  readonly sizes: readonly ProductSize[]
  readonly links: readonly ProductAccompaniment[]
  readonly resaleConfigurations: readonly ResaleConfiguration[]
  readonly brands: readonly Brand[]
}

export class LinkProductAccompanimentUseCase
  implements UseCase<Request, ProductAccompanimentDetails>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductAccompanimentDetails> {
    this.validateActor(request.actor)
    this.validateQuantity(request.input.quantityPerPortion)

    return this.database.run((scope) => this.link(scope, request))
  }

  private async link(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<ProductAccompanimentDetails> {
    const establishmentId = request.actor.establishmentId
    const { owner, target, accompanimentTypeId } = await this.resolveLinkContext(
      scope,
      request,
    )
    const savedTarget = await this.saveAccompanimentPrice(
      scope,
      target,
      request.input.accompanimentPrice,
    )
    const link = await scope.productAccompanimentsRepository.add({
      establishmentId,
      productId: owner.id,
      accompanimentProductId: savedTarget.id,
      accompanimentTypeId,
      quantityPerPortion: request.input.quantityPerPortion,
    })

    const result = await this.buildDetails(scope, establishmentId, link)
    await this.publishAffectedOwners(
      scope,
      establishmentId,
      owner.id,
      target,
      savedTarget,
    )
    return result
  }

  private async resolveLinkContext(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<LinkContext> {
    const establishmentId = request.actor.establishmentId
    const owner = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateOwner(owner, establishmentId)
    const target = await scope.productsRepository.findById(
      establishmentId,
      request.input.accompanimentProductId,
    )
    this.validateTarget(target, owner.id, establishmentId)
    const type = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      request.input.accompanimentTypeId,
    )
    if (!type || type.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    if (target.stockControl === ProductStockControl.ByBrand) {
      await this.requireMainBrand(scope, target)
    }
    const existing =
      await scope.productAccompanimentsRepository.findByProductAndAccompaniment(
        establishmentId,
        owner.id,
        target.id,
      )
    if (existing)
      throw new ConflictError('O acompanhamento já está vinculado a esta porção.')
    this.validateAccompanimentPrice(target, request.input.accompanimentPrice)
    return { owner, target, accompanimentTypeId: type.id }
  }

  private async publishAffectedOwners(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    ownerId: string,
    previousTarget: Product,
    savedTarget: Product,
  ): Promise<void> {
    const inverseOwnerIds =
      savedTarget.accompanimentPrice !== previousTarget.accompanimentPrice
        ? await this.findAffectedPortionIds(scope, establishmentId, savedTarget.id)
        : [ownerId]
    const configurations = await this.buildAffectedPortionConfigurations(
      scope,
      establishmentId,
      [ownerId, ...inverseOwnerIds],
    )
    await this.publishConfigurations(scope, establishmentId, configurations)
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem vincular acompanhamentos.')
    }
  }

  private validateOwner(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
    if (!product.categories.includes(ProductCategory.Portion)) {
      throw new BadRequestError('O produto não é uma porção.')
    }
  }

  private validateTarget(
    product: Product | undefined,
    ownerId: string,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto de acompanhamento não encontrado.')
    }
    if (product.id === ownerId) {
      throw new BadRequestError('Uma porção não pode acompanhar a si mesma.')
    }
    if (product.status !== ProductStatus.Active) {
      throw new BadRequestError('O produto de acompanhamento deve estar ativo.')
    }
    if (
      !product.categories.includes(ProductCategory.Accompaniment) ||
      product.categories.includes(ProductCategory.Portion)
    ) {
      throw new BadRequestError('O produto selecionado não é um acompanhamento elegível.')
    }
  }

  private validateQuantity(quantity: number): void {
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !this.hasAtMostThreeDecimalPlaces(quantity)
    ) {
      throw new BadRequestError(
        'A quantidade deve ser positiva e ter até três casas decimais.',
      )
    }
  }

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }

  private async saveAccompanimentPrice(
    scope: MrpDatabaseRepositories,
    target: Product,
    suppliedPrice: number | undefined,
  ): Promise<Product> {
    this.validateAccompanimentPrice(target, suppliedPrice)
    if (suppliedPrice === undefined) {
      return target
    }
    if (suppliedPrice === target.accompanimentPrice) return target
    return scope.productsRepository.replace(target.establishmentId, target.id, {
      accompanimentPrice: suppliedPrice,
    })
  }

  private validateAccompanimentPrice(
    target: Product,
    suppliedPrice: number | undefined,
  ): void {
    const price = suppliedPrice ?? target.accompanimentPrice
    if (price === undefined)
      throw new BadRequestError('Informe o preço de venda do acompanhamento.')
    if (!Number.isFinite(price) || price < 0 || Number(price.toFixed(2)) !== price) {
      throw new BadRequestError(
        'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
      )
    }
  }

  private async requireMainBrand(
    scope: MrpDatabaseRepositories,
    product: Product,
  ): Promise<void> {
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    if (!brands.some((brand) => brand.productId === product.id && brand.isPrimary)) {
      throw new BadRequestError('O acompanhamento não possui marca principal.')
    }
  }

  private async findAffectedPortionIds(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<readonly string[]> {
    const links =
      (await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        accompanimentProductId,
      )) ?? []
    return [
      ...new Set(
        links
          .filter((link) => link.establishmentId === establishmentId)
          .map((link) => link.productId),
      ),
    ]
  }

  private async buildDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    link: ProductAccompaniment,
  ): Promise<ProductAccompanimentDetails> {
    const target = await scope.productsRepository.findById(
      establishmentId,
      link.accompanimentProductId,
    )
    if (!target || target.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto de acompanhamento não encontrado.')
    }
    const type = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      link.accompanimentTypeId,
    )
    if (!type || type.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    const source = await this.resolveCurrentSource(scope, target)
    return {
      id: link.id,
      accompanimentProductId: target.id,
      accompanimentProductName: target.name,
      accompanimentTypeId: type.id,
      accompanimentTypeName: type.name,
      unit: target.unit,
      quantityPerPortion: link.quantityPerPortion,
      salePrice: target.accompanimentPrice ?? null,
      ...(source?.brandId ? { brandId: source.brandId } : {}),
      ...(source?.brandName ? { brandName: source.brandName } : {}),
      ...(source?.unitCost !== undefined ? { unitCost: source.unitCost } : {}),
      ...(source?.unitCost !== undefined
        ? { estimatedCost: link.quantityPerPortion * source.unitCost }
        : {}),
    }
  }

  private async resolveCurrentSource(
    scope: MrpDatabaseRepositories,
    product: Product,
  ): Promise<{ brandId?: string; brandName?: string; unitCost?: number } | undefined> {
    if (
      product.status !== ProductStatus.Active ||
      !product.categories.includes(ProductCategory.Accompaniment)
    ) {
      return undefined
    }
    if (product.stockControl === ProductStockControl.Single) {
      return product.currentUnitCost === undefined
        ? undefined
        : { unitCost: product.currentUnitCost }
    }
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const mainBrand = brands.find(
      (brand) => brand.productId === product.id && brand.isPrimary,
    )
    if (!mainBrand || mainBrand.packageQuantity <= 0) return undefined
    return {
      brandId: mainBrand.id,
      brandName: mainBrand.name,
      unitCost: mainBrand.packagePrice / mainBrand.packageQuantity,
    }
  }

  private async buildAffectedPortionConfigurations(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    portionIds: readonly string[],
  ): Promise<readonly ProductSalesConfiguration[]> {
    const configurations: ProductSalesConfiguration[] = []
    for (const portionId of new Set(portionIds)) {
      const configuration = await this.buildPortionSalesConfiguration(
        scope,
        establishmentId,
        portionId,
      )
      if (configuration) configurations.push(configuration)
    }
    return configurations
  }

  private async buildPortionSalesConfiguration(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    portionId: string,
  ): Promise<ProductSalesConfiguration | undefined> {
    const portion = await scope.productsRepository.findById(establishmentId, portionId)
    if (
      !portion ||
      portion.establishmentId !== establishmentId ||
      !portion.categories.includes(ProductCategory.Portion)
    ) {
      return undefined
    }

    const [sizes, links, resaleConfigurations, brands] = await Promise.all([
      scope.productSizesRepository.findManyByProductId(establishmentId, portion.id),
      scope.productAccompanimentsRepository.findManyByProductId(
        establishmentId,
        portion.id,
      ),
      scope.resaleConfigurationsRepository.findManyByProductId(
        establishmentId,
        portion.id,
      ),
      portion.stockControl === ProductStockControl.ByBrand
        ? scope.brandsRepository.findManyByProductId(portion.id)
        : Promise.resolve([]),
    ])
    return this.projectPortionSalesConfiguration(scope, establishmentId, {
      portion,
      sizes: sizes ?? [],
      links: links ?? [],
      resaleConfigurations: resaleConfigurations ?? [],
      brands: brands ?? [],
    })
  }

  private async projectPortionSalesConfiguration(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    source: PortionSalesConfigurationSource,
  ): Promise<ProductSalesConfiguration> {
    const { portion } = source
    const sizes = source.sizes.filter(
      (size) => size.establishmentId === establishmentId && size.productId === portion.id,
    )
    const links = source.links.filter(
      (link) => link.establishmentId === establishmentId && link.productId === portion.id,
    )
    const resaleConfigurations = source.resaleConfigurations.filter(
      (configuration) =>
        configuration.establishmentId === establishmentId &&
        configuration.productId === portion.id,
    )
    const brands = source.brands.filter((brand) => brand.productId === portion.id)
    const accompaniments = await Promise.all(
      links.map((link) =>
        this.buildAccompanimentSalesSnapshot(scope, establishmentId, link),
      ),
    )
    const updatedAt = this.findLatestUpdatedAt([
      portion.updatedAt,
      ...sizes.map((size) => size.updatedAt),
      ...links.map((link) => link.updatedAt),
      ...accompaniments.map((accompaniment) => accompaniment.updatedAt),
      ...resaleConfigurations.map((configuration) => configuration.updatedAt),
      ...brands.map((brand) => brand.updatedAt),
    ])
    return this.toPortionSalesConfiguration(
      establishmentId,
      portion,
      sizes,
      resaleConfigurations,
      brands,
      accompaniments,
      updatedAt,
    )
  }

  private toPortionSalesConfiguration(
    establishmentId: string,
    portion: Product,
    sizes: readonly ProductSize[],
    resaleConfigurations: readonly ResaleConfiguration[],
    brands: readonly Brand[],
    accompaniments: readonly AccompanimentSalesSnapshot[],
    updatedAt: Date,
  ): ProductSalesConfiguration {
    return {
      establishmentId,
      productId: portion.id,
      name: portion.name,
      categories: portion.categories,
      status: portion.status,
      stockControl: portion.stockControl,
      sizes: sizes.map((size) => ({
        sizeId: size.id,
        name: size.name,
        price: size.price,
        isActive: size.isActive,
        accompaniments: accompaniments.map(({ updatedAt: _updatedAt, ...item }) => item),
      })),
      resaleConfigurations: resaleConfigurations.map((configuration) => {
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

  private async buildAccompanimentSalesSnapshot(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    link: ProductAccompaniment,
  ): Promise<AccompanimentSalesSnapshot> {
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
    const price = this.resolveAccompanimentPrice(product)
    return {
      accompanimentId: link.id,
      productId: product.id,
      name: product.name,
      type: type.name,
      basePrice: price ?? 0,
      isActive: product.status === ProductStatus.Active && price !== undefined,
      updatedAt: this.findLatestUpdatedAt([
        link.updatedAt,
        product.updatedAt,
        type.updatedAt,
      ]),
    }
  }

  private resolveAccompanimentPrice(product: Product): number | undefined {
    const price = product.accompanimentPrice
    if (
      price === undefined ||
      !Number.isFinite(price) ||
      price < 0 ||
      Number(price.toFixed(2)) !== price
    ) {
      return undefined
    }
    return price
  }

  private findLatestUpdatedAt(updatedAts: readonly Date[]): Date {
    return new Date(Math.max(...updatedAts.map((updatedAt) => updatedAt.getTime())))
  }

  private async publishConfigurations(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    configurations: readonly ProductSalesConfiguration[],
  ): Promise<void> {
    for (const configuration of configurations) {
      await scope.eventsRepository.add(
        new ProductSalesConfigurationChangedEvent({
          establishmentId,
          productId: configuration.productId,
          state: 'available',
          configuration,
        }),
      )
    }
  }
}
