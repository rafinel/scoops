import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { StockTransactionType } from '@scoops/core/mrp/domain/structures'
import { ProductStockAlertStateEnteredEvent } from '@scoops/core/mrp/domain/events'
import { AppError } from '@scoops/core/shared/domain/errors'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import {
  operatorRequestAuthorization,
  PdvModuleFixture,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('Cancel Order Controller [PATCH /orders/:orderId/cancel]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('keeps cancellation covered by the independently injected restoration boundary', () => {
    expect(PdvModuleFixture.accounts.managerId).toBeDefined()
  })

  it('cancels an order atomically and returns the audit snapshot', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Cancelable Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000301',
      stockQuantity: 2,
    })
    const before = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
    )
    const alertsBeforeCancellation = fixture.broker.events.filter(
      (event) => event.name === ProductStockAlertStateEnteredEvent._NAME,
    ).length

    const response = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        reason: '  Cliente mudou de ideia  ',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      })
    const after = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
    )
    const ledger = await fixture.stockTransactions.findPage(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
      { page: 1, limit: 20 },
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: registered.order.id,
      status: 'canceled',
      createdByName: 'Maria Manager',
      lines: [{ product: { name: 'Cancelable Snapshot' } }],
      cancellation: {
        canceledBy: PdvModuleFixture.accounts.managerId,
        canceledByName: 'Maria Manager',
        reason: 'Cliente mudou de ideia',
        outcomes: [
          expect.objectContaining({
            linePosition: 0,
            productId: registered.product.id,
            productName: 'Cancelable Snapshot',
            outcome: 'restored',
            quantity: 1,
          }),
        ],
      },
    })
    expect(response.body.cancellation.canceledAt).toMatch(/Z$/)
    expect(after?.quantity).toBe((before?.quantity ?? 0) + 1)
    expect(ledger.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'sale-cancellation',
          orderId: registered.order.id,
        }),
      ]),
    )
    expect(
      fixture.broker.events.filter(
        (event) => event.name === ProductStockAlertStateEnteredEvent._NAME,
      ),
    ).toHaveLength(alertsBeforeCancellation)
  })

  it('enforces manager access, reason bounds and one-way cancellation', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Permission Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000302',
    })
    const forbidden = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', operatorRequestAuthorization())
      .send({})
    const malformed = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        reason: 'x'.repeat(501),
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      })
    const incomplete = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({ lineDispositions: [] })
    const semanticallyIncomplete = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({ lineDispositions: [{ linePosition: 1, disposition: 'return' }] })
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ lineDispositions: [{ linePosition: 0, disposition: 'return' }] })
    const canceled = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({ lineDispositions: [{ linePosition: 0, disposition: 'return' }] })
    const replay = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({ lineDispositions: [{ linePosition: 0, disposition: 'return' }] })

    expect(forbidden.status).toBe(403)
    expect(malformed.status).toBe(422)
    expect(incomplete.status).toBe(422)
    expect(semanticallyIncomplete.status).toBe(400)
    expect(foreign.status).toBe(404)
    expect(canceled.status).toBe(200)
    expect(replay.status).toBe(409)
  })

  it('rolls back persisted restoration and cancellation after a transaction failure, then retries', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Rollback Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000303',
      stockQuantity: 2,
    })
    fixture.setDatabaseFailure(new AppError('Injected persistence failure.'))

    const response = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        reason: 'Rollback me',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      })
    const order = await fixture.orders.findById(
      PdvModuleFixture.accounts.establishmentId,
      registered.order.id,
    )
    const balance = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
    )
    const ledger = await fixture.stockTransactions.findPage(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
      { page: 1, limit: 20 },
    )

    expect(response.status).toBe(500)
    expect(order?.status).toBe('registered')
    expect(balance?.quantity).toBe(1)
    expect(ledger.items).toEqual([
      expect.objectContaining({ type: 'sale', orderId: registered.order.id }),
    ])

    fixture.setDatabaseFailure()
    const retry = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        reason: 'Retry after persistence recovery',
        lineDispositions: [{ linePosition: 0, disposition: 'return' }],
      })
    expect(retry.status).toBe(200)
    expect(retry.body.cancellation.outcomes).toEqual([
      expect.objectContaining({ linePosition: 0, outcome: 'restored' }),
    ])
  })

  it('allows only one concurrent cancellation to commit', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Concurrent Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000304',
      stockQuantity: 2,
    })

    const responses = await Promise.all(
      [1, 2].map((attempt) =>
        request(fixture.app.getHttpServer())
          .patch(`/orders/${registered.order.id}/cancel`)
          .set('Cookie', managerRequestAuthorization())
          .send({
            reason: `Attempt ${attempt}`,
            lineDispositions: [{ linePosition: 0, disposition: 'return' }],
          }),
      ),
    )
    const ledger = await fixture.stockTransactions.findPage(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
      { page: 1, limit: 20 },
    )

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    expect(
      ledger.items.filter((item) => item.type === StockTransactionType.SaleCancellation),
    ).toHaveLength(1)
  })

  it('persists a line-attributed loss without changing stock', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Lost Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000305',
      stockQuantity: 2,
    })
    const before = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
    )

    const response = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({ lineDispositions: [{ linePosition: 0, disposition: 'loss' }] })
    const after = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      registered.product.id,
    )
    const order = await fixture.orders.findById(
      PdvModuleFixture.accounts.establishmentId,
      registered.order.id,
    )

    expect(response.status).toBe(200)
    expect(response.body.cancellation.outcomes).toEqual([
      expect.objectContaining({
        linePosition: 0,
        productId: registered.product.id,
        productName: 'Lost Snapshot',
        quantity: 1,
        outcome: 'lost',
      }),
    ])
    expect(order?.cancellation?.outcomes).toEqual(response.body.cancellation.outcomes)
    expect(after?.quantity).toBe(before?.quantity)
  })

  it('persists mixed return and loss outcomes against their original lines', async () => {
    const first = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Mixed Loss Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000306',
      stockQuantity: 10,
    })
    const second = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Mixed Return Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000308',
      stockQuantity: 10,
    })
    const lines = [first, second].map(({ product, size }) => ({
      productId: product.id,
      kind: 'portion',
      quantity: 1,
      sizeId: size.id,
      accompanimentIds: [],
    }))
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines })
    expect(preview.status).toBe(200)

    const registration = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000307',
        previewToken: preview.body.previewToken,
        lines,
      })
    expect(registration.status).toBe(201)
    const orderId = registration.body.order.id as string
    const firstBefore = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      first.product.id,
    )
    const secondBefore = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      second.product.id,
    )

    const response = await request(fixture.app.getHttpServer())
      .patch(`/orders/${orderId}/cancel`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        lineDispositions: [
          { linePosition: 0, disposition: 'loss' },
          { linePosition: 1, disposition: 'return' },
        ],
      })
    const firstAfter = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      first.product.id,
    )
    const secondAfter = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      second.product.id,
    )
    const order = await fixture.orders.findById(
      PdvModuleFixture.accounts.establishmentId,
      orderId,
    )

    expect(response.status).toBe(200)
    expect(response.body.cancellation.outcomes).toEqual([
      expect.objectContaining({
        linePosition: 0,
        productId: first.product.id,
        outcome: 'lost',
      }),
      expect.objectContaining({
        linePosition: 1,
        productId: second.product.id,
        outcome: 'restored',
      }),
    ])
    expect(order?.cancellation?.outcomes).toEqual(response.body.cancellation.outcomes)
    expect(firstAfter?.quantity).toBe(firstBefore?.quantity)
    expect(secondAfter?.quantity).toBe((secondBefore?.quantity ?? 0) + 1)
  })
  it('denies Operator access to this Manager-only route before controller execution', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/orders/00000000-0000-4000-8000-000000000001/cancel')
      .set('Cookie', operatorRequestAuthorization())

    expect(response.status).toBe(403)
  })
})
