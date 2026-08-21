import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type {
  ProductsRepository,
  StockTransactionsRepository,
} from '#mrp/interfaces/index.ts'
import { BadRequestError, NotFoundError } from '#shared/domain/errors/index.ts'
import { ListStockTransactionsUseCase } from '#mrp/use-cases/list-stock-transactions-use-case.ts'

const actor = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }
const product: Product = {
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  status: ProductStatus.Active,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('List Stock Transactions Use Case', () => {
  let products: MockProxy<ProductsRepository>
  let transactions: MockProxy<StockTransactionsRepository>
  let useCase: ListStockTransactionsUseCase
  beforeEach(() => {
    products = mock()
    transactions = mock()
    products.findById.mockResolvedValue(product)
    transactions.findPage.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 })
    useCase = new ListStockTransactionsUseCase(products, transactions)
  })
  it('returns a tenant-qualified filtered page', async () => {
    const params = {
      page: 1,
      limit: 20,
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    }
    await useCase.execute({ actor, productId: 'p1', params })
    expect(products.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(transactions.findPage).toHaveBeenCalledWith('e1', 'p1', params)
  })
  it('rejects invalid paging or dates and hides missing products', async () => {
    await expect(
      useCase.execute({ actor, productId: 'p1', params: { page: 0, limit: 101 } }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        params: {
          page: 1,
          limit: 20,
          from: new Date('2026-02-01'),
          to: new Date('2026-01-01'),
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    products.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: 'foreign', params: { page: 1, limit: 20 } }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
