import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { AccompanimentPortionDetails } from '#mrp/domain/structures/accompaniment-portion-details.ts'
import type { LinkAccompanimentPortionsInput } from '#mrp/domain/structures/link-accompaniment-portions-input.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { AccompanimentPortionDetailsStrategy } from '#mrp/domain/strategies/accompaniment-portion-details-strategy.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import { GlobalAccompanimentRowsStrategy } from '#mrp/domain/strategies/global-accompaniment-rows-strategy.ts'
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

const PORTION_LOOKUP_BATCH_SIZE = 100

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: LinkAccompanimentPortionsInput
}

type LinkContext = {
  readonly accompanimentProduct: Product
  readonly accompanimentType: AccompanimentType
  readonly brands: readonly Brand[]
  readonly global?: GlobalAccompaniment
  /** The validated sale price: the link's (individual) or the global's (global modes). */
  readonly price: number
}

type WrittenRows = {
  readonly global?: GlobalAccompaniment
  readonly shouldRepublishAll: boolean
}

type LinkPlanBase = {
  /** Selected Portions, or every Portion of the establishment when making it global. */
  readonly portions: readonly Product[]
  /** Rows of the accompaniment product before any write. */
  readonly existingRows: readonly ProductAccompaniment[]
}

type LinkPlan =
  | (LinkPlanBase & { readonly mode: 'individual' })
  | (LinkPlanBase & { readonly mode: 'make-global' })
  | (LinkPlanBase & {
      readonly mode: 'restore-global'
      readonly global: GlobalAccompaniment
    })

export class LinkAccompanimentPortionsUseCase
  implements UseCase<Request, readonly AccompanimentPortionDetails[]>
{
  private readonly accompanimentPriceValidation =
    new AccompanimentPriceValidationStrategy()
  private readonly globalAccompanimentRows = new GlobalAccompanimentRowsStrategy()
  private readonly portionDetails = new AccompanimentPortionDetailsStrategy()
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<readonly AccompanimentPortionDetails[]> {
    this.validateActor(request.actor)
    this.validateQuantity(request.input.quantityPerPortion)

    return this.database.run((scope) => this.link(scope, request))
  }

  private async link(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<readonly AccompanimentPortionDetails[]> {
    const context = await this.resolveContext(scope, request)
    const plan = await this.planLink(scope, request, context)
    await this.saveDefaultPrice(
      scope,
      context.accompanimentProduct,
      request.input.accompanimentPrice,
    )
    const written = await this.writeRows(scope, request, context, plan)

    const rows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        request.actor.establishmentId,
        context.accompanimentProduct.id,
      )
    await this.publishSalesConfigurations(scope, context.accompanimentProduct, [
      ...plan.portions.map((portion) => portion.id),
      ...(written.shouldRepublishAll ? rows.map((row) => row.productId) : []),
    ])

    return this.buildResult(rows, plan, { ...context, global: written.global })
  }

  private async resolveContext(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<LinkContext> {
    const establishmentId = request.actor.establishmentId
    const accompanimentProduct = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateAccompanimentProduct(accompanimentProduct, establishmentId)

    const accompanimentType = await this.findType(scope, request)
    const brands = await scope.brandsRepository.findManyByProductId(
      establishmentId,
      accompanimentProduct.id,
    )
    this.validateMainBrand(accompanimentProduct, brands)
    const global =
      await scope.globalAccompanimentsRepository.findByAccompanimentProductId(
        establishmentId,
        accompanimentProduct.id,
      )
    const price = this.validateAccompanimentPrice(
      request.input.accompanimentPrice ??
        (global ? global.accompanimentPrice : accompanimentProduct.accompanimentPrice),
    )
    return { accompanimentProduct, accompanimentType, brands, global, price }
  }

  private async findType(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<AccompanimentType> {
    const establishmentId = request.actor.establishmentId
    const accompanimentType = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      request.input.accompanimentTypeId,
    )
    if (!accompanimentType || accompanimentType.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    return accompanimentType
  }

  private async planLink(
    scope: MrpDatabaseRepositories,
    request: Request,
    { accompanimentProduct, global }: LinkContext,
  ): Promise<LinkPlan> {
    const existingRows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        request.actor.establishmentId,
        accompanimentProduct.id,
      )
    return global
      ? this.planRestore(scope, request, existingRows, global)
      : this.planNonGlobal(scope, request, existingRows)
  }

  private async planRestore(
    scope: MrpDatabaseRepositories,
    request: Request,
    existingRows: readonly ProductAccompaniment[],
    global: GlobalAccompaniment,
  ): Promise<LinkPlan> {
    this.validateGlobalFlag(request.input.isGlobal)
    const portions = await this.resolveSelectedPortions(scope, request, existingRows)
    return { mode: 'restore-global', portions, existingRows, global }
  }

  private async planNonGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    existingRows: readonly ProductAccompaniment[],
  ): Promise<LinkPlan> {
    if (request.input.isGlobal === true) {
      this.validateNoSelection(request.input.portionProductIds)
      const portions = await this.resolveEveryPortion(
        scope,
        request.actor.establishmentId,
      )
      return { mode: 'make-global', portions, existingRows }
    }
    const portions = await this.resolveSelectedPortions(scope, request, existingRows)
    return { mode: 'individual', portions, existingRows }
  }

  private async resolveSelectedPortions(
    scope: MrpDatabaseRepositories,
    request: Request,
    existingRows: readonly ProductAccompaniment[],
  ): Promise<readonly Product[]> {
    const establishmentId = request.actor.establishmentId
    const portionIds = [...new Set(request.input.portionProductIds ?? [])]
    if (portionIds.length === 0) {
      throw new BadRequestError('Selecione ao menos uma porção.')
    }

    const products = await this.findProducts(scope, establishmentId, portionIds)
    const portions = portionIds.map((portionId) => {
      const portion = products.find((product) => product.id === portionId)
      if (!portion) throw new NotFoundError('Porção não encontrada.')
      return portion
    })
    const linkedPortionIds = new Set(existingRows.map((row) => row.productId))
    if (
      portions.some(
        (portion) =>
          !portion.categories.includes(ProductCategory.Portion) ||
          linkedPortionIds.has(portion.id),
      )
    ) {
      throw new ConflictError(
        'Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento.',
      )
    }
    return portions
  }

  private async findProducts(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly Product[]> {
    const products: Product[] = []
    for (let start = 0; start < productIds.length; start += PORTION_LOOKUP_BATCH_SIZE) {
      const batch = await scope.productsRepository.findManyByIds(
        establishmentId,
        productIds.slice(start, start + PORTION_LOOKUP_BATCH_SIZE),
      )
      products.push(
        ...batch.filter((product) => product.establishmentId === establishmentId),
      )
    }
    return products
  }

  private async resolveEveryPortion(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
  ): Promise<readonly Product[]> {
    const products = await scope.productsRepository.findManyByCategory(
      establishmentId,
      ProductCategory.Portion,
    )
    const portions = products.filter(
      (product) => product.establishmentId === establishmentId,
    )
    if (portions.length === 0) {
      throw new BadRequestError(
        'Cadastre uma porção antes de disponibilizar este acompanhamento para todas as porções.',
      )
    }
    return portions
  }

  private async writeRows(
    scope: MrpDatabaseRepositories,
    request: Request,
    context: LinkContext,
    plan: LinkPlan,
  ): Promise<WrittenRows> {
    switch (plan.mode) {
      case 'individual':
        await this.addIndividualRows(scope, request, context, plan)
        return { shouldRepublishAll: false }
      case 'make-global':
        return this.makeGlobal(scope, request, context, plan)
      case 'restore-global':
        return this.restoreGlobal(scope, request, context, plan)
    }
  }

  private async addIndividualRows(
    scope: MrpDatabaseRepositories,
    request: Request,
    { accompanimentProduct, accompanimentType, price }: LinkContext,
    plan: LinkPlan,
  ): Promise<void> {
    await scope.productAccompanimentsRepository.addMany(
      plan.portions.map((portion) => ({
        establishmentId: request.actor.establishmentId,
        productId: portion.id,
        accompanimentProductId: accompanimentProduct.id,
        accompanimentTypeId: accompanimentType.id,
        quantityPerPortion: request.input.quantityPerPortion,
        accompanimentPrice: price,
      })),
    )
  }

  private async makeGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    { accompanimentProduct, accompanimentType, price }: LinkContext,
    plan: LinkPlan,
  ): Promise<WrittenRows> {
    const establishmentId = request.actor.establishmentId
    const { quantityPerPortion } = request.input
    const global = await scope.globalAccompanimentsRepository.add({
      establishmentId,
      accompanimentProductId: accompanimentProduct.id,
      accompanimentTypeId: accompanimentType.id,
      quantityPerPortion,
      accompanimentPrice: price,
    })
    await scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId(
      establishmentId,
      accompanimentProduct.id,
      {
        accompanimentTypeId: accompanimentType.id,
        quantityPerPortion,
        globalAccompanimentId: global.id,
        accompanimentPrice: null,
      },
    )
    await scope.productAccompanimentsRepository.addMany(
      this.globalAccompanimentRows.execute({
        globals: [global],
        portionProductIds: plan.portions.map((portion) => portion.id),
        existingPairs: plan.existingRows,
      }),
    )
    return { global, shouldRepublishAll: true }
  }

  private async restoreGlobal(
    scope: MrpDatabaseRepositories,
    request: Request,
    { accompanimentProduct, accompanimentType, price }: LinkContext,
    plan: Extract<LinkPlan, { mode: 'restore-global' }>,
  ): Promise<WrittenRows> {
    const establishmentId = request.actor.establishmentId
    const { quantityPerPortion } = request.input
    const { global } = plan
    const hasSharedValuesChanged =
      global.accompanimentTypeId !== accompanimentType.id ||
      global.quantityPerPortion !== quantityPerPortion
    const hasPriceChanged = global.accompanimentPrice !== price
    const savedGlobal =
      hasSharedValuesChanged || hasPriceChanged
        ? await scope.globalAccompanimentsRepository.replace(establishmentId, global.id, {
            accompanimentTypeId: accompanimentType.id,
            quantityPerPortion,
            accompanimentPrice: price,
          })
        : global
    if (hasSharedValuesChanged) {
      await scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId(
        establishmentId,
        global.id,
        { accompanimentTypeId: accompanimentType.id, quantityPerPortion },
      )
    }
    await scope.productAccompanimentsRepository.addMany(
      plan.portions.map((portion) => ({
        establishmentId,
        productId: portion.id,
        accompanimentProductId: accompanimentProduct.id,
        accompanimentTypeId: accompanimentType.id,
        quantityPerPortion,
        globalAccompanimentId: global.id,
      })),
    )
    return {
      global: savedGlobal,
      shouldRepublishAll: hasSharedValuesChanged || hasPriceChanged,
    }
  }

  /** The default only prefills: it is written by the first Link save while still unset. */
  private async saveDefaultPrice(
    scope: MrpDatabaseRepositories,
    accompanimentProduct: Product,
    suppliedPrice: number | undefined,
  ): Promise<void> {
    if (
      suppliedPrice === undefined ||
      accompanimentProduct.accompanimentPrice !== undefined
    ) {
      return
    }
    await scope.productsRepository.replace(
      accompanimentProduct.establishmentId,
      accompanimentProduct.id,
      { accompanimentPrice: suppliedPrice },
    )
  }

  private async publishSalesConfigurations(
    scope: MrpDatabaseRepositories,
    accompanimentProduct: Product,
    affectedPortionIds: readonly string[],
  ): Promise<void> {
    const establishmentId = accompanimentProduct.establishmentId
    const sources =
      await scope.productSalesConfigurationSourcesRepository.findManyByProductIds(
        establishmentId,
        [...new Set([accompanimentProduct.id, ...affectedPortionIds])],
      )
    const configurations = this.salesConfiguration
      .execute({ establishmentId, sources })
      .filter((configuration) =>
        configuration.categories.includes(ProductCategory.Portion),
      )
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

  private buildResult(
    rows: readonly ProductAccompaniment[],
    plan: LinkPlan,
    { accompanimentProduct, accompanimentType, brands, global }: LinkContext,
  ): readonly AccompanimentPortionDetails[] {
    const portionsById = new Map(plan.portions.map((portion) => [portion.id, portion]))
    return rows
      .flatMap((link) => {
        const portion = portionsById.get(link.productId)
        return portion
          ? [
              this.portionDetails.execute({
                link,
                portion,
                accompanimentProduct,
                accompanimentType,
                brands,
                global,
                accompanimentLinksCount: rows.length,
              }),
            ]
          : []
      })
      .sort((left, right) => this.compareDetails(left, right))
  }

  private compareDetails(
    left: AccompanimentPortionDetails,
    right: AccompanimentPortionDetails,
  ): number {
    return (
      this.normalizeForSort(left.portionProductName).localeCompare(
        this.normalizeForSort(right.portionProductName),
      ) || left.id.localeCompare(right.id)
    )
  }

  private normalizeForSort(value: string): string {
    return value.trim().toLocaleLowerCase()
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem vincular porções.')
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
    if (product.status !== ProductStatus.Active) {
      throw new BadRequestError('Ative o produto para vincular ou editar porções.')
    }
  }

  private validateGlobalFlag(isGlobal: boolean | undefined): void {
    if (isGlobal !== true) {
      throw new ConflictError(
        'Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo às porções.',
      )
    }
  }

  private validateNoSelection(portionProductIds: readonly string[] | undefined): void {
    if (portionProductIds !== undefined && portionProductIds.length > 0) {
      throw new BadRequestError(
        'Não informe porções ao disponibilizar o acompanhamento para todas as porções.',
      )
    }
  }

  private validateMainBrand(product: Product, brands: readonly Brand[]): void {
    if (product.stockControl !== ProductStockControl.ByBrand) return
    if (!brands.some((brand) => brand.productId === product.id && brand.isPrimary)) {
      throw new BadRequestError('O acompanhamento não possui marca principal.')
    }
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

  private validateAccompanimentPrice(price: number | undefined): number {
    const result = this.accompanimentPriceValidation.execute(price)
    if (typeof result === 'number') return result
    throw new BadRequestError(
      result === 'missing'
        ? 'Informe o preço de venda do acompanhamento.'
        : 'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
    )
  }
}
