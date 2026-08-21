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
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { ConflictError } from '#shared/domain/errors/index.ts'
import { RemoveProductBrandUseCase } from '#mrp/use-cases/remove-product-brand-use-case.ts'

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

describe('Remove Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RemoveProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    useCase = new RemoveProductBrandUseCase(database)
  })
  it('requires replacement before removing main brand', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(2)
    await expect(
      useCase.execute({ actor, productId: 'p1', brandId: 'b1' }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.brandsRepository.remove).not.toHaveBeenCalled()
  })
  it('removes a non-main or last brand', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.remove).toHaveBeenCalledWith('p1', 'b1')
    scope.brandsRepository.findById.mockResolvedValue({ ...brand, isPrimary: false })
    scope.brandsRepository.countByProductId.mockResolvedValue(2)
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.remove).toHaveBeenCalledTimes(2)
  })
})
