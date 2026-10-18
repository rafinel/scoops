import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
  RecipeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { RemoveProductUseCase } from '#mrp/use-cases/remove-product-use-case.ts'

const product = ProductFaker.fake({ id: 'p1', establishmentId: 'e1', name: 'Milk' })
const updatedAt = product.updatedAt
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Remove Product Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: RemoveProductUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findByIdForUpdate.mockResolvedValue(product)
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    scope.stockBalancesRepository.countByProductId.mockResolvedValue(1)
    scope.recipesRepository.countByProductId.mockResolvedValue(1)
    scope.productSizesRepository.countByProductId.mockResolvedValue(1)
    scope.resaleConfigurationsRepository.countByProductId.mockResolvedValue(1)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(1)
    scope.recipeIngredientsRepository.countByIngredientProductId.mockResolvedValue(1)
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      1,
    )
    scope.stockTransactionsRepository.countByProductId.mockResolvedValue(1)
    scope.productionsRepository.countByProductId.mockResolvedValue(1)
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      {
        id: 'b1',
        productId: 'p1',
        name: 'Brand',
        packageQuantity: 1,
        packagePrice: 1,
        isPrimary: true,
        createdAt: updatedAt,
        updatedAt,
      },
    ])
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      ProductSizeFaker.fake({ id: 'size-1', establishmentId: 'e1', productId: 'p1' }),
    ])
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({ id: 'recipe-1', establishmentId: 'e1', productId: 'p1' }),
    )
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      undefined,
    )
    useCase = new RemoveProductUseCase(database)
  })

  it('rechecks impact, removes current inverse configuration, and retains history', async () => {
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).resolves.toBeUndefined()

    expect(scope.productAccompanimentsRepository.removeByProductId).toHaveBeenCalledWith(
      'e1',
      'p1',
    )
    expect(
      scope.productAccompanimentsRepository.removeByAccompanimentProductId,
    ).toHaveBeenCalledWith('e1', 'p1')
    expect(
      scope.recipeIngredientsRepository.removeByIngredientProductId,
    ).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.resaleConfigurationsRepository.removeByProductId).toHaveBeenCalledWith(
      'e1',
      'p1',
    )
    expect(scope.productSizesRepository.remove).toHaveBeenCalledWith('e1', 'p1', 'size-1')
    expect(scope.recipesRepository.remove).toHaveBeenCalledWith('e1', 'recipe-1')
    expect(scope.brandsRepository.remove).toHaveBeenCalledWith('e1', 'p1', 'b1')
    expect(scope.productsRepository.remove).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.stockTransactionsRepository.removeAll).not.toHaveBeenCalled()
    expect(scope.productionsRepository.removeAll).not.toHaveBeenCalled()
  })

  it('hides foreign products and rejects operators before transaction work', async () => {
    scope.productsRepository.findByIdForUpdate.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('hides a product owned by another establishment without removing anything', async () => {
    scope.productsRepository.findByIdForUpdate.mockResolvedValue({
      ...product,
      establishmentId: 'other-establishment',
    })

    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).rejects.toThrow('Produto não encontrado.')
    expect(scope.productsRepository.remove).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.removeByProductId).not.toHaveBeenCalled()
  })

  it('tells operators that only managers remove products, before any transaction', async () => {
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
      }),
    ).rejects.toThrow('Somente gestores podem remover produtos.')
    expect(database.run).not.toHaveBeenCalled()
  })

  describe('global accompaniments', () => {
    const portionA = ProductFaker.fake({
      id: 'portion-a',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
    })
    const portionB = ProductFaker.fake({
      id: 'portion-b',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
    })
    const accompaniment = ProductFaker.fake({
      id: 'granola',
      establishmentId: 'e1',
      categories: [ProductCategory.Accompaniment],
    })
    const global = GlobalAccompanimentFaker.fake({
      id: 'global-1',
      establishmentId: 'e1',
      accompanimentProductId: accompaniment.id,
    })
    const publishedEvents = () =>
      scope.eventsRepository.add.mock.calls.flatMap(([event]) =>
        event instanceof ProductSalesConfigurationChangedEvent ? [event.payload] : [],
      )

    beforeEach(() => {
      scope.productsRepository.findByIdForUpdate.mockResolvedValue(accompaniment)
      scope.productsRepository.findById.mockImplementation(async (_, id) =>
        [portionA, portionB].find((portion) => portion.id === id),
      )
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [portionA, portionB].map((portion) =>
          ProductAccompanimentFaker.fake({
            establishmentId: 'e1',
            productId: portion.id,
            accompanimentProductId: accompaniment.id,
            globalAccompanimentId: global.id,
          }),
        ),
      )
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        global,
      )
      scope.brandsRepository.findManyByProductId.mockResolvedValue([])
      scope.productSizesRepository.findManyByProductId.mockResolvedValue([])
      scope.recipesRepository.findByProductId.mockResolvedValue(undefined)
    })

    it('removes the global with an Accompaniment product after its rows and republishes every Portion', async () => {
      await useCase.execute({ actor: manager, productId: accompaniment.id })

      expect(
        scope.globalAccompanimentsRepository.findByAccompanimentProductId,
      ).toHaveBeenCalledWith('e1', accompaniment.id)
      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        'e1',
        global.id,
      )
      const callOrder = (mockFn: { mock: { invocationCallOrder: number[] } }) =>
        mockFn.mock.invocationCallOrder[0]
      expect(
        callOrder(scope.productAccompanimentsRepository.removeByAccompanimentProductId),
      ).toBeLessThan(callOrder(scope.globalAccompanimentsRepository.remove))
      expect(callOrder(scope.globalAccompanimentsRepository.remove)).toBeLessThan(
        callOrder(scope.productsRepository.remove),
      )
      expect(publishedEvents()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId: portionA.id, state: 'available' }),
          expect.objectContaining({ productId: portionB.id, state: 'available' }),
          expect.objectContaining({ productId: accompaniment.id, state: 'deleted' }),
        ]),
      )
    })

    it('keeps globals when a Portion is removed and publishes nothing after a failed deletion', async () => {
      scope.productsRepository.findByIdForUpdate.mockResolvedValue(portionA)
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        undefined,
      )
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [],
      )

      await useCase.execute({ actor: manager, productId: portionA.id })

      expect(
        scope.productAccompanimentsRepository.removeByProductId,
      ).toHaveBeenCalledWith('e1', portionA.id)
      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()

      scope.eventsRepository.add.mockClear()
      scope.productsRepository.remove.mockRejectedValue(new Error('failed'))
      await expect(
        useCase.execute({ actor: manager, productId: portionA.id }),
      ).rejects.toThrow('failed')
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })
  })
})
