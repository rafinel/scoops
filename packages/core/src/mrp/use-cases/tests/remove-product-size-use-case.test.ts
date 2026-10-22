import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
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
import { RemoveProductSizeUseCase } from '#mrp/use-cases/remove-product-size-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const product = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const finalActiveSize = ProductSizeFaker.fake({
  id: 'size-final',
  establishmentId,
  productId: product.id,
  isActive: true,
})

describe('Remove Product Size Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: RemoveProductSizeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productSizesRepository.findById.mockResolvedValue(finalActiveSize)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [],
    )
    useCase = new RemoveProductSizeUseCase(database)
  })

  it('removes an owned size, including the final active size, without an active-count guard', async () => {
    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id }),
    ).resolves.toBeUndefined()

    expect(scope.productSizesRepository.remove).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      finalActiveSize.id,
    )
    expect(scope.productSizesRepository.countActive).not.toHaveBeenCalled()
  })

  it('rejects operators, foreign sizes and non-Portion products before removal', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: product.id,
        sizeId: finalActiveSize.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    scope.productSizesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: 'foreign-size' }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'resale-1',
        establishmentId,
        categories: [ProductCategory.Resale],
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'resale-1', sizeId: finalActiveSize.id }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })

  it('publishes the sales configuration left after the removal', async () => {
    const remainingSize = ProductSizeFaker.fake({
      id: 'size-remaining',
      establishmentId,
      productId: product.id,
    })
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product, sizes: [remainingSize] })],
    )

    await useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id })

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, [product.id])
    expect(scope.eventsRepository.add).toHaveBeenCalledExactlyOnceWith(
      new ProductSalesConfigurationChangedEvent({
        establishmentId,
        productId: product.id,
        state: 'available',
        configuration: {
          establishmentId,
          productId: product.id,
          name: product.name,
          categories: [ProductCategory.Portion],
          status: product.status,
          stockControl: product.stockControl,
          sizes: [
            {
              sizeId: remainingSize.id,
              name: remainingSize.name,
              price: remainingSize.price,
              isActive: remainingSize.isActive,
              accompaniments: [],
            },
          ],
          resaleConfigurations: [],
          updatedAt: new Date(
            Math.max(product.updatedAt.getTime(), remainingSize.updatedAt.getTime()),
          ),
        },
      }),
    )
  })

  it.each([
    {
      name: 'zero',
      price: 0,
      status: ProductStatus.Active,
      expectedPrice: 0,
      expectedActive: true,
    },
    {
      name: 'negative',
      price: -1,
      status: ProductStatus.Active,
      expectedPrice: 0,
      expectedActive: false,
    },
    {
      name: 'not finite',
      price: Number.POSITIVE_INFINITY,
      status: ProductStatus.Active,
      expectedPrice: 0,
      expectedActive: false,
    },
    {
      name: 'more than two decimal places',
      price: 2.755,
      status: ProductStatus.Active,
      expectedPrice: 0,
      expectedActive: false,
    },
    {
      name: 'inactive accompaniment',
      price: 2.75,
      status: ProductStatus.Inactive,
      expectedPrice: 2.75,
      expectedActive: false,
    },
  ])(
    'publishes a safe base price and activity state for $name values',
    async ({ price, status, expectedPrice, expectedActive }) => {
      const accompaniment = ProductFaker.fake({
        id: 'accompaniment-1',
        establishmentId,
        categories: [ProductCategory.Accompaniment],
        status,
      })
      const type = AccompanimentTypeFaker.fake({ id: 'type-1', establishmentId })
      const remainingSize = ProductSizeFaker.fake({
        id: 'size-remaining',
        establishmentId,
        productId: product.id,
      })
      const link = ProductAccompanimentFaker.fake({
        id: 'link-1',
        establishmentId,
        productId: product.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        accompanimentPrice: price,
      })
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
        [
          ProductSalesConfigurationSourceFaker.fake({
            product,
            sizes: [remainingSize],
            links: [link],
            accompanimentProducts: [accompaniment],
            accompanimentTypes: [type],
          }),
        ],
      )

      await useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id })

      const [[event]] = scope.eventsRepository.add.mock.calls
      expect(
        (event as ProductSalesConfigurationChangedEvent).payload.configuration?.sizes[0]
          ?.accompaniments,
      ).toEqual([
        {
          accompanimentId: link.id,
          productId: accompaniment.id,
          name: accompaniment.name,
          type: type.name,
          basePrice: expectedPrice,
          isActive: expectedActive,
        },
      ])
    },
  )

  it('rejects non-Managers with the manager-only message before opening a transaction', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: product.id,
        sizeId: finalActiveSize.id,
      }),
    ).rejects.toThrow(new AuthorizationError('Somente gestores podem remover tamanhos.'))

    expect(database.run).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()
  })

  it.each([
    ['a missing product', undefined],
    [
      'a product from another establishment',
      ProductFaker.fake({
        id: 'portion-1',
        establishmentId: 'establishment-2',
        categories: [ProductCategory.Portion],
      }),
    ],
  ])('reports %s as not found and writes nothing', async (_label, found) => {
    scope.productsRepository.findById.mockResolvedValue(found)

    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id }),
    ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))

    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
    expect(scope.productSizesRepository.findById).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects products that are not Portions with the Portion message', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId,
        categories: [ProductCategory.Manufacturable],
      }),
    )

    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id }),
    ).rejects.toThrow(new BadRequestError('O produto não é uma porção.'))

    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects products that are both Portion and Resale with the exclusivity message', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
      }),
    )

    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id }),
    ).rejects.toThrow(
      new BadRequestError('Porção e Revenda não podem ser usadas juntas.'),
    )

    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    ['a missing size', undefined],
    [
      'a size from another establishment',
      ProductSizeFaker.fake({
        id: 'size-final',
        establishmentId: 'establishment-2',
        productId: 'portion-1',
      }),
    ],
    [
      'a size owned by another product',
      ProductSizeFaker.fake({
        id: 'size-final',
        establishmentId,
        productId: 'another-portion',
      }),
    ],
  ])('reports %s with the size message and writes nothing', async (_label, found) => {
    scope.productSizesRepository.findById.mockResolvedValue(found)

    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id }),
    ).rejects.toThrow(new NotFoundError('Tamanho não encontrado.'))

    expect(scope.productSizesRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      finalActiveSize.id,
    )
    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('removes the size before republishing the Portion and its same-tenant inverse owners once', async () => {
    const owner = ProductFaker.fake({
      id: 'portion-2',
      establishmentId,
      categories: [ProductCategory.Portion],
    })
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId,
          productId: owner.id,
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId,
          productId: owner.id,
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'establishment-2',
          productId: 'foreign-portion',
          accompanimentProductId: product.id,
        }),
      ],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({ product }),
        ProductSalesConfigurationSourceFaker.fake({ product: owner }),
      ],
    )

    await useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id })

    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, product.id)
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, [product.id, owner.id])
    expect(scope.productSizesRepository.remove.mock.invocationCallOrder[0]).toBeLessThan(
      scope.eventsRepository.add.mock.invocationCallOrder[0],
    )
    expect(
      scope.eventsRepository.add.mock.calls.map(
        ([event]) => (event as ProductSalesConfigurationChangedEvent).payload.productId,
      ),
    ).toEqual([product.id, owner.id])
  })
})
