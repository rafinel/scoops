import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductRecipeDetails } from '#mrp/domain/structures/product-recipe-details.ts'
import type { RecipeIngredientDetails } from '#mrp/domain/structures/recipe-ingredient-details.ts'
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
}

export class GetProductRecipeUseCase implements UseCase<Request, ProductRecipeDetails> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductRecipeDetails> {
    this.validateActor(request.actor)

    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )

      this.validateManufacturableProduct(product)

      return GetProductRecipeUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
      )
    })
  }

  static async buildDetails(
    scope: MrpDatabaseScope,
    establishmentId: string,
    product: Product,
  ): Promise<ProductRecipeDetails> {
    const recipe = await scope.recipesRepository.findByProductId(
      establishmentId,
      product.id,
    )

    if (!recipe) return { product, recipe: null }

    const ingredients = await scope.recipeIngredientsRepository.findByRecipeId(
      establishmentId,
      recipe.id,
    )
    const ingredientDetails = await Promise.all(
      ingredients.map(async (ingredient) => {
        const ingredientProduct = await scope.productsRepository.findById(
          establishmentId,
          ingredient.ingredientProductId,
        )
        if (!ingredientProduct) {
          throw new BadRequestError('Um ingrediente da receita não está disponível.')
        }

        const source = await GetProductRecipeUseCase.resolveSource(
          scope,
          ingredientProduct,
          ingredient.ingredientBrandId,
        )
        const lineCost = ingredient.quantity * source.unitCost
        const capacity = Math.max(
          0,
          Math.floor(
            (source.balance / ingredient.quantity) * recipe.yieldQuantity * 1000,
          ) / 1000,
        )

        return {
          id: ingredient.id,
          ingredientProductId: ingredientProduct.id,
          ingredientProductName: ingredientProduct.name,
          ingredientBrandId: source.brandId,
          ingredientBrandName: source.brandName,
          unit: ingredientProduct.unit,
          quantity: ingredient.quantity,
          unitCost: source.unitCost,
          lineCost,
          cogsPercentage: 0,
          currentBalance: source.balance,
          capacity,
          isLimiting: false,
        } satisfies RecipeIngredientDetails
      }),
    )
    const totalCost = ingredientDetails.reduce((total, line) => total + line.lineCost, 0)
    const maximumProducibleQuantity = ingredientDetails.length
      ? Math.min(...ingredientDetails.map((line) => line.capacity))
      : 0
    const ingredientDetailsWithMetrics = ingredientDetails.map((line) => ({
      ...line,
      cogsPercentage: totalCost === 0 ? 0 : (line.lineCost / totalCost) * 100,
      isLimiting: line.capacity === maximumProducibleQuantity,
    }))

    return {
      product,
      recipe: {
        id: recipe.id,
        yieldQuantity: recipe.yieldQuantity,
        totalCost,
        unitCost: totalCost / recipe.yieldQuantity,
        maximumProducibleQuantity,
        ingredients: ingredientDetailsWithMetrics,
      },
    }
  }

  private static async resolveSource(
    scope: MrpDatabaseScope,
    product: Product,
    selectedBrandId?: string,
  ) {
    if (product.status !== ProductStatus.Active) {
      throw new BadRequestError('Um ingrediente da receita está inativo.')
    }
    if (!product.categories.includes(ProductCategory.Ingredient)) {
      throw new BadRequestError('Um produto da receita não é um ingrediente elegível.')
    }

    if (product.stockControl === ProductStockControl.Single) {
      if (product.currentUnitCost === undefined) {
        throw new BadRequestError('Um ingrediente não possui custo unitário atual.')
      }
      const balance = await scope.stockBalancesRepository.findByProductId(product.id)
      if (!balance)
        throw new BadRequestError('Um ingrediente não possui saldo de estoque.')
      return { balance: balance.quantity, unitCost: product.currentUnitCost }
    }

    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const brand =
      (selectedBrandId
        ? brands.find((item) => item.id === selectedBrandId)
        : undefined) ?? brands.find((item) => item.isPrimary)
    if (!brand) throw new BadRequestError('Um ingrediente não possui marca principal.')
    const balance = await scope.stockBalancesRepository.findByProductAndBrand(
      product.id,
      brand.id,
    )
    if (!balance) throw new BadRequestError('Um ingrediente não possui saldo de estoque.')

    return {
      balance: balance.quantity,
      brandId: brand.id,
      brandName: brand.name,
      unitCost: brand.packagePrice / brand.packageQuantity,
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem consultar receitas.')
    }
  }

  private validateManufacturableProduct(
    product: Product | undefined,
  ): asserts product is Product {
    if (!product) throw new NotFoundError('Produto não encontrado.')
    if (!product.categories.includes(ProductCategory.Manufacturable)) {
      throw new BadRequestError('O produto não é fabricável.')
    }
  }
}
