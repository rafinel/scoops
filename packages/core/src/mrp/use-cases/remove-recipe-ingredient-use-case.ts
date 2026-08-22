import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
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
}

export class RemoveRecipeIngredientUseCase implements UseCase<Request, void> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)

    await this.database.run(async (scope) => {
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

      await scope.recipeIngredientsRepository.remove(
        request.actor.establishmentId,
        recipe.id,
        line.id,
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem remover ingredientes.')
    }
  }
}
