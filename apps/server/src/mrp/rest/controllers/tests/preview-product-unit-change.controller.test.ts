import { ProductStockControl, ProductUnit } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Preview Product Unit Change Controller [POST /products/:productId/unit-change-preview]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns affected current rows without conversion facts', async () => {
    const product = await fixture.addProduct(
      createProduct({
        stockControl: ProductStockControl.ByBrand,
        idealStock: 5,
        currentUnitCost: 2,
      }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Brand',
      packageQuantity: 2,
      packagePrice: 20,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.balances.add({ productId: product.id, brandId: brand.id }, 3)

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/unit-change-preview`)
      .set('Authorization', managerRequestAuthorization())
      .send({ targetUnit: ProductUnit.Gram })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      currentUnit: ProductUnit.Kilogram,
      targetUnit: ProductUnit.Gram,
      affected: {
        balances: 1,
        brands: [{ brandId: brand.id, brandName: brand.name }],
        hasIdealStock: true,
        hasCurrentUnitCost: true,
      },
    })
  })

  it('previews a cross-dimension unit change without mutating persistence', async () => {
    const product = await fixture.addProduct(createProduct())
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/unit-change-preview`)
      .set('Authorization', managerRequestAuthorization())
      .send({ targetUnit: ProductUnit.Unit })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      currentUnit: ProductUnit.Kilogram,
      targetUnit: ProductUnit.Unit,
      affected: {
        balances: 0,
        brands: [],
        hasIdealStock: false,
        hasCurrentUnitCost: false,
      },
    })
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({
      unit: ProductUnit.Kilogram,
    })
  })

  it('rejects anonymous, operator, and foreign-establishment previews', async () => {
    const product = await fixture.addProduct(createProduct())
    const body = { targetUnit: ProductUnit.Unit }

    const anonymous = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/unit-change-preview`)
      .send(body)
    const operator = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/unit-change-preview`)
      .set('Authorization', operatorRequestAuthorization())
      .send(body)
    const foreign = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/unit-change-preview`)
      .set('Authorization', foreignManagerRequestAuthorization())
      .send(body)

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
  })
})
