import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ChangeProductCategoriesInput } from '#mrp/domain/structures/change-product-categories-input.ts'
import type { ProductCategoryDependency } from '#mrp/domain/structures/product-category-dependency.ts'
import type { ProductSettingsDetails } from '#mrp/domain/structures/product-settings-details.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: ChangeProductCategoriesInput
}

export class ChangeProductCategoriesUseCase
  implements UseCase<Request, ProductSettingsDetails>
{
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<ProductSettingsDetails> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    const product = await this.database.run(async (scope) => {
      const currentProduct = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      this.validateProduct(currentProduct, request.actor.establishmentId)
      this.validateVersion(currentProduct.updatedAt, request.input.expectedUpdatedAt)
      this.validateCategoryCompatibility(currentProduct, request.input.categories)

      const removedCategories = currentProduct.categories.filter(
        (category) => !request.input.categories.includes(category),
      )
      for (const category of removedCategories) {
        const dependencies = await this.findDependencies(
          scope,
          request.actor.establishmentId,
          currentProduct,
          category,
        )
        if (dependencies.length > 0) {
          throw new ConflictError(
            'A categoria possui dependências e não pode ser removida.',
          )
        }
      }

      return scope.productsRepository.replace(
        request.actor.establishmentId,
        currentProduct.id,
        { categories: [...request.input.categories] },
      )
    })

    await this.broker.publish(
      new ProductUpdatedEvent({
        productId: product.id,
        establishmentId: product.establishmentId,
        updatedAt: product.updatedAt,
      }),
    )

    return { product }
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
        if (!recipe) continue
        const consumingProduct = await scope.productsRepository.findById(
          establishmentId,
          recipe.productId,
        )
        if (!consumingProduct) continue
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
        ? [{ kind: 'owned-recipe', productId: product.id, productName: product.name }]
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
        if (!portion) continue
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
        left.productName
          .trim()
          .toLocaleLowerCase()
          .localeCompare(right.productName.trim().toLocaleLowerCase()) ||
        left.productId.localeCompare(right.productId),
    )
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem alterar categorias.')
    }
  }

  private validateInput(input: ChangeProductCategoriesInput): void {
    if (
      !(input.expectedUpdatedAt instanceof Date) ||
      !Number.isFinite(input.expectedUpdatedAt.getTime())
    ) {
      throw new BadRequestError('A versão do produto é inválida.')
    }
    if (
      input.categories.length === 0 ||
      input.categories.some(
        (category) => !Object.values(ProductCategory).includes(category),
      )
    ) {
      throw new BadRequestError('Selecione pelo menos uma categoria válida.')
    }
    if (new Set(input.categories).size !== input.categories.length) {
      throw new BadRequestError('As categorias não podem se repetir.')
    }
    if (
      input.categories.includes(ProductCategory.Portion) &&
      input.categories.includes(ProductCategory.Resale)
    ) {
      throw new BadRequestError('Porção e Revenda não podem ser selecionadas juntas.')
    }
  }

  private validateVersion(currentUpdatedAt: Date, expectedUpdatedAt: Date): void {
    if (currentUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new ConflictError(
        'As categorias do produto foram alteradas. Recarregue e tente novamente.',
      )
    }
  }

  private validateCategoryCompatibility(
    product: Product,
    categories: readonly ProductCategory[],
  ): void {
    if (
      categories.includes(ProductCategory.Manufacturable) &&
      product.stockControl !== ProductStockControl.Single
    ) {
      throw new BadRequestError('Produtos fabricáveis devem usar estoque único.')
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
