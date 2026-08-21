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
  StockSituation,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { BadRequestError, ConflictError } from '#shared/domain/errors/index.ts'
import { RegisterProductBrandUseCase } from '#mrp/use-cases/register-product-brand-use-case.ts'

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
  stockControl: ProductStockControl.ByBrand,
  status: ProductStatus.Active,
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

describe('Register Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let datetime: MockProxy<DatetimeProvider>
  let useCase: RegisterProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    datetime = mock()
    datetime.now.mockReturnValue(new Date('2026-01-01T00:00:00Z'))
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findByName.mockResolvedValue(undefined)
    scope.brandsRepository.countByProductId.mockResolvedValue(0)
    scope.brandsRepository.add.mockResolvedValue(brand)
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 0,
      situation: StockSituation.Normal,
    })
    scope.stockBalancesRepository.add.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 3,
      situation: StockSituation.Normal,
    })
    useCase = new RegisterProductBrandUseCase(database, datetime)
  })

  it('registers first brand as main with initial balance and ledger row', async () => {
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { name: ' A ', packageQuantity: 2, packageValue: 10, initialQuantity: 3 },
    })
    expect(scope.brandsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', isPrimary: true }),
    )
    expect(scope.stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: 'p1', brandId: 'b1' },
      3,
    )
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 3,
        balanceAfter: 3,
        performedByName: 'Manager',
      }),
    )
  })

  it('creates no ledger row for zero and rejects invalid or duplicate brand', async () => {
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { name: 'A', packageQuantity: 2, packageValue: 0, initialQuantity: 0 },
    })
    expect(scope.stockTransactionsRepository.add).not.toHaveBeenCalled()
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { name: '', packageQuantity: 0, packageValue: -1, initialQuantity: -1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.brandsRepository.findByName.mockResolvedValue(brand)
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { name: 'A', packageQuantity: 1, packageValue: 0, initialQuantity: 0 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })
})
