import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductionPreview } from '#mrp/domain/structures/production-preview.ts'
import type { ProductionRequest } from '#mrp/domain/structures/production-request.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: ProductionRequest
}

type Source = {
  readonly balance: number
  readonly unitCost: number
  readonly brandId?: string
  readonly brandName?: string
  readonly blockReason?: string
}

export class PreviewProductionUseCase implements UseCase<Request, ProductionPreview> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductionPreview> {
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

      const blockReasons: string[] = []
      const consumptions = await Promise.all(
        ingredients.map(async (ingredient) => {
          const ingredientProduct = await scope.productsRepository.findById(
            request.actor.establishmentId,
            ingredient.ingredientProductId,
          )
          if (!ingredientProduct) {
            const reason = 'Um ingrediente da receita não está disponível.'
            blockReasons.push(reason)
            return {
              ingredientProductId: ingredient.ingredientProductId,
              ingredientProductName: 'Ingrediente indisponível',
              unit: product.unit,
              quantity: 0,
              unitCost: 0,
              lineCost: 0,
              currentBalance: 0,
              projectedBalance: 0,
              missingQuantity: 0,
              allowsNegativeStock: false,
            }
          }
          const source = await this.resolveSource(
            scope,
            ingredientProduct,
            ingredient.ingredientBrandId,
          )
          if (source.blockReason) blockReasons.push(source.blockReason)
          const quantity =
            ingredient.quantity * (request.input.quantity / recipe.yieldQuantity)
          const projectedBalance = source.balance - quantity
          const missingQuantity = Math.max(0, -projectedBalance)
          const allowsNegativeStock = ingredientProduct.allowNegativeStock === true
          if (missingQuantity > 0 && !allowsNegativeStock) {
            blockReasons.push(`Estoque insuficiente para ${ingredientProduct.name}.`)
          }

          return {
            ingredientProductId: ingredientProduct.id,
            ingredientProductName: ingredientProduct.name,
            ingredientBrandId: source.brandId,
            ingredientBrandName: source.brandName,
            unit: ingredientProduct.unit,
            quantity,
            unitCost: source.unitCost,
            lineCost: quantity * source.unitCost,
            currentBalance: source.balance,
            projectedBalance,
            missingQuantity,
            allowsNegativeStock,
          }
        }),
      )
      const outputBalance = await scope.stockBalancesRepository.findByProductId(
        product.id,
      )
      if (!outputBalance)
        blockReasons.push('O produto fabricável não possui saldo de estoque.')
      const totalCost = consumptions.reduce((total, line) => total + line.lineCost, 0)
      const batches = request.input.quantity / recipe.yieldQuantity

      return {
        productId: product.id,
        unit: product.unit,
        quantity: request.input.quantity,
        recipeYield: recipe.yieldQuantity,
        ...(Number.isInteger(batches) && batches > 0 ? { batches } : {}),
        consumptions,
        totalCost,
        currentOutputStock: outputBalance?.quantity ?? 0,
        projectedOutputStock: (outputBalance?.quantity ?? 0) + request.input.quantity,
        canProduce: blockReasons.length === 0,
        blockReasons: [...new Set(blockReasons)],
      }
    })
  }

  private async resolveSource(
    scope: MrpDatabaseScope,
    product: Product,
    selectedBrandId?: string,
  ): Promise<Source> {
    if (product.status !== ProductStatus.Active) {
      return { balance: 0, unitCost: 0, blockReason: `${product.name} está inativo.` }
    }
    if (!product.categories.includes(ProductCategory.Ingredient)) {
      return {
        balance: 0,
        unitCost: 0,
        blockReason: `${product.name} não é ingrediente.`,
      }
    }
    if (product.stockControl === ProductStockControl.Single) {
      const balance = await scope.stockBalancesRepository.findByProductId(product.id)
      if (product.currentUnitCost === undefined) {
        return {
          balance: balance?.quantity ?? 0,
          unitCost: 0,
          blockReason: `${product.name} não possui custo unitário atual.`,
        }
      }
      if (!balance) {
        return {
          balance: 0,
          unitCost: product.currentUnitCost,
          blockReason: `${product.name} não possui saldo de estoque.`,
        }
      }
      return { balance: balance.quantity, unitCost: product.currentUnitCost }
    }
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const brand =
      (selectedBrandId
        ? brands.find((item) => item.id === selectedBrandId)
        : undefined) ?? brands.find((item) => item.isPrimary)
    if (!brand) {
      return {
        balance: 0,
        unitCost: 0,
        blockReason: `${product.name} não possui marca principal.`,
      }
    }
    const balance = await scope.stockBalancesRepository.findByProductAndBrand(
      product.id,
      brand.id,
    )
    if (!balance) {
      return {
        balance: 0,
        unitCost: brand.packagePrice / brand.packageQuantity,
        brandId: brand.id,
        brandName: brand.name,
        blockReason: `${product.name} não possui saldo de estoque.`,
      }
    }
    return {
      balance: balance.quantity,
      unitCost: brand.packagePrice / brand.packageQuantity,
      brandId: brand.id,
      brandName: brand.name,
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem pré-visualizar a produção.')
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
