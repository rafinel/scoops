import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { OrderFaker } from '#pdv/domain/entities/fakers/order-faker.ts'
import { OrderStatus } from '#pdv/domain/structures/order-status.ts'
import type { PdvDatabase, PdvDatabaseScope } from '#pdv/interfaces/pdv-database.ts'
import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import type { OrderSequencesRepository } from '#pdv/interfaces/order-sequences-repository.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import type { StockRestorer } from '#pdv/interfaces/stock-restorer.ts'
import type { StockConsumer } from '#pdv/interfaces/stock-consumer.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { CancelOrderUseCase } from '#pdv/use-cases/cancel-order-use-case.ts'

const actor = {
  id: 'manager-1',
  name: 'Manager',
  establishmentId: 'establishment-1',
  profile: UserProfile.Manager,
} as const

describe('Cancel Order Use Case', () => {
  let database: MockProxy<PdvDatabase>
  let scope: PdvDatabaseScope
  let orders: MockProxy<OrdersRepository>
  let restorer: MockProxy<StockRestorer>
  let datetime: MockProxy<DatetimeProvider>
  let useCase: CancelOrderUseCase

  beforeEach(() => {
    orders = mock<OrdersRepository>()
    restorer = mock<StockRestorer>()
    datetime = mock<DatetimeProvider>()
    datetime.now.mockReturnValue(new Date('2026-01-02T03:04:05.000Z'))
    scope = {
      salesCatalogProvider: mock<SalesCatalogProvider>(),
      salesChannelsRepository: mock<SalesChannelsRepository>(),
      discountsRepository: mock<DiscountsRepository>(),
      ordersRepository: orders,
      orderSequencesRepository: mock<OrderSequencesRepository>(),
      stockConsumer: mock<StockConsumer>(),
      stockRestorer: restorer,
    }
    database = mock<PdvDatabase>()
    database.run.mockImplementation(async (operation) => operation(scope))
    useCase = new CancelOrderUseCase(database, datetime)
  })

  it('consolidates product/brand consumption and commits one immutable cancellation fact', async () => {
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
    restorer.restore.mockResolvedValue([
      {
        productId: 'p1',
        productName: 'Chocolate',
        brandId: 'b1',
        brandName: 'Marca',
        quantity: 3,
        outcome: 'restored',
      },
      {
        productId: 'p2',
        productName: 'Produto removido',
        quantity: 3,
        outcome: 'skipped',
      },
    ])
    orders.cancel.mockResolvedValue(canceled)

    await expect(
      useCase.execute({ actor, orderId: order.id, reason: '  Ajuste solicitado  ' }),
    ).resolves.toBe(canceled)
    expect(restorer.restore).toHaveBeenCalledWith({
      establishmentId: actor.establishmentId,
      orderId: order.id,
      performedBy: actor.id,
      performedByName: actor.name,
      occurredAt: new Date('2026-01-02T03:04:05.000Z'),
      targets: [
        {
          productId: 'p1',
          productName: 'Chocolate',
          brandId: 'b1',
          brandName: 'Marca',
          quantity: 3,
        },
        { productId: 'p2', productName: 'Produto removido', quantity: 3 },
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
        restorations: expect.any(Array),
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
    restorer.restore.mockResolvedValue([])
    orders.cancel.mockResolvedValue({ ...order, status: OrderStatus.Canceled })

    await useCase.execute({ actor, orderId: order.id })

    expect(restorer.restore).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: [
          {
            productId: 'ingredient-1',
            productName: 'Farinha',
            brandId: 'brand-1',
            brandName: 'Moinho',
            quantity: 2,
          },
          { productId: 'p1', productName: 'Bolo', quantity: 1 },
        ],
      }),
    )
  })

  it('preserves rollback ownership when restoration or cancellation fails', async () => {
    const order = OrderFaker.fake({ establishmentId: actor.establishmentId })
    orders.findByIdForUpdate.mockResolvedValue(order)
    restorer.restore.mockRejectedValue(new Error('restore failed'))
    await expect(useCase.execute({ actor, orderId: order.id })).rejects.toThrow(
      'restore failed',
    )
    expect(orders.cancel).not.toHaveBeenCalled()

    restorer.restore.mockResolvedValue([])
    orders.cancel.mockRejectedValue(new Error('cancel failed'))
    await expect(useCase.execute({ actor, orderId: order.id })).rejects.toThrow(
      'cancel failed',
    )
  })

  it('rejects missing, canceled, unauthorized and overlong requests without side effects', async () => {
    orders.findByIdForUpdate.mockResolvedValue(undefined)
    await expect(useCase.execute({ actor, orderId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundError,
    )

    orders.findByIdForUpdate.mockResolvedValue(
      OrderFaker.fake({
        status: OrderStatus.Canceled,
        establishmentId: actor.establishmentId,
      }),
    )
    await expect(useCase.execute({ actor, orderId: 'canceled' })).rejects.toBeInstanceOf(
      ConflictError,
    )
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        orderId: 'order-1',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    await expect(
      useCase.execute({ actor, orderId: 'order-1', reason: 'x'.repeat(501) }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(restorer.restore).not.toHaveBeenCalled()
  })

  it('uses the locked tenant read and one deterministic clock value', async () => {
    const order = OrderFaker.fake({ establishmentId: actor.establishmentId })
    orders.findByIdForUpdate.mockResolvedValue(order)
    restorer.restore.mockResolvedValue([])
    orders.cancel.mockResolvedValue({ ...order, status: OrderStatus.Canceled })
    await useCase.execute({ actor, orderId: order.id })
    expect(orders.findByIdForUpdate).toHaveBeenCalledWith(actor.establishmentId, order.id)
    expect(datetime.now).toHaveBeenCalledTimes(1)
  })
})
