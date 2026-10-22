import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  BrandFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { ProductSalesConfigurationSource } from '#mrp/domain/structures/product-sales-configuration-source.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { UpdateGlobalAccompanimentUseCase } from '#mrp/use-cases/update-global-accompaniment-use-case.ts'

const establishmentId = 'establishment-1'
const manager = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const accompaniment = ProductFaker.fake({
  id: 'accompaniment-1',
  establishmentId,
  name: 'Granola',
  unit: ProductUnit.Kilogram,
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: 4,
  accompanimentPrice: 9,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId,
  name: 'Toppings',
})
const newType = AccompanimentTypeFaker.fake({
  id: 'type-2',
  establishmentId,
  name: 'Sauces',
})
const global = GlobalAccompanimentFaker.fake({
  id: 'global-1',
  establishmentId,
  accompanimentProductId: accompaniment.id,
  accompanimentTypeId: type.id,
  quantityPerPortion: 0.5,
  accompanimentPrice: 3.5,
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
    quantityPerPortion: 0.5,
    globalAccompanimentId: global.id,
  })
}

let currentGlobal = global

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
    links: [rowFor(portion.id)],
    resaleConfigurations: [],
    brands: [],
    accompanimentProducts: [accompaniment],
    accompanimentTypes: [type],
    globals: [currentGlobal],
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

const globalUpdatedAt = new Date('2030-01-01T00:00:00.000Z')

const sharedChange = {
  accompanimentTypeId: newType.id,
  quantityPerPortion: 2,
}

describe('Update Global Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: UpdateGlobalAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(accompaniment)
    currentGlobal = global
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockImplementation(
      async () => currentGlobal,
    )
    scope.globalAccompanimentsRepository.replace.mockImplementation(
      async (_, id, changes) => {
        currentGlobal = { ...currentGlobal, id, ...changes, updatedAt: globalUpdatedAt }
        return currentGlobal
      },
    )
    scope.accompanimentTypesRepository.findById.mockImplementation(async (_, id) =>
      id === type.id ? type : id === newType.id ? newType : undefined,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([])
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [rowFor(portionA.id), rowFor(portionB.id)],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockImplementation(
      async () => [accompanimentSource(), sourceFor(portionA), sourceFor(portionB)],
    )
    useCase = new UpdateGlobalAccompanimentUseCase(database)
  })

  function execute(
    input: Partial<
      Parameters<UpdateGlobalAccompanimentUseCase['execute']>[0]['input']
    > = {},
  ) {
    return useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      input: {
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.5,
        ...input,
      },
    })
  }

  function publishedProductIds() {
    return scope.eventsRepository.add.mock.calls.map(
      ([event]) => (event.payload as { productId: string }).productId,
    )
  }

  function expectNothingWritten() {
    expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
    expect(
      scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
    ).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  }

  it('updates the global and every row, saves the price and republishes each Portion with a row', async () => {
    const result = await execute({ ...sharedChange, accompanimentPrice: 5 })

    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      global.id,
      { ...sharedChange, accompanimentPrice: 5 },
    )
    // Rows never carry a price: the shared replace passes only type and quantity.
    expect(
      scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
    ).toHaveBeenCalledWith(establishmentId, global.id, sharedChange)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(result).toEqual({
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Granola',
      isGlobal: true,
      unit: ProductUnit.Kilogram,
      salePrice: 5,
      globalAccompanimentId: global.id,
      accompanimentTypeId: newType.id,
      accompanimentTypeName: 'Sauces',
      quantityPerPortion: 2,
      unitCost: 4,
      estimatedCost: 8,
    })
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledWith(establishmentId, [accompaniment.id, portionA.id, portionB.id])
    expect(publishedProductIds()).toEqual([portionA.id, portionB.id])
    const [firstEvent] = scope.eventsRepository.add.mock.calls[0]
    expect(firstEvent).toBeInstanceOf(ProductSalesConfigurationChangedEvent)
    expect(firstEvent).toMatchObject({
      payload: {
        establishmentId,
        productId: portionA.id,
        state: 'available',
        configuration: {
          sizes: [
            {
              sizeId: `size-${portionA.id}`,
              accompaniments: [
                {
                  accompanimentId: `row-${portionA.id}`,
                  productId: accompaniment.id,
                  name: 'Granola',
                  type: 'Toppings',
                  basePrice: 5,
                  isActive: true,
                },
              ],
            },
          ],
          updatedAt: globalUpdatedAt,
        },
      },
    })
  })

  it('saves only the shared values when the price is omitted', async () => {
    await execute(sharedChange)

    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledTimes(1)
    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      global.id,
      { ...sharedChange, accompanimentPrice: 3.5 },
    )
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(publishedProductIds()).toEqual([portionA.id, portionB.id])
  })

  it('republishes when only the type changes or only the quantity changes', async () => {
    await execute({ accompanimentTypeId: newType.id })
    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenLastCalledWith(
      establishmentId,
      global.id,
      {
        accompanimentTypeId: newType.id,
        quantityPerPortion: 0.5,
        accompanimentPrice: 3.5,
      },
    )
    expect(publishedProductIds()).toHaveLength(2)

    scope.eventsRepository.add.mockClear()
    await execute({ quantityPerPortion: 1 })
    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenLastCalledWith(
      establishmentId,
      global.id,
      { accompanimentTypeId: type.id, quantityPerPortion: 1, accompanimentPrice: 3.5 },
    )
    expect(publishedProductIds()).toHaveLength(2)
  })

  it('saves only the price and republishes when the shared values are unchanged', async () => {
    const result = await execute({ accompanimentPrice: 4 })

    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      global.id,
      { accompanimentTypeId: type.id, quantityPerPortion: 0.5, accompanimentPrice: 4 },
    )
    expect(
      scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
    ).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(result.salePrice).toBe(4)
    expect(publishedProductIds()).toEqual([portionA.id, portionB.id])
    const [event] = scope.eventsRepository.add.mock.calls[0]
    expect(event).toMatchObject({
      payload: {
        configuration: {
          sizes: [{ accompaniments: [{ basePrice: 4, isActive: true }] }],
        },
      },
    })
  })

  it('saves a zero price as free', async () => {
    const result = await execute({ accompanimentPrice: 0 })

    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      global.id,
      { accompanimentTypeId: type.id, quantityPerPortion: 0.5, accompanimentPrice: 0 },
    )
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(result.salePrice).toBe(0)
  })

  it('is a no-op without writes or events when nothing differs', async () => {
    const result = await execute({ accompanimentPrice: 3.5 })

    expectNothingWritten()
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      isGlobal: true,
      accompanimentTypeId: type.id,
      quantityPerPortion: 0.5,
      salePrice: 3.5,
    })
  })

  it('is a no-op when the price is omitted and the shared values match', async () => {
    await execute()

    expectNothingWritten()
  })

  it('works with zero rows: updates the global and publishes nothing', async () => {
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )

    const result = await execute({ ...sharedChange, accompanimentPrice: 5 })

    expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledTimes(1)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(result).toMatchObject({ quantityPerPortion: 2, salePrice: 5 })
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('publishes only Portion configurations', async () => {
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [accompanimentSource(), sourceFor(portionA)],
    )

    await execute(sharedChange)

    expect(publishedProductIds()).toEqual([portionA.id])
  })

  it('uses the main brand cost of a By-brand Accompaniment', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      BrandFaker.fake({
        id: 'brand-1',
        productId: accompaniment.id,
        name: 'House',
        packageQuantity: 4,
        packagePrice: 12,
      }),
    ])

    const result = await execute({ quantityPerPortion: 1 })

    expect(result).toMatchObject({
      brandId: 'brand-1',
      brandName: 'House',
      unitCost: 3,
      estimatedCost: 3,
    })
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      accompaniment.id,
    )
  })

  describe('rejections write nothing', () => {
    it('rejects Operators before opening a transaction', async () => {
      await expect(
        useCase.execute({
          actor: { ...manager, profile: UserProfile.Operator },
          productId: accompaniment.id,
          input: { accompanimentTypeId: type.id, quantityPerPortion: 1 },
        }),
      ).rejects.toThrow(
        new AuthorizationError('Somente gestores podem editar acompanhamentos globais.'),
      )
      expect(database.run).not.toHaveBeenCalled()
    })

    it.each([0, -1, 1.0001, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects the quantity %s before opening a transaction',
      async (quantityPerPortion) => {
        await expect(execute({ quantityPerPortion })).rejects.toThrow(
          new BadRequestError(
            'A quantidade deve ser positiva e ter até três casas decimais.',
          ),
        )
        expect(database.run).not.toHaveBeenCalled()
      },
    )

    it('accepts a quantity with three decimals', async () => {
      await expect(execute({ quantityPerPortion: 0.125 })).resolves.toMatchObject({
        quantityPerPortion: 0.125,
      })
    })

    it.each([
      { name: 'missing', product: undefined },
      {
        name: 'foreign',
        product: { ...accompaniment, establishmentId: 'another-establishment' },
      },
    ])('rejects a $name route product', async ({ product }) => {
      scope.productsRepository.findById.mockResolvedValue(product)

      await expect(execute(sharedChange)).rejects.toThrow(
        new NotFoundError('Produto não encontrado.'),
      )
      expect(scope.productsRepository.findById).toHaveBeenCalledWith(
        establishmentId,
        accompaniment.id,
      )
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

      await expect(execute(sharedChange)).rejects.toThrow(
        new BadRequestError('O produto não é um acompanhamento elegível para porções.'),
      )
      expectNothingWritten()
    })

    it('rejects an inactive Accompaniment', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        status: ProductStatus.Inactive,
      })

      await expect(execute(sharedChange)).rejects.toThrow(
        new BadRequestError('Ative o produto para vincular ou editar porções.'),
      )
      expectNothingWritten()
    })

    it('rejects a non-global Accompaniment', async () => {
      scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
        undefined,
      )

      await expect(execute(sharedChange)).rejects.toThrow(
        new NotFoundError('Acompanhamento global não encontrado.'),
      )
      expect(
        scope.globalAccompanimentsRepository.findByAccompanimentProductId,
      ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
      expectNothingWritten()
    })

    it('rejects a missing or foreign type', async () => {
      scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
      await expect(execute(sharedChange)).rejects.toThrow(
        new NotFoundError('Tipo de acompanhamento não encontrado.'),
      )

      scope.accompanimentTypesRepository.findById.mockResolvedValue({
        ...newType,
        establishmentId: 'another-establishment',
      })
      await expect(execute(sharedChange)).rejects.toThrow(
        new NotFoundError('Tipo de acompanhamento não encontrado.'),
      )
      expectNothingWritten()
    })

    it('accepts a By-brand Accompaniment whose several brands include its main brand', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
        currentUnitCost: undefined,
      })
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        BrandFaker.fake({
          id: 'secondary',
          productId: accompaniment.id,
          isPrimary: false,
        }),
        BrandFaker.fake({
          id: 'foreign',
          productId: 'another-product',
          isPrimary: false,
        }),
        BrandFaker.fake({
          id: 'main',
          productId: accompaniment.id,
          isPrimary: true,
          name: 'Main',
          packageQuantity: 2,
          packagePrice: 8,
        }),
      ])

      await expect(execute(sharedChange)).resolves.toMatchObject({
        brandId: 'main',
        brandName: 'Main',
        unitCost: 4,
      })
    })

    it('rejects a By-brand Accompaniment whose own brands are all non-primary', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
      })
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        BrandFaker.fake({ productId: accompaniment.id, isPrimary: false }),
        BrandFaker.fake({ productId: accompaniment.id, isPrimary: false }),
      ])

      await expect(execute(sharedChange)).rejects.toThrow(
        new BadRequestError('O acompanhamento não possui marca principal.'),
      )
      expectNothingWritten()
    })

    it('rejects a By-brand Accompaniment without a main brand', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
      })
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        BrandFaker.fake({ productId: accompaniment.id, isPrimary: false }),
        BrandFaker.fake({ productId: 'another-product', isPrimary: true }),
      ])

      await expect(execute(sharedChange)).rejects.toThrow(
        new BadRequestError('O acompanhamento não possui marca principal.'),
      )
      expectNothingWritten()
    })

    it('rejects a missing price when the global has no saved price, even with a default', async () => {
      currentGlobal = { ...global, accompanimentPrice: undefined }

      await expect(execute(sharedChange)).rejects.toThrow(
        new BadRequestError('Informe o preço de venda do acompanhamento.'),
      )
      expectNothingWritten()
    })

    it.each([-1, 1.234, Number.NaN])('rejects the invalid price %s', async (price) => {
      await expect(
        execute({ ...sharedChange, accompanimentPrice: price }),
      ).rejects.toThrow(
        new BadRequestError(
          'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
        ),
      )
      expectNothingWritten()
    })

    it('accepts a missing supplied price when the Accompaniment already has one', async () => {
      await expect(execute(sharedChange)).resolves.toMatchObject({ salePrice: 3.5 })
    })

    it('accepts a supplied price for a global that has none', async () => {
      currentGlobal = { ...global, accompanimentPrice: undefined }

      await expect(execute({ accompanimentPrice: 2 })).resolves.toMatchObject({
        salePrice: 2,
      })
      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        global.id,
        { accompanimentTypeId: type.id, quantityPerPortion: 0.5, accompanimentPrice: 2 },
      )
    })

    it("keeps the global's price instead of the product default when the price is omitted", async () => {
      const result = await execute(sharedChange)

      expect(result.salePrice).toBe(3.5)
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    })
  })
})
