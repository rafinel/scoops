import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import {
  AccompanimentTypeFaker,
  BrandFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { LinkAccompanimentPortionsInput } from '#mrp/domain/structures/link-accompaniment-portions-input.ts'
import type { ProductAccompanimentUpdate } from '#mrp/domain/structures/product-accompaniment-update.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
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
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { LinkAccompanimentPortionsUseCase } from '#mrp/use-cases/link-accompaniment-portions-use-case.ts'

const establishmentId = 'establishment-1'
const manager = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const accompaniment = ProductFaker.fake({
  id: 'accompaniment-1',
  establishmentId,
  name: 'Granola',
  unit: ProductUnit.Kilogram,
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: 4,
  accompanimentPrice: 3.5,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId,
  name: 'Toppings',
})
const otherType = AccompanimentTypeFaker.fake({
  id: 'type-2',
  establishmentId,
  name: 'Sauces',
})

function portion(id: string, name: string, overrides = {}) {
  return ProductFaker.fake({
    id,
    establishmentId,
    name,
    categories: [ProductCategory.Portion],
    ...overrides,
  })
}

const portionA = portion('portion-a', 'Alpha')
const portionB = portion('portion-b', 'Bravo', { status: ProductStatus.Inactive })
const portionC = portion('portion-c', 'Charlie')
const portionD = portion('portion-d', 'Delta')
const portionE = portion('portion-e', 'Echo')
const everyPortion = [portionA, portionB, portionC, portionD, portionE]
const globalId = 'global-1'

function applyChanges(
  row: ProductAccompaniment,
  { accompanimentPrice, ...changes }: ProductAccompanimentUpdate,
): ProductAccompaniment {
  return {
    ...row,
    ...changes,
    ...(accompanimentPrice === undefined
      ? {}
      : { accompanimentPrice: accompanimentPrice ?? undefined }),
  }
}

function rowFor(
  portionId: string,
  overrides: Partial<ProductAccompaniment> = {},
): ProductAccompaniment {
  return ProductAccompanimentFaker.fake({
    id: `row-${portionId}`,
    establishmentId,
    productId: portionId,
    accompanimentProductId: accompaniment.id,
    accompanimentTypeId: otherType.id,
    quantityPerPortion: 9,
    ...overrides,
  })
}

describe('Link Accompaniment Portions Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: LinkAccompanimentPortionsUseCase
  let rows: ProductAccompaniment[]
  let catalog: ReturnType<typeof portion>[]
  let currentAccompaniment: typeof accompaniment
  let currentGlobal: ReturnType<typeof GlobalAccompanimentFaker.fake> | undefined

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    rows = []
    catalog = [...everyPortion]
    currentAccompaniment = accompaniment
    currentGlobal = undefined
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async () => currentAccompaniment)
    scope.productsRepository.findManyByIds.mockImplementation(async (_, ids) =>
      catalog.filter((product) => ids.includes(product.id)),
    )
    scope.productsRepository.findManyByCategory.mockImplementation(async () =>
      catalog.filter((product) => product.categories.includes(ProductCategory.Portion)),
    )
    scope.productsRepository.replace.mockImplementation(async (...args: unknown[]) => {
      const changes = args.at(-1) as { accompanimentPrice?: number }
      currentAccompaniment = { ...currentAccompaniment, ...changes }
      return currentAccompaniment
    })
    scope.accompanimentTypesRepository.findById.mockImplementation(async (_, id) =>
      id === type.id ? type : id === otherType.id ? otherType : undefined,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([])
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockImplementation(
      async () => currentGlobal,
    )
    scope.globalAccompanimentsRepository.add.mockImplementation(async (input) => {
      currentGlobal = GlobalAccompanimentFaker.fake({ ...input, id: globalId })
      return currentGlobal
    })
    scope.globalAccompanimentsRepository.replace.mockImplementation(
      async (_, id, changes) => {
        currentGlobal = GlobalAccompanimentFaker.fake({
          ...currentGlobal,
          ...changes,
          id,
        })
        return currentGlobal
      },
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockImplementation(
      async () => [...rows],
    )
    scope.productAccompanimentsRepository.addMany.mockImplementation(async (inputs) => {
      const created = inputs.map((input) =>
        ProductAccompanimentFaker.fake({ ...input, id: `row-${input.productId}` }),
      )
      rows.push(...created)
      return created
    })
    scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId.mockImplementation(
      async (_, __, changes) => {
        rows = rows.map((row) => applyChanges(row, changes))
      },
    )
    scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId.mockImplementation(
      async (_, id, changes) => {
        rows = rows.map((row) =>
          row.globalAccompanimentId === id ? applyChanges(row, changes) : row,
        )
      },
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockImplementation(
      async (_, ids) => ids.flatMap((id) => sourcesFor(id)),
    )
    useCase = new LinkAccompanimentPortionsUseCase(database)
  })

  function sourcesFor(productId: string): ProductSalesConfigurationSource[] {
    const product = [accompaniment, ...catalog].find(
      (candidate) => candidate.id === productId,
    )
    if (!product) return []
    return [
      {
        product,
        sizes: product.categories.includes(ProductCategory.Portion)
          ? [
              ProductSizeFaker.fake({
                id: `size-${product.id}`,
                establishmentId,
                productId: product.id,
                price: 15,
              }),
            ]
          : [],
        links: rows.filter((row) => row.productId === product.id),
        resaleConfigurations: [],
        brands: [],
        accompanimentProducts: [currentAccompaniment],
        accompanimentTypes: [type, otherType],
        globals: currentGlobal ? [currentGlobal] : [],
      },
    ]
  }

  function execute(
    input: Partial<LinkAccompanimentPortionsInput> = {},
    actor: ProductActor = manager,
  ) {
    return useCase.execute({
      actor,
      productId: accompaniment.id,
      input: {
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.5,
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
    expect(scope.productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
    expect(
      scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId,
    ).not.toHaveBeenCalled()
    expect(
      scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
    ).not.toHaveBeenCalled()
    expect(scope.globalAccompanimentsRepository.add).not.toHaveBeenCalled()
    expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  }

  describe('mode (a): individual links', () => {
    it('links every selected Portion with one addMany and one event per linked Portion', async () => {
      const result = await execute({
        portionProductIds: [portionC.id, portionB.id, portionA.id],
      })

      expect(scope.productAccompanimentsRepository.addMany).toHaveBeenCalledTimes(1)
      expect(scope.productAccompanimentsRepository.addMany).toHaveBeenCalledWith([
        {
          establishmentId,
          productId: portionC.id,
          accompanimentProductId: accompaniment.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          accompanimentPrice: 3.5,
        },
        {
          establishmentId,
          productId: portionB.id,
          accompanimentProductId: accompaniment.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          accompanimentPrice: 3.5,
        },
        {
          establishmentId,
          productId: portionA.id,
          accompanimentProductId: accompaniment.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          accompanimentPrice: 3.5,
        },
      ])
      expect(scope.globalAccompanimentsRepository.add).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId,
      ).not.toHaveBeenCalled()
      expect(result).toEqual([
        {
          id: `row-${portionA.id}`,
          accompanimentProductId: accompaniment.id,
          accompanimentProductName: 'Granola',
          accompanimentTypeId: type.id,
          accompanimentTypeName: 'Toppings',
          unit: ProductUnit.Kilogram,
          quantityPerPortion: 1.5,
          salePrice: 3.5,
          isGlobal: false,
          hasOtherPortionLinks: true,
          unitCost: 4,
          estimatedCost: 6,
          portionProductId: portionA.id,
          portionProductName: 'Alpha',
        },
        expect.objectContaining({ portionProductId: portionB.id }),
        expect.objectContaining({ portionProductId: portionC.id }),
      ])
      expect(
        scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
      ).toHaveBeenCalledWith(establishmentId, [
        accompaniment.id,
        portionC.id,
        portionB.id,
        portionA.id,
      ])
      expect(publishedProductIds()).toEqual([portionC.id, portionB.id, portionA.id])
      const [event] = scope.eventsRepository.add.mock.calls[0]
      expect(event).toBeInstanceOf(ProductSalesConfigurationChangedEvent)
      expect(event).toMatchObject({
        payload: {
          establishmentId,
          productId: portionC.id,
          state: 'available',
          configuration: {
            sizes: [
              {
                sizeId: `size-${portionC.id}`,
                accompaniments: [
                  {
                    accompanimentId: `row-${portionC.id}`,
                    productId: accompaniment.id,
                    type: 'Toppings',
                    basePrice: 3.5,
                    isActive: true,
                  },
                ],
              },
            ],
          },
        },
      })
    })

    it('does not republish Portions that already had the Accompaniment while the price is unchanged', async () => {
      rows = [rowFor(portionD.id), rowFor(portionE.id)]

      await execute({ portionProductIds: [portionA.id], accompanimentPrice: 3.5 })

      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual([portionA.id])
    })

    it('flags the result when no other Portion has the Accompaniment', async () => {
      const result = await execute({ portionProductIds: [portionA.id] })

      expect(result).toHaveLength(1)
      expect(result[0].hasOtherPortionLinks).toBe(false)
    })

    it('returns only the rows created by this request', async () => {
      rows = [rowFor(portionD.id)]

      const result = await execute({ portionProductIds: [portionA.id, portionB.id] })

      expect(result.map((item) => item.portionProductId)).toEqual([
        portionA.id,
        portionB.id,
      ])
      expect(result.every((item) => item.hasOtherPortionLinks)).toBe(true)
    })

    it('orders the result by Portion name ignoring case, then by link id', async () => {
      catalog = [
        portion('p-1', 'zeta'),
        portion('p-2', 'Alpha'),
        portion('p-3', ' alpha'),
      ]

      const result = await execute({ portionProductIds: ['p-1', 'p-3', 'p-2'] })

      expect(result.map((item) => item.portionProductId)).toEqual(['p-2', 'p-3', 'p-1'])
    })

    it('gives each new link the entered price and leaves existing links and the default untouched', async () => {
      rows = [
        rowFor(portionD.id, { accompanimentPrice: 4 }),
        rowFor(portionE.id, { accompanimentPrice: 4 }),
      ]

      const result = await execute({
        portionProductIds: [portionA.id, portionB.id],
        accompanimentPrice: 5.25,
      })

      const [inputs] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(inputs.map((input) => input.accompanimentPrice)).toEqual([5.25, 5.25])
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId,
      ).not.toHaveBeenCalled()
      expect(
        rows.filter((row) => row.productId === portionD.id)[0].accompanimentPrice,
      ).toBe(4)
      expect(result.map((item) => item.salePrice)).toEqual([5.25, 5.25])
      expect(publishedProductIds()).toEqual([portionA.id, portionB.id])
    })

    it('uses the default price for the new links when no price is entered', async () => {
      const result = await execute({ portionProductIds: [portionA.id] })

      const [inputs] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(inputs[0].accompanimentPrice).toBe(3.5)
      expect(result[0].salePrice).toBe(3.5)
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    })

    it('writes the default price only while it is unset, before the rows', async () => {
      currentAccompaniment = { ...accompaniment, accompanimentPrice: undefined }

      const result = await execute({
        portionProductIds: [portionA.id],
        accompanimentPrice: 2.5,
      })

      expect(scope.productsRepository.replace).toHaveBeenCalledTimes(1)
      expect(scope.productsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        accompaniment.id,
        { accompanimentPrice: 2.5 },
      )
      expect(scope.productsRepository.replace.mock.invocationCallOrder[0]).toBeLessThan(
        scope.productAccompanimentsRepository.addMany.mock.invocationCallOrder[0],
      )
      expect(result[0].salePrice).toBe(2.5)
    })

    it('saves a zero price as free for an unpriced Accompaniment', async () => {
      currentAccompaniment = { ...accompaniment, accompanimentPrice: undefined }

      const result = await execute({
        portionProductIds: [portionA.id],
        accompanimentPrice: 0,
      })

      expect(scope.productsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        accompaniment.id,
        { accompanimentPrice: 0 },
      )
      const [inputs] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(inputs[0].accompanimentPrice).toBe(0)
      expect(result[0].salePrice).toBe(0)
    })

    it('reports a link without a price as null', async () => {
      scope.productAccompanimentsRepository.addMany.mockImplementation(async (inputs) => {
        const created = inputs.map((input) =>
          ProductAccompanimentFaker.fake({
            ...input,
            accompanimentPrice: undefined,
            id: `row-${input.productId}`,
          }),
        )
        rows.push(...created)
        return created
      })

      const result = await execute({ portionProductIds: [portionA.id] })

      expect(result[0].salePrice).toBeNull()
    })

    it('uses the main brand cost for a By-brand Accompaniment', async () => {
      currentAccompaniment = {
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
        currentUnitCost: undefined,
      }
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        BrandFaker.fake({
          id: 'brand-1',
          productId: accompaniment.id,
          name: 'House',
          packageQuantity: 4,
          packagePrice: 12,
        }),
      ])

      const result = await execute({ portionProductIds: [portionA.id] })

      expect(result[0]).toMatchObject({
        brandId: 'brand-1',
        brandName: 'House',
        unitCost: 3,
        estimatedCost: 4.5,
      })
      expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
        establishmentId,
        accompaniment.id,
      )
    })

    it('links the same Portion once when the ids repeat', async () => {
      await execute({ portionProductIds: [portionA.id, portionA.id] })

      const [inputs] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(inputs.map((input) => input.productId)).toEqual([portionA.id])
    })

    it('looks Portions up in batches of 100 ids', async () => {
      const many = Array.from({ length: 250 }, (_, index) =>
        portion(`bulk-${index}`, `Bulk ${String(index).padStart(3, '0')}`),
      )
      catalog = many

      const result = await execute({ portionProductIds: many.map((item) => item.id) })

      const batches = scope.productsRepository.findManyByIds.mock.calls.map(
        ([, ids]) => ids.length,
      )
      expect(batches).toEqual([100, 100, 50])
      expect(result).toHaveLength(250)
      const [inputs] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(inputs).toHaveLength(250)
    })
  })

  describe('mode (a) rejections are atomic', () => {
    it('requires at least one Portion', async () => {
      for (const portionProductIds of [undefined, []]) {
        await expect(execute({ portionProductIds })).rejects.toThrow(
          new BadRequestError('Selecione ao menos uma porção.'),
        )
      }
      expectNothingWritten()
    })

    it('rejects an unknown Portion id before writing anything, even with a new price', async () => {
      await expect(
        execute({
          portionProductIds: [portionA.id, 'unknown-portion'],
          accompanimentPrice: 9,
        }),
      ).rejects.toThrow(new NotFoundError('Porção não encontrada.'))
      expectNothingWritten()
    })

    it('rejects a Portion of another establishment as not found', async () => {
      catalog = [
        portionA,
        portion('foreign-portion', 'Foreign', {
          establishmentId: 'another-establishment',
        }),
      ]

      await expect(
        execute({ portionProductIds: [portionA.id, 'foreign-portion'] }),
      ).rejects.toThrow(new NotFoundError('Porção não encontrada.'))
      expect(scope.productsRepository.findManyByIds).toHaveBeenCalledWith(
        establishmentId,
        [portionA.id, 'foreign-portion'],
      )
      expectNothingWritten()
    })

    it('rejects a product that lost the Portion category as a conflict', async () => {
      catalog = [
        portionA,
        portion('ex-portion', 'Ex', { categories: [ProductCategory.Ingredient] }),
      ]

      await expect(
        execute({ portionProductIds: [portionA.id, 'ex-portion'] }),
      ).rejects.toThrow(
        new ConflictError(
          'Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento.',
        ),
      )
      expectNothingWritten()
    })

    it('rejects a Portion that already has the Accompaniment as a conflict', async () => {
      rows = [rowFor(portionB.id)]

      await expect(
        execute({ portionProductIds: [portionA.id, portionB.id] }),
      ).rejects.toThrow(
        new ConflictError(
          'Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento.',
        ),
      )
      expect(
        scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
      ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
      expectNothingWritten()
    })

    it('reports an unknown Portion before a conflicting one', async () => {
      rows = [rowFor(portionB.id)]

      await expect(
        execute({ portionProductIds: [portionB.id, 'unknown-portion'] }),
      ).rejects.toBeInstanceOf(NotFoundError)
      expectNothingWritten()
    })
  })

  describe('mode (b): making the Accompaniment global', () => {
    it('creates the global, converts existing rows in place and adds a row for every other Portion', async () => {
      rows = [
        rowFor(portionB.id, {
          id: 'kept-b',
          quantityPerPortion: 7,
          accompanimentPrice: 6,
        }),
        rowFor(portionC.id, { id: 'kept-c', accompanimentPrice: 2 }),
      ]

      const result = await execute({ isGlobal: true })

      // The default prefills the single price stored on the new global.
      expect(scope.globalAccompanimentsRepository.add).toHaveBeenCalledWith({
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.5,
        accompanimentPrice: 3.5,
      })
      expect(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId,
      ).toHaveBeenCalledWith(establishmentId, accompaniment.id, {
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.5,
        globalAccompanimentId: globalId,
        accompanimentPrice: null,
      })
      expect(rows.every((row) => row.accompanimentPrice === undefined)).toBe(true)
      const [created] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(created.map((input) => input.productId)).toEqual([
        portionA.id,
        portionD.id,
        portionE.id,
      ])
      for (const input of created) {
        expect(input).toMatchObject({
          establishmentId,
          accompanimentProductId: accompaniment.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          globalAccompanimentId: globalId,
        })
        expect(input).not.toHaveProperty('accompanimentPrice')
      }
      expect(result.map((item) => item.portionProductId)).toEqual(
        everyPortion.map((item) => item.id),
      )
      expect(result.map((item) => item.id)).toEqual([
        `row-${portionA.id}`,
        'kept-b',
        'kept-c',
        `row-${portionD.id}`,
        `row-${portionE.id}`,
      ])
      for (const item of result) {
        expect(item).toMatchObject({
          isGlobal: true,
          hasOtherPortionLinks: false,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          salePrice: 3.5,
        })
      }
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.globalAccompanimentsRepository.add.mock.invocationCallOrder[0],
      ).toBeLessThan(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId.mock
          .invocationCallOrder[0],
      )
      expect(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        scope.productAccompanimentsRepository.addMany.mock.invocationCallOrder[0],
      )
      expect(publishedProductIds()).toEqual(everyPortion.map((item) => item.id))
    })

    it('accepts an empty id list and works without existing rows', async () => {
      const result = await execute({ isGlobal: true, portionProductIds: [] })

      expect(result).toHaveLength(5)
      const [created] = scope.productAccompanimentsRepository.addMany.mock.calls[0]
      expect(created).toHaveLength(5)
    })

    it('stores the entered price on the global and writes the unset default', async () => {
      currentAccompaniment = { ...accompaniment, accompanimentPrice: undefined }

      const result = await execute({ isGlobal: true, accompanimentPrice: 2 })

      expect(scope.productsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        accompaniment.id,
        { accompanimentPrice: 2 },
      )
      expect(scope.globalAccompanimentsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ accompanimentPrice: 2 }),
      )
      expect(result.every((item) => item.salePrice === 2)).toBe(true)
    })

    it('prefers the entered price over the default and keeps the existing default', async () => {
      const result = await execute({ isGlobal: true, accompanimentPrice: 8 })

      expect(scope.globalAccompanimentsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ accompanimentPrice: 8 }),
      )
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(result.every((item) => item.salePrice === 8)).toBe(true)
    })

    it('rejects Portion ids when making the Accompaniment global', async () => {
      await expect(
        execute({ isGlobal: true, portionProductIds: [portionA.id] }),
      ).rejects.toThrow(
        new BadRequestError(
          'Não informe porções ao disponibilizar o acompanhamento para todas as porções.',
        ),
      )
      expectNothingWritten()
    })

    it('rejects the conversion when the establishment has no Portion product', async () => {
      catalog = [
        portion('ingredient', 'Flour', { categories: [ProductCategory.Ingredient] }),
        portion('foreign-portion', 'Foreign', {
          establishmentId: 'another-establishment',
        }),
      ]
      scope.productsRepository.findManyByCategory.mockResolvedValue([
        portion('foreign-portion', 'Foreign', {
          establishmentId: 'another-establishment',
        }),
      ])

      await expect(execute({ isGlobal: true })).rejects.toThrow(
        new BadRequestError(
          'Cadastre uma porção antes de disponibilizar este acompanhamento para todas as porções.',
        ),
      )
      expect(scope.productsRepository.findManyByCategory).toHaveBeenCalledWith(
        establishmentId,
        ProductCategory.Portion,
      )
      expectNothingWritten()
    })

    it('does not create a global when isGlobal is false or absent', async () => {
      await execute({ isGlobal: false, portionProductIds: [portionA.id] })

      expect(scope.globalAccompanimentsRepository.add).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId,
      ).not.toHaveBeenCalled()
    })
  })

  describe('mode (c): restoring Portions of a global', () => {
    beforeEach(() => {
      currentGlobal = GlobalAccompanimentFaker.fake({
        id: globalId,
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.5,
        accompanimentPrice: 4.25,
      })
      rows = [portionA, portionD, portionE].map((item) =>
        rowFor(item.id, {
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          globalAccompanimentId: globalId,
        }),
      )
    })

    it('restores each selected Portion as the same global item and republishes only them', async () => {
      const result = await execute({
        isGlobal: true,
        portionProductIds: [portionC.id, portionB.id],
      })

      expect(scope.globalAccompanimentsRepository.add).not.toHaveBeenCalled()
      expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.addMany).toHaveBeenCalledWith([
        {
          establishmentId,
          productId: portionC.id,
          accompanimentProductId: accompaniment.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          globalAccompanimentId: globalId,
        },
        {
          establishmentId,
          productId: portionB.id,
          accompanimentProductId: accompaniment.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
          globalAccompanimentId: globalId,
        },
      ])
      expect(result.map((item) => item.portionProductId)).toEqual([
        portionB.id,
        portionC.id,
      ])
      expect(result.every((item) => item.isGlobal && !item.hasOtherPortionLinks)).toBe(
        true,
      )
      // An omitted price keeps the global's own price, not the product default.
      expect(result.map((item) => item.salePrice)).toEqual([4.25, 4.25])
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual([portionC.id, portionB.id])
    })

    it('applies a changed type to the global and every row, then republishes every Portion', async () => {
      const result = await execute({
        isGlobal: true,
        portionProductIds: [portionB.id],
        accompanimentTypeId: otherType.id,
      })

      const changes = { accompanimentTypeId: otherType.id, quantityPerPortion: 1.5 }
      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        globalId,
        { ...changes, accompanimentPrice: 4.25 },
      )
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, globalId, changes)
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        scope.productAccompanimentsRepository.addMany.mock.invocationCallOrder[0],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        portionProductId: portionB.id,
        accompanimentTypeId: otherType.id,
        accompanimentTypeName: 'Sauces',
      })
      expect(publishedProductIds()).toEqual([
        portionB.id,
        portionA.id,
        portionD.id,
        portionE.id,
      ])
    })

    it('applies a changed quantity to the global and every row', async () => {
      await execute({
        isGlobal: true,
        portionProductIds: [portionB.id],
        quantityPerPortion: 3,
      })

      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        globalId,
        { accompanimentTypeId: type.id, quantityPerPortion: 3, accompanimentPrice: 4.25 },
      )
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, globalId, {
        accompanimentTypeId: type.id,
        quantityPerPortion: 3,
      })
      expect(publishedProductIds()).toHaveLength(4)
    })

    it("updates the global's price and republishes every Portion when only the price changes", async () => {
      const result = await execute({
        isGlobal: true,
        portionProductIds: [portionB.id],
        accompanimentPrice: 8,
      })

      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        globalId,
        { accompanimentTypeId: type.id, quantityPerPortion: 1.5, accompanimentPrice: 8 },
      )
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(result[0].salePrice).toBe(8)
      expect(publishedProductIds()).toHaveLength(4)
    })

    it('does not touch the global when the entered price equals its own', async () => {
      await execute({
        isGlobal: true,
        portionProductIds: [portionB.id],
        accompanimentPrice: 4.25,
      })

      expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual([portionB.id])
    })

    it('writes the unset default with the entered price while restoring', async () => {
      currentAccompaniment = { ...accompaniment, accompanimentPrice: undefined }

      await execute({
        isGlobal: true,
        portionProductIds: [portionB.id],
        accompanimentPrice: 8,
      })

      expect(scope.productsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        accompaniment.id,
        { accompanimentPrice: 8 },
      )
    })

    it('does not write an unset default when no price is entered', async () => {
      currentAccompaniment = { ...accompaniment, accompanimentPrice: undefined }

      await execute({ isGlobal: true, portionProductIds: [portionB.id] })

      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    })

    it('requires a price when the global has none and none is entered', async () => {
      currentGlobal = GlobalAccompanimentFaker.fake({
        ...currentGlobal,
        accompanimentPrice: undefined,
      })

      await expect(
        execute({ isGlobal: true, portionProductIds: [portionB.id] }),
      ).rejects.toThrow(
        new BadRequestError('Informe o preço de venda do acompanhamento.'),
      )
      expectNothingWritten()
    })

    it('requires isGlobal: true to link a global Accompaniment', async () => {
      for (const isGlobal of [undefined, false]) {
        await expect(
          execute({ isGlobal, portionProductIds: [portionB.id] }),
        ).rejects.toThrow(
          new ConflictError(
            'Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo às porções.',
          ),
        )
      }
      expectNothingWritten()
    })

    it('requires at least one excluded Portion', async () => {
      for (const portionProductIds of [undefined, []]) {
        await expect(execute({ isGlobal: true, portionProductIds })).rejects.toThrow(
          new BadRequestError('Selecione ao menos uma porção.'),
        )
      }
      expectNothingWritten()
    })

    it('rejects a Portion that already has the global as a conflict', async () => {
      await expect(
        execute({ isGlobal: true, portionProductIds: [portionB.id, portionA.id] }),
      ).rejects.toThrow(
        new ConflictError(
          'Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento.',
        ),
      )
      expectNothingWritten()
    })

    it('rejects unknown ids and non-Portion products without writing', async () => {
      await expect(
        execute({ isGlobal: true, portionProductIds: ['unknown-portion'] }),
      ).rejects.toThrow(new NotFoundError('Porção não encontrada.'))

      catalog = [
        portion('ex-portion', 'Ex', { categories: [ProductCategory.Ingredient] }),
      ]
      await expect(
        execute({
          isGlobal: true,
          portionProductIds: ['ex-portion'],
          accompanimentTypeId: otherType.id,
        }),
      ).rejects.toBeInstanceOf(ConflictError)
      expectNothingWritten()
    })
  })

  describe('shared validation', () => {
    it('rejects Operators before opening a transaction', async () => {
      await expect(
        execute(
          { portionProductIds: [portionA.id] },
          { ...manager, profile: UserProfile.Operator },
        ),
      ).rejects.toThrow(
        new AuthorizationError('Somente gestores podem vincular porções.'),
      )
      expect(database.run).not.toHaveBeenCalled()
    })

    it.each([0, -1, 1.0001, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects the quantity %s before opening a transaction',
      async (quantityPerPortion) => {
        await expect(
          execute({ portionProductIds: [portionA.id], quantityPerPortion }),
        ).rejects.toThrow(
          new BadRequestError(
            'A quantidade deve ser positiva e ter até três casas decimais.',
          ),
        )
        expect(database.run).not.toHaveBeenCalled()
      },
    )

    it('accepts a quantity with three decimals', async () => {
      const result = await execute({
        portionProductIds: [portionA.id],
        quantityPerPortion: 0.125,
      })

      expect(result[0].quantityPerPortion).toBe(0.125)
    })

    it.each([
      { name: 'missing', product: undefined },
      {
        name: 'foreign',
        product: { ...accompaniment, establishmentId: 'another-establishment' },
      },
    ])('rejects a $name route product', async ({ product }) => {
      scope.productsRepository.findById.mockResolvedValue(product)

      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
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

      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
        new BadRequestError('O produto não é um acompanhamento elegível para porções.'),
      )
      expectNothingWritten()
    })

    it('rejects an inactive Accompaniment in every mode', async () => {
      currentAccompaniment = { ...accompaniment, status: ProductStatus.Inactive }

      for (const input of [{ portionProductIds: [portionA.id] }, { isGlobal: true }]) {
        await expect(execute(input)).rejects.toThrow(
          new BadRequestError('Ative o produto para vincular ou editar porções.'),
        )
      }
      expectNothingWritten()
    })

    it('rejects a missing or foreign type', async () => {
      scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
        new NotFoundError('Tipo de acompanhamento não encontrado.'),
      )

      scope.accompanimentTypesRepository.findById.mockResolvedValue({
        ...type,
        establishmentId: 'another-establishment',
      })
      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
        new NotFoundError('Tipo de acompanhamento não encontrado.'),
      )
      expectNothingWritten()
    })

    it('accepts a By-brand Accompaniment whose several brands include its main brand', async () => {
      currentAccompaniment = {
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
        currentUnitCost: undefined,
      }
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

      const result = await execute({ portionProductIds: [portionA.id] })

      expect(result[0]).toMatchObject({ brandId: 'main', brandName: 'Main', unitCost: 4 })
    })

    it('rejects a By-brand Accompaniment whose own brands are all non-primary', async () => {
      currentAccompaniment = {
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
      }
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        BrandFaker.fake({ productId: accompaniment.id, isPrimary: false }),
        BrandFaker.fake({ productId: accompaniment.id, isPrimary: false }),
      ])

      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
        new BadRequestError('O acompanhamento não possui marca principal.'),
      )
      expectNothingWritten()
    })

    it('rejects a By-brand Accompaniment without a main brand', async () => {
      currentAccompaniment = {
        ...accompaniment,
        stockControl: ProductStockControl.ByBrand,
      }
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        BrandFaker.fake({ productId: accompaniment.id, isPrimary: false }),
        BrandFaker.fake({ productId: 'another-product', isPrimary: true }),
      ])

      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
        new BadRequestError('O acompanhamento não possui marca principal.'),
      )
      expectNothingWritten()
    })

    it('requires a price when none is saved or supplied', async () => {
      currentAccompaniment = { ...accompaniment, accompanimentPrice: undefined }

      await expect(execute({ portionProductIds: [portionA.id] })).rejects.toThrow(
        new BadRequestError('Informe o preço de venda do acompanhamento.'),
      )
      expectNothingWritten()
    })

    it.each([-1, 1.234, Number.NaN])('rejects the invalid price %s', async (price) => {
      await expect(
        execute({ portionProductIds: [portionA.id], accompanimentPrice: price }),
      ).rejects.toThrow(
        new BadRequestError(
          'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
        ),
      )
      expectNothingWritten()
    })
  })
})
