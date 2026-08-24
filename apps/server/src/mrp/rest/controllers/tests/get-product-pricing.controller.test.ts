import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Product Pricing Controller [GET /products/:productId/pricing]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns Portion sizes with numeric metrics and serialized dates', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Pricing Portion',
        categories: [ProductCategory.Portion],
        currentUnitCost: 2.5,
      }),
    )
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Small',
      quantity: 0.5,
      price: 8.5,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/pricing`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      product: { id: product.id, name: product.name },
      mode: 'portion',
      resale: [],
    })
    expect(response.body.sizes[0]).toMatchObject({
      size: { name: 'Small', quantity: 0.5, price: 8.5, isActive: true },
      operatingCost: 1.25,
      profit: 7.25,
    })
    expect(response.body.sizes[0].size.createdAt).toEqual(expect.any(String))
  })

  it('returns Single and By-brand current projections without fallback rows', async () => {
    const single = await fixture.addProduct(
      createProduct({ name: 'Single Pricing', categories: [ProductCategory.Resale] }),
    )
    const singleConfiguration = await fixture.addResaleConfiguration({
      establishmentId: single.establishmentId,
      productId: single.id,
      price: 12,
      isActive: true,
    })
    const singleResponse = await request(fixture.app.getHttpServer())
      .get(`/products/${single.id}/pricing`)
      .set('Authorization', managerRequestAuthorization())

    expect(singleResponse.status).toBe(200)
    expect(singleResponse.body).toMatchObject({
      mode: 'resale-single',
      resale: [
        {
          packageQuantity: 1,
          price: 12,
          isActive: true,
          configuration: { id: singleConfiguration.id },
        },
      ],
    })

    const byBrand = await fixture.addProduct(
      createProduct({
        name: 'Brand Pricing',
        categories: [ProductCategory.Resale],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const brand = await fixture.addBrand({
      productId: byBrand.id,
      name: 'Brand One',
      packageQuantity: 2,
      packagePrice: 20,
      isPrimary: true,
    })
    const byBrandResponse = await request(fixture.app.getHttpServer())
      .get(`/products/${byBrand.id}/pricing`)
      .set('Authorization', managerRequestAuthorization())

    expect(byBrandResponse.status).toBe(200)
    expect(byBrandResponse.body).toMatchObject({
      mode: 'resale-by-brand',
      resale: [
        {
          brand: { id: brand.id, name: 'Brand One', packageQuantity: 2 },
          packageQuantity: 2,
          isActive: false,
        },
      ],
    })
    expect(byBrandResponse.body.resale[0]).not.toHaveProperty('price')
  })

  it('enforces authentication, Manager authorization, and tenant-safe not-found behavior', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Protected Pricing', categories: [ProductCategory.Portion] }),
    )
    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/pricing`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/pricing`)
      .set('Authorization', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/pricing`)
      .set('Authorization', foreignManagerRequestAuthorization())
    const malformed = await request(fixture.app.getHttpServer())
      .get('/products/not-a-uuid/pricing')
      .set('Authorization', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(malformed.status).toBe(400)
  })
})
