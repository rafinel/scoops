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
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { ListStockTransactionsUseCase } from '#mrp/use-cases/list-stock-transactions-use-case.ts'

const actor = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }
const operator = {
  id: 'u2',
  establishmentId: 'e1',
  profile: UserProfile.Operator,
}
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

  it('allows Operators to read scoped stock history', async () => {
    const params = { page: 1, limit: 20 }
    const result = await useCase.execute({ actor: operator, productId: 'p1', params })

    expect(result).toEqual({ items: [], page: 1, limit: 20, total: 0 })
    expect(products.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(transactions.findPage).toHaveBeenCalledWith('e1', 'p1', params)
  })

  it('rejects unsupported actors before reading products or transactions', async () => {
    const unsupportedActor = {
      ...operator,
      profile: 'prospective' as never,
    }

    await expect(
      useCase.execute({
        actor: unsupportedActor,
        productId: 'p1',
        params: { page: 1, limit: 20 },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(products.findById).not.toHaveBeenCalled()
    expect(transactions.findPage).not.toHaveBeenCalled()
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
    expect(transactions.findPage).not.toHaveBeenCalled()
  })

  it('hides a product returned from outside the actor establishment', async () => {
    products.findById.mockResolvedValue({ ...product, establishmentId: 'e2' })

    await expect(
      useCase.execute({
        actor: operator,
        productId: 'p1',
        params: { page: 1, limit: 20 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(products.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(transactions.findPage).not.toHaveBeenCalled()
  })
})
