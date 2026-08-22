import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductRecipeDetails } from '#mrp/domain/structures/product-recipe-details.ts'
import type { UpdateRecipeIngredientInput } from '#mrp/domain/structures/update-recipe-ingredient-input.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { GetProductRecipeUseCase } from '#mrp/use-cases/get-product-recipe-use-case.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly lineId: string
  readonly input: UpdateRecipeIngredientInput
}

export class UpdateRecipeIngredientUseCase
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
      if (!recipe) throw new NotFoundError('Receita não encontrada.')
      const line = await scope.recipeIngredientsRepository.findById(
        request.actor.establishmentId,
        recipe.id,
        request.lineId,
      )
      if (!line) throw new NotFoundError('Ingrediente da receita não encontrado.')

      await scope.recipeIngredientsRepository.replace(
        request.actor.establishmentId,
        recipe.id,
        line.id,
        { quantity: request.input.quantity },
      )

      return GetProductRecipeUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem editar ingredientes.')
    }
  }

  private validateInput(input: UpdateRecipeIngredientInput): void {
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

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }
}
