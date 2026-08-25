import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { PreviewProductUnitChangeInput } from '#mrp/domain/structures/preview-product-unit-change-input.ts'
import type { ProductUnitChangePreview } from '#mrp/domain/structures/product-unit-change-preview.ts'
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
  readonly input: PreviewProductUnitChangeInput
}

export class PreviewProductUnitChangeUseCase
  implements UseCase<Request, ProductUnitChangePreview>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductUnitChangePreview> {
    this.validateActor(request.actor)
    this.validateUnit(request.input.targetUnit)

    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product || product.establishmentId !== request.actor.establishmentId) {
        throw new NotFoundError('Produto não encontrado.')
      }
      if (product.unit === request.input.targetUnit) {
        throw new BadRequestError('A unidade de destino deve ser diferente da atual.')
      }

      const brands = await scope.brandsRepository.findManyByProductId(
        request.actor.establishmentId,
        product.id,
      )
      const [balances, recipeYields, recipeIngredients, sizes, accompanimentLinks] =
        await Promise.all([
          scope.stockBalancesRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          scope.recipesRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          scope.recipeIngredientsRepository.countByIngredientProductId(
            request.actor.establishmentId,
            product.id,
          ),
          scope.productSizesRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          scope.productAccompanimentsRepository.countByAccompanimentProductId(
            request.actor.establishmentId,
            product.id,
          ),
        ])

      const affectedBrands = brands
        .filter(
          (brand) =>
            brand.productId === product.id &&
            product.establishmentId === request.actor.establishmentId,
        )
        .map(({ id, name }) => ({ brandId: id, brandName: name }))
        .sort(
          (left, right) =>
            left.brandName
              .trim()
              .toLocaleLowerCase()
              .localeCompare(right.brandName.trim().toLocaleLowerCase()) ||
            left.brandId.localeCompare(right.brandId),
        )

      return {
        currentUnit: product.unit,
        targetUnit: request.input.targetUnit,
        affected: {
          balances,
          brands: affectedBrands,
          recipeYields,
          recipeIngredients,
          sizes,
          accompanimentLinks,
          hasIdealStock: product.idealStock !== undefined,
          hasCurrentUnitCost: product.currentUnitCost !== undefined,
        },
      }
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem alterar a unidade.')
    }
  }

  private validateUnit(unit: ProductUnit): void {
    if (!Object.values(ProductUnit).includes(unit)) {
      throw new BadRequestError('A unidade do produto é inválida.')
    }
  }
}
