import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductCategoryDependency } from '#mrp/domain/structures/product-category-dependency.ts'
import type { ProductCategoryRemovalImpact } from '#mrp/domain/structures/product-category-removal-impact.ts'
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
  readonly category: ProductCategory
}

export class PreviewProductCategoryRemovalUseCase
  implements UseCase<Request, ProductCategoryRemovalImpact>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductCategoryRemovalImpact> {
    this.validateActor(request.actor)
    this.validateCategory(request.category)

    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      this.validateProduct(product, request.actor.establishmentId)
      if (!product.categories.includes(request.category)) {
        throw new BadRequestError('A categoria não está atribuída ao produto.')
      }
      if (product.categories.length === 1) {
        throw new BadRequestError('O produto deve possuir pelo menos uma categoria.')
      }

      const dependencies = await this.findDependencies(
        scope,
        request.actor.establishmentId,
        product,
        request.category,
      )

      return {
        category: request.category,
        canRemove: dependencies.length === 0,
        dependencies,
      }
    })
  }

  private async findDependencies(
    scope: MrpDatabaseScope,
    establishmentId: string,
    product: Product,
    category: ProductCategory,
  ): Promise<readonly ProductCategoryDependency[]> {
    if (category === ProductCategory.Ingredient) {
      const lines = await scope.recipeIngredientsRepository.findManyByIngredientProductId(
        establishmentId,
        product.id,
      )
      const dependencyByProductId = new Map<string, ProductCategoryDependency>()
      for (const line of lines) {
        const recipe = await scope.recipesRepository.findById(
          establishmentId,
          line.recipeId,
        )
        if (!recipe || recipe.establishmentId !== establishmentId) continue
        const consumingProduct = await scope.productsRepository.findById(
          establishmentId,
          recipe.productId,
        )
        if (!consumingProduct || consumingProduct.establishmentId !== establishmentId) {
          continue
        }
        dependencyByProductId.set(consumingProduct.id, {
          kind: 'consuming-recipe',
          productId: consumingProduct.id,
          productName: consumingProduct.name,
        })
      }
      return this.sortDependencies([...dependencyByProductId.values()])
    }

    if (category === ProductCategory.Manufacturable) {
      const recipe = await scope.recipesRepository.findByProductId(
        establishmentId,
        product.id,
      )
      return recipe
        ? [
            {
              kind: 'owned-recipe',
              productId: product.id,
              productName: product.name,
            },
          ]
        : []
    }

    if (category === ProductCategory.Portion) {
      const [sizeCount, linkCount] = await Promise.all([
        scope.productSizesRepository.countByProductId(establishmentId, product.id),
        scope.productAccompanimentsRepository.countByProductId(
          establishmentId,
          product.id,
        ),
      ])
      const dependencies: ProductCategoryDependency[] = []
      if (sizeCount > 0) {
        dependencies.push({
          kind: 'portion-size',
          productId: product.id,
          productName: product.name,
          sizeCount,
        })
      }
      if (linkCount > 0) {
        dependencies.push({
          kind: 'portion-accompaniment',
          productId: product.id,
          productName: product.name,
          linkCount,
        })
      }
      return this.sortDependencies(dependencies)
    }

    if (category === ProductCategory.Accompaniment) {
      const links =
        await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
          establishmentId,
          product.id,
        )
      const dependencyByProductId = new Map<string, ProductCategoryDependency>()
      for (const link of links) {
        const portion = await scope.productsRepository.findById(
          establishmentId,
          link.productId,
        )
        if (!portion || portion.establishmentId !== establishmentId) continue
        dependencyByProductId.set(portion.id, {
          kind: 'accompaniment-user',
          productId: portion.id,
          productName: portion.name,
        })
      }
      return this.sortDependencies([...dependencyByProductId.values()])
    }

    const configurationCount =
      await scope.resaleConfigurationsRepository.countByProductId(
        establishmentId,
        product.id,
      )
    return configurationCount > 0
      ? [
          {
            kind: 'resale-configuration',
            productId: product.id,
            productName: product.name,
            configurationCount,
          },
        ]
      : []
  }

  private sortDependencies(
    dependencies: readonly ProductCategoryDependency[],
  ): readonly ProductCategoryDependency[] {
    return [...dependencies].sort(
      (left, right) =>
        this.normalizeForSort(left.productName).localeCompare(
          this.normalizeForSort(right.productName),
        ) || left.productId.localeCompare(right.productId),
    )
  }

  private normalizeForSort(value: string): string {
    return value.trim().toLocaleLowerCase()
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem alterar categorias.')
    }
  }

  private validateCategory(category: ProductCategory): void {
    if (!Object.values(ProductCategory).includes(category)) {
      throw new BadRequestError('A categoria do produto é inválida.')
    }
  }

  private validateProduct(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
  }
}
