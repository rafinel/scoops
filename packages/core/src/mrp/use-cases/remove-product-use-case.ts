import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductRemovalImpact } from '#mrp/domain/structures/product-removal-impact.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
}

export class RemoveProductUseCase implements UseCase<Request, void> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)

    let inverseOwnerIds: readonly string[] = []
    await this.database.run(
      async ({
        productsRepository,
        brandsRepository,
        recipesRepository,
        recipeIngredientsRepository,
        productionsRepository,
        productionIngredientsRepository,
        stockBalancesRepository,
        stockTransactionsRepository,
        productSizesRepository,
        accompanimentTypesRepository,
        productAccompanimentsRepository,
        resaleConfigurationsRepository,
        eventsRepository,
      }: MrpDatabaseRepositories) => {
        const scope = {
          productsRepository,
          brandsRepository,
          recipesRepository,
          recipeIngredientsRepository,
          productionsRepository,
          productionIngredientsRepository,
          stockBalancesRepository,
          stockTransactionsRepository,
          productSizesRepository,
          accompanimentTypesRepository,
          productAccompanimentsRepository,
          resaleConfigurationsRepository,
          eventsRepository,
        }
        const product = await productsRepository.findByIdForUpdate(
          request.actor.establishmentId,
          request.productId,
        )
        if (!product || product.establishmentId !== request.actor.establishmentId) {
          throw new NotFoundError('Produto não encontrado.')
        }

        await this.readImpact(scope, request.actor.establishmentId, product)

        const inverseLinks =
          (await productAccompanimentsRepository.findManyByAccompanimentProductId(
            request.actor.establishmentId,
            product.id,
          )) ?? []
        inverseOwnerIds = [
          ...new Set(
            inverseLinks
              .filter(
                (link) =>
                  link.establishmentId === request.actor.establishmentId &&
                  link.productId !== product.id,
              )
              .map((link) => link.productId),
          ),
        ]

        const [brands, sizes, recipe] = await Promise.all([
          brandsRepository.findManyByProductId(request.actor.establishmentId, product.id),
          productSizesRepository.findManyByProductId(
            request.actor.establishmentId,
            product.id,
          ),
          recipesRepository.findByProductId(request.actor.establishmentId, product.id),
        ])

        await productAccompanimentsRepository.removeByProductId(
          request.actor.establishmentId,
          product.id,
        )
        await productAccompanimentsRepository.removeByAccompanimentProductId(
          request.actor.establishmentId,
          product.id,
        )
        await recipeIngredientsRepository.removeByIngredientProductId(
          request.actor.establishmentId,
          product.id,
        )
        await resaleConfigurationsRepository.removeByProductId(
          request.actor.establishmentId,
          product.id,
        )

        for (const size of sizes) {
          await productSizesRepository.remove(
            request.actor.establishmentId,
            product.id,
            size.id,
          )
        }
        if (recipe) {
          await recipesRepository.remove(request.actor.establishmentId, recipe.id)
        }
        for (const brand of brands) {
          await brandsRepository.remove(
            request.actor.establishmentId,
            product.id,
            brand.id,
          )
        }

        await productsRepository.remove(request.actor.establishmentId, product.id)
        const configurations =
          await new GetAffectedProductSalesConfigurationsUseCase().execute({
            scope,
            establishmentId: request.actor.establishmentId,
            productId: request.productId,
            affectedProductIds: inverseOwnerIds,
          })
        await publishAffectedProductSalesConfigurations({
          scope,
          establishmentId: request.actor.establishmentId,
          productId: request.productId,
          configurations,
          deleted: true,
        })
      },
    )
  }

  private async readImpact(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<ProductRemovalImpact> {
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
      scope.brandsRepository.countByProductId(establishmentId, product.id),
      scope.stockBalancesRepository.countByProductId(establishmentId, product.id),
      scope.recipesRepository.countByProductId(establishmentId, product.id),
      scope.productSizesRepository.countByProductId(establishmentId, product.id),
      scope.resaleConfigurationsRepository.countByProductId(establishmentId, product.id),
      scope.productAccompanimentsRepository.countByProductId(establishmentId, product.id),
      scope.recipeIngredientsRepository.countByIngredientProductId(
        establishmentId,
        product.id,
      ),
      scope.productAccompanimentsRepository.countByAccompanimentProductId(
        establishmentId,
        product.id,
      ),
      scope.stockTransactionsRepository.countByProductId(establishmentId, product.id),
      scope.productionsRepository.countByProductId(establishmentId, product.id),
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
      retainedHistory: { stockTransactions, productions, orders: 0 },
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem remover produtos.')
    }
  }
}
