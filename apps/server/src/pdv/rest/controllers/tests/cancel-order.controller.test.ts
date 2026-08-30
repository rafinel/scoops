import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { StockTransactionType } from '@scoops/core/mrp/domain/structures'
import { AppError } from '@scoops/core/shared/domain/errors'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import {
  PdvModuleFixture,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('Cancel Order Controller [PATCH /orders/:orderId/cancel]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

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

    const response = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Authorization', managerRequestAuthorization())
      .send({ reason: '  Cliente mudou de ideia  ' })
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
        restorations: [
          expect.objectContaining({
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
  })

  it('enforces manager access, reason bounds and one-way cancellation', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Permission Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000302',
    })
    const forbidden = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Authorization', operatorRequestAuthorization())
      .send({})
    const malformed = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Authorization', managerRequestAuthorization())
      .send({ reason: 'x'.repeat(501) })
    const canceled = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Authorization', managerRequestAuthorization())
      .send({})
    const replay = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Authorization', managerRequestAuthorization())
      .send({})

    expect(forbidden.status).toBe(403)
    expect(malformed.status).toBe(422)
    expect(canceled.status).toBe(200)
    expect(replay.status).toBe(409)
  })

  it('rolls back restoration and cancellation when the restorer fails', async () => {
    const registered = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Rollback Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000303',
      stockQuantity: 2,
    })
    fixture.setStockRestorerFailure(new AppError('Injected restorer failure.'))

    const response = await request(fixture.app.getHttpServer())
      .patch(`/orders/${registered.order.id}/cancel`)
      .set('Authorization', managerRequestAuthorization())
      .send({ reason: 'Rollback me' })
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
          .set('Authorization', managerRequestAuthorization())
          .send({ reason: `Attempt ${attempt}` }),
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
})
