import type {
  AccompanimentType,
  Brand,
  Product,
  ProductAccompaniment,
  ProductSize,
  ResaleConfiguration,
} from '@scoops/core/mrp/domain/entities'
import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import { ServiceUnavailableError } from '@scoops/core/shared/domain/errors'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MrpSalesCatalogProvider } from '@/pdv/provision/mrp/mrp-sales-catalog-provider'

const ESTABLISHMENT_ID = '41000000-0000-0000-0000-000000000001'
const PORTION_ID = '41000000-0000-0000-0000-000000000010'
const RESALE_ID = '41000000-0000-0000-0000-000000000011'
const ACCOMPANIMENT_ID = '41000000-0000-0000-0000-000000000012'
const SIZE_ID = '41000000-0000-0000-0000-000000000013'
const LINK_ID = '41000000-0000-0000-0000-000000000014'
const TYPE_ID = '41000000-0000-0000-0000-000000000015'
const BRAND_ID = '41000000-0000-0000-0000-000000000016'

type Repositories = {
  products: ProductsRepository
  sizes: ProductSizesRepository
  accompaniments: ProductAccompanimentsRepository
  types: AccompanimentTypesRepository
  resaleConfigurations: ResaleConfigurationsRepository
  brands: BrandsRepository
  balances: StockBalancesRepository
}

describe('MRP Sales Catalog Provider', () => {
  let repositories: Repositories
  let provider: MrpSalesCatalogProvider

  beforeEach(() => {
    repositories = {
      products: {
        findById: vi.fn(),
        findMany: vi.fn(),
      } as unknown as ProductsRepository,
      sizes: {
        findManyByProductId: vi.fn().mockResolvedValue([]),
      } as unknown as ProductSizesRepository,
      accompaniments: {
        findManyByProductId: vi.fn().mockResolvedValue([]),
      } as unknown as ProductAccompanimentsRepository,
      types: {
        findById: vi.fn().mockResolvedValue(undefined),
      } as unknown as AccompanimentTypesRepository,
      resaleConfigurations: {
        findManyByProductId: vi.fn().mockResolvedValue([]),
      } as unknown as ResaleConfigurationsRepository,
      brands: {
        findManyByProductId: vi.fn().mockResolvedValue([]),
      } as unknown as BrandsRepository,
      balances: {
        findManyByProductId: vi.fn().mockResolvedValue([]),
      } as unknown as StockBalancesRepository,
    }
    provider = new MrpSalesCatalogProvider(
      repositories.products,
      repositories.sizes,
      repositories.accompaniments,
      repositories.types,
      repositories.resaleConfigurations,
      repositories.brands,
      repositories.balances,
    )
  })

  it('maps Portion and by-brand Resale configurations while preserving stock flags', async () => {
    const portion = makeProduct({
      id: PORTION_ID,
      name: 'Portion Sundae',
      categories: [ProductCategory.Portion],
    })
    const resale = makeProduct({
      id: RESALE_ID,
      name: 'Resale Cup',
      categories: [ProductCategory.Resale],
      stockControl: ProductStockControl.ByBrand,
    })
    const accompaniment = makeProduct({
      id: ACCOMPANIMENT_ID,
      name: 'Cookie',
      categories: [ProductCategory.Accompaniment],
    })
    const size = makeSize()
    const link = makeAccompaniment()
    const type = makeAccompanimentType()
    const brand = makeBrand()
    const configuration = makeResaleConfiguration()
    const accompanimentWithCost = {
      ...accompaniment,
      currentUnitCost: 3,
    }

    vi.mocked(repositories.products.findById).mockImplementation(
      async (_establishmentId, productId) =>
        ({
          [PORTION_ID]: portion,
          [RESALE_ID]: resale,
          [ACCOMPANIMENT_ID]: accompanimentWithCost,
        })[productId],
    )
    vi.mocked(repositories.sizes.findManyByProductId).mockResolvedValue([size])
    vi.mocked(repositories.accompaniments.findManyByProductId).mockResolvedValue([link])
    vi.mocked(repositories.types.findById).mockResolvedValue(type)
    vi.mocked(repositories.resaleConfigurations.findManyByProductId).mockImplementation(
      async (_establishmentId, productId) =>
        productId === RESALE_ID ? [configuration] : [],
    )
    vi.mocked(repositories.brands.findManyByProductId).mockResolvedValue([brand])
    vi.mocked(repositories.balances.findManyByProductId).mockImplementation(
      async (_establishmentId, productId) => [
        {
          productId,
          ...(productId === RESALE_ID ? { brandId: BRAND_ID } : {}),
          quantity: 10,
          situation: 'normal',
        },
      ],
    )

    const products = await provider.findByProductIds(ESTABLISHMENT_ID, [
      RESALE_ID,
      PORTION_ID,
    ])

    expect(products).toHaveLength(2)
    expect(products[0]).toMatchObject({
      productId: RESALE_ID,
      kind: 'resale',
      isActive: true,
      isAvailable: true,
      resaleBrands: [
        {
          brandId: BRAND_ID,
          basePrice: 12,
          isActive: true,
          isAvailable: true,
        },
      ],
    })
    expect(products[1]).toMatchObject({
      productId: PORTION_ID,
      kind: 'portion',
      sizes: [
        {
          sizeId: SIZE_ID,
          basePrice: 8,
          isActive: true,
          isAvailable: true,
          accompaniments: [
            {
              accompanimentId: LINK_ID,
              name: 'Cookie',
              type: 'Toppings',
              basePrice: 3,
              isActive: true,
              isAvailable: true,
            },
          ],
        },
      ],
    })
  })

  it('loads all matching product pages for Combo name filtering', async () => {
    const firstPage = new PaginationResponse(
      [{ product: makeProduct({ id: PORTION_ID }) }],
      1,
      1,
      2,
      2,
    ) as never
    const secondPage = new PaginationResponse(
      [{ product: makeProduct({ id: RESALE_ID }) }],
      2,
      1,
      2,
      2,
    ) as never
    vi.mocked(repositories.products.findMany)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage)

    await expect(
      provider.findProductIdsByName(ESTABLISHMENT_ID, 'sundae'),
    ).resolves.toEqual([PORTION_ID, RESALE_ID])
    expect(repositories.products.findMany).toHaveBeenCalledTimes(2)
  })

  it('maps a single-stock resale configuration to the default catalog price', async () => {
    const resale = makeProduct({
      id: RESALE_ID,
      name: 'Resale Cup',
      categories: [ProductCategory.Resale],
      stockControl: ProductStockControl.Single,
    })
    const configuration = makeResaleConfiguration({
      brandId: undefined,
      price: 4.5,
    })

    vi.mocked(repositories.products.findById).mockResolvedValue(resale)
    vi.mocked(repositories.resaleConfigurations.findManyByProductId).mockResolvedValue([
      configuration,
    ])
    vi.mocked(repositories.balances.findManyByProductId).mockResolvedValue([
      {
        productId: RESALE_ID,
        quantity: 500,
        situation: 'normal',
      },
    ])

    await expect(
      provider.findByProductId(ESTABLISHMENT_ID, RESALE_ID),
    ).resolves.toMatchObject({
      productId: RESALE_ID,
      kind: 'resale',
      isActive: true,
      isAvailable: true,
      resalePrice: 4.5,
      resaleBrands: [],
    })
  })

  it('translates MRP failures without exposing provider details', async () => {
    vi.mocked(repositories.products.findById).mockRejectedValue(
      new Error('database connection string'),
    )

    await expect(
      provider.findByProductId(ESTABLISHMENT_ID, PORTION_ID),
    ).rejects.toBeInstanceOf(ServiceUnavailableError)
    await expect(
      provider.findByProductId(ESTABLISHMENT_ID, PORTION_ID),
    ).rejects.not.toThrow('database connection string')
  })
})

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: PORTION_ID,
    establishmentId: ESTABLISHMENT_ID,
    name: 'Portion Sundae',
    unit: 'un',
    categories: [ProductCategory.Portion],
    stockControl: ProductStockControl.Single,
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function makeSize(overrides: Partial<ProductSize> = {}): ProductSize {
  return {
    id: SIZE_ID,
    establishmentId: ESTABLISHMENT_ID,
    productId: PORTION_ID,
    name: 'Regular',
    quantity: 1,
    price: 8,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function makeAccompaniment(
  overrides: Partial<ProductAccompaniment> = {},
): ProductAccompaniment {
  return {
    id: LINK_ID,
    establishmentId: ESTABLISHMENT_ID,
    productId: PORTION_ID,
    accompanimentProductId: ACCOMPANIMENT_ID,
    accompanimentTypeId: TYPE_ID,
    quantityPerPortion: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function makeAccompanimentType(
  overrides: Partial<AccompanimentType> = {},
): AccompanimentType {
  return {
    id: TYPE_ID,
    establishmentId: ESTABLISHMENT_ID,
    name: 'Toppings',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function makeBrand(overrides: Partial<Brand> = {}): Brand {
  return {
    id: BRAND_ID,
    productId: RESALE_ID,
    name: 'Brand A',
    unit: 'un',
    packageQuantity: 1,
    packagePrice: 12,
    isPrimary: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function makeResaleConfiguration(
  overrides: Partial<ResaleConfiguration> = {},
): ResaleConfiguration {
  return {
    id: '41000000-0000-0000-0000-000000000018',
    establishmentId: ESTABLISHMENT_ID,
    productId: RESALE_ID,
    brandId: BRAND_ID,
    price: 12,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}
