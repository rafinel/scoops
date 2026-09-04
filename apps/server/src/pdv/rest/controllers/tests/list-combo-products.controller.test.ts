import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import { productCreate } from './combo-controller-test-helpers'

describe('List Combo Products Controller [GET /discounts/catalog]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns commercially eligible MRP products from the current establishment', async () => {
    const product = await fixture.addProduct(
      productCreate({ name: 'Catalog Resale', categories: [ProductCategory.Resale] }),
    )
    await fixture.addResaleConfiguration({
      establishmentId: product.establishmentId,
      productId: product.id,
      price: 12.5,
      isActive: true,
    })
    const foreignProduct = await fixture.addProduct(
      productCreate({
        establishmentId: '44000000-0000-0000-0000-000000000001',
        name: 'Foreign Catalog Resale',
        categories: [ProductCategory.Resale],
      }),
    )
    await fixture.addResaleConfiguration({
      establishmentId: foreignProduct.establishmentId,
      productId: foreignProduct.id,
      price: 9.75,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/discounts/catalog?kind=resale&page=1&pageSize=10')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    })
    expect(response.body.items).toEqual([
      expect.objectContaining({
        productId: product.id,
        name: 'Catalog Resale',
        kind: 'resale',
        stockControl: 'single',
        isActive: true,
        isAvailable: false,
        resalePrice: 12.5,
        resaleBrands: [],
      }),
    ])
  })

  it('rejects malformed catalog pagination at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/discounts/catalog?pageSize=51')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(422)
  })
})
