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

  it('rejects a selected accompaniment whose link has no configured price', async () => {
    const portion = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Preview Portion with legacy topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await fixture.addProductSize({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const topping = await fixture.addProduct({
      establishmentId: portion.establishmentId,
      name: 'Unpriced legacy topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Accompaniment],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 1,
      accompanimentPrice: 5,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: portion.establishmentId,
      name: 'Toppings',
    })
    const accompaniment = await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: topping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await fixture.stockBalances.initialize(topping.id)
    await fixture.stockBalances.add({ productId: topping.id }, 2)

    const response = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({
        lines: [
          {
            productId: portion.id,
            kind: 'portion',
            quantity: 1,
            sizeId: size.id,
            accompanimentIds: [accompaniment.id],
          },
        ],
      })

    expect(response.status).toBe(400)
    expect(response.body).not.toHaveProperty('cart')
  })

  it('prices a selected accompaniment from its link or its global record, never from the Accompaniment product', async () => {
    const portion = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Preview Portion with priced toppings',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await fixture.addProductSize({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const createTopping = async (name: string) => {
      const topping = await fixture.addProduct({
        establishmentId: portion.establishmentId,
        name,
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Accompaniment],
        stockControl: ProductStockControl.Single,
        status: ProductStatus.Active,
        allowNegativeStock: false,
        idealStock: 0,
        currentUnitCost: 1,
        accompanimentPrice: 50,
      })
      await fixture.stockBalances.initialize(topping.id)
      await fixture.stockBalances.add({ productId: topping.id }, 10)
      return topping
    }
    const individualTopping = await createTopping('Preview individual topping')
    const globalTopping = await createTopping('Preview global topping')
    const type = await fixture.addAccompanimentType({
      establishmentId: portion.establishmentId,
      name: 'Toppings',
    })
    const individual = await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: individualTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 2,
    })
    const global = await fixture.addGlobalAccompaniment({
      establishmentId: portion.establishmentId,
      accompanimentProductId: globalTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 3,
    })
    const globalRow = await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: globalTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      globalAccompanimentId: global.id,
    })

    const response = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({
        lines: [
          {
            productId: portion.id,
            kind: 'portion',
            quantity: 1,
            sizeId: size.id,
            accompanimentIds: [individual.id, globalRow.id],
          },
        ],
      })

    expect(response.status).toBe(200)
    expect(response.body.cart).toMatchObject({ total: 15, subtotal: 15 })
  })

  it('rejects a selected global accompaniment without a configured price', async () => {
    const portion = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Preview Portion with unpriced global',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await fixture.addProductSize({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const topping = await fixture.addProduct({
      establishmentId: portion.establishmentId,
      name: 'Unpriced global topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Accompaniment],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 1,
      accompanimentPrice: 5,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: portion.establishmentId,
      name: 'Toppings',
    })
    const global = await fixture.addGlobalAccompaniment({
      establishmentId: portion.establishmentId,
      accompanimentProductId: topping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const globalRow = await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: topping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      globalAccompanimentId: global.id,
    })
    await fixture.stockBalances.initialize(topping.id)
    await fixture.stockBalances.add({ productId: topping.id }, 2)

    const response = await request(fixture.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', managerRequestAuthorization())
      .send({
        lines: [
          {
            productId: portion.id,
            kind: 'portion',
            quantity: 1,
            sizeId: size.id,
            accompanimentIds: [globalRow.id],
          },
        ],
      })

    expect(response.status).toBe(400)
    expect(response.body).not.toHaveProperty('cart')
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
