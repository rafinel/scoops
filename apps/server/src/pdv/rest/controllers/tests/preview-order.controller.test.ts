import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import {
  PdvModuleFixture,
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('Preview Order Controller [POST /orders/preview]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns an authoritative cart and opaque preview token', async () => {
    const product = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Preview Portion',
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

    const response = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({
        lines: [
          {
            productId: product.id,
            kind: 'portion',
            quantity: 1,
            sizeId: size.id,
            accompanimentIds: [],
          },
        ],
      })

    expect(response.status).toBe(200)
    expect(response.body.previewToken).toEqual(expect.any(String))
    expect(response.body.previewToken).not.toContain(product.id)
    expect(response.body.cart).toMatchObject({ total: 10, subtotal: 10 })
  })

  it('requires an authenticated Manager or Operator', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .send({ lines: [] })

    expect(response.status).toBe(401)
  })

  it('does not disclose a cart for an invalid registration token', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/orders')
      .set('Cookie', managerRequestAuthorization())
      .send({
        idempotencyKey: '55000000-0000-4000-8000-000000000001',
        previewToken: 'invalid-token',
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
})
