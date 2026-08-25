import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductAccompanimentFaker,
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { PreviewProductCategoryRemovalUseCase } from '#mrp/use-cases/preview-product-category-removal-use-case.ts'

const product = ProductFaker.fake({
  id: 'p1',
  establishmentId: 'e1',
  name: 'Target',
  categories: [
    ProductCategory.Ingredient,
    ProductCategory.Manufacturable,
    ProductCategory.Portion,
    ProductCategory.Accompaniment,
  ],
})
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Preview Product Category Removal Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: PreviewProductCategoryRemovalUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([])
    scope.recipesRepository.findByProductId.mockResolvedValue(undefined)
    scope.productSizesRepository.countByProductId.mockResolvedValue(0)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(0)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.resaleConfigurationsRepository.countByProductId.mockResolvedValue(0)
    useCase = new PreviewProductCategoryRemovalUseCase(database)
  })

  it('maps the five category-owned blocker families and sorts named reverse users', async () => {
    const recipe = RecipeFaker.fake({
      id: 'r1',
      establishmentId: 'e1',
      productId: 'p2',
    })
    const consumingProduct = ProductFaker.fake({
      id: 'p2',
      establishmentId: 'e1',
      name: 'Apple Cream',
    })
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        recipeId: recipe.id,
        ingredientProductId: product.id,
        establishmentId: 'e1',
      }),
    ])
    scope.recipesRepository.findById.mockResolvedValue(recipe)
    scope.productsRepository.findById.mockImplementation(async (_establishmentId, id) =>
      id === consumingProduct.id ? consumingProduct : product,
    )
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Ingredient,
      }),
    ).resolves.toMatchObject({
      canRemove: false,
      dependencies: [{ kind: 'consuming-recipe', productId: 'p2' }],
    })

    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Manufacturable,
      }),
    ).resolves.toMatchObject({
      dependencies: [{ kind: 'owned-recipe', productId: 'p1' }],
    })

    scope.recipesRepository.findByProductId.mockResolvedValue(undefined)
    scope.productSizesRepository.countByProductId.mockResolvedValue(2)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(1)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Portion,
      }),
    ).resolves.toMatchObject({
      dependencies: expect.arrayContaining([
        expect.objectContaining({ kind: 'portion-accompaniment', linkCount: 1 }),
        expect.objectContaining({ kind: 'portion-size', sizeCount: 2 }),
      ]),
    })

    const link = ProductAccompanimentFaker.fake({
      establishmentId: 'e1',
      productId: 'portion-1',
      accompanimentProductId: product.id,
    })
    const portion = ProductFaker.fake({
      id: 'portion-1',
      establishmentId: 'e1',
      name: 'Small Portion',
    })
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [link],
    )
    scope.productsRepository.findById.mockImplementation(async (_establishmentId, id) =>
      id === portion.id ? portion : product,
    )
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Accompaniment,
      }),
    ).resolves.toMatchObject({
      dependencies: [{ kind: 'accompaniment-user', productId: 'portion-1' }],
    })

    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.resaleConfigurationsRepository.countByProductId.mockResolvedValue(3)
    const resaleProduct = {
      ...product,
      categories: [ProductCategory.Resale, ProductCategory.Ingredient],
    }
    scope.productsRepository.findById.mockResolvedValue(resaleProduct)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Resale,
      }),
    ).resolves.toMatchObject({
      dependencies: [{ kind: 'resale-configuration', configurationCount: 3 }],
    })
  })

  it('allows unused removal, blocks the last category, foreign products, and operators', async () => {
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Ingredient,
      }),
    ).resolves.toMatchObject({ canRemove: true, dependencies: [] })

    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Ingredient],
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Ingredient,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      establishmentId: 'e2',
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        category: ProductCategory.Ingredient,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
        category: ProductCategory.Ingredient,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
