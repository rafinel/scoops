import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ChangeProductCategoriesInput } from '#mrp/domain/structures/change-product-categories-input.ts'
import type { ProductCategoryDependency } from '#mrp/domain/structures/product-category-dependency.ts'
import type { ProductSettingsDetails } from '#mrp/domain/structures/product-settings-details.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import { GlobalAccompanimentRowsStrategy } from '#mrp/domain/strategies/global-accompaniment-rows-strategy.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: ChangeProductCategoriesInput
}

export class ChangeProductCategoriesUseCase
  implements UseCase<Request, ProductSettingsDetails>
{
  private readonly globalAccompanimentRows = new GlobalAccompanimentRowsStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductSettingsDetails> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    const product = await this.database.run((scope) => this.change(scope, request))

    return { product }
  }

  private async change(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<Product> {
    const establishmentId = request.actor.establishmentId
    const currentProduct = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateProduct(currentProduct, establishmentId)
    this.validateVersion(currentProduct.updatedAt, request.input.expectedUpdatedAt)
    this.validateCategoryCompatibility(currentProduct, request.input.categories)
    await this.validateRemovedCategories(
      scope,
      establishmentId,
      currentProduct,
      request.input.categories,
    )

    const savedProduct = await scope.productsRepository.replace(
      establishmentId,
      currentProduct.id,
      { categories: [...request.input.categories] },
    )
    await this.syncGlobalAccompaniments(
      scope,
      establishmentId,
      currentProduct,
      request.input.categories,
    )
    const configurations =
      await new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId,
        productId: request.productId,
      })
    await publishAffectedProductSalesConfigurations({
      scope,
      establishmentId,
      productId: request.productId,
      configurations,
    })
    await scope.eventsRepository.add(
      new ProductUpdatedEvent({
        productId: savedProduct.id,
        establishmentId: savedProduct.establishmentId,
        updatedAt: savedProduct.updatedAt,
      }),
    )
    return savedProduct
  }

  private async validateRemovedCategories(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
    categories: readonly ProductCategory[],
  ): Promise<void> {
    const removedCategories = product.categories.filter(
      (category) => !categories.includes(category),
    )
    for (const category of removedCategories) {
      const dependencies = await this.findDependencies(
        scope,
        establishmentId,
        product,
        category,
      )
      if (dependencies.length > 0) {
        throw new ConflictError(
          'A categoria possui dependências e não pode ser removida.',
        )
      }
    }
  }

  private async syncGlobalAccompaniments(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
    categories: readonly ProductCategory[],
  ): Promise<void> {
    const wasAccompaniment = product.categories.includes(ProductCategory.Accompaniment)
    if (wasAccompaniment && !categories.includes(ProductCategory.Accompaniment)) {
      await this.removeGlobal(scope, establishmentId, product)
    }
    const wasPortion = product.categories.includes(ProductCategory.Portion)
    const isPortion = categories.includes(ProductCategory.Portion)
    if (!wasPortion && isPortion) {
      await this.addGlobalRows(scope, establishmentId, product)
    }
    if (wasPortion && !isPortion) {
      await scope.productAccompanimentsRepository.removeByProductId(
        establishmentId,
        product.id,
      )
    }
  }

  private async addGlobalRows(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<void> {
    const [globals, links] = await Promise.all([
      scope.globalAccompanimentsRepository.findManyByEstablishmentId(establishmentId),
      scope.productAccompanimentsRepository.findManyByProductId(
        establishmentId,
        product.id,
      ),
    ])
    await scope.productAccompanimentsRepository.addMany(
      this.globalAccompanimentRows.execute({
        globals,
        portionProductIds: [product.id],
        existingPairs: links,
      }),
    )
  }

  private async removeGlobal(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<void> {
    const global =
      await scope.globalAccompanimentsRepository.findByAccompanimentProductId(
        establishmentId,
        product.id,
      )
    if (global) {
      await scope.globalAccompanimentsRepository.remove(establishmentId, global.id)
    }
  }

  private async countIndividualLinks(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<number> {
    const links = await scope.productAccompanimentsRepository.findManyByProductId(
      establishmentId,
      product.id,
    )
    return links.filter((link) => link.globalAccompanimentId === undefined).length
  }

  private async findDependencies(
    scope: MrpDatabaseRepositories,
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
        this.countIndividualLinks(scope, establishmentId, product),
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
    if (
      input.categories.includes(ProductCategory.Portion) &&
      input.categories.includes(ProductCategory.Accompaniment)
    ) {
      throw new BadRequestError(
        'Porção e acompanhamento não podem ser selecionados juntos.',
      )
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
