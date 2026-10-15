import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductAccompanimentFaker,
  ProductFaker,
  RecipeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { ChangeProductCategoriesUseCase } from '#mrp/use-cases/change-product-categories-use-case.ts'

const updatedAt = new Date('2026-01-01T00:00:00.000Z')
const product = ProductFaker.fake({
  id: 'p1',
  establishmentId: 'e1',
  updatedAt,
  categories: [ProductCategory.Ingredient, ProductCategory.Portion],
})
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Change Product Categories Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let eventsRepository: MockProxy<EventsRepository>
  let useCase: ChangeProductCategoriesUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    eventsRepository = mock<EventsRepository>()
    scope.eventsRepository = eventsRepository
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productsRepository.replace.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
    })
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([])
    scope.productSizesRepository.countByProductId.mockResolvedValue(0)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(0)
    useCase = new ChangeProductCategoriesUseCase(database)
  })

  it('rechecks removed dependencies and records events in the transaction', async () => {
    const result = await useCase.execute({
      actor: manager,
      productId: product.id,
      input: {
        categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
        expectedUpdatedAt: updatedAt,
      },
    })

    expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', 'p1', {
      categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
    })
    expect(database.run).toHaveBeenCalledTimes(1)
    expect(eventsRepository.add).toHaveBeenCalledTimes(2)
    expect(eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ProductUpdatedEvent._NAME,
        payload: {
          productId: 'p1',
          establishmentId: 'e1',
          updatedAt,
        },
      }),
    )
    expect(result.product.categories).toEqual([
      ProductCategory.Accompaniment,
      ProductCategory.Resale,
    ])
  })

  it('rejects dependency races, stale versions, invalid sets, and operators before writes', async () => {
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([
      {
        id: 'line-1',
        establishmentId: 'e1',
        recipeId: 'recipe-1',
        ingredientProductId: 'p1',
        quantity: 1,
        createdAt: updatedAt,
        updatedAt,
      },
    ])
    scope.recipesRepository.findById.mockResolvedValue({
      id: 'recipe-1',
      establishmentId: 'e1',
      productId: 'consumer-1',
      yieldQuantity: 1,
      createdAt: updatedAt,
      updatedAt,
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()

    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([])
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: {
          categories: [ProductCategory.Portion, ProductCategory.Resale],
          expectedUpdatedAt: updatedAt,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: {
          categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
          expectedUpdatedAt: updatedAt,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('rejects manufacturable for products controlled by brand', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
    })

    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: {
          categories: [...product.categories, ProductCategory.Manufacturable],
          expectedUpdatedAt: updatedAt,
        },
      }),
    ).rejects.toMatchObject({
      message: 'Produtos fabricáveis devem usar estoque único.',
    })
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('validates category sets and timestamps before opening a transaction', async () => {
    for (const input of [
      { categories: [], expectedUpdatedAt: updatedAt },
      {
        categories: [ProductCategory.Ingredient, ProductCategory.Ingredient],
        expectedUpdatedAt: updatedAt,
      },
      { categories: ['unknown' as ProductCategory], expectedUpdatedAt: updatedAt },
      {
        categories: [ProductCategory.Ingredient],
        expectedUpdatedAt: new Date(Number.NaN),
      },
      { categories: [ProductCategory.Ingredient], expectedUpdatedAt: undefined as never },
    ]) {
      await expect(
        useCase.execute({ actor: manager, productId: product.id, input }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }

    expect(database.run).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('does not expose products missing from or owned by another establishment', async () => {
    scope.productsRepository.findById
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(
        ProductFaker.fake({ id: 'p1', establishmentId: 'another-establishment' }),
      )

    for (const _attempt of [1, 2]) {
      await expect(
        useCase.execute({
          actor: manager,
          productId: product.id,
          input: {
            categories: [ProductCategory.Ingredient],
            expectedUpdatedAt: updatedAt,
          },
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    }

    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('allows a category to remain when it still has dependencies', async () => {
    scope.productSizesRepository.countByProductId.mockResolvedValue(1)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(1)

    await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { categories: [...product.categories], expectedUpdatedAt: updatedAt },
    })

    expect(scope.productSizesRepository.countByProductId).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.countByProductId).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', 'p1', {
      categories: product.categories,
    })
  })

  it.each([
    { label: 'a size', sizeCount: 1, linkCount: 0 },
    { label: 'an accompaniment link', sizeCount: 0, linkCount: 1 },
  ])(
    'blocks removing Portion while it still has $label',
    async ({ sizeCount, linkCount }) => {
      scope.productsRepository.findById.mockResolvedValue({
        ...product,
        categories: [ProductCategory.Portion],
      })
      scope.productSizesRepository.countByProductId.mockResolvedValue(sizeCount)
      scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(linkCount)

      await expect(
        useCase.execute({
          actor: manager,
          productId: product.id,
          input: {
            categories: [ProductCategory.Ingredient],
            expectedUpdatedAt: updatedAt,
          },
        }),
      ).rejects.toBeInstanceOf(ConflictError)

      expect(scope.productSizesRepository.countByProductId).toHaveBeenCalledWith(
        'e1',
        'p1',
      )
      expect(scope.productAccompanimentsRepository.countByProductId).toHaveBeenCalledWith(
        'e1',
        'p1',
      )
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    },
  )

  it('blocks removing Accompaniment while a Portion still uses it', async () => {
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Accompaniment],
    })
    const linkedPortion = ProductFaker.fake({
      id: 'portion-2',
      establishmentId: 'e1',
      name: 'Linked Portion',
      categories: [ProductCategory.Portion],
    })
    scope.productsRepository.findById.mockImplementation(
      async (_establishmentId, productId) =>
        productId === accompaniment.id ? accompaniment : linkedPortion,
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: linkedPortion.id,
          accompanimentProductId: accompaniment.id,
        }),
      ],
    )

    await expect(
      useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        input: { categories: [ProductCategory.Ingredient], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    expect(scope.productsRepository.findById).toHaveBeenNthCalledWith(
      2,
      'e1',
      linkedPortion.id,
    )
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('blocks removing Resale while a sales configuration remains', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Resale],
    })
    scope.resaleConfigurationsRepository.countByProductId.mockResolvedValue(1)

    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { categories: [ProductCategory.Ingredient], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    expect(scope.resaleConfigurationsRepository.countByProductId).toHaveBeenCalledWith(
      'e1',
      'p1',
    )
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('blocks removing Manufacturable while its recipe remains', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Manufacturable],
    })
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({ id: 'recipe-1', establishmentId: 'e1', productId: 'p1' }),
    )

    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { categories: [ProductCategory.Ingredient], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    expect(scope.recipesRepository.findByProductId).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('allows removal of Ingredient when its recipe row has no live owner', async () => {
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([
      {
        id: 'line-1',
        establishmentId: 'e1',
        recipeId: 'missing-recipe',
        ingredientProductId: 'p1',
        quantity: 1,
        createdAt: updatedAt,
        updatedAt,
      },
    ])
    scope.recipesRepository.findById.mockResolvedValue(undefined)

    await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
    })

    expect(scope.recipesRepository.findById).toHaveBeenCalledWith('e1', 'missing-recipe')
    expect(scope.productsRepository.replace).toHaveBeenCalled()
  })
})
