import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { Production } from '#mrp/domain/entities/production.ts'
import type { ProductionIngredient } from '#mrp/domain/entities/production-ingredient.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductionRequest } from '#mrp/domain/structures/production-request.ts'
import { StockTransactionType } from '#mrp/domain/structures/stock-transaction-type.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

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

export class RegisterProductionUseCase implements UseCase<Request, Production> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Production> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      this.validateProduct(product)
      const recipe = await scope.recipesRepository.findByProductId(
        request.actor.establishmentId,
        product.id,
      )
      if (!recipe || recipe.yieldQuantity <= 0) {
        throw new BadRequestError('O produto ainda não possui uma receita válida.')
      }
      const ingredients = await scope.recipeIngredientsRepository.findByRecipeId(
        request.actor.establishmentId,
        recipe.id,
      )
      if (!ingredients.length) {
        throw new BadRequestError('A receita deve possuir pelo menos um ingrediente.')
      }

      const outputBalance = await scope.stockBalancesRepository.findByProductId(
        product.id,
      )
      if (!outputBalance) {
        throw new BadRequestError('O produto fabricável não possui saldo de estoque.')
      }
      const consumptions = await Promise.all(
        ingredients.map(async (ingredient) => {
          const ingredientProduct = await scope.productsRepository.findById(
            request.actor.establishmentId,
            ingredient.ingredientProductId,
          )
          if (!ingredientProduct) {
            throw new NotFoundError('Ingrediente da receita não encontrado.')
          }
          const source = await this.resolveSource(
            scope,
            ingredientProduct,
            ingredient.ingredientBrandId,
          )
          const quantity =
            ingredient.quantity * (request.input.quantity / recipe.yieldQuantity)
          const balance = source.brandId
            ? await scope.stockBalancesRepository.findByProductAndBrand(
                ingredientProduct.id,
                source.brandId,
              )
            : await scope.stockBalancesRepository.findByProductId(ingredientProduct.id)
          if (!balance) {
            throw new BadRequestError(
              `O ingrediente ${ingredientProduct.name} não possui saldo.`,
            )
          }
          if (balance.quantity - quantity < 0 && !ingredientProduct.allowNegativeStock) {
            throw new BadRequestError(
              `Estoque insuficiente para ${ingredientProduct.name}.`,
            )
          }
          return {
            product: ingredientProduct,
            brandId: source.brandId,
            brandName: source.brandName,
            quantity,
            unitCost: source.unitCost,
            lineCost: quantity * source.unitCost,
          } satisfies ResolvedConsumption
        }),
      )
      const totalCost = consumptions.reduce((total, item) => total + item.lineCost, 0)
      const occurredAt = this.datetimeProvider.now()
      const production = await scope.productionsRepository.add({
        establishmentId: request.actor.establishmentId,
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        recipeId: recipe.id,
        recipeYield: recipe.yieldQuantity,
        quantity: request.input.quantity,
        totalCost,
        performedBy: request.actor.id,
        performedByName: request.actor.name,
        occurredAt,
      })
      const productionIngredients: Omit<ProductionIngredient, 'id'>[] = []

      for (const consumption of consumptions) {
        const balance = await scope.stockBalancesRepository.add(
          { productId: consumption.product.id, brandId: consumption.brandId },
          -consumption.quantity,
          consumption.product.allowNegativeStock ? undefined : 0,
        )
        productionIngredients.push({
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
        })
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

      await scope.productionIngredientsRepository.addMany(productionIngredients)
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

      return production
    })
  }

  private async resolveSource(
    scope: MrpDatabaseScope,
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
}
