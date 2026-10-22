import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { GlobalAccompanimentDetails } from '#mrp/domain/structures/global-accompaniment-details.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { UpdateGlobalAccompanimentInput } from '#mrp/domain/structures/update-global-accompaniment-input.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import { GlobalAccompanimentDetailsStrategy } from '#mrp/domain/strategies/global-accompaniment-details-strategy.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
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

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: UpdateGlobalAccompanimentInput
}

type UpdateContext = {
  readonly accompanimentProduct: Product
  readonly global: GlobalAccompaniment
  readonly accompanimentType: AccompanimentType
  readonly brands: readonly Brand[]
  /** The validated shared sale price: the entered one, else the global's own. */
  readonly price: number
}

type SavedSharedValues = {
  readonly savedGlobal: GlobalAccompaniment
  readonly hasChanged: boolean
}

export class UpdateGlobalAccompanimentUseCase
  implements UseCase<Request, GlobalAccompanimentDetails>
{
  private readonly accompanimentPriceValidation =
    new AccompanimentPriceValidationStrategy()
  private readonly globalDetails = new GlobalAccompanimentDetailsStrategy()
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<GlobalAccompanimentDetails> {
    this.validateActor(request.actor)
    this.validateQuantity(request.input.quantityPerPortion)

    return this.database.run((scope) => this.update(scope, request))
  }

  private async update(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<GlobalAccompanimentDetails> {
    const establishmentId = request.actor.establishmentId
    const context = await this.resolveContext(scope, request)
    const { accompanimentProduct, accompanimentType, brands } = context

    const { savedGlobal, hasChanged } = await this.saveSharedValues(
      scope,
      request,
      context,
    )

    if (hasChanged) {
      await this.publishSalesConfigurations(
        scope,
        establishmentId,
        accompanimentProduct.id,
      )
    }

    return this.globalDetails.execute({
      accompanimentProduct,
      brands,
      shared: { global: savedGlobal, accompanimentType },
    })
  }

  private async resolveContext(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<UpdateContext> {
    const establishmentId = request.actor.establishmentId
    const accompanimentProduct = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateAccompanimentProduct(accompanimentProduct, establishmentId)

    const global = await this.findGlobal(scope, accompanimentProduct)
    const accompanimentType = await this.findType(scope, request)
    const brands = await scope.brandsRepository.findManyByProductId(
      establishmentId,
      accompanimentProduct.id,
    )
    this.validateMainBrand(accompanimentProduct, brands)
    const price = this.validateAccompanimentPrice(
      request.input.accompanimentPrice ?? global.accompanimentPrice,
    )
    return { accompanimentProduct, global, accompanimentType, brands, price }
  }

  private async findGlobal(
    scope: MrpDatabaseRepositories,
    accompanimentProduct: Product,
  ): Promise<GlobalAccompaniment> {
    const global =
      await scope.globalAccompanimentsRepository.findByAccompanimentProductId(
        accompanimentProduct.establishmentId,
        accompanimentProduct.id,
      )
    if (!global) throw new NotFoundError('Acompanhamento global não encontrado.')
    return global
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

  private async saveSharedValues(
    scope: MrpDatabaseRepositories,
    request: Request,
    { global, accompanimentType, price }: UpdateContext,
  ): Promise<SavedSharedValues> {
    const establishmentId = request.actor.establishmentId
    const { quantityPerPortion } = request.input
    const hasSharedValuesChanged =
      global.accompanimentTypeId !== accompanimentType.id ||
      global.quantityPerPortion !== quantityPerPortion
    if (!hasSharedValuesChanged && global.accompanimentPrice === price) {
      return { savedGlobal: global, hasChanged: false }
    }

    const changes = { accompanimentTypeId: accompanimentType.id, quantityPerPortion }
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
    return { savedGlobal, hasChanged: true }
  }

  private async publishSalesConfigurations(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<void> {
    const rows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        accompanimentProductId,
      )
    if (rows.length === 0) return

    const sources =
      await scope.productSalesConfigurationSourcesRepository.findManyByProductIds(
        establishmentId,
        [...new Set([accompanimentProductId, ...rows.map((row) => row.productId)])],
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

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError(
        'Somente gestores podem editar acompanhamentos globais.',
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
    if (product.status !== ProductStatus.Active) {
      throw new BadRequestError('Ative o produto para vincular ou editar porções.')
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
