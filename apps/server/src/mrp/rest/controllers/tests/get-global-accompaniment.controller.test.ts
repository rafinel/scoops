import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Global Accompaniment Controller [GET /products/:productId/global-accompaniment]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  function addAccompaniment(name = 'Granola', overrides = {}) {
    return fixture.addProduct(
      createProduct({
        name,
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 4,
        accompanimentPrice: 3.5,
        ...overrides,
      }),
    )
  }

  function addType(name = 'Toppings') {
    return fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.establishmentId,
      name,
    })
  }

  function get(path: string, cookie = managerRequestAuthorization()) {
    return request(fixture.app.getHttpServer()).get(path).set('Cookie', cookie)
  }

  it('returns the shared values, price and cost of a global Accompaniment for Managers and Operators', async () => {
    const accompaniment = await addAccompaniment()
    const type = await addType()
    const { global } = await addGlobalAccompanimentWithRows(fixture, {
      target: accompaniment,
      type,
      portions: [],
      quantityPerPortion: 0.5,
      accompanimentPrice: 9,
    })

    const manager = await get(`/products/${accompaniment.id}/global-accompaniment`)
    const operator = await get(
      `/products/${accompaniment.id}/global-accompaniment`,
      operatorRequestAuthorization(),
    )

    expect(manager.status).toBe(200)
    expect(manager.body).toEqual({
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Granola',
      isGlobal: true,
      unit: 'kg',
      salePrice: 9,
      globalAccompanimentId: global.id,
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'Toppings',
      quantityPerPortion: 0.5,
      unitCost: 4,
      estimatedCost: 2,
    })
    expect(operator.status).toBe(200)
    expect(operator.body).toEqual(manager.body)
  })

  it('returns the price of the global record, null when the global has none, never the product default', async () => {
    const accompaniment = await addAccompaniment('Unpriced global')
    const type = await addType()
    await addGlobalAccompanimentWithRows(fixture, {
      target: accompaniment,
      type,
      portions: [],
      accompanimentPrice: undefined,
    })

    const response = await get(`/products/${accompaniment.id}/global-accompaniment`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ isGlobal: true, salePrice: null })
  })

  it('returns only the product facts for a non-global Accompaniment', async () => {
    const accompaniment = await addAccompaniment('Plain', {
      accompanimentPrice: undefined,
    })

    const response = await get(`/products/${accompaniment.id}/global-accompaniment`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Plain',
      isGlobal: false,
      unit: 'kg',
      salePrice: null,
    })
  })

  it('answers isGlobal false for a legacy Portion and Accompaniment product', async () => {
    const legacy = await fixture.addProduct(
      createProduct({
        name: 'Legacy',
        categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
        accompanimentPrice: 0,
      }),
    )

    const response = await get(`/products/${legacy.id}/global-accompaniment`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ isGlobal: false, salePrice: 0 })
  })

  it('uses the main brand cost for a By-brand global Accompaniment and still answers when inactive', async () => {
    const accompaniment = await addAccompaniment('Sauce', {
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
    const brand = await fixture.addBrand({
      productId: accompaniment.id,
      name: 'House brand',
      packageQuantity: 4,
      packagePrice: 12,
      isPrimary: true,
    })
    const type = await addType()
    await addGlobalAccompanimentWithRows(fixture, {
      target: accompaniment,
      type,
      portions: [],
      quantityPerPortion: 2,
    })

    const active = await get(`/products/${accompaniment.id}/global-accompaniment`)
    await fixture.products.replace(accompaniment.establishmentId, accompaniment.id, {
      status: ProductStatus.Inactive,
    })
    const inactive = await get(`/products/${accompaniment.id}/global-accompaniment`)

    expect(active.body).toMatchObject({
      brandId: brand.id,
      brandName: 'House brand',
      unitCost: 3,
      estimatedCost: 6,
    })
    expect(inactive.status).toBe(200)
    expect(inactive.body).toMatchObject({ isGlobal: true, quantityPerPortion: 2 })
    expect(inactive.body).not.toHaveProperty('unitCost')
  })

  it('does not leak another establishment global', async () => {
    const accompaniment = await addAccompaniment()
    const foreignAccompaniment = await addAccompaniment('Foreign Granola', {
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
    })
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      name: 'Foreign type',
    })
    await fixture.addGlobalAccompaniment({
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      accompanimentProductId: foreignAccompaniment.id,
      accompanimentTypeId: foreignType.id,
      quantityPerPortion: 1,
    })

    const own = await get(`/products/${accompaniment.id}/global-accompaniment`)
    const foreignProduct = await get(
      `/products/${foreignAccompaniment.id}/global-accompaniment`,
    )
    const foreignManager = await get(
      `/products/${foreignAccompaniment.id}/global-accompaniment`,
      foreignManagerRequestAuthorization(),
    )

    expect(own.body.isGlobal).toBe(false)
    expect(foreignProduct.status).toBe(404)
    expect(foreignManager.status).toBe(200)
    expect(foreignManager.body.isGlobal).toBe(true)
  })

  it('rejects unauthenticated, malformed, unknown and non-Accompaniment products', async () => {
    const accompaniment = await addAccompaniment()
    const portion = await fixture.addProduct(
      createProduct({ name: 'Plain portion', categories: [ProductCategory.Portion] }),
    )

    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${accompaniment.id}/global-accompaniment`,
    )
    const malformed = await get('/products/not-a-uuid/global-accompaniment')
    const unknown = await get(
      '/products/00000000-0000-4000-8000-000000000099/global-accompaniment',
    )
    const notAccompaniment = await get(`/products/${portion.id}/global-accompaniment`)

    expect(anonymous.status).toBe(401)
    expect(malformed.status).toBe(400)
    expect(unknown.status).toBe(404)
    expect(notAccompaniment.status).toBe(400)
  })
})
