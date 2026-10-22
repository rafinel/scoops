import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { UpdateProductAccompanimentInput } from '#mrp/domain/structures/update-product-accompaniment-input.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import { GlobalAccompanimentRowsStrategy } from '#mrp/domain/strategies/global-accompaniment-rows-strategy.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly linkId: string
  readonly input: UpdateProductAccompanimentInput
}

type SavedLink = {
  readonly link: ProductAccompaniment
  readonly global?: GlobalAccompaniment
  readonly shouldRepublishAll: boolean
  readonly shouldPublish: boolean
}

type UpdateContext = {
  readonly owner: Product
  readonly link: ProductAccompaniment
  readonly target: Product
  readonly accompanimentTypeId: string
  /** The global the row references, when it is a global row. */
  readonly global?: GlobalAccompaniment
  /** The validated sale price: the link's (individual) or the global's (global modes). */
  readonly price: number
}

export class UpdateProductAccompanimentUseCase
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

    return this.database.run((scope) => this.update(scope, request))
  }

  private async update(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<ProductAccompanimentDetails> {
    const establishmentId = request.actor.establishmentId
    const context = await this.resolveUpdateContext(scope, request)
    const { owner, target } = context
    const saved = await this.saveLink(scope, request, context)

    const result = await this.buildDetails(scope, establishmentId, saved)
    if (!saved.shouldPublish) return result

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

  private async saveLink(
    scope: MrpDatabaseRepositories,
    request: Request,
    context: UpdateContext,
  ): Promise<SavedLink> {
    if (context.global) {
      return this.saveGlobalRowChanges(scope, request, context, context.global)
    }
    if (request.input.isGlobal === true) {
      return this.convertToGlobal(scope, request, context)
    }
    const link = await scope.productAccompanimentsRepository.replace(
      request.actor.establishmentId,
      context.owner.id,
      context.link.id,
      {
        accompanimentTypeId: context.accompanimentTypeId,
        quantityPerPortion: request.input.quantityPerPortion,
        accompanimentPrice: context.price,
      },
    )
    return { link, shouldRepublishAll: false, shouldPublish: true }
  }

  private async saveGlobalRowChanges(
    scope: MrpDatabaseRepositories,
    request: Request,
    { link, accompanimentTypeId, price }: UpdateContext,
    global: GlobalAccompaniment,
  ): Promise<SavedLink> {
    const establishmentId = request.actor.establishmentId
    const { quantityPerPortion } = request.input
    const hasSharedValuesChanged =
      link.accompanimentTypeId !== accompanimentTypeId ||
      link.quantityPerPortion !== quantityPerPortion
    const hasPriceChanged = global.accompanimentPrice !== price
    if (!hasSharedValuesChanged && !hasPriceChanged) {
      return { link, global, shouldRepublishAll: false, shouldPublish: false }
    }
    const changes = { accompanimentTypeId, quantityPerPortion }
    const savedGlobal = await scope.globalAccompanimentsRepository.replace(
      establishmentId,
      global.id,
      { ...changes, accompanimentPrice: price },
    )
    if (hasSharedValuesChanged) {
      await scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId(
        establishmentId,
        global.id,
        changes,
      )
    }
    return {
      link: { ...link, ...changes },
      global: savedGlobal,
      shouldRepublishAll: true,
      shouldPublish: true,
    }
  }

  private async convertToGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    { link, target, accompanimentTypeId, price }: UpdateContext,
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
    const portions = await scope.productsRepository.findManyByCategory(
      establishmentId,
      ProductCategory.Portion,
    )
    await scope.productAccompanimentsRepository.addMany(
      this.globalAccompanimentRows.execute({
        globals: [global],
        portionProductIds: portions.map((portion) => portion.id),
        existingPairs: convertedRows,
      }),
    )
    return {
      link: {
        ...link,
        accompanimentTypeId,
        quantityPerPortion,
        globalAccompanimentId: global.id,
        accompanimentPrice: undefined,
      },
      global,
      shouldRepublishAll: true,
      shouldPublish: true,
    }
  }

  private async resolveUpdateContext(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<UpdateContext> {
    const establishmentId = request.actor.establishmentId
    const owner = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateOwner(owner, establishmentId)
    const link = await this.findLink(scope, request, owner)
    this.validateGlobalStatus(link, request.input)
    const target = await scope.productsRepository.findById(
      establishmentId,
      link.accompanimentProductId,
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
    const global = await this.findGlobal(scope, link)
    const price = this.validateAccompanimentPrice(
      request.input.accompanimentPrice ??
        this.resolveStoredPrice(request, link, global, target),
    )
    return { owner, link, target, accompanimentTypeId: type.id, global, price }
  }

  /** The price an omitted request keeps: the global's, the link's, or the default for a new global. */
  private resolveStoredPrice(
    request: Request,
    link: ProductAccompaniment,
    global: GlobalAccompaniment | undefined,
    target: Product,
  ): number | undefined {
    if (global) return global.accompanimentPrice
    return request.input.isGlobal === true
      ? (link.accompanimentPrice ?? target.accompanimentPrice)
      : link.accompanimentPrice
  }

  private async findGlobal(
    scope: MrpDatabaseRepositories,
    link: ProductAccompaniment,
  ): Promise<GlobalAccompaniment | undefined> {
    if (link.globalAccompanimentId === undefined) return undefined
    const global = await scope.globalAccompanimentsRepository.findById(
      link.establishmentId,
      link.globalAccompanimentId,
    )
    if (!global || global.establishmentId !== link.establishmentId) {
      throw new NotFoundError('Acompanhamento global não encontrado.')
    }
    return global
  }

  private async findLink(
    scope: MrpDatabaseRepositories,
    request: Request,
    owner: Product,
  ): Promise<ProductAccompaniment> {
    const establishmentId = request.actor.establishmentId
    const link = await scope.productAccompanimentsRepository.findById(
      establishmentId,
      owner.id,
      request.linkId,
    )
    if (
      !link ||
      link.establishmentId !== establishmentId ||
      link.productId !== owner.id
    ) {
      throw new NotFoundError('Acompanhamento não encontrado.')
    }
    return link
  }

  private validateGlobalStatus(
    link: ProductAccompaniment,
    input: UpdateProductAccompanimentInput,
  ): void {
    if (link.globalAccompanimentId !== undefined && input.isGlobal === false) {
      throw new BadRequestError(
        'Um acompanhamento global só deixa de ser global pela remoção de todas as porções.',
      )
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem editar acompanhamentos.')
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
    if (
      product.status !== ProductStatus.Active ||
      !product.categories.includes(ProductCategory.Accompaniment)
    ) {
      throw new BadRequestError('O produto selecionado não é um acompanhamento elegível.')
    }
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

  private validateQuantity(quantity: number): void {
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      Math.abs(quantity * 1_000 - Math.round(quantity * 1_000)) >= 1e-8
    ) {
      throw new BadRequestError(
        'A quantidade deve ser positiva e ter até três casas decimais.',
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
