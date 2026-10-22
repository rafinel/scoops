import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { BadRequestError, NotFoundError } from '#shared/domain/errors/index.ts'
import { GetProductAccompanimentsUseCase } from '#mrp/use-cases/get-product-accompaniments-use-case.ts'

const establishmentId = 'establishment-1'
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  name: 'Sunday Portion',
  categories: [ProductCategory.Portion],
})
const single = ProductFaker.fake({
  id: 'single-1',
  establishmentId,
  name: 'Biscuit',
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: 2.5,
  accompanimentPrice: 9,
})
const byBrand = ProductFaker.fake({
  id: 'brand-1',
  establishmentId,
  name: 'Apple Syrup',
  categories: [ProductCategory.Accompaniment],
  stockControl: ProductStockControl.ByBrand,
  currentUnitCost: undefined,
  accompanimentPrice: 8,
})
const unavailable = ProductFaker.fake({
  id: 'unavailable-1',
  establishmentId,
  name: 'Zest',
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: undefined,
})
const singleLink = ProductAccompanimentFaker.fake({
  id: 'link-1',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: single.id,
  accompanimentTypeId: 'type-1',
  quantityPerPortion: 2,
  accompanimentPrice: 4.5,
})
const brandLink = ProductAccompanimentFaker.fake({
  id: 'link-2',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: byBrand.id,
  accompanimentTypeId: 'type-1',
  quantityPerPortion: 0.25,
  accompanimentPrice: 2.75,
})
const unavailableLink = ProductAccompanimentFaker.fake({
  id: 'link-3',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: unavailable.id,
  accompanimentTypeId: 'type-1',
  quantityPerPortion: 1,
})

describe('Get Product Accompaniments Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: GetProductAccompanimentsUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) => {
      if (id === owner.id) return owner
      if (id === single.id) return single
      if (id === byBrand.id) return byBrand
      if (id === unavailable.id) return unavailable
      return undefined
    })
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      unavailableLink,
      brandLink,
      singleLink,
    ])
    scope.accompanimentTypesRepository.findById.mockResolvedValue(
      AccompanimentTypeFaker.fake({ id: 'type-1', establishmentId, name: '  Extras  ' }),
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      {
        id: 'brand-main',
        productId: byBrand.id,
        name: 'Main Brand',
        packageQuantity: 2,
        packagePrice: 10,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      1,
    )
    useCase = new GetProductAccompanimentsUseCase(database)
  })

  it("projects current cost and each link's own sale price independently of the default", async () => {
    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
    })

    expect(result.product).toBe(owner)
    expect(result.accompaniments.map((item) => item.accompanimentProductName)).toEqual([
      'Apple Syrup',
      'Biscuit',
      'Zest',
    ])
    expect(result.accompaniments[0]).toMatchObject({
      brandId: 'brand-main',
      brandName: 'Main Brand',
      unitCost: 5,
      estimatedCost: 1.25,
      salePrice: 2.75,
    })
    expect(result.accompaniments[1]).toMatchObject({
      unitCost: 2.5,
      estimatedCost: 5,
      salePrice: 4.5,
    })
    expect(result.accompaniments[2]).not.toHaveProperty('unitCost')
    expect(result.accompaniments[2]).not.toHaveProperty('estimatedCost')
    expect(result.accompaniments[2]).toHaveProperty('salePrice', null)
  })

  it('allows operators to read accompaniments and hides non-Portion or missing owners', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId, profile: UserProfile.Operator },
        productId: owner.id,
      }),
    ).resolves.toMatchObject({ product: { id: owner.id } })

    scope.productsRepository.findById.mockResolvedValue(single)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: single.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: 'foreign-owner',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('lists global rows first and then individual rows by name, flagging links on other Portions', async () => {
    const globalZest = { ...unavailableLink, globalAccompanimentId: 'global-1' }
    const globalBiscuit = { ...singleLink, globalAccompanimentId: 'global-2' }
    scope.globalAccompanimentsRepository.findById.mockImplementation(async (_, id) =>
      id === 'global-1'
        ? GlobalAccompanimentFaker.fake({
            id,
            establishmentId,
            accompanimentPrice: 6,
          })
        : GlobalAccompanimentFaker.fake({
            id,
            establishmentId,
            accompanimentPrice: undefined,
          }),
    )
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      brandLink,
      globalZest,
      globalBiscuit,
    ])
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockImplementation(
      async (_, accompanimentProductId) =>
        accompanimentProductId === byBrand.id ? 3 : 1,
    )

    const result = await useCase.execute({
      actor: { id: 'operator-1', establishmentId, profile: UserProfile.Operator },
      productId: owner.id,
    })

    expect(
      result.accompaniments.map(({ accompanimentProductName, isGlobal }) => [
        accompanimentProductName,
        isGlobal,
      ]),
    ).toEqual([
      ['Biscuit', true],
      ['Zest', true],
      ['Apple Syrup', false],
    ])
    expect(result.accompaniments.map((item) => item.hasOtherPortionLinks)).toEqual([
      false,
      false,
      true,
    ])
    // A global row has no price of its own: it shows the global's, even over a stale own price.
    expect(result.accompaniments.map((item) => item.salePrice)).toEqual([null, 6, 2.75])
    expect(scope.globalAccompanimentsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      'global-1',
    )
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).toHaveBeenCalledTimes(1)
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, byBrand.id)
  })

  it.each([
    { name: 'missing', global: undefined },
    {
      name: 'foreign',
      global: GlobalAccompanimentFaker.fake({
        id: 'global-1',
        establishmentId: 'establishment-2',
        accompanimentPrice: 6,
      }),
    },
  ])('fails when the global a row references is $name', async ({ global }) => {
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      { ...singleLink, globalAccompanimentId: 'global-1' },
    ])
    scope.globalAccompanimentsRepository.findById.mockResolvedValue(global)

    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
      }),
    ).rejects.toThrow(new NotFoundError('Acompanhamento global não encontrado.'))
  })

  it('does not read any global for individual rows', async () => {
    await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
    })

    expect(scope.globalAccompanimentsRepository.findById).not.toHaveBeenCalled()
  })

  it('does not flag an individual accompaniment linked only to this Portion', async () => {
    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
    })

    expect(result.accompaniments.every((item) => !item.isGlobal)).toBe(true)
    expect(result.accompaniments.every((item) => !item.hasOtherPortionLinks)).toBe(true)
  })

  it('orders accompaniments with the same name by product id', async () => {
    const twin = ProductFaker.fake({
      id: 'a-twin',
      establishmentId,
      name: 'Biscuit',
      categories: [ProductCategory.Accompaniment],
      accompanimentPrice: 1,
    })
    const twinLink = ProductAccompanimentFaker.fake({
      id: 'link-twin',
      establishmentId,
      productId: owner.id,
      accompanimentProductId: twin.id,
      accompanimentTypeId: 'type-1',
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === twin.id ? twin : id === owner.id ? owner : single,
    )
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      singleLink,
      twinLink,
    ])

    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
    })

    expect(result.accompaniments.map((item) => item.accompanimentProductId)).toEqual([
      twin.id,
      single.id,
    ])
  })
})
