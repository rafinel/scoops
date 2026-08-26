import { describe, expect, it } from 'vitest'
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'

import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { GetAffectedProductSalesConfigurationsUseCase } from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'

describe('GetAffectedProductSalesConfigurationsUseCase', () => {
  it('builds a complete tenant-qualified current snapshot', async () => {
    const scope: DeepMockProxy<MrpDatabaseScope> = mockDeep<MrpDatabaseScope>()
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
})
