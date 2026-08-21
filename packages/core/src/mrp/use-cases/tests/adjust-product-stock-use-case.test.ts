import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
  StockAdjustmentType,
  StockSituation,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { BadRequestError, NotFoundError } from '#shared/domain/errors/index.ts'
import { AdjustProductStockUseCase } from '#mrp/use-cases/adjust-product-stock-use-case.ts'

const actor = {
  id: 'u1',
  name: 'Manager',
  establishmentId: 'e1',
  profile: UserProfile.Manager,
}
const product: Product = {
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  status: ProductStatus.Active,
  allowNegativeStock: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const brand: Brand = {
  id: 'b1',
  productId: 'p1',
  name: 'A',
  packageQuantity: 2,
  packagePrice: 10,
  isPrimary: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Adjust Product Stock Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let datetime: MockProxy<DatetimeProvider>
  let useCase: AdjustProductStockUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    datetime = mock()
    datetime.now.mockReturnValue(new Date('2026-01-01T00:00:00Z'))
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.stockBalancesRepository.add.mockResolvedValue({
      productId: 'p1',
      quantity: 8,
      situation: StockSituation.Normal,
    })
    useCase = new AdjustProductStockUseCase(database, datetime)
  })
  it('atomically applies entry and write-off and records one transaction', async () => {
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { type: StockAdjustmentType.Entry, quantity: 3 },
    })
    expect(scope.stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: 'p1' },
      3,
      0,
    )
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entry',
        quantity: 3,
        balanceAfter: 8,
        performedByName: 'Manager',
      }),
    )
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { type: StockAdjustmentType.WriteOff, quantity: 2 },
    })
    expect(scope.stockBalancesRepository.add).toHaveBeenLastCalledWith(
      { productId: 'p1' },
      -2,
      0,
    )
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledTimes(2)
  })
  it('validates target and negative-stock policy', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { type: StockAdjustmentType.Entry, quantity: 0 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
    })
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { type: StockAdjustmentType.Entry, quantity: 1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.brandsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { brandId: 'foreign', type: StockAdjustmentType.Entry, quantity: 1 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
      allowNegativeStock: true,
    })
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { brandId: 'b1', type: StockAdjustmentType.WriteOff, quantity: 20 },
    })
    expect(scope.stockBalancesRepository.add).toHaveBeenLastCalledWith(
      { productId: 'p1', brandId: 'b1' },
      -20,
      undefined,
    )
  })
})
