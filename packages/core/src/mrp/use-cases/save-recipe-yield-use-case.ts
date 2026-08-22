import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductRecipeDetails } from '#mrp/domain/structures/product-recipe-details.ts'
import type { SaveRecipeYieldInput } from '#mrp/domain/structures/save-recipe-yield-input.ts'
import { GetProductRecipeUseCase } from '#mrp/use-cases/get-product-recipe-use-case.ts'
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
  readonly input: SaveRecipeYieldInput
}

export class SaveRecipeYieldUseCase implements UseCase<Request, ProductRecipeDetails> {
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
      if (recipe) {
        await scope.recipesRepository.replace(request.actor.establishmentId, recipe.id, {
          yieldQuantity: request.input.yieldQuantity,
        })
      } else {
        await scope.recipesRepository.add({
          establishmentId: request.actor.establishmentId,
          productId: product.id,
          yieldQuantity: request.input.yieldQuantity,
        })
      }

      return GetProductRecipeUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem salvar receitas.')
    }
  }

  private validateInput(input: SaveRecipeYieldInput): void {
    if (
      !Number.isFinite(input.yieldQuantity) ||
      input.yieldQuantity <= 0 ||
      !this.hasAtMostThreeDecimalPlaces(input.yieldQuantity)
    ) {
      throw new BadRequestError(
        'O rendimento deve ser positivo e ter até três casas decimais.',
      )
    }
  }

  private hasAtMostThreeDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
  }
}
