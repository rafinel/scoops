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
import { NotFoundError } from '#shared/domain/errors/index.ts'
import { SetPrimaryProductBrandUseCase } from '#mrp/use-cases/set-primary-product-brand-use-case.ts'

const actor = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }
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
  isPrimary: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Set Primary Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: SetPrimaryProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    scope.brandsRepository.setPrimary.mockResolvedValue({ ...brand, isPrimary: true })
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 2,
      situation: StockSituation.Normal,
    })
    useCase = new SetPrimaryProductBrandUseCase(database)
  })
  it('exchanges one main brand atomically and is idempotent', async () => {
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.setPrimary).toHaveBeenCalledTimes(1)
    scope.brandsRepository.findById.mockResolvedValue({ ...brand, isPrimary: true })
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.setPrimary).toHaveBeenCalledTimes(1)
  })
  it('hides foreign or missing brands', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: 'foreign', brandId: 'b1' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
