import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { OrderFaker } from '#pdv/domain/entities/fakers/order-faker.ts'
import { OrderStatus } from '#pdv/domain/structures/order-status.ts'
import type {
  PdvDatabase,
  PdvDatabaseRepositories,
} from '#pdv/interfaces/pdv-database.ts'
import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import type { OrderSequencesRepository } from '#pdv/interfaces/order-sequences-repository.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import type { StockProvider } from '#pdv/interfaces/stock-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import { CancelOrderUseCase } from '#pdv/use-cases/cancel-order-use-case.ts'

const actor = {
  id: 'manager-1',
  name: 'Manager',
  establishmentId: 'establishment-1',
  profile: UserProfile.Manager,
} as const

describe('Cancel Order Use Case', () => {
  let database: MockProxy<PdvDatabase>
  let scope: PdvDatabaseRepositories
  let orders: MockProxy<OrdersRepository>
  let stockProvider: MockProxy<StockProvider>
  let datetime: MockProxy<DatetimeProvider>
  let useCase: CancelOrderUseCase

  beforeEach(() => {
    orders = mock<OrdersRepository>()
    stockProvider = mock<StockProvider>()
    datetime = mock<DatetimeProvider>()
    datetime.now.mockReturnValue(new Date('2026-01-02T03:04:05.000Z'))
    scope = {
      salesCatalogProvider: mock<SalesCatalogProvider>(),
      salesChannelsRepository: mock<SalesChannelsRepository>(),
      discountsRepository: mock<DiscountsRepository>(),
      ordersRepository: orders,
      orderSequencesRepository: mock<OrderSequencesRepository>(),
      stockProvider,
      eventsRepository: mock<EventsRepository>(),
    }
    database = mock<PdvDatabase>()
    database.run.mockImplementation(async (operation) => operation(scope))
    useCase = new CancelOrderUseCase(database, datetime)
  })

  it('keeps same-destination consumptions attributable to their sold line', async () => {
    const order = OrderFaker.fake({
      id: 'order-1',
      establishmentId: actor.establishmentId,
      lines: [
        {
          product: { productId: 'p1', name: 'Chocolate', kind: 'resale' },
          brand: { brandId: 'b1', name: 'Marca' },
          accompaniments: [],
          quantity: 2,
          baseUnitPrice: 10,
          finalUnitPrice: 10,
          subtotal: 20,
          allocatedNetSalesCents: 2000,
          costComponents: [],
          cogsCents: null,
          consumptions: [
            { productId: 'p1', brandId: 'b1', quantity: 1 },
            { productId: 'p1', brandId: 'b1', quantity: 2 },
            { productId: 'p2', quantity: 3 },
          ],
        },
      ],
    })
    const canceled = { ...order, status: OrderStatus.Canceled }
    orders.findByIdForUpdate.mockResolvedValue(order)
    stockProvider.restore.mockResolvedValue([
      {
        linePosition: 0,
        productId: 'p1',
        productName: 'Chocolate',
        brandId: 'b1',
        brandName: 'Marca',
        quantity: 1,
        outcome: 'restored',
      },
      {
        linePosition: 0,
        productId: 'p1',
        productName: 'Chocolate',
        brandId: 'b1',
        brandName: 'Marca',
        quantity: 2,
        outcome: 'restored',
      },
      {
        linePosition: 0,
        productId: 'p2',
        productName: 'Produto removido',
        quantity: 3,
        outcome: 'skipped',
      },
    ])
    orders.cancel.mockResolvedValue(canceled)

    await expect(
      useCase.execute({
        actor,
        orderId: order.id,
        reason: '  Ajuste solicitado  ',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).resolves.toBe(canceled)
    expect(stockProvider.restore).toHaveBeenCalledWith({
      establishmentId: actor.establishmentId,
      orderId: order.id,
      performedBy: actor.id,
      performedByName: actor.name,
      occurredAt: new Date('2026-01-02T03:04:05.000Z'),
      targets: [
        {
          linePosition: 0,
          productId: 'p1',
          productName: 'Chocolate',
          brandId: 'b1',
          brandName: 'Marca',
          quantity: 1,
        },
        {
          linePosition: 0,
          productId: 'p1',
          productName: 'Chocolate',
          brandId: 'b1',
          brandName: 'Marca',
          quantity: 2,
        },
        {
          linePosition: 0,
          productId: 'p2',
          productName: 'Produto removido',
          quantity: 3,
        },
      ],
    })
    expect(orders.cancel).toHaveBeenCalledWith(
      actor.establishmentId,
      order.id,
      expect.objectContaining({
        canceledAt: new Date('2026-01-02T03:04:05.000Z'),
        canceledBy: actor.id,
        canceledByName: actor.name,
        reason: 'Ajuste solicitado',
        outcomes: [
          {
            linePosition: 0,
            productId: 'p1',
            productName: 'Chocolate',
            brandId: 'b1',
            brandName: 'Marca',
            quantity: 1,
            outcome: 'restored',
          },
          {
            linePosition: 0,
            productId: 'p1',
            productName: 'Chocolate',
            brandId: 'b1',
            brandName: 'Marca',
            quantity: 2,
            outcome: 'restored',
          },
          {
            linePosition: 0,
            productId: 'p2',
            productName: 'Produto removido',
            quantity: 3,
            outcome: 'skipped',
          },
        ],
      }),
    )
  })

  it('uses indirect consumption snapshots without losing current target labels', async () => {
    const order = OrderFaker.fake({
      id: 'order-1',
      establishmentId: actor.establishmentId,
      lines: [
        {
          product: { productId: 'p1', name: 'Bolo', kind: 'portion' },
          accompaniments: [],
          quantity: 1,
          baseUnitPrice: 10,
          finalUnitPrice: 10,
          subtotal: 10,
          allocatedNetSalesCents: 1000,
          costComponents: [],
          cogsCents: null,
          consumptions: [
            {
              productId: 'ingredient-1',
              productName: 'Farinha',
              brandId: 'brand-1',
              brandName: 'Moinho',
              quantity: 2,
            },
            { productId: 'p1', quantity: 1 },
          ],
        },
      ],
    })
    orders.findByIdForUpdate.mockResolvedValue(order)
    stockProvider.restore.mockResolvedValue([
      {
        linePosition: 0,
        productId: 'ingredient-1',
        productName: 'Farinha',
        brandId: 'brand-1',
        brandName: 'Moinho',
        quantity: 2,
        outcome: 'restored',
      },
      {
        linePosition: 0,
        productId: 'p1',
        productName: 'Bolo',
        quantity: 1,
        outcome: 'restored',
      },
    ])
    orders.cancel.mockResolvedValue({ ...order, status: OrderStatus.Canceled })

    await useCase.execute({
      actor,
      orderId: order.id,
      lineDispositions: [{ linePosition: 0, disposition: 'return' }],
    })

    expect(stockProvider.restore).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: [
          {
            linePosition: 0,
            productId: 'ingredient-1',
            productName: 'Farinha',
            brandId: 'brand-1',
            brandName: 'Moinho',
            quantity: 2,
          },
          { linePosition: 0, productId: 'p1', productName: 'Bolo', quantity: 1 },
        ],
      }),
    )
  })

  it('preserves rollback ownership when restoration or cancellation fails', async () => {
    const order = OrderFaker.fake({ establishmentId: actor.establishmentId })
    orders.findByIdForUpdate.mockResolvedValue(order)
    stockProvider.restore.mockRejectedValue(new Error('restore failed'))
    await expect(
      useCase.execute({
        actor,
        orderId: order.id,
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toThrow('restore failed')
    expect(orders.cancel).not.toHaveBeenCalled()

    stockProvider.restore.mockResolvedValue([])
    orders.cancel.mockRejectedValue(new Error('cancel failed'))
    stockProvider.restore.mockResolvedValue([
      {
        linePosition: 0,
        productId: order.lines[0].product.productId,
        productName: order.lines[0].product.name,
        quantity: 1,
        outcome: 'restored',
      },
    ])
    await expect(
      useCase.execute({
        actor,
        orderId: order.id,
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toThrow('cancel failed')
  })

  it('rejects missing, canceled, unauthorized and overlong requests without side effects', async () => {
    orders.findByIdForUpdate.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        orderId: 'missing',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    orders.findByIdForUpdate.mockResolvedValue(
      OrderFaker.fake({
        status: OrderStatus.Canceled,
        establishmentId: actor.establishmentId,
      }),
    )
    await expect(
      useCase.execute({
        actor,
        orderId: 'canceled',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        orderId: 'order-1',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    await expect(
      useCase.execute({
        actor,
        orderId: 'order-1',
        reason: 'x'.repeat(501),
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(stockProvider.restore).not.toHaveBeenCalled()
  })

  it('uses the locked tenant read and one deterministic clock value', async () => {
    const order = OrderFaker.fake({ establishmentId: actor.establishmentId })
    orders.findByIdForUpdate.mockResolvedValue(order)
    stockProvider.restore.mockResolvedValue([
      {
        linePosition: 0,
        productId: order.lines[0].product.productId,
        productName: order.lines[0].product.name,
        quantity: 1,
        outcome: 'restored',
      },
    ])
    orders.cancel.mockResolvedValue({ ...order, status: OrderStatus.Canceled })
    await useCase.execute({
      actor,
      orderId: order.id,
      lineDispositions: [{ linePosition: 0, disposition: 'return' }],
    })
    expect(orders.findByIdForUpdate).toHaveBeenCalledWith(actor.establishmentId, order.id)
    expect(datetime.now).toHaveBeenCalledTimes(1)
  })

  it('records each loss consumption without calling the stock provider', async () => {
    const order = OrderFaker.fake({
      id: 'order-1',
      establishmentId: actor.establishmentId,
      lines: [
        {
          ...OrderFaker.fake().lines[0],
          product: { productId: 'p1', name: 'Bolo', kind: 'portion' },
          accompaniments: [],
          consumptions: [
            { productId: 'flour', productName: 'Farinha', quantity: 2 },
            { productId: 'sugar', productName: 'Açúcar', quantity: 1 },
          ],
        },
        {
          ...OrderFaker.fake().lines[0],
          product: { productId: 'p2', name: 'Sorvete', kind: 'resale' },
          accompaniments: [],
          consumptions: [{ productId: 'p2', quantity: 1 }],
        },
      ],
    })
    orders.findByIdForUpdate.mockResolvedValue(order)
    orders.cancel.mockImplementation(
      async (_establishmentId, _orderId, cancellation) => ({
        ...order,
        status: OrderStatus.Canceled,
        cancellation,
      }),
    )

    const result = await useCase.execute({
      actor,
      orderId: order.id,
      lineDispositions: [
        { linePosition: 0, disposition: 'loss' },
        { linePosition: 1, disposition: 'loss' },
      ],
    })

    expect(stockProvider.restore).not.toHaveBeenCalled()
    expect(result.cancellation?.outcomes).toEqual([
      {
        linePosition: 0,
        productId: 'flour',
        productName: 'Farinha',
        quantity: 2,
        outcome: 'lost',
      },
      {
        linePosition: 0,
        productId: 'sugar',
        productName: 'Açúcar',
        quantity: 1,
        outcome: 'lost',
      },
      {
        linePosition: 1,
        productId: 'p2',
        productName: 'Sorvete',
        quantity: 1,
        outcome: 'lost',
      },
    ])
  })

  it('sends only return lines to MRP and preserves mixed outcomes in line order', async () => {
    const order = OrderFaker.fake({
      id: 'order-1',
      establishmentId: actor.establishmentId,
      lines: [
        {
          ...OrderFaker.fake().lines[0],
          product: { productId: 'p1', name: 'Bolo', kind: 'portion' },
          accompaniments: [],
          consumptions: [{ productId: 'flour', productName: 'Farinha', quantity: 2 }],
        },
        {
          ...OrderFaker.fake().lines[0],
          product: { productId: 'p2', name: 'Sorvete', kind: 'resale' },
          accompaniments: [],
          consumptions: [{ productId: 'p2', quantity: 1 }],
        },
      ],
    })
    orders.findByIdForUpdate.mockResolvedValue(order)
    stockProvider.restore.mockResolvedValue([
      {
        linePosition: 1,
        productId: 'p2',
        productName: 'Sorvete',
        quantity: 1,
        outcome: 'restored',
      },
    ])
    orders.cancel.mockImplementation(
      async (_establishmentId, _orderId, cancellation) => ({
        ...order,
        status: OrderStatus.Canceled,
        cancellation,
      }),
    )

    const result = await useCase.execute({
      actor,
      orderId: order.id,
      lineDispositions: [
        { linePosition: 0, disposition: 'loss' },
        { linePosition: 1, disposition: 'return' },
      ],
    })

    expect(stockProvider.restore).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: [
          {
            linePosition: 1,
            productId: 'p2',
            productName: 'Sorvete',
            quantity: 1,
          },
        ],
      }),
    )
    expect(result.cancellation?.outcomes).toEqual([
      {
        linePosition: 0,
        productId: 'flour',
        productName: 'Farinha',
        quantity: 2,
        outcome: 'lost',
      },
      {
        linePosition: 1,
        productId: 'p2',
        productName: 'Sorvete',
        quantity: 1,
        outcome: 'restored',
      },
    ])
  })

  it('rejects an MRP result for the wrong consumption on the same line and rolls back', async () => {
    const order = OrderFaker.fake({
      id: 'order-1',
      establishmentId: actor.establishmentId,
      lines: [
        {
          ...OrderFaker.fake().lines[0],
          product: { productId: 'p1', name: 'Bolo', kind: 'portion' },
          accompaniments: [],
          consumptions: [
            { productId: 'flour', productName: 'Farinha', quantity: 2 },
            { productId: 'sugar', productName: 'Açúcar', quantity: 1 },
          ],
        },
      ],
    })
    orders.findByIdForUpdate.mockResolvedValue(order)
    let simulatedStockQuantity = 0
    database.run.mockImplementation(async (operation) => {
      const before = simulatedStockQuantity
      try {
        return await operation(scope)
      } catch (error) {
        simulatedStockQuantity = before
        throw error
      }
    })
    stockProvider.restore.mockImplementation(async (request) => {
      simulatedStockQuantity += request.targets.reduce(
        (total, target) => total + target.quantity,
        0,
      )
      return [
        {
          ...request.targets[0],
          productId: 'sugar',
          productName: 'Açúcar',
          quantity: 1,
          outcome: 'restored',
        },
        {
          ...request.targets[1],
          outcome: 'restored',
        },
      ]
    })

    await expect(
      useCase.execute({
        actor,
        orderId: order.id,
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    expect(simulatedStockQuantity).toBe(0)
    expect(orders.cancel).not.toHaveBeenCalled()
  })

  it('rejects duplicate, missing, out-of-range, and invalid line choices before stock changes', async () => {
    const order = OrderFaker.fake({ establishmentId: actor.establishmentId })
    orders.findByIdForUpdate.mockResolvedValue(order)
    const invalidChoices = [
      [],
      [
        { linePosition: 0, disposition: 'return' },
        { linePosition: 0, disposition: 'loss' },
      ],
      [{ linePosition: 1, disposition: 'return' }],
      [{ linePosition: -1, disposition: 'return' }],
      [{ linePosition: 0, disposition: 'unknown' }],
    ]
    for (const lineDispositions of invalidChoices) {
      await expect(
        useCase.execute({ actor, orderId: order.id, lineDispositions } as never),
      ).rejects.toBeInstanceOf(BadRequestError)
    }
    expect(stockProvider.restore).not.toHaveBeenCalled()
    expect(orders.cancel).not.toHaveBeenCalled()
  })

  it('rejects a second cancellation after the first transition', async () => {
    const order = OrderFaker.fake({ establishmentId: actor.establishmentId })
    orders.findByIdForUpdate
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, status: OrderStatus.Canceled })
    stockProvider.restore.mockResolvedValue([
      {
        linePosition: 0,
        productId: order.lines[0].product.productId,
        productName: order.lines[0].product.name,
        quantity: 1,
        outcome: 'restored',
      },
    ])
    orders.cancel.mockResolvedValue({ ...order, status: OrderStatus.Canceled })
    const request = {
      actor,
      orderId: order.id,
      lineDispositions: [{ linePosition: 0, disposition: 'return' as const }],
    }
    await useCase.execute(request)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(stockProvider.restore).toHaveBeenCalledTimes(1)
  })
})
