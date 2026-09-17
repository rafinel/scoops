import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ProductFaker } from '#mrp/domain/entities/fakers/product-faker.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'
import type { OrderStockRestorationRequest } from '#mrp/domain/structures/order-stock-restoration-request.ts'
import { RestoreOrderStockUseCase } from '#mrp/use-cases/restore-order-stock-use-case.ts'

describe('RestoreOrderStockUseCase', () => {
  let database: MockProxy<MrpDatabase>
  let scope: MockProxy<MrpDatabaseRepositories>

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mock<MrpDatabaseRepositories>()
    const products = mock<ProductsRepository>()
    const balances = mock<StockBalancesRepository>()
    scope.productsRepository = products
    scope.stockBalancesRepository = balances
    scope.stockTransactionsRepository = mock<StockTransactionsRepository>()
    database.run.mockImplementation(async (operation) => operation(scope))
    ;(products.findByIdForUpdate as any).mockResolvedValue(
      ProductFaker.fake({ id: 'product-1', establishmentId: 'shop-1' }),
    )
    ;(balances.add as any).mockResolvedValue({
      productId: 'product-1',
      quantity: 2,
      situation: 'normal',
    })
  })

  it('restores current targets and preserves the requested snapshot', async () => {
    const input: OrderStockRestorationRequest = {
      establishmentId: 'shop-1',
      orderId: 'order-1',
      performedBy: 'manager-1',
      performedByName: 'Manager',
      occurredAt: new Date(),
      targets: [{ productId: 'product-1', productName: 'Sorvete', quantity: 2 }],
    }
    await expect(new RestoreOrderStockUseCase(database).execute(input)).resolves.toEqual([
      { ...input.targets[0], outcome: 'restored' },
    ])
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sale-cancellation', orderId: 'order-1' }),
    )
  })

  it('returns a skipped result when the source product was deleted', async () => {
    ;(scope.productsRepository.findByIdForUpdate as any).mockResolvedValue(undefined)
    await expect(
      new RestoreOrderStockUseCase(database).execute({
        establishmentId: 'shop-1',
        orderId: 'order-1',
        performedBy: 'manager-1',
        performedByName: 'Manager',
        occurredAt: new Date(),
        targets: [{ productId: 'deleted', productName: 'Removido', quantity: 1 }],
      }),
    ).resolves.toEqual([
      { productId: 'deleted', productName: 'Removido', quantity: 1, outcome: 'skipped' },
    ])
  })
})
