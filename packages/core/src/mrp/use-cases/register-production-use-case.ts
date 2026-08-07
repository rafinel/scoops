import { ProductionRegisteredEvent } from '#mrp/domain/events/production-registered-event.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStockControl,
  StockAdjustmentType,
} from '#mrp/domain/structures/index.ts'
import type { ProductionRequest } from '#mrp/domain/structures/production-request.ts'
import type { ProductionPreview } from '#mrp/domain/structures/production-preview.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { BadRequestError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export class RegisterProductionUseCase
  implements UseCase<ProductionRequest, ProductionPreview>
{
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker: Broker,
  ) {}

  async execute(request: ProductionRequest): Promise<ProductionPreview> {
    if (request.quantity <= 0) {
      throw new BadRequestError('A quantidade produzida deve ser maior que zero.')
    }

    const preview = await this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(request.productId)

      if (!product || product.establishmentId !== request.establishmentId) {
        throw new NotFoundError('Produto fabricável não encontrado.')
      }

      this.validateProduct(product)

      const recipe = await scope.recipesRepository.findByProductId(product.id)

      if (!recipe) throw new BadRequestError('O produto ainda não possui uma receita.')

      if (recipe.yieldQuantity <= 0) {
        throw new BadRequestError('O rendimento da receita deve ser maior que zero.')
      }

      const ingredients = await scope.recipeIngredientsRepository.findByRecipeId(
        recipe.id,
      )

      if (ingredients.length === 0) {
        throw new BadRequestError('A receita deve possuir pelo menos um ingrediente.')
      }

      const consumptions = []

      for (const ingredient of ingredients) {
        const ingredientProduct = await scope.productsRepository.findById(
          ingredient.ingredientProductId,
        )

        if (
          !ingredientProduct ||
          ingredientProduct.establishmentId !== request.establishmentId
        ) {
          throw new NotFoundError('Ingrediente da receita não encontrado.')
        }

        const balance = await this.findIngredientBalance(scope, ingredientProduct)
        const consumedQuantity =
          ingredient.quantity * (request.quantity / recipe.yieldQuantity)
        const projectedBalance = balance.quantity - consumedQuantity

        if (projectedBalance < 0) {
          throw new BadRequestError(
            `Estoque insuficiente para o ingrediente ${ingredientProduct.name}.`,
          )
        }

        consumptions.push({
          ingredientProductId: ingredientProduct.id,
          ingredientBrandId: balance.brandId,
          quantity: consumedQuantity,
          currentBalance: balance.quantity,
          projectedBalance,
        })
      }

      for (const consumption of consumptions) {
        await scope.stockBalancesRepository.adjust({
          establishmentId: request.establishmentId,
          productId: consumption.ingredientProductId,
          brandId: consumption.ingredientBrandId,
          type: StockAdjustmentType.WriteOff,
          quantity: consumption.quantity,
          performedBy: request.performedBy,
          occurredAt: request.occurredAt,
        })
      }

      const resultingStock = await scope.stockBalancesRepository.adjust({
        establishmentId: request.establishmentId,
        productId: product.id,
        type: StockAdjustmentType.Entry,
        quantity: request.quantity,
        performedBy: request.performedBy,
        occurredAt: request.occurredAt,
      })

      return {
        productId: product.id,
        quantity: request.quantity,
        recipeYield: recipe.yieldQuantity,
        consumptions,
        resultingStock: resultingStock.quantity,
        canProduce: true,
      }
    })

    this.broker.publish(new ProductionRegisteredEvent(request))

    return preview
  }

  private validateProduct(product: Product): void {
    if (!product.categories.includes(ProductCategory.Manufacturable)) {
      throw new BadRequestError('Somente produtos fabricáveis podem receber produção.')
    }

    if (product.stockControl !== ProductStockControl.Single) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
    }
  }

  private async findIngredientBalance(scope: MrpDatabaseScope, product: Product) {
    if (product.stockControl === ProductStockControl.Single) {
      const balance = await scope.stockBalancesRepository.findByProductId(product.id)

      if (!balance)
        throw new BadRequestError(`O ingrediente ${product.name} não possui estoque.`)

      return balance
    }

    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const primaryBrand = brands.find((brand) => brand.isPrimary)

    if (!primaryBrand) {
      throw new BadRequestError(
        `O ingrediente ${product.name} não possui marca principal.`,
      )
    }

    const balance = await scope.stockBalancesRepository.findByProductAndBrand(
      product.id,
      primaryBrand.id,
    )

    if (!balance)
      throw new BadRequestError(`O ingrediente ${product.name} não possui estoque.`)

    return balance
  }
}
