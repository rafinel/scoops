import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ProductFaker } from '#mrp/domain/entities/fakers/product-faker.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import { ProductStockAlertState } from '#mrp/domain/structures/product-stock-alert-state.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import type { OrderStockConsumption } from '#mrp/domain/structures/order-stock-consumption.ts'
import { ConsumeOrderStockUseCase } from '#mrp/use-cases/consume-order-stock-use-case.ts'

describe('Consume Order Stock Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: MockProxy<MrpDatabaseRepositories>
  let useCase: ConsumeOrderStockUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mock<MrpDatabaseRepositories>()
    const products = mock<ProductsRepository>()
    const balances = mock<StockBalancesRepository>()
    scope.productsRepository = products
    scope.stockBalancesRepository = balances
    scope.stockTransactionsRepository = mock<StockTransactionsRepository>()
    scope.eventsRepository = mock<EventsRepository>()
    database.run.mockImplementation(async (operation) => operation(scope))
    ;(products.findByIdForUpdate as any).mockResolvedValue(
      ProductFaker.fake({
        id: 'product-1',
        establishmentId: 'shop-1',
        stockControl: ProductStockControl.Single,
      }),
    )
    ;(balances.findManyByProductId as any).mockResolvedValue([
      { productId: 'product-1', quantity: 4, situation: 'normal' },
    ])
    ;(balances.add as any).mockResolvedValue({
      productId: 'product-1',
      quantity: 3,
      situation: 'normal',
    })
    useCase = new ConsumeOrderStockUseCase(database)
  })

  it('locks products before consuming stock and records the sale movement', async () => {
    const input: OrderStockConsumption = {
      establishmentId: 'shop-1',
      orderId: 'order-1',
      performedBy: 'operator-1',
      performedByName: 'Operator',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      consumptions: [{ productId: 'product-1', quantity: 1 }],
    }

    await useCase.execute(input)

    expect(scope.productsRepository.findByIdForUpdate).toHaveBeenCalledWith(
      'shop-1',
      'product-1',
    )
    expect(scope.stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: 'product-1' },
      -1,
      0,
    )
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', type: 'sale', quantity: 1 }),
    )
  })

  it('publishes the stock alert inside the order-consumption transaction', async () => {
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')
    ;(scope.productsRepository.findByIdForUpdate as any).mockResolvedValue(
      ProductFaker.fake({
        id: 'product-1',
        establishmentId: 'shop-1',
        stockControl: ProductStockControl.Single,
        idealStock: 10,
      }),
    )
    ;(scope.stockBalancesRepository.findManyByProductId as any)
      .mockResolvedValueOnce([
        { productId: 'product-1', quantity: 12, situation: 'normal' },
      ])
      .mockResolvedValueOnce([{ productId: 'product-1', quantity: 8, situation: 'low' }])

    await useCase.execute({
      establishmentId: 'shop-1',
      orderId: 'order-1',
      performedBy: 'operator-1',
      performedByName: 'Operator',
      occurredAt,
      consumptions: [{ productId: 'product-1', quantity: 4 }],
    })

    expect(scope.eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ProductStockAlertStateEnteredEvent._NAME,
        payload: expect.objectContaining({
          establishmentId: 'shop-1',
          productId: 'product-1',
          state: ProductStockAlertState.BelowIdeal,
          availableQuantity: 8,
          idealQuantity: 10,
          occurredAt,
        }),
      }),
    )
  })

  it('fails when the persisted product no longer belongs to the order tenant', async () => {
    ;(scope.productsRepository.findByIdForUpdate as any).mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        establishmentId: 'shop-1',
        orderId: 'order-1',
        performedBy: 'operator-1',
        performedByName: 'Operator',
        occurredAt: new Date(),
        consumptions: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toThrow('O estoque do pedido não está mais disponível.')
  })
})
