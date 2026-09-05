import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductRemovalImpact } from '#mrp/domain/structures/product-removal-impact.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
}

export class GetProductRemovalImpactUseCase
  implements UseCase<Request, ProductRemovalImpact>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductRemovalImpact> {
    this.validateActor(request.actor)

    return this.database.run(
      async ({
        productsRepository,
        brandsRepository,
        recipesRepository,
        recipeIngredientsRepository,
        productionsRepository,
        stockBalancesRepository,
        stockTransactionsRepository,
        productSizesRepository,
        productAccompanimentsRepository,
        resaleConfigurationsRepository,
      }: MrpDatabaseRepositories) => {
        const product = await productsRepository.findById(
          request.actor.establishmentId,
          request.productId,
        )
        if (!product || product.establishmentId !== request.actor.establishmentId) {
          throw new NotFoundError('Produto não encontrado.')
        }

        const [
          brands,
          balances,
          ownedRecipe,
          sizes,
          resaleConfigurations,
          ownedAccompanimentLinks,
          consumingRecipeLinks,
          inverseAccompanimentLinks,
          stockTransactions,
          productions,
        ] = await Promise.all([
          brandsRepository.countByProductId(request.actor.establishmentId, product.id),
          stockBalancesRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          recipesRepository.countByProductId(request.actor.establishmentId, product.id),
          productSizesRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          resaleConfigurationsRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          productAccompanimentsRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          recipeIngredientsRepository.countByIngredientProductId(
            request.actor.establishmentId,
            product.id,
          ),
          productAccompanimentsRepository.countByAccompanimentProductId(
            request.actor.establishmentId,
            product.id,
          ),
          stockTransactionsRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          productionsRepository.countByProductId(
            request.actor.establishmentId,
            product.id,
          ),
        ])

        return {
          productName: product.name,
          removable: {
            brands,
            balances,
            ownedRecipe,
            sizes,
            resaleConfigurations,
            ownedAccompanimentLinks,
            consumingRecipeLinks,
            inverseAccompanimentLinks,
          },
          retainedHistory: {
            stockTransactions,
            productions,
            orders: 0,
          },
        }
      },
    )
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem remover produtos.')
    }
  }
}
