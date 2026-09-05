import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { AddRecipeIngredientInput } from '#mrp/domain/structures/add-recipe-ingredient-input.ts'
import type { ProductRecipeDetails } from '#mrp/domain/structures/product-recipe-details.ts'
import { GetProductRecipeUseCase } from '#mrp/use-cases/get-product-recipe-use-case.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
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
  readonly input: AddRecipeIngredientInput
}

export class AddRecipeIngredientUseCase
  implements UseCase<Request, ProductRecipeDetails>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductRecipeDetails> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product) throw new NotFoundError('Produto não encontrado.')
      if (!product.categories.includes(ProductCategory.Manufacturable)) {
        throw new BadRequestError('O produto não é fabricável.')
      }
      const recipe = await scope.recipesRepository.findByProductId(
        request.actor.establishmentId,
        product.id,
      )
      if (!recipe)
        throw new BadRequestError('Salve o rendimento antes de adicionar ingredientes.')
      if (request.input.ingredientProductId === product.id) {
        throw new BadRequestError(
          'Um produto não pode ser ingrediente de sua própria receita.',
        )
      }
      const ingredientProduct = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.input.ingredientProductId,
      )
      this.validateIngredient(ingredientProduct)
      const sourceBrand = await this.resolveSourceBrand(
        scope,
        ingredientProduct,
        request.input.ingredientBrandId,
      )
      const existing = await scope.recipeIngredientsRepository.findByRecipeAndProduct(
        request.actor.establishmentId,
        recipe.id,
        ingredientProduct.id,
      )
      if (existing) throw new ConflictError('O ingrediente já está na receita.')

      await scope.recipeIngredientsRepository.add({
        establishmentId: request.actor.establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredientProduct.id,
        ...(sourceBrand ? { ingredientBrandId: sourceBrand.id } : {}),
        quantity: request.input.quantity,
      })

      return GetProductRecipeUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem adicionar ingredientes.')
    }
  }

  private validateInput(input: AddRecipeIngredientInput): void {
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

  private validateIngredient(product: Product | undefined): asserts product is Product {
    if (!product) throw new NotFoundError('Ingrediente não encontrado.')
    if (product.status !== ProductStatus.Active) {
      throw new BadRequestError('O ingrediente deve estar ativo.')
    }
    if (!product.categories.includes(ProductCategory.Ingredient)) {
      throw new BadRequestError('O produto selecionado não é um ingrediente.')
    }
  }

  private async resolveSourceBrand(
    scope: MrpDatabaseScope,
    product: Product,
    requestedBrandId: string | undefined,
  ): Promise<Brand | undefined> {
    if (product.stockControl === ProductStockControl.Single) {
      if (product.currentUnitCost === undefined) {
        throw new BadRequestError('O ingrediente não possui custo unitário atual.')
      }
      if (requestedBrandId) {
        throw new BadRequestError('Ingrediente com estoque único não possui marca.')
      }
      return undefined
    }
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const brand = requestedBrandId
      ? brands.find((candidate) => candidate.id === requestedBrandId)
      : brands.find((candidate) => candidate.isPrimary)
    if (!brand) {
      if (requestedBrandId)
        throw new NotFoundError('Marca do ingrediente não encontrada.')
      throw new BadRequestError('O ingrediente não possui marca principal.')
    }
    return brand
  }

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }
}
