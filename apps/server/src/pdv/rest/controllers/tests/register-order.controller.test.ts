import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  StockTransactionType,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import { AppError, ServiceUnavailableError } from '@scoops/core/shared/domain/errors'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import {
  PdvModuleFixture,
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('Register Order Controller [POST /orders]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('registers one order and returns the original order on replay', async () => {
    const product = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Registered Portion',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    await fixture.stockBalances.initialize(product.id)
    await fixture.stockBalances.add({ productId: product.id }, 2)

    const lines = [
      {
        productId: product.id,
        kind: 'portion',
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines })
    const body = {
      idempotencyKey: '55000000-0000-4000-8000-000000000002',
      previewToken: preview.body.previewToken,
      lines,
    }

    const first = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    const replay = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send(body)

    expect(preview.status).toBe(200)
    expect(first.status).toBe(201)
    expect(first.body).toMatchObject({ kind: 'registered', replayed: false })
    expect(first.body.order).toMatchObject({
      createdBy: PdvModuleFixture.accounts.managerId,
      createdByName: 'Maria Manager',
      status: 'registered',
    })
    expect(first.body.order.createdAt).toMatch(/Z$/)
    expect(replay.status).toBe(200)
    expect(replay.body).toMatchObject({ kind: 'registered', replayed: true })
    expect(replay.body.order).toEqual(first.body.order)
  })

  it('rejects a conflicting idempotency key without creating another order', async () => {
    const { product, size } = await addRegisterablePortion(fixture, 'Idempotency Portion')
    const firstLines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const conflictingLines = [{ ...firstLines[0], quantity: 2 }]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines: firstLines })

    const first = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000007',
        previewToken: preview.body.previewToken,
        lines: firstLines,
      })
    const conflict = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000007',
        previewToken: preview.body.previewToken,
        lines: conflictingLines,
      })

    expect(first.status).toBe(201)
    expect(conflict.status).toBe(409)
    expect(conflict.body).toMatchObject({ statusCode: 409 })
    expect(conflict.body.message).toContain('idempotência')
    const orders = await fixture.orders.findMany({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      page: 1,
      pageSize: 20,
    })
    expect(orders.total).toBe(1)
  })

  it.each([
    {
      error: new AppError('Injected stock-consumer failure.'),
      expectedStatus: 500,
      idempotencyKey: '55000000-0000-4000-8000-00000000000a',
    },
    {
      error: new ServiceUnavailableError('Injected dependency failure.'),
      expectedStatus: 503,
      idempotencyKey: '55000000-0000-4000-8000-00000000000b',
    },
  ])(
    'rolls back the order when the stock consumer fails with $expectedStatus',
    async ({ error, expectedStatus, idempotencyKey }) => {
      const { product, size } = await addRegisterablePortion(
        fixture,
        `Failure ${expectedStatus} Portion`,
      )
      const lines = [
        {
          productId: product.id,
          kind: 'portion' as const,
          quantity: 1,
          sizeId: size.id,
          accompanimentIds: [],
        },
      ]
      const preview = await request(fixture.app.getHttpServer())
        .post('/orders/preview')
        .set('Cookie', managerRequestAuthorization())
        .send({ lines })
      fixture.setStockConsumerFailure(error)

      const response = await request(fixture.app.getHttpServer())
        .post('/orders')
        .set('Cookie', managerRequestAuthorization())
        .send({ idempotencyKey, previewToken: preview.body.previewToken, lines })

      expect(response.status).toBe(expectedStatus)
      const balance = await fixture.stockBalances.findByProductId(
        PdvModuleFixture.accounts.establishmentId,
        product.id,
      )
      expect(balance?.quantity).toBe(2)
      expect(
        await fixture.getOrderSequenceNumber(PdvModuleFixture.accounts.establishmentId),
      ).toBeUndefined()
      const ledger = await fixture.stockTransactions.findPage(
        PdvModuleFixture.accounts.establishmentId,
        product.id,
        { page: 1, limit: 20 },
      )
      expect(ledger.items).toEqual([])
      const orders = await fixture.orders.findMany({
        establishmentId: PdvModuleFixture.accounts.establishmentId,
        page: 1,
        pageSize: 20,
      })
      expect(orders.total).toBe(0)
    },
  )

  it('rolls back the transaction when the database seam fails after the operation', async () => {
    const { product, size } = await addRegisterablePortion(
      fixture,
      'Database Failure Portion',
    )
    const lines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines })
    fixture.setDatabaseFailure(new AppError('Injected database failure.'))

    const response = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-00000000000c',
        previewToken: preview.body.previewToken,
        lines,
      })

    expect(response.status).toBe(500)
    expect(
      await fixture.getOrderSequenceNumber(PdvModuleFixture.accounts.establishmentId),
    ).toBeUndefined()
    const balance = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
    )
    expect(balance?.quantity).toBe(2)
    const orders = await fixture.orders.findMany({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      page: 1,
      pageSize: 20,
    })
    expect(orders.items).toEqual([])
    const ledger = await fixture.stockTransactions.findPage(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(ledger.items).toEqual([])
  })

  it('rejects a malformed registration without exposing a rebuilt cart', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000003',
        previewToken: 'not-a-preview',
        lines: [
          {
            productId: '55000000-0000-4000-8000-000000000010',
            kind: 'portion',
            quantity: 1,
            sizeId: '55000000-0000-4000-8000-000000000011',
            accompanimentIds: [],
          },
        ],
      })

    expect(response.status).toBe(400)
    expect(response.body).not.toHaveProperty('cart')
    expect(response.body).not.toHaveProperty('recalculatedCart')
  })

  it('requires an authenticated Manager or Operator', async () => {
    const response = await request(fixture.app.getHttpServer()).post('/orders').send({})

    expect(response.status).toBe(401)
  })

  it('returns repriced when the selected channel changes after preview', async () => {
    const { product, size } = await addRegisterablePortion(fixture, 'Repriced Portion')
    const channel = await fixture.addSalesChannel({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Delivery',
      percentage: 0,
      status: 'active',
    })
    const lines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ channelId: channel.id, lines })
    await fixture.salesChannels.replace(
      PdvModuleFixture.accounts.establishmentId,
      channel.id,
      { name: channel.name, percentage: 20 },
    )

    const response = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000004',
        previewToken: preview.body.previewToken,
        channelId: channel.id,
        lines,
      })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ kind: 'repriced' })
    expect(response.body.previewToken).toEqual(expect.any(String))
    expect(response.body.changes).toEqual(expect.any(Array))
  })

  it('returns review-required when stock is depleted after preview', async () => {
    const { product, size } = await addRegisterablePortion(fixture, 'Review Portion')
    await fixture.stockBalances.replaceQuantity(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
      undefined,
      1,
    )
    const lines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines })
    await fixture.stockBalances.replaceQuantity(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
      undefined,
      0,
    )

    const response = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000005',
        previewToken: preview.body.previewToken,
        lines,
      })

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({ kind: 'review-required' })
    expect(response.body.shortages).toEqual([
      expect.objectContaining({
        productId: product.id,
        productName: 'Review Portion',
        unit: ProductUnit.Unit,
        requiredQuantity: 1,
        availableQuantity: 0,
      }),
    ])
  })

  it('returns correction-required when a selected size is invalidated after preview', async () => {
    const { product, size } = await addRegisterablePortion(fixture, 'Correction Portion')
    const lines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines })
    await fixture.productSizes.replace(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
      size.id,
      { isActive: false },
    )

    const response = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000006',
        previewToken: preview.body.previewToken,
        lines,
      })

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({ kind: 'correction-required' })
    expect(response.body.invalidConfigurations).toEqual([
      expect.objectContaining({
        productId: product.id,
        productName: 'Correction Portion',
        selectedKind: 'portion',
        selectedId: size.id,
        reason: 'size',
        correctiveMessage: 'O tamanho selecionado não está mais disponível.',
      }),
    ])
  })

  it('serializes concurrent oversell attempts and leaves no partial second order', async () => {
    const { product, size } = await addRegisterablePortion(fixture, 'Contention Portion')
    await fixture.stockBalances.replaceQuantity(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
      undefined,
      1,
    )
    const lines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({ lines })

    const responses = await Promise.all(
      ['000000000008', '000000000009'].map((suffix) =>
        request(fixture.app.getHttpServer())
          .post('/orders')
          .set('Cookie', managerRequestAuthorization())
          .send({
            idempotencyKey: `55000000-0000-4000-8000-${suffix}`,
            previewToken: preview.body.previewToken,
            lines,
          }),
      ),
    )

    expect(responses.filter((response) => response.status === 201)).toHaveLength(1)
    expect(responses.filter((response) => response.status === 409)).toHaveLength(1)
    const registered = responses.find((response) => response.status === 201)
    expect(registered?.body.order.sequenceNumber).toBe(1)
    expect(
      await fixture.getOrderSequenceNumber(PdvModuleFixture.accounts.establishmentId),
    ).toBe(1)
    const ledger = await fixture.stockTransactions.findPage(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(ledger.items).toHaveLength(1)
    expect(ledger.items[0]).toMatchObject({
      type: StockTransactionType.Sale,
      orderId: registered?.body.order.id,
    })
    const balance = await fixture.stockBalances.findByProductId(
      PdvModuleFixture.accounts.establishmentId,
      product.id,
    )
    expect(balance?.quantity).toBe(0)
    const orders = await fixture.orders.findMany({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      page: 1,
      pageSize: 20,
    })
    expect(orders.items).toHaveLength(1)
    expect(orders.total).toBe(1)
  })
})

async function addRegisterablePortion(fixture: PdvModuleFixture, name: string) {
  const product = await fixture.addProduct({
    establishmentId: PdvModuleFixture.accounts.establishmentId,
    name,
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Portion],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    allowNegativeStock: false,
    idealStock: 0,
    currentUnitCost: 2,
  })
  const size = await fixture.addProductSize({
    establishmentId: product.establishmentId,
    productId: product.id,
    name: 'Regular',
    quantity: 1,
    price: 10,
    isActive: true,
  })
  await fixture.stockBalances.initialize(product.id)
  await fixture.stockBalances.add({ productId: product.id }, 2)
  return { product, size }
}
