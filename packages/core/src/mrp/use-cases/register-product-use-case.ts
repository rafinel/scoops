import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductCreatedEvent } from '#mrp/domain/events/product-created-event.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
  type ProductActor,
  type RegisterProductInput,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { AccompanimentPriceValidationStrategy } from '#mrp/domain/strategies/accompaniment-price-validation-strategy.ts'
import { GlobalAccompanimentRowsStrategy } from '#mrp/domain/strategies/global-accompaniment-rows-strategy.ts'
import {
  PRODUCT_SIZE_VALIDATION_MESSAGES,
  ProductSizeValidationStrategy,
} from '#mrp/domain/strategies/product-size-validation-strategy.ts'
import { ResalePriceValidationStrategy } from '#mrp/domain/strategies/resale-price-validation-strategy.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { PublishProductStockAlertUseCase } from '#mrp/use-cases/publish-product-stock-alert-use-case.ts'

type Request = RegisterProductInput & {
  actor: ProductActor & { readonly name: string }
}

const SALE_PRICE_TARGET_MESSAGES = {
  [ProductCategory.Resale]:
    'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
  [ProductCategory.Accompaniment]:
    'O preço como acompanhamento é permitido apenas para acompanhamentos de estoque único.',
} as const
const RESALE_PRICE_MESSAGE =
  'O preço de revenda deve ser maior ou igual a zero e ter até duas casas decimais.'
const SIZES_NOT_ALLOWED_MESSAGE = 'Tamanhos são permitidos apenas para porções.'
const DUPLICATE_SIZE_MESSAGE = 'Já existe um tamanho com esse nome para o produto.'
const ACCOMPANIMENT_PRICE_MESSAGE =
  'O preço deve ser maior ou igual a zero e ter até duas casas decimais.'

export class RegisterProductUseCase implements UseCase<Request, Product> {
  private readonly accompanimentPriceValidation =
    new AccompanimentPriceValidationStrategy()
  private readonly globalAccompanimentRows = new GlobalAccompanimentRowsStrategy()
  private readonly resalePriceValidation = new ResalePriceValidationStrategy()
  private readonly sizeValidation = new ProductSizeValidationStrategy()

  constructor(
    private readonly database: MrpDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Product> {
    this.validateActor(request.actor)
    this.validateInput(request)

    return this.database.run((scope) => this.register(scope, request))
  }

  private async register(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<Product> {
    const createdProduct = await this.createProduct(scope, request)

    await this.addResaleConfiguration(scope, request, createdProduct)
    await this.addSizes(scope, request, createdProduct)
    if (request.categories.includes(ProductCategory.Portion)) {
      await this.addGlobalRows(scope, request.actor.establishmentId, createdProduct)
    }
    if (request.stockControl === ProductStockControl.Single) {
      await this.recordSingleStock(scope, request, createdProduct)
    } else {
      await this.recordBrandStock(scope, request, createdProduct)
    }
    await this.publishCreation(scope, request, createdProduct)
    return createdProduct
  }

  private async createProduct(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<Product> {
    const existingProduct = await scope.productsRepository.findByName(
      request.actor.establishmentId,
      request.name.trim(),
    )

    if (existingProduct) {
      throw new ConflictError('Já existe um produto com esse nome neste estabelecimento.')
    }

    return scope.productsRepository.add({
      establishmentId: request.actor.establishmentId,
      name: request.name.trim(),
      unit: request.unit,
      categories: [...new Set(request.categories)],
      stockControl: request.stockControl,
      status: ProductStatus.Active,
      allowNegativeStock: request.allowNegativeStock ?? false,
      idealStock: request.idealStock,
      ...(request.currentUnitCost === undefined
        ? {}
        : { currentUnitCost: request.currentUnitCost }),
      ...(request.accompanimentPrice === undefined
        ? {}
        : { accompanimentPrice: request.accompanimentPrice }),
    })
  }

  private async addResaleConfiguration(
    scope: MrpDatabaseRepositories,
    request: Request,
    product: Product,
  ): Promise<void> {
    if (request.resalePrice === undefined) return

    await scope.resaleConfigurationsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: product.id,
      price: request.resalePrice,
      isActive: true,
    })
  }

  private async addSizes(
    scope: MrpDatabaseRepositories,
    request: Request,
    product: Product,
  ): Promise<void> {
    for (const size of request.sizes ?? []) {
      await scope.productSizesRepository.add({
        establishmentId: request.actor.establishmentId,
        productId: product.id,
        name: size.name.trim(),
        quantity: size.quantity,
        price: size.price,
        isActive: true,
      })
    }
  }

  private async publishCreation(
    scope: MrpDatabaseRepositories,
    request: Request,
    createdProduct: Product,
  ): Promise<void> {
    const availableQuantity =
      request.stockControl === ProductStockControl.Single
        ? (request.initialStock ?? 0)
        : (request.brands ?? []).reduce(
            (total, brand) => total + brand.initialQuantity,
            0,
          )
    await new PublishProductStockAlertUseCase(scope.eventsRepository).execute({
      product: createdProduct,
      availableQuantity,
      occurredAt: createdProduct.createdAt,
    })

    await scope.eventsRepository.add(
      new ProductCreatedEvent({
        productId: createdProduct.id,
        establishmentId: createdProduct.establishmentId,
        createdAt: createdProduct.createdAt,
      }),
    )
  }

  private async addGlobalRows(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<void> {
    const globals =
      await scope.globalAccompanimentsRepository.findManyByEstablishmentId(
        establishmentId,
      )
    await scope.productAccompanimentsRepository.addMany(
      this.globalAccompanimentRows.execute({
        globals,
        portionProductIds: [product.id],
        existingPairs: [],
      }),
    )
  }

  private async recordSingleStock(
    scope: MrpDatabaseRepositories,
    request: Request,
    createdProduct: Product,
  ): Promise<void> {
    await scope.stockBalancesRepository.initialize(createdProduct.id)
    if (request.initialStock === undefined || request.initialStock === 0) return

    const balance = await scope.stockBalancesRepository.add(
      { productId: createdProduct.id },
      request.initialStock,
    )
    await scope.stockTransactionsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: createdProduct.id,
      productName: createdProduct.name,
      unit: createdProduct.unit,
      type: request.initialStock > 0 ? 'entry' : 'write-off',
      quantity: Math.abs(request.initialStock),
      balanceAfter: balance.quantity,
      performedBy: request.actor.id,
      performedByName: request.actor.name,
      occurredAt: this.datetimeProvider.now(),
    })
  }

  private async recordBrandStock(
    scope: MrpDatabaseRepositories,
    request: Request,
    createdProduct: Product,
  ): Promise<void> {
    for (const brand of request.brands ?? []) {
      const createdBrand = await scope.brandsRepository.add({
        productId: createdProduct.id,
        name: brand.name.trim(),
        unit: brand.unit ?? createdProduct.unit,
        packageQuantity: brand.packageQuantity,
        packagePrice: brand.packageValue,
        isPrimary: brand.isPrimary,
      })
      await scope.stockBalancesRepository.initialize(createdProduct.id, createdBrand.id)
      if (brand.initialQuantity !== 0) {
        await this.recordBrandInitialStock(
          scope,
          request,
          createdProduct,
          createdBrand,
          brand.initialQuantity,
        )
      }
    }
  }

  private async recordBrandInitialStock(
    scope: MrpDatabaseRepositories,
    request: Request,
    createdProduct: Product,
    createdBrand: Brand,
    initialQuantity: number,
  ): Promise<void> {
    const balance = await scope.stockBalancesRepository.add(
      { productId: createdProduct.id, brandId: createdBrand.id },
      initialQuantity,
    )
    await scope.stockTransactionsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: createdProduct.id,
      brandId: createdBrand.id,
      productName: createdProduct.name,
      brandName: createdBrand.name,
      unit: createdProduct.unit,
      type: initialQuantity > 0 ? 'entry' : 'write-off',
      quantity: Math.abs(initialQuantity),
      balanceAfter: balance.quantity,
      performedBy: request.actor.id,
      performedByName: request.actor.name,
      occurredAt: this.datetimeProvider.now(),
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem registrar produtos.')
    }
  }

  private validateInput(input: RegisterProductInput): void {
    this.validateName(input)
    this.validateCategories(input)
    this.validateStock(input)
    this.validateCurrentUnitCost(input)
    this.validateSalePrices(input)
    this.validateSizes(input)
    this.validateBrandConfiguration(input)
    this.validateBrandValues(input)
  }

  private validateName(input: RegisterProductInput): void {
    if (!input.name.trim()) throw new BadRequestError('O nome do produto é obrigatório.')
  }

  private validateCategories(input: RegisterProductInput): void {
    if (input.categories.length === 0) {
      throw new BadRequestError('O produto deve possuir pelo menos uma categoria.')
    }

    if (
      input.categories.includes(ProductCategory.Portion) &&
      input.categories.includes(ProductCategory.Resale)
    ) {
      throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
    }

    if (
      input.categories.includes(ProductCategory.Portion) &&
      input.categories.includes(ProductCategory.Accompaniment)
    ) {
      throw new BadRequestError('Porção e acompanhamento não podem ser usados juntos.')
    }

    if (
      input.categories.includes(ProductCategory.Manufacturable) &&
      input.stockControl !== ProductStockControl.Single
    ) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
    }
  }

  private validateStock(input: RegisterProductInput): void {
    if (input.idealStock === undefined || input.idealStock < 0) {
      throw new BadRequestError(
        'O estoque ideal deve ser informado e não pode ser negativo.',
      )
    }

    if (
      input.initialStock !== undefined &&
      input.initialStock < 0 &&
      !input.allowNegativeStock
    ) {
      throw new BadRequestError('O estoque inicial não pode ser negativo.')
    }
  }

  private validateCurrentUnitCost(input: RegisterProductInput): void {
    if (input.currentUnitCost === undefined) return

    const isSingleStockIngredient =
      input.stockControl === ProductStockControl.Single &&
      input.categories.includes(ProductCategory.Ingredient)
    if (!isSingleStockIngredient) {
      throw new BadRequestError(
        'O custo unitário atual é permitido apenas para ingredientes de estoque único.',
      )
    }

    if (
      !Number.isFinite(input.currentUnitCost) ||
      input.currentUnitCost < 0 ||
      !this.hasAtMostSixDecimalPlaces(input.currentUnitCost)
    ) {
      throw new BadRequestError('O custo unitário atual é inválido.')
    }
  }

  private validateSalePrices(input: RegisterProductInput): void {
    const { accompanimentPrice, resalePrice } = input

    if (resalePrice !== undefined) {
      this.requireSalePriceTarget(input, ProductCategory.Resale)
      this.requireValidSalePrice(
        this.resalePriceValidation.execute(resalePrice),
        RESALE_PRICE_MESSAGE,
      )
    }
    if (accompanimentPrice !== undefined) {
      this.requireSalePriceTarget(input, ProductCategory.Accompaniment)
      this.requireValidSalePrice(
        this.accompanimentPriceValidation.execute(accompanimentPrice) !== 'invalid',
        ACCOMPANIMENT_PRICE_MESSAGE,
      )
    }
  }

  private validateSizes(input: RegisterProductInput): void {
    const sizes = input.sizes ?? []
    if (sizes.length === 0) return

    if (!input.categories.includes(ProductCategory.Portion)) {
      throw new BadRequestError(SIZES_NOT_ALLOWED_MESSAGE)
    }
    for (const size of sizes) {
      const result = this.sizeValidation.execute(size)
      if (result !== 'valid') {
        throw new BadRequestError(PRODUCT_SIZE_VALIDATION_MESSAGES[result])
      }
    }
    const names = sizes.map((size) => size.name.trim().toLocaleLowerCase())
    if (new Set(names).size !== names.length) {
      throw new BadRequestError(DUPLICATE_SIZE_MESSAGE)
    }
  }

  private requireSalePriceTarget(
    input: RegisterProductInput,
    category: keyof typeof SALE_PRICE_TARGET_MESSAGES,
  ): void {
    const canReceivePrice =
      input.stockControl === ProductStockControl.Single &&
      input.categories.includes(category) &&
      !input.categories.includes(ProductCategory.Portion)

    if (!canReceivePrice) {
      throw new BadRequestError(SALE_PRICE_TARGET_MESSAGES[category])
    }
  }

  private requireValidSalePrice(isValid: boolean, message: string): void {
    if (!isValid) throw new BadRequestError(message)
  }

  private validateBrandConfiguration(input: RegisterProductInput): void {
    if (input.stockControl !== ProductStockControl.ByBrand) return
    if (!input.brands?.length) {
      throw new BadRequestError('Produtos por marca devem possuir pelo menos uma marca.')
    }

    const initialStock = input.brands.reduce(
      (total, brand) => total + brand.initialQuantity,
      0,
    )
    if (input.initialStock !== undefined && input.initialStock !== initialStock) {
      throw new BadRequestError(
        'O estoque inicial deve corresponder à soma dos estoques das marcas.',
      )
    }

    const primaryBrandsCount = input.brands.filter((brand) => brand.isPrimary).length
    if (primaryBrandsCount !== 1) {
      throw new BadRequestError(
        'Produtos por marca devem possuir exatamente uma marca principal.',
      )
    }
  }

  private validateBrandValues(input: RegisterProductInput): void {
    for (const brand of input.brands ?? []) {
      this.validateBrand(brand, input.allowNegativeStock)
    }
  }

  private validateBrand(
    brand: NonNullable<RegisterProductInput['brands']>[number],
    allowNegativeStock: boolean | undefined,
  ): void {
    if (!brand.name.trim()) throw new BadRequestError('O nome da marca é obrigatório.')
    if (
      brand.packageQuantity <= 0 ||
      brand.packageValue < 0 ||
      (brand.initialQuantity < 0 && !allowNegativeStock)
    ) {
      throw new BadRequestError('Os valores da marca não podem ser negativos.')
    }
    if (brand.unit !== undefined && !Object.values(ProductUnit).includes(brand.unit)) {
      throw new BadRequestError('A unidade da marca é inválida.')
    }
  }

  private hasAtMostSixDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000_000 - Math.round(value * 1_000_000)) < 1e-8
  }
}
