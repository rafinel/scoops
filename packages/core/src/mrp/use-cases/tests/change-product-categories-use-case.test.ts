import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  RecipeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
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
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([])
    scope.globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([])
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      undefined,
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product })],
    )
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

    await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { categories: [...product.categories], expectedUpdatedAt: updatedAt },
    })

    expect(scope.productSizesRepository.countByProductId).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.removeByProductId).not.toHaveBeenCalled()
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
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue(
        Array.from({ length: linkCount }, () =>
          ProductAccompanimentFaker.fake({ establishmentId: 'e1', productId: 'p1' }),
        ),
      )

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
      expect(
        scope.productAccompanimentsRepository.findManyByProductId,
      ).toHaveBeenCalledWith('e1', 'p1')
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.removeByProductId,
      ).not.toHaveBeenCalled()
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

  describe('global accompaniments', () => {
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
      updatedAt,
    })
    const firstGlobal = GlobalAccompanimentFaker.fake({
      id: 'global-1',
      establishmentId: 'e1',
      accompanimentProductId: 'granola',
      accompanimentTypeId: 'type-1',
      quantityPerPortion: 0.05,
    })
    const secondGlobal = GlobalAccompanimentFaker.fake({
      id: 'global-2',
      establishmentId: 'e1',
      accompanimentProductId: 'banana',
      accompanimentTypeId: 'type-2',
      quantityPerPortion: 2,
    })
    const request = (
      categories: ProductCategory[],
    ): Parameters<ChangeProductCategoriesUseCase['execute']>[0] => ({
      actor: manager,
      productId: product.id,
      input: { categories, expectedUpdatedAt: updatedAt },
    })

    beforeEach(() => {
      scope.globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([
        firstGlobal,
        secondGlobal,
      ])
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [],
      )
      scope.accompanimentTypesRepository.findById.mockResolvedValue(
        AccompanimentTypeFaker.fake({ establishmentId: 'e1' }),
      )
    })

    it('adds the missing global rows when a product gains the Portion category', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...product,
        categories: [ProductCategory.Ingredient],
      })
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: product.id,
          accompanimentProductId: secondGlobal.accompanimentProductId,
        }),
      ])

      await useCase.execute(
        request([ProductCategory.Ingredient, ProductCategory.Portion]),
      )

      expect(scope.productAccompanimentsRepository.addMany).toHaveBeenCalledWith([
        {
          establishmentId: 'e1',
          productId: product.id,
          accompanimentProductId: firstGlobal.accompanimentProductId,
          accompanimentTypeId: firstGlobal.accompanimentTypeId,
          quantityPerPortion: firstGlobal.quantityPerPortion,
          globalAccompanimentId: firstGlobal.id,
        },
      ])
      expect(
        scope.globalAccompanimentsRepository.findManyByEstablishmentId,
      ).toHaveBeenCalledWith('e1')
      expect(
        scope.productAccompanimentsRepository.removeByProductId,
      ).not.toHaveBeenCalled()
    })

    it('drops only global rows when a Portion without individual rows loses the category', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...product,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
      })
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: product.id,
          globalAccompanimentId: firstGlobal.id,
        }),
      ])

      await useCase.execute(request([ProductCategory.Resale]))

      expect(
        scope.productAccompanimentsRepository.removeByProductId,
      ).toHaveBeenCalledWith('e1', product.id)
      expect(scope.productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', product.id, {
        categories: [ProductCategory.Resale],
      })
    })

    it('keeps blocking the Portion removal when an individual row remains', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...product,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
      })
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: product.id,
          globalAccompanimentId: firstGlobal.id,
        }),
        ProductAccompanimentFaker.fake({ establishmentId: 'e1', productId: product.id }),
      ])

      await expect(
        useCase.execute(request([ProductCategory.Resale])),
      ).rejects.toBeInstanceOf(ConflictError)

      expect(
        scope.productAccompanimentsRepository.removeByProductId,
      ).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    })

    it('deletes a global without rows when its product loses the Accompaniment category', async () => {
      scope.productsRepository.findById.mockResolvedValue(accompaniment)
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [],
      )
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        firstGlobal,
      )

      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        input: { categories: [ProductCategory.Resale], expectedUpdatedAt: updatedAt },
      })

      expect(
        scope.globalAccompanimentsRepository.findByAccompanimentProductId,
      ).toHaveBeenCalledWith('e1', accompaniment.id)
      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        'e1',
        firstGlobal.id,
      )
    })

    it('never gives a product a row for its own global when it changes from Accompaniment to Portion', async () => {
      const own = ProductFaker.fake({
        id: 'own-accompaniment',
        establishmentId: 'e1',
        categories: [ProductCategory.Accompaniment],
        updatedAt,
      })
      const ownGlobal = GlobalAccompanimentFaker.fake({
        id: 'global-own',
        establishmentId: 'e1',
        accompanimentProductId: own.id,
        accompanimentTypeId: 'type-1',
      })
      let globals = [ownGlobal, firstGlobal]
      scope.productsRepository.findById.mockResolvedValue(own)
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([])
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        ownGlobal,
      )
      scope.globalAccompanimentsRepository.findManyByEstablishmentId.mockImplementation(
        async () => globals,
      )
      scope.globalAccompanimentsRepository.remove.mockImplementation(async (_, id) => {
        globals = globals.filter((global) => global.id !== id)
      })

      await useCase.execute({
        actor: manager,
        productId: own.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      })

      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        'e1',
        ownGlobal.id,
      )
      expect(scope.productAccompanimentsRepository.addMany).toHaveBeenCalledWith([
        {
          establishmentId: 'e1',
          productId: own.id,
          accompanimentProductId: firstGlobal.accompanimentProductId,
          accompanimentTypeId: firstGlobal.accompanimentTypeId,
          quantityPerPortion: firstGlobal.quantityPerPortion,
          globalAccompanimentId: firstGlobal.id,
        },
      ])
    })

    it('leaves the global untouched when the product keeps the Accompaniment category or has none', async () => {
      scope.productsRepository.findById.mockResolvedValue(accompaniment)
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        firstGlobal,
      )

      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        input: {
          categories: [ProductCategory.Accompaniment, ProductCategory.Ingredient],
          expectedUpdatedAt: updatedAt,
        },
      })
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        undefined,
      )
      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        input: { categories: [ProductCategory.Resale], expectedUpdatedAt: updatedAt },
      })

      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()
    })

    it('blocks removing Accompaniment while global rows exist and keeps the global', async () => {
      const linkedPortion = ProductFaker.fake({
        id: 'portion-2',
        establishmentId: 'e1',
        categories: [ProductCategory.Portion],
      })
      scope.productsRepository.findById.mockImplementation(async (_, productId) =>
        productId === accompaniment.id ? accompaniment : linkedPortion,
      )
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [
          ProductAccompanimentFaker.fake({
            establishmentId: 'e1',
            productId: linkedPortion.id,
            accompanimentProductId: accompaniment.id,
            globalAccompanimentId: firstGlobal.id,
          }),
        ],
      )
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        firstGlobal,
      )

      await expect(
        useCase.execute({
          actor: manager,
          productId: accompaniment.id,
          input: { categories: [ProductCategory.Resale], expectedUpdatedAt: updatedAt },
        }),
      ).rejects.toBeInstanceOf(ConflictError)

      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(eventsRepository.add).not.toHaveBeenCalled()
    })
  })

  it('republishes the product and its inverse owners once before recording the product update', async () => {
    const owner = ProductFaker.fake({
      id: 'portion-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
    })
    const savedProduct = {
      ...product,
      categories: [
        ProductCategory.Ingredient,
        ProductCategory.Portion,
        ProductCategory.Manufacturable,
      ],
    }
    scope.productsRepository.replace.mockResolvedValue(savedProduct)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: owner.id,
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: owner.id,
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'other-establishment',
          productId: 'foreign-portion',
          accompanimentProductId: product.id,
        }),
      ],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({ product: savedProduct }),
        ProductSalesConfigurationSourceFaker.fake({ product: owner }),
      ],
    )

    await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { categories: savedProduct.categories, expectedUpdatedAt: updatedAt },
    })

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', [product.id, owner.id])
    expect(eventsRepository.add.mock.calls.map(([event]) => event)).toEqual([
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({
          productId: product.id,
          state: 'available',
          configuration: expect.objectContaining({ categories: savedProduct.categories }),
        }),
      }),
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({ productId: owner.id, state: 'available' }),
      }),
      expect.objectContaining({ name: ProductUpdatedEvent._NAME }),
    ])
  })
})
