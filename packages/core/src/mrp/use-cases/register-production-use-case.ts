import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { Production } from '#mrp/domain/entities/production.ts'
import type { ProductionIngredient } from '#mrp/domain/entities/production-ingredient.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductionRequest } from '#mrp/domain/structures/production-request.ts'
import type { StockBalance } from '#mrp/domain/structures/stock-balance.ts'
import { StockTransactionType } from '#mrp/domain/structures/stock-transaction-type.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { PublishProductStockAlertUseCase } from '#mrp/use-cases/publish-product-stock-alert-use-case.ts'

type Request = {
  readonly actor: ProductActor & { readonly name: string }
  readonly productId: string
  readonly input: ProductionRequest
}

type ResolvedConsumption = {
  readonly product: Product
  readonly brandId?: string
  readonly brandName?: string
  readonly quantity: number
  readonly unitCost: number
  readonly lineCost: number
}

type PreparedProduction = {
  readonly product: Product
  readonly recipeId: string
  readonly recipeYield: number
  readonly productIds: readonly string[]
  readonly products: Map<string, Product>
  readonly previousQuantities: Map<string, number>
  readonly consumptions: readonly ResolvedConsumption[]
  readonly occurredAt: Date
}

export class RegisterProductionUseCase implements UseCase<Request, Production> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Production> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    return this.database.run((scope) => this.registerProduction(request, scope))
  }

  private async registerProduction(
    request: Request,
    scope: MrpDatabaseRepositories,
  ): Promise<Production> {
    const prepared = await this.prepareProduction(scope, request)
    const production = await this.addProduction(
      scope,
      request,
      prepared.product,
      prepared.recipeId,
      prepared.recipeYield,
      this.calculateTotalCost(prepared.consumptions),
      prepared.occurredAt,
    )

    await this.addConsumptionMovements(
      scope,
      request,
      production,
      prepared.consumptions,
      prepared.occurredAt,
    )
    await this.addOutputMovement(
      scope,
      request,
      production,
      prepared.product,
      prepared.occurredAt,
    )
    await this.publishStockAlerts(
      scope,
      prepared.productIds,
      prepared.products,
      prepared.previousQuantities,
      prepared.occurredAt,
    )

    return production
  }

  private async prepareProduction(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<PreparedProduction> {
    const productBeforeLock = await scope.productsRepository.findById(
      request.actor.establishmentId,
      request.productId,
    )
    this.validateProduct(productBeforeLock)

    const recipe = await scope.recipesRepository.findByProductId(
      request.actor.establishmentId,
      productBeforeLock.id,
    )
    this.validateRecipe(recipe)

    const ingredients = await scope.recipeIngredientsRepository.findByRecipeId(
      request.actor.establishmentId,
      recipe.id,
    )
    this.validateIngredients(ingredients)

    const { productIds, products } = await this.lockProducts(
      scope,
      request,
      productBeforeLock,
      ingredients,
    )
    const product = this.getProduct(products, productBeforeLock.id)
    const previousQuantities = await this.captureQuantities(scope, productIds)

    const outputBalance = await scope.stockBalancesRepository.findByProductId(product.id)
    this.validateOutputBalance(outputBalance)

    const consumptions = await this.resolveConsumptions(
      scope,
      ingredients,
      products,
      request.input.quantity,
      recipe.yieldQuantity,
    )

    return {
      product,
      recipeId: recipe.id,
      recipeYield: recipe.yieldQuantity,
      productIds,
      products,
      previousQuantities,
      consumptions,
      occurredAt: this.datetimeProvider.now(),
    }
  }

  private calculateTotalCost(consumptions: readonly ResolvedConsumption[]): number {
    return consumptions.reduce((total, item) => total + item.lineCost, 0)
  }

  private async lockProducts(
    scope: MrpDatabaseRepositories,
    request: Request,
    productBeforeLock: Product,
    ingredients: readonly { ingredientProductId: string }[],
  ): Promise<{ productIds: string[]; products: Map<string, Product> }> {
    const productIds = [
      ...new Set([
        productBeforeLock.id,
        ...ingredients.map((item) => item.ingredientProductId),
      ]),
    ].sort()
    const products = new Map<string, Product>()

    for (const productId of productIds) {
      const lockedProduct = await this.findLockedProduct(scope, request, productId)
      if (!lockedProduct) {
        if (productId === productBeforeLock.id)
          throw new NotFoundError('Produto não encontrado.')
        throw new NotFoundError('Ingrediente da receita não encontrado.')
      }
      products.set(productId, lockedProduct)
    }

    return { productIds, products }
  }

  private async findLockedProduct(
    scope: MrpDatabaseRepositories,
    request: Request,
    productId: string,
  ): Promise<Product | undefined> {
    return (
      (await scope.productsRepository.findByIdForUpdate(
        request.actor.establishmentId,
        productId,
      )) ??
      (await scope.productsRepository.findById(request.actor.establishmentId, productId))
    )
  }

  private getProduct(products: Map<string, Product>, productId: string): Product {
    const product = products.get(productId)
    if (!product) throw new NotFoundError('Produto não encontrado.')
    return product
  }

  private async captureQuantities(
    scope: MrpDatabaseRepositories,
    productIds: readonly string[],
  ): Promise<Map<string, number>> {
    const previousQuantities = new Map<string, number>()
    for (const productId of productIds) {
      previousQuantities.set(productId, await this.findProductQuantity(scope, productId))
    }
    return previousQuantities
  }

  private async resolveConsumptions(
    scope: MrpDatabaseRepositories,
    ingredients: readonly {
      ingredientProductId: string
      ingredientBrandId?: string
      quantity: number
    }[],
    products: Map<string, Product>,
    requestedQuantity: number,
    recipeYield: number,
  ): Promise<ResolvedConsumption[]> {
    return Promise.all(
      ingredients.map((ingredient) =>
        this.resolveConsumption(
          scope,
          ingredient,
          products,
          requestedQuantity,
          recipeYield,
        ),
      ),
    )
  }

  private async resolveConsumption(
    scope: MrpDatabaseRepositories,
    ingredient: {
      ingredientProductId: string
      ingredientBrandId?: string
      quantity: number
    },
    products: Map<string, Product>,
    requestedQuantity: number,
    recipeYield: number,
  ): Promise<ResolvedConsumption> {
    const ingredientProduct = products.get(ingredient.ingredientProductId)
    if (!ingredientProduct) {
      throw new NotFoundError('Ingrediente da receita não encontrado.')
    }

    const source = await this.resolveSource(
      scope,
      ingredientProduct,
      ingredient.ingredientBrandId,
    )
    const quantity = ingredient.quantity * (requestedQuantity / recipeYield)
    const balance = source.brandId
      ? await scope.stockBalancesRepository.findByProductAndBrand(
          ingredientProduct.id,
          source.brandId,
        )
      : await scope.stockBalancesRepository.findByProductId(ingredientProduct.id)
    this.validateIngredientBalance(ingredientProduct, balance, quantity)

    return {
      product: ingredientProduct,
      brandId: source.brandId,
      brandName: source.brandName,
      quantity,
      unitCost: source.unitCost,
      lineCost: quantity * source.unitCost,
    }
  }

  private validateIngredientBalance(
    product: Product,
    balance: StockBalance | undefined,
    quantity: number,
  ): asserts balance is StockBalance {
    if (!balance) {
      throw new BadRequestError(`O ingrediente ${product.name} não possui saldo.`)
    }
    if (balance.quantity - quantity < 0 && !product.allowNegativeStock) {
      throw new BadRequestError(`Estoque insuficiente para ${product.name}.`)
    }
  }

  private async addProduction(
    scope: MrpDatabaseRepositories,
    request: Request,
    product: Product,
    recipeId: string,
    recipeYield: number,
    totalCost: number,
    occurredAt: Date,
  ): Promise<Production> {
    return scope.productionsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      recipeId,
      recipeYield,
      quantity: request.input.quantity,
      totalCost,
      performedBy: request.actor.id,
      performedByName: request.actor.name,
      occurredAt,
    })
  }

  private async addConsumptionMovements(
    scope: MrpDatabaseRepositories,
    request: Request,
    production: Production,
    consumptions: readonly ResolvedConsumption[],
    occurredAt: Date,
  ): Promise<void> {
    const productionIngredients: Omit<ProductionIngredient, 'id'>[] = []

    for (const consumption of consumptions) {
      const balance = await scope.stockBalancesRepository.add(
        { productId: consumption.product.id, brandId: consumption.brandId },
        -consumption.quantity,
        consumption.product.allowNegativeStock ? undefined : 0,
      )
      productionIngredients.push(
        this.buildProductionIngredient(request, production, consumption, balance),
      )
      await this.addConsumptionTransaction(
        scope,
        request,
        production,
        consumption,
        balance,
        occurredAt,
      )
    }

    await scope.productionIngredientsRepository.addMany(productionIngredients)
  }

  private buildProductionIngredient(
    request: Request,
    production: Production,
    consumption: ResolvedConsumption,
    balance: StockBalance,
  ): Omit<ProductionIngredient, 'id'> {
    return {
      establishmentId: request.actor.establishmentId,
      productionId: production.id,
      ingredientProductId: consumption.product.id,
      ingredientProductName: consumption.product.name,
      ...(consumption.brandId
        ? {
            ingredientBrandId: consumption.brandId,
            ingredientBrandName: consumption.brandName,
          }
        : {}),
      unit: consumption.product.unit,
      quantity: consumption.quantity,
      unitCost: consumption.unitCost,
      lineCost: consumption.lineCost,
      balanceAfter: balance.quantity,
    }
  }

  private async addConsumptionTransaction(
    scope: MrpDatabaseRepositories,
    request: Request,
    production: Production,
    consumption: ResolvedConsumption,
    balance: StockBalance,
    occurredAt: Date,
  ): Promise<void> {
    await scope.stockTransactionsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: consumption.product.id,
      ...(consumption.brandId
        ? { brandId: consumption.brandId, brandName: consumption.brandName }
        : {}),
      productionId: production.id,
      productName: consumption.product.name,
      unit: consumption.product.unit,
      type: StockTransactionType.ProductionConsumption,
      quantity: consumption.quantity,
      balanceAfter: balance.quantity,
      performedBy: request.actor.id,
      performedByName: request.actor.name,
      occurredAt,
    })
  }

  private async addOutputMovement(
    scope: MrpDatabaseRepositories,
    request: Request,
    production: Production,
    product: Product,
    occurredAt: Date,
  ): Promise<void> {
    const output = await scope.stockBalancesRepository.add(
      { productId: product.id },
      request.input.quantity,
    )
    await scope.stockTransactionsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: product.id,
      productionId: production.id,
      productName: product.name,
      unit: product.unit,
      type: StockTransactionType.ProductionOutput,
      quantity: request.input.quantity,
      balanceAfter: output.quantity,
      performedBy: request.actor.id,
      performedByName: request.actor.name,
      occurredAt,
    })
  }

  private async publishStockAlerts(
    scope: MrpDatabaseRepositories,
    productIds: readonly string[],
    products: Map<string, Product>,
    previousQuantities: Map<string, number>,
    occurredAt: Date,
  ): Promise<void> {
    const publishStockAlert = new PublishProductStockAlertUseCase(scope.eventsRepository)
    for (const productId of productIds) {
      const sourceProduct = products.get(productId)
      if (!sourceProduct) continue
      await publishStockAlert.execute({
        product: sourceProduct,
        previousQuantity: previousQuantities.get(productId),
        availableQuantity: await this.findProductQuantity(scope, productId),
        occurredAt,
      })
    }
  }

  private validateRecipe(
    recipe: Awaited<
      ReturnType<MrpDatabaseRepositories['recipesRepository']['findByProductId']>
    >,
  ): asserts recipe {
    if (!recipe || recipe.yieldQuantity <= 0) {
      throw new BadRequestError('O produto ainda não possui uma receita válida.')
    }
  }

  private validateIngredients(ingredients: readonly unknown[]): asserts ingredients {
    if (!ingredients.length) {
      throw new BadRequestError('A receita deve possuir pelo menos um ingrediente.')
    }
  }

  private validateOutputBalance(balance: StockBalance | undefined): asserts balance {
    if (!balance) {
      throw new BadRequestError('O produto fabricável não possui saldo de estoque.')
    }
  }

  private async resolveSource(
    scope: MrpDatabaseRepositories,
    product: Product,
    selectedBrandId?: string,
  ) {
    if (product.status !== ProductStatus.Active) {
      throw new BadRequestError(`O ingrediente ${product.name} está inativo.`)
    }
    if (!product.categories.includes(ProductCategory.Ingredient)) {
      throw new BadRequestError(`O produto ${product.name} não é um ingrediente.`)
    }
    if (product.stockControl === ProductStockControl.Single) {
      if (product.currentUnitCost === undefined) {
        throw new BadRequestError(`O ingrediente ${product.name} não possui custo atual.`)
      }
      return { unitCost: product.currentUnitCost }
    }
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const brand =
      (selectedBrandId
        ? brands.find((item) => item.id === selectedBrandId)
        : undefined) ?? brands.find((item) => item.isPrimary)
    if (!brand) {
      throw new BadRequestError(
        `O ingrediente ${product.name} não possui marca principal.`,
      )
    }
    return {
      brandId: brand.id,
      brandName: brand.name,
      unitCost: brand.packagePrice / brand.packageQuantity,
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem registrar produções.')
    }
  }

  private validateInput(input: ProductionRequest): void {
    if (
      !Number.isFinite(input.quantity) ||
      input.quantity <= 0 ||
      !this.hasAtMostThreeDecimalPlaces(input.quantity)
    ) {
      throw new BadRequestError(
        'A quantidade deve ser positiva e ter até três casas decimais.',
      )
    }
  }

  private validateProduct(product: Product | undefined): asserts product is Product {
    if (!product) throw new NotFoundError('Produto não encontrado.')
    if (!product.categories.includes(ProductCategory.Manufacturable)) {
      throw new BadRequestError('O produto não é fabricável.')
    }
    if (product.stockControl !== ProductStockControl.Single) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
    }
  }

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }

  private async findProductQuantity(
    scope: MrpDatabaseRepositories,
    productId: string,
  ): Promise<number> {
    const balances = await scope.stockBalancesRepository.findManyByProductId(productId)
    return balances.reduce((total, balance) => total + balance.quantity, 0)
  }
}
