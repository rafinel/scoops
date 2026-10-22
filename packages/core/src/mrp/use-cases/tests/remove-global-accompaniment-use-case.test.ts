import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { ProductSalesConfigurationSource } from '#mrp/domain/structures/product-sales-configuration-source.ts'
import { ProductCategory, ProductStatus } from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RemoveGlobalAccompanimentUseCase } from '#mrp/use-cases/remove-global-accompaniment-use-case.ts'

const establishmentId = 'establishment-1'
const manager = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const accompaniment = ProductFaker.fake({
  id: 'accompaniment-1',
  establishmentId,
  name: 'Granola',
  categories: [ProductCategory.Accompaniment],
  accompanimentPrice: 3.5,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId,
  name: 'Toppings',
})
const global = GlobalAccompanimentFaker.fake({
  id: 'global-1',
  establishmentId,
  accompanimentProductId: accompaniment.id,
  accompanimentTypeId: type.id,
  accompanimentPrice: 4.75,
})
const portionA = ProductFaker.fake({
  id: 'portion-a',
  establishmentId,
  name: 'A',
  categories: [ProductCategory.Portion],
})
const portionB = ProductFaker.fake({
  id: 'portion-b',
  establishmentId,
  name: 'B',
  categories: [ProductCategory.Portion],
})

function rowFor(portionId: string) {
  return ProductAccompanimentFaker.fake({
    id: `row-${portionId}`,
    establishmentId,
    productId: portionId,
    accompanimentProductId: accompaniment.id,
    accompanimentTypeId: type.id,
    globalAccompanimentId: global.id,
  })
}

function sourceFor(portion: typeof portionA): ProductSalesConfigurationSource {
  return {
    product: portion,
    sizes: [
      ProductSizeFaker.fake({
        id: `size-${portion.id}`,
        establishmentId,
        productId: portion.id,
        price: 15,
      }),
    ],
    links: [],
    resaleConfigurations: [],
    brands: [],
    accompanimentProducts: [],
    accompanimentTypes: [],
    globals: [],
  }
}

function accompanimentSource(): ProductSalesConfigurationSource {
  return {
    product: accompaniment,
    sizes: [],
    links: [],
    resaleConfigurations: [],
    brands: [],
    accompanimentProducts: [],
    accompanimentTypes: [],
    globals: [],
  }
}

describe('Remove Global Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: RemoveGlobalAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(accompaniment)
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      global,
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [rowFor(portionA.id), rowFor(portionB.id)],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [accompanimentSource(), sourceFor(portionA), sourceFor(portionB)],
    )
    useCase = new RemoveGlobalAccompanimentUseCase(database)
  })

  describe('default mode', () => {
    it('removes every row, then the global, and republishes each captured Portion', async () => {
      await useCase.execute({ actor: manager, productId: accompaniment.id })

      const { productAccompanimentsRepository, globalAccompanimentsRepository } = scope
      expect(
        productAccompanimentsRepository.findManyByAccompanimentProductId,
      ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
      expect(
        productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id)
      expect(globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        establishmentId,
        global.id,
      )
      expect(
        productAccompanimentsRepository.findManyByAccompanimentProductId.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        productAccompanimentsRepository.removeByGlobalAccompanimentId.mock
          .invocationCallOrder[0],
      )
      expect(
        productAccompanimentsRepository.removeByGlobalAccompanimentId.mock
          .invocationCallOrder[0],
      ).toBeLessThan(globalAccompanimentsRepository.remove.mock.invocationCallOrder[0])
      expect(
        productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()

      expect(
        scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
      ).toHaveBeenCalledWith(establishmentId, [
        accompaniment.id,
        portionA.id,
        portionB.id,
      ])
      const events = scope.eventsRepository.add.mock.calls.map(([event]) => event)
      expect(events).toHaveLength(2)
      for (const event of events) {
        expect(event).toBeInstanceOf(ProductSalesConfigurationChangedEvent)
      }
      expect(events[0]).toMatchObject({
        payload: {
          establishmentId,
          productId: portionA.id,
          state: 'available',
          configuration: {
            productId: portionA.id,
            sizes: [{ sizeId: `size-${portionA.id}`, price: 15, accompaniments: [] }],
          },
        },
      })
      expect(events[1]).toMatchObject({
        payload: { productId: portionB.id, state: 'available' },
      })
      expect(
        globalAccompanimentsRepository.remove.mock.invocationCallOrder[0],
      ).toBeLessThan(scope.eventsRepository.add.mock.invocationCallOrder[0])
    })

    it('treats an explicit false like the default', async () => {
      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        keepPortionLinks: false,
      })

      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id)
      expect(
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).toHaveBeenCalledTimes(2)
    })

    it('publishes only Portion configurations', async () => {
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
        [accompanimentSource(), sourceFor(portionA)],
      )

      await useCase.execute({ actor: manager, productId: accompaniment.id })

      const productIds = scope.eventsRepository.add.mock.calls.map(
        ([event]) => (event.payload as { productId: string }).productId,
      )
      expect(productIds).toEqual([portionA.id])
    })

    it('works with zero rows: removes the global and publishes nothing', async () => {
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [],
      )

      await useCase.execute({ actor: manager, productId: accompaniment.id })

      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id)
      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        establishmentId,
        global.id,
      )
      expect(
        scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
      ).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('removes the global of an inactive Accompaniment', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        status: ProductStatus.Inactive,
      })

      await useCase.execute({ actor: manager, productId: accompaniment.id })

      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledTimes(1)
    })
  })

  describe('keep mode', () => {
    it("gives each row the global's price, or none when the global has none", async () => {
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        {
          ...global,
          accompanimentPrice: undefined,
        },
      )

      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        keepPortionLinks: true,
      })

      expect(
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id, undefined)
    })

    it('does not copy the product default price onto the rows', async () => {
      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        keepPortionLinks: true,
      })

      const [, , copiedPrice] =
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId
          .mock.calls[0]
      expect(copiedPrice).not.toBe(accompaniment.accompanimentPrice)
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    })

    it('clears the global reference, removes the global and publishes nothing', async () => {
      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        keepPortionLinks: true,
      })

      expect(
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id, 4.75)
      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        establishmentId,
        global.id,
      )
      expect(
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId
          .mock.invocationCallOrder[0],
      ).toBeLessThan(
        scope.globalAccompanimentsRepository.remove.mock.invocationCallOrder[0],
      )
      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(
        scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
      ).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('ends a global without rows and ignores the product status', async () => {
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [],
      )
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        status: ProductStatus.Inactive,
      })

      await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
        keepPortionLinks: true,
      })

      expect(
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id, 4.75)
      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledTimes(1)
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })
  })

  describe.each([
    { name: 'default', keepPortionLinks: false },
    { name: 'keep', keepPortionLinks: true },
  ])('$name mode rejections', ({ keepPortionLinks }) => {
    function expectNothingWritten() {
      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    }

    it('rejects Operators before opening a transaction', async () => {
      await expect(
        useCase.execute({
          actor: { ...manager, profile: UserProfile.Operator },
          productId: accompaniment.id,
          keepPortionLinks,
        }),
      ).rejects.toThrow(
        new AuthorizationError('Somente gestores podem remover acompanhamentos globais.'),
      )
      expect(database.run).not.toHaveBeenCalled()
    })

    it.each([
      { name: 'missing', product: undefined },
      {
        name: 'foreign',
        product: { ...accompaniment, establishmentId: 'another-establishment' },
      },
    ])('rejects a $name route product', async ({ product }) => {
      scope.productsRepository.findById.mockResolvedValue(product)

      await expect(
        useCase.execute({
          actor: manager,
          productId: accompaniment.id,
          keepPortionLinks,
        }),
      ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
      expectNothingWritten()
    })

    it.each([
      { name: 'lacks the Accompaniment category', categories: [ProductCategory.Portion] },
      {
        name: 'is a legacy Portion and Accompaniment',
        categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
      },
    ])('rejects a product that $name', async ({ categories }) => {
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        categories,
      })

      await expect(
        useCase.execute({
          actor: manager,
          productId: accompaniment.id,
          keepPortionLinks,
        }),
      ).rejects.toThrow(
        new BadRequestError('O produto não é um acompanhamento elegível para porções.'),
      )
      expectNothingWritten()
    })

    it('rejects a non-global Accompaniment', async () => {
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        undefined,
      )

      await expect(
        useCase.execute({
          actor: manager,
          productId: accompaniment.id,
          keepPortionLinks,
        }),
      ).rejects.toThrow(new NotFoundError('Acompanhamento global não encontrado.'))
      expect(
        scope.globalAccompanimentsRepository.findByAccompanimentProductId,
      ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
      expectNothingWritten()
    })
  })

  it('never touches the product price or stock', async () => {
    await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(scope.stockTransactionsRepository.add).not.toHaveBeenCalled()
  })
})
