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
import { ConflictError, NotFoundError } from '#shared/domain/errors/index.ts'
import { UpdateProductBrandUseCase } from '#mrp/use-cases/update-product-brand-use-case.ts'

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
  isPrimary: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Update Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: UpdateProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    scope.brandsRepository.findByName.mockResolvedValue(undefined)
    scope.brandsRepository.replace.mockResolvedValue({
      ...brand,
      name: 'B',
      packageQuantity: 4,
      packagePrice: 12,
    })
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 7,
      situation: StockSituation.Normal,
    })
    useCase = new UpdateProductBrandUseCase(database)
  })
  it('updates configuration without changing stock', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        brandId: 'b1',
        input: { name: ' B ', packageQuantity: 4, packageValue: 12 },
      }),
    ).resolves.toMatchObject({ stockQuantity: 7, unitPrice: 3 })
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
  })
  it('rejects duplicates and foreign brands', async () => {
    scope.brandsRepository.findByName.mockResolvedValue({ ...brand, id: 'b2' })
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        brandId: 'b1',
        input: { name: 'A', packageQuantity: 1, packageValue: 0 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    scope.brandsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        brandId: 'foreign',
        input: { name: 'A', packageQuantity: 1, packageValue: 0 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
