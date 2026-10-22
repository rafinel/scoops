import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { LinkProductAccompanimentInput } from '#mrp/domain/structures/link-product-accompaniment-input.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import { GlobalAccompanimentRowsStrategy } from '#mrp/domain/strategies/global-accompaniment-rows-strategy.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
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
  readonly global?: GlobalAccompaniment
  /** The validated sale price: the link's (individual) or the global's (global modes). */
  readonly price: number
}

type SavedLink = {
  readonly link: ProductAccompaniment
  readonly global?: GlobalAccompaniment
  readonly shouldRepublishAll: boolean
}

export class LinkProductAccompanimentUseCase
  implements UseCase<Request, ProductAccompanimentDetails>
{
  private readonly accompanimentPriceValidation =
    new AccompanimentPriceValidationStrategy()
  private readonly globalAccompanimentRows = new GlobalAccompanimentRowsStrategy()
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

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
    const context = await this.resolveLinkContext(scope, request)
    const { owner, target } = context
    await this.saveDefaultPrice(scope, target, request.input.accompanimentPrice)
    const saved =
      request.input.isGlobal === true
        ? await this.saveGlobalLink(scope, request, context)
        : await this.saveIndividualLink(scope, request, context)

    const result = await this.buildDetails(scope, establishmentId, saved)
    const affectedProductIds = await this.findAffectedProductIds(
      scope,
      establishmentId,
      owner.id,
      saved.shouldRepublishAll ? target.id : undefined,
    )
    await this.publishPortionSalesConfigurations(
      scope,
      establishmentId,
      affectedProductIds,
    )
    return result
  }

  private async findAffectedProductIds(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    ownerId: string,
    accompanimentProductId: string | undefined,
  ): Promise<readonly string[]> {
    if (accompanimentProductId === undefined) return [ownerId]
    const rows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        accompanimentProductId,
      )
    const ownerIds = rows
      .filter((row) => row.establishmentId === establishmentId)
      .map((row) => row.productId)
    return [...new Set([ownerId, ...ownerIds])]
  }

  private async publishPortionSalesConfigurations(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<void> {
    const sources =
      await scope.productSalesConfigurationSourcesRepository.findManyByProductIds(
        establishmentId,
        productIds,
      )
    const configurations = this.salesConfiguration.execute({ establishmentId, sources })
    for (const configuration of configurations) {
      if (!configuration.categories.includes(ProductCategory.Portion)) continue
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

  private async saveIndividualLink(
    scope: MrpDatabaseRepositories,
    request: Request,
    { owner, target, accompanimentTypeId, price }: LinkContext,
  ): Promise<SavedLink> {
    const link = await scope.productAccompanimentsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId,
      quantityPerPortion: request.input.quantityPerPortion,
      accompanimentPrice: price,
    })
    return { link, shouldRepublishAll: false }
  }

  private async saveGlobalLink(
    scope: MrpDatabaseRepositories,
    request: Request,
    context: LinkContext,
  ): Promise<SavedLink> {
    return context.global
      ? this.joinGlobal(scope, request, context, context.global)
      : this.createGlobal(scope, request, context)
  }

  private async joinGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    { owner, target, accompanimentTypeId, price }: LinkContext,
    global: GlobalAccompaniment,
  ): Promise<SavedLink> {
    const establishmentId = request.actor.establishmentId
    const { quantityPerPortion } = request.input
    const hasSharedValuesChanged =
      global.accompanimentTypeId !== accompanimentTypeId ||
      global.quantityPerPortion !== quantityPerPortion
    const hasPriceChanged = global.accompanimentPrice !== price
    const savedGlobal =
      hasSharedValuesChanged || hasPriceChanged
        ? await scope.globalAccompanimentsRepository.replace(establishmentId, global.id, {
            accompanimentTypeId,
            quantityPerPortion,
            accompanimentPrice: price,
          })
        : global
    if (hasSharedValuesChanged) {
      await scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId(
        establishmentId,
        global.id,
        { accompanimentTypeId, quantityPerPortion },
      )
    }
    const link = await scope.productAccompanimentsRepository.add({
      establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId,
      quantityPerPortion,
      globalAccompanimentId: global.id,
    })
    return {
      link,
      global: savedGlobal,
      shouldRepublishAll: hasSharedValuesChanged || hasPriceChanged,
    }
  }

  private async createGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    { owner, target, accompanimentTypeId, price }: LinkContext,
  ): Promise<SavedLink> {
    const establishmentId = request.actor.establishmentId
    const { quantityPerPortion } = request.input
    const global = await scope.globalAccompanimentsRepository.add({
      establishmentId,
      accompanimentProductId: target.id,
      accompanimentTypeId,
      quantityPerPortion,
      accompanimentPrice: price,
    })
    const convertedRows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
    await scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId(
      establishmentId,
      target.id,
      {
        accompanimentTypeId,
        quantityPerPortion,
        globalAccompanimentId: global.id,
        accompanimentPrice: null,
      },
    )
    const link = await scope.productAccompanimentsRepository.add({
      establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId,
      quantityPerPortion,
      globalAccompanimentId: global.id,
    })
    const portions = await scope.productsRepository.findManyByCategory(
      establishmentId,
      ProductCategory.Portion,
    )
    await scope.productAccompanimentsRepository.addMany(
      this.globalAccompanimentRows.execute({
        globals: [global],
        portionProductIds: portions.map((portion) => portion.id),
        existingPairs: [...convertedRows, link],
      }),
    )
    return { link, global, shouldRepublishAll: true }
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
    const type = await this.findType(scope, request)
    if (target.stockControl === ProductStockControl.ByBrand) {
      await this.requireMainBrand(scope, target)
    }
    await this.validateNotLinked(scope, owner, target)
    const global = await this.findGlobal(scope, request, target)
    const price = this.validateAccompanimentPrice(
      request.input.accompanimentPrice ??
        (global ? global.accompanimentPrice : target.accompanimentPrice),
    )
    return { owner, target, accompanimentTypeId: type.id, global, price }
  }

  private async findType(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<AccompanimentType> {
    const establishmentId = request.actor.establishmentId
    const type = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      request.input.accompanimentTypeId,
    )
    if (!type || type.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    return type
  }

  private async validateNotLinked(
    scope: MrpDatabaseRepositories,
    owner: Product,
    target: Product,
  ): Promise<void> {
    const existing =
      await scope.productAccompanimentsRepository.findByProductAndAccompaniment(
        owner.establishmentId,
        owner.id,
        target.id,
      )
    if (existing) {
      throw new ConflictError('O acompanhamento já está vinculado a esta porção.')
    }
  }

  private async findGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    target: Product,
  ): Promise<GlobalAccompaniment | undefined> {
    const global =
      await scope.globalAccompanimentsRepository.findByAccompanimentProductId(
        target.establishmentId,
        target.id,
      )
    if (global && request.input.isGlobal !== true) {
      throw new ConflictError(
        'Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo a esta porção.',
      )
    }
    return global
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

  /** The default only prefills: it is written by the first Link save while still unset. */
  private async saveDefaultPrice(
    scope: MrpDatabaseRepositories,
    target: Product,
    suppliedPrice: number | undefined,
  ): Promise<void> {
    if (suppliedPrice === undefined || target.accompanimentPrice !== undefined) return
    await scope.productsRepository.replace(target.establishmentId, target.id, {
      accompanimentPrice: suppliedPrice,
    })
  }

  private validateAccompanimentPrice(price: number | undefined): number {
    const result = this.accompanimentPriceValidation.execute(price)
    if (typeof result === 'number') return result
    throw new BadRequestError(
      result === 'missing'
        ? 'Informe o preço de venda do acompanhamento.'
        : 'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
    )
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

  private async buildDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    { link, global }: SavedLink,
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
      salePrice: (global ? global.accompanimentPrice : link.accompanimentPrice) ?? null,
      isGlobal: link.globalAccompanimentId !== undefined,
      hasOtherPortionLinks: await this.hasOtherPortionLinks(scope, link),
      ...this.toSourceFields(source, link.quantityPerPortion),
    }
  }

  private toSourceFields(
    source: { brandId?: string; brandName?: string; unitCost?: number } | undefined,
    quantityPerPortion: number,
  ) {
    return {
      ...(source?.brandId ? { brandId: source.brandId } : {}),
      ...(source?.brandName ? { brandName: source.brandName } : {}),
      ...(source?.unitCost !== undefined ? { unitCost: source.unitCost } : {}),
      ...(source?.unitCost !== undefined
        ? { estimatedCost: quantityPerPortion * source.unitCost }
        : {}),
    }
  }

  private async hasOtherPortionLinks(
    scope: MrpDatabaseRepositories,
    link: ProductAccompaniment,
  ): Promise<boolean> {
    if (link.globalAccompanimentId !== undefined) return false
    const linksCount =
      await scope.productAccompanimentsRepository.countByAccompanimentProductId(
        link.establishmentId,
        link.accompanimentProductId,
      )
    // The link itself is part of the count.
    return linksCount > 1
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
}
