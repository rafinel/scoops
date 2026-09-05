import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Adjust Product Stock Controller [POST /products/:productId/stock-adjustments]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('commits one balance delta and one immutable transaction without publication', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ type: 'entry', quantity: 3.125 })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ productId: product.id, quantity: 3.125 })
    const page = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toMatchObject({
      type: 'entry',
      quantity: 3.125,
      balanceAfter: 3.125,
      performedByName: 'Maria Manager',
    })
  })

  it('trims and serializes an optional justification in stock history', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        type: 'entry',
        quantity: 2,
        justification: '  Conferência de inventário  ',
      })

    expect(response.status).toBe(201)
    const history = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock-transactions?page=1&limit=20`)
      .set('Cookie', managerRequestAuthorization())

    expect(history.status).toBe(200)
    expect(history.body.items[0]).toMatchObject({
      quantity: 2,
      justification: 'Conferência de inventário',
    })
  })

  it('omits a whitespace-only justification from the serialized history', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ type: 'entry', quantity: 1, justification: '   ' })

    expect(response.status).toBe(201)
    const history = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock-transactions?page=1&limit=20`)
      .set('Cookie', managerRequestAuthorization())

    expect(history.status).toBe(200)
    expect(history.body.items[0]).not.toHaveProperty('justification')
  })

  it('rolls back both balance and ledger when a write-off is insufficient', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)
    await fixture.balances.add({ productId: product.id }, 2)
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ type: 'write-off', quantity: 3 })
    expect(response.status).toBe(409)
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 2,
    })
    expect(
      (
        await fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        })
      ).items,
    ).toHaveLength(0)
  })

  it('allows a negative result only when the product policy permits it', async () => {
    const product = await fixture.addProduct(createProduct({ allowNegativeStock: true }))
    await fixture.balances.initialize(product.id)
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ type: 'write-off', quantity: 1 })
    expect(response.status).toBe(201)
    expect(response.body.quantity).toBe(-1)
  })

  it('prevents two concurrent write-offs from overspending one balance', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)
    await fixture.balances.add({ productId: product.id }, 5)
    const sendWriteOff = () =>
      request(fixture.app.getHttpServer())
        .post(`/products/${product.id}/stock-adjustments`)
        .set('Cookie', managerRequestAuthorization())
        .send({ type: 'write-off', quantity: 4 })
    const responses = await Promise.all([sendWriteOff(), sendWriteOff()])
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 1,
    })
    expect(
      (
        await fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        })
      ).items,
    ).toHaveLength(1)
  })

  it('enforces authentication, Manager authorization, and establishment isolation', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)

    const anonymous = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .send({ type: 'entry', quantity: 1 })
    const operator = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ type: 'entry', quantity: 1 })
    const foreignManager = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/stock-adjustments`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ type: 'entry', quantity: 1 })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreignManager.status).toBe(404)
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 0,
    })
    expect(
      (
        await fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        })
      ).items,
    ).toHaveLength(0)
  })
})
