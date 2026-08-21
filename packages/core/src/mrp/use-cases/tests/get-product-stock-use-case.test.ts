import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
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
import type {
  BrandsRepository,
  ProductsRepository,
  StockBalancesRepository,
} from '#mrp/interfaces/index.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { GetProductStockUseCase } from '#mrp/use-cases/get-product-stock-use-case.ts'

const product: Product = {
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  status: ProductStatus.Active,
  idealStock: 10,
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
const actor = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Get Product Stock Use Case', () => {
  let products: MockProxy<ProductsRepository>
  let brands: MockProxy<BrandsRepository>
  let balances: MockProxy<StockBalancesRepository>
  let useCase: GetProductStockUseCase
  beforeEach(() => {
    products = mock()
    brands = mock()
    balances = mock()
    products.findById.mockResolvedValue(product)
    useCase = new GetProductStockUseCase(products, brands, balances)
  })

  it('returns single and by-brand stock details', async () => {
    balances.findManyByProductId.mockResolvedValue([
      { productId: 'p1', quantity: 0, situation: StockSituation.Low },
    ])
    await expect(useCase.execute({ actor, productId: 'p1' })).resolves.toMatchObject({
      stockQuantity: 0,
      stockSituation: StockSituation.Low,
      brands: [],
    })
    products.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
      idealStock: undefined,
    })
    brands.findManyByProductId.mockResolvedValue([brand])
    balances.findManyByProductId.mockResolvedValue([
      { productId: 'p1', brandId: 'b1', quantity: 4, situation: StockSituation.Normal },
    ])
    await expect(useCase.execute({ actor, productId: 'p1' })).resolves.toMatchObject({
      stockQuantity: 4,
      stockSituation: StockSituation.Normal,
      brands: [{ stockQuantity: 4, unitPrice: 5 }],
    })
  })

  it('hides foreign and missing products and rejects non-managers', async () => {
    products.findById.mockResolvedValue(undefined)
    await expect(useCase.execute({ actor, productId: 'foreign' })).rejects.toBeInstanceOf(
      NotFoundError,
    )
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: 'p1',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(products.findById).toHaveBeenCalledWith('e1', 'foreign')
  })
})
