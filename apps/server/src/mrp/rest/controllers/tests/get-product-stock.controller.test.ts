import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
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

describe('Get Product Stock Controller [GET /products/:productId/stock]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns the authoritative by-brand projection and summed balance', async () => {
    const product = await fixture.addProduct(
      createProduct({
        stockControl: ProductStockControl.ByBrand,
        idealStock: 5,
      }),
    )
    const primary = await fixture.addBrand({
      productId: product.id,
      name: 'Callebaut',
      packageQuantity: 2,
      packagePrice: 30,
      isPrimary: true,
    })
    const secondary = await fixture.addBrand({
      productId: product.id,
      name: 'Sicao',
      packageQuantity: 4,
      packagePrice: 40,
      isPrimary: false,
    })
    await fixture.balances.initialize(product.id, primary.id)
    await fixture.balances.initialize(product.id, secondary.id)
    await fixture.balances.add({ productId: product.id, brandId: primary.id }, 3)
    await fixture.balances.add({ productId: product.id, brandId: secondary.id }, 4)

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      stockQuantity: 7,
      idealStock: 5,
      stockSituation: 'normal',
      product: { id: product.id, name: 'Chocolate', unit: 'kg' },
      brands: [
        { brand: { id: primary.id, isPrimary: true }, stockQuantity: 3, unitPrice: 15 },
        { brand: { id: secondary.id }, stockQuantity: 4, unitPrice: 10 },
      ],
    })
  })

  it('returns zero as low only when an ideal target exists', async () => {
    const product = await fixture.addProduct(createProduct({ idealStock: 1 }))
    await fixture.balances.initialize(product.id)
    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock`)
      .set('Cookie', managerRequestAuthorization())
    expect(response.body).toMatchObject({ stockQuantity: 0, stockSituation: 'low' })
  })

  it('enforces profile authorization and uniform tenant-safe not-found', async () => {
    const product = await fixture.addProduct(createProduct())
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock`)
      .set('Cookie', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/stock')
      .set('Cookie', managerRequestAuthorization())
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body.title).toBe(missing.body.title)
  })
})
