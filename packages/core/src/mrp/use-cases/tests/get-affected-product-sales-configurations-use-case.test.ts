import { describe, expect, it } from 'vitest'
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'

import {
  AccompanimentTypeFaker,
  BrandFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ResaleConfigurationFaker,
  ProductSizeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { GetAffectedProductSalesConfigurationsUseCase } from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import { NotFoundError } from '#shared/domain/errors/index.ts'

describe('Get Affected Product Sales Configurations Use Case', () => {
  it('builds a complete tenant-qualified current snapshot', async () => {
    const scope: DeepMockProxy<MrpDatabaseRepositories> =
      mockDeep<MrpDatabaseRepositories>()
    const updatedAt = new Date('2026-01-01T00:00:00.000Z')
    const product = ProductFaker.fake({
      id: 'p1',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      updatedAt,
    })
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([])
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([])
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([])

    const snapshots = await new GetAffectedProductSalesConfigurationsUseCase().execute({
      scope,
      establishmentId: 'e1',
      productId: 'p1',
    })

    expect(snapshots).toEqual([
      {
        establishmentId: 'e1',
        productId: 'p1',
        name: product.name,
        categories: [ProductCategory.Portion],
        status: product.status,
        stockControl: ProductStockControl.Single,
        sizes: [],
        resaleConfigurations: [],
        updatedAt,
      },
    ])
  })

  it('publishes the saved Product price once and leaves unpriced legacy links unavailable', async () => {
    const scope: DeepMockProxy<MrpDatabaseRepositories> =
      mockDeep<MrpDatabaseRepositories>()
    const ownerUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
    const accompanimentUpdatedAt = new Date('2026-01-02T00:00:00.000Z')
    const owner = ProductFaker.fake({
      id: 'portion-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      updatedAt: ownerUpdatedAt,
    })
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Accompaniment],
      currentUnitCost: 0.11,
      accompanimentPrice: 2.75,
      updatedAt: accompanimentUpdatedAt,
    })
    const size = ProductSizeFaker.fake({
      id: 'size-1',
      establishmentId: 'e1',
      productId: owner.id,
      quantity: 1,
      updatedAt: ownerUpdatedAt,
    })
    const type = AccompanimentTypeFaker.fake({
      id: 'type-1',
      establishmentId: 'e1',
      updatedAt: ownerUpdatedAt,
    })
    const link = ProductAccompanimentFaker.fake({
      id: 'link-1',
      establishmentId: 'e1',
      productId: owner.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 9,
      updatedAt: ownerUpdatedAt,
    })
    scope.productsRepository.findById.mockImplementation(async (_establishment, id) =>
      id === owner.id ? owner : accompaniment,
    )
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([link])
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([])

    const useCase = new GetAffectedProductSalesConfigurationsUseCase()
    const savedSnapshots = await useCase.execute({
      scope,
      establishmentId: 'e1',
      productId: owner.id,
      affectedProductIds: [owner.id],
    })
    expect(savedSnapshots[0]?.sizes[0]?.accompaniments[0]).toMatchObject({
      basePrice: 2.75,
      isActive: true,
    })
    expect(savedSnapshots[0]?.updatedAt).toEqual(accompanimentUpdatedAt)

    scope.productsRepository.findById.mockImplementation(async (_establishment, id) =>
      id === owner.id ? owner : { ...accompaniment, accompanimentPrice: undefined },
    )
    const unpricedSnapshots = await useCase.execute({
      scope,
      establishmentId: 'e1',
      productId: owner.id,
      affectedProductIds: [owner.id],
    })
    expect(unpricedSnapshots[0]?.sizes[0]?.accompaniments[0]).toMatchObject({
      basePrice: 0,
      isActive: false,
    })
  })

  it('discovers same-tenant inverse owners once when no affected ids are supplied', async () => {
    const scope: DeepMockProxy<MrpDatabaseRepositories> =
      mockDeep<MrpDatabaseRepositories>()
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Accompaniment],
    })
    const owner = ProductFaker.fake({
      id: 'portion-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
    })
    const excludedOwner = ProductFaker.fake({
      id: 'portion-foreign-link',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
    })
    const ownersById = new Map([
      [accompaniment.id, accompaniment],
      [owner.id, owner],
      [excludedOwner.id, excludedOwner],
    ])
    const inverseLinks = [
      ProductAccompanimentFaker.fake({
        id: 'link-1',
        establishmentId: 'e1',
        productId: owner.id,
        accompanimentProductId: accompaniment.id,
      }),
      ProductAccompanimentFaker.fake({
        id: 'link-2',
        establishmentId: 'e1',
        productId: owner.id,
        accompanimentProductId: accompaniment.id,
      }),
      ProductAccompanimentFaker.fake({
        id: 'link-foreign',
        establishmentId: 'e2',
        productId: excludedOwner.id,
        accompanimentProductId: accompaniment.id,
      }),
      ProductAccompanimentFaker.fake({
        id: 'link-self',
        establishmentId: 'e1',
        productId: accompaniment.id,
        accompanimentProductId: accompaniment.id,
      }),
    ]
    scope.productsRepository.findById.mockImplementation(async (_establishment, id) =>
      ownersById.get(id),
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      inverseLinks,
    )
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([])
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([])
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([])

    const snapshots = await new GetAffectedProductSalesConfigurationsUseCase().execute({
      scope,
      establishmentId: 'e1',
      productId: accompaniment.id,
    })

    expect(snapshots.map(({ productId }) => productId)).toEqual([
      accompaniment.id,
      owner.id,
    ])
    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledExactlyOnceWith('e1', accompaniment.id)
  })

  it('filters foreign child rows and maps by-brand resale names into the snapshot', async () => {
    const scope: DeepMockProxy<MrpDatabaseRepositories> =
      mockDeep<MrpDatabaseRepositories>()
    const ownerUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
    const sizeUpdatedAt = new Date('2026-01-02T00:00:00.000Z')
    const linkUpdatedAt = new Date('2026-01-03T00:00:00.000Z')
    const typeUpdatedAt = new Date('2026-01-04T00:00:00.000Z')
    const accompanimentUpdatedAt = new Date('2026-01-05T00:00:00.000Z')
    const configurationUpdatedAt = new Date('2026-01-06T00:00:00.000Z')
    const brandUpdatedAt = new Date('2026-01-07T00:00:00.000Z')
    const owner = ProductFaker.fake({
      id: 'portion-1',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion, ProductCategory.Resale],
      stockControl: ProductStockControl.ByBrand,
      updatedAt: ownerUpdatedAt,
    })
    const otherOwner = ProductFaker.fake({
      id: 'portion-2',
      establishmentId: 'e1',
      categories: [ProductCategory.Portion],
    })
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId: 'e1',
      name: 'Granola',
      categories: [ProductCategory.Accompaniment],
      status: ProductStatus.Active,
      accompanimentPrice: 0,
      updatedAt: accompanimentUpdatedAt,
    })
    const type = AccompanimentTypeFaker.fake({
      id: 'type-1',
      establishmentId: 'e1',
      name: 'Cobertura',
      updatedAt: typeUpdatedAt,
    })
    const validSize = ProductSizeFaker.fake({
      id: 'size-1',
      establishmentId: 'e1',
      productId: owner.id,
      name: 'Médio',
      quantity: 1,
      price: 12,
      updatedAt: sizeUpdatedAt,
    })
    const childSizes = [
      validSize,
      ProductSizeFaker.fake({
        id: 'size-foreign-establishment',
        establishmentId: 'e2',
        productId: owner.id,
        updatedAt: new Date('2025-12-01T00:00:00.000Z'),
      }),
      ProductSizeFaker.fake({
        id: 'size-other-product',
        establishmentId: 'e1',
        productId: otherOwner.id,
        updatedAt: new Date('2025-12-02T00:00:00.000Z'),
      }),
    ]
    const validLink = ProductAccompanimentFaker.fake({
      id: 'link-1',
      establishmentId: 'e1',
      productId: owner.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 9,
      updatedAt: linkUpdatedAt,
    })
    const childLinks = [
      validLink,
      ProductAccompanimentFaker.fake({
        id: 'link-foreign-establishment',
        establishmentId: 'e2',
        productId: owner.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        updatedAt: new Date('2025-12-03T00:00:00.000Z'),
      }),
      ProductAccompanimentFaker.fake({
        id: 'link-other-product',
        establishmentId: 'e1',
        productId: otherOwner.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        updatedAt: new Date('2025-12-04T00:00:00.000Z'),
      }),
    ]
    const brand = BrandFaker.fake({
      id: 'brand-1',
      productId: owner.id,
      name: 'Mãe Terra',
      updatedAt: brandUpdatedAt,
    })
    const resaleConfigurations = [
      ResaleConfigurationFaker.fake({
        id: 'resale-1',
        establishmentId: 'e1',
        productId: owner.id,
        brandId: brand.id,
        price: 18,
        isActive: true,
        updatedAt: configurationUpdatedAt,
      }),
      ResaleConfigurationFaker.fake({
        id: 'resale-unknown-brand',
        establishmentId: 'e1',
        productId: owner.id,
        brandId: 'brand-unknown',
        price: 19,
        isActive: false,
      }),
      ResaleConfigurationFaker.fake({
        id: 'resale-unbranded',
        establishmentId: 'e1',
        productId: owner.id,
        price: 20,
        isActive: true,
      }),
      ResaleConfigurationFaker.fake({
        id: 'resale-foreign-establishment',
        establishmentId: 'e2',
        productId: owner.id,
        price: 21,
        updatedAt: new Date('2025-12-05T00:00:00.000Z'),
      }),
      ResaleConfigurationFaker.fake({
        id: 'resale-other-product',
        establishmentId: 'e1',
        productId: otherOwner.id,
        price: 22,
        updatedAt: new Date('2025-12-06T00:00:00.000Z'),
      }),
    ]
    scope.productsRepository.findById.mockImplementation(async (_establishment, id) =>
      id === owner.id ? owner : accompaniment,
    )
    scope.productSizesRepository.findManyByProductId.mockResolvedValue(childSizes)
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue(
      childLinks,
    )
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue(
      resaleConfigurations,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand])

    const [snapshot] = await new GetAffectedProductSalesConfigurationsUseCase().execute({
      scope,
      establishmentId: 'e1',
      productId: owner.id,
      affectedProductIds: [owner.id],
    })

    expect(snapshot?.sizes).toEqual([
      {
        sizeId: validSize.id,
        name: validSize.name,
        price: validSize.price,
        isActive: validSize.isActive,
        accompaniments: [
          {
            accompanimentId: validLink.id,
            productId: accompaniment.id,
            name: accompaniment.name,
            type: type.name,
            basePrice: 0,
            isActive: true,
          },
        ],
      },
    ])
    expect(snapshot?.resaleConfigurations).toEqual([
      {
        brandId: brand.id,
        brandName: brand.name,
        price: 18,
        isActive: true,
      },
      {
        brandId: 'brand-unknown',
        price: 19,
        isActive: false,
      },
      { price: 20, isActive: true },
    ])
    expect(snapshot?.updatedAt).toEqual(brandUpdatedAt)
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledExactlyOnceWith(
      'e1',
      owner.id,
    )
  })

  it('omits a requested product missing from the establishment', async () => {
    const useCase = new GetAffectedProductSalesConfigurationsUseCase()

    for (const product of [
      undefined,
      ProductFaker.fake({ id: 'portion-foreign', establishmentId: 'e2' }),
    ]) {
      const scope: DeepMockProxy<MrpDatabaseRepositories> =
        mockDeep<MrpDatabaseRepositories>()
      scope.productsRepository.findById.mockResolvedValue(product)

      await expect(
        useCase.execute({
          scope,
          establishmentId: 'e1',
          productId: 'portion-foreign',
          affectedProductIds: ['portion-foreign'],
        }),
      ).resolves.toEqual([])
      expect(scope.productSizesRepository.findManyByProductId).not.toHaveBeenCalled()
    }
  })

  it.each([
    { name: 'a missing accompaniment product', productExists: false, typeExists: true },
    {
      name: 'an accompaniment product from another establishment',
      productExists: true,
      typeExists: true,
      foreignProduct: true,
    },
    { name: 'a missing accompaniment type', productExists: true, typeExists: false },
    {
      name: 'an accompaniment type from another establishment',
      productExists: true,
      typeExists: true,
      foreignType: true,
    },
  ])(
    'rejects a dangling relationship when $name',
    async ({ productExists, typeExists, foreignProduct, foreignType }) => {
      const scope: DeepMockProxy<MrpDatabaseRepositories> =
        mockDeep<MrpDatabaseRepositories>()
      const owner = ProductFaker.fake({ id: 'portion-1', establishmentId: 'e1' })
      const accompaniment = ProductFaker.fake({
        id: 'accompaniment-1',
        establishmentId: foreignProduct ? 'e2' : 'e1',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 2.5,
      })
      const type = AccompanimentTypeFaker.fake({
        id: 'type-1',
        establishmentId: foreignType ? 'e2' : 'e1',
      })
      const size = ProductSizeFaker.fake({
        id: 'size-1',
        establishmentId: 'e1',
        productId: owner.id,
      })
      const link = ProductAccompanimentFaker.fake({
        id: 'link-1',
        establishmentId: 'e1',
        productId: owner.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
      })
      scope.productsRepository.findById.mockImplementation(async (_establishment, id) =>
        id === owner.id ? owner : productExists ? accompaniment : undefined,
      )
      scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([link])
      scope.accompanimentTypesRepository.findById.mockResolvedValue(
        typeExists ? type : undefined,
      )
      scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([])

      const snapshots = new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId: 'e1',
        productId: owner.id,
        affectedProductIds: [owner.id],
      })
      await expect(snapshots).rejects.toBeInstanceOf(NotFoundError)
      await expect(snapshots).rejects.toMatchObject({
        message: 'A configuração de acompanhamento não foi encontrada.',
      })
      expect(scope.accompanimentTypesRepository.findById).toHaveBeenCalledWith(
        'e1',
        type.id,
      )
    },
  )

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
    'uses a safe base price and activity state for $name values',
    async ({ price, status, expectedPrice, expectedActive }) => {
      const scope: DeepMockProxy<MrpDatabaseRepositories> =
        mockDeep<MrpDatabaseRepositories>()
      const owner = ProductFaker.fake({ id: 'portion-1', establishmentId: 'e1' })
      const accompaniment = ProductFaker.fake({
        id: 'accompaniment-1',
        establishmentId: 'e1',
        categories: [ProductCategory.Accompaniment],
        status: status ?? ProductStatus.Active,
        accompanimentPrice: price,
      })
      const type = AccompanimentTypeFaker.fake({ id: 'type-1', establishmentId: 'e1' })
      const size = ProductSizeFaker.fake({
        id: 'size-1',
        establishmentId: 'e1',
        productId: owner.id,
      })
      const link = ProductAccompanimentFaker.fake({
        id: 'link-1',
        establishmentId: 'e1',
        productId: owner.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
      })
      scope.productsRepository.findById.mockImplementation(async (_establishment, id) =>
        id === owner.id ? owner : accompaniment,
      )
      scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
      scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([link])
      scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
      scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([])

      const [snapshot] = await new GetAffectedProductSalesConfigurationsUseCase().execute(
        {
          scope,
          establishmentId: 'e1',
          productId: owner.id,
          affectedProductIds: [owner.id],
        },
      )

      expect(snapshot?.sizes[0]?.accompaniments).toEqual([
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
})
