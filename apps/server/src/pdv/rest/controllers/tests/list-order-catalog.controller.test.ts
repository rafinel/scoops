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
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('List Order Catalog Controller [GET /orders/catalog]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns the tenant catalog to managers and operators', async () => {
    const product = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Tenant Portion',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })

    const manager = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?page=1&pageSize=20')
      .set('Cookie', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?page=1&pageSize=20')
      .set('Cookie', operatorRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      '/orders/catalog?page=1&pageSize=20',
    )

    expect(manager.status).toBe(200)
    expect(manager.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Tenant Portion' })]),
    )
    expect(operator.status).toBe(200)
    expect(operator.body).toEqual(manager.body)
    expect(anonymous.status).toBe(401)
  })

  it('rejects malformed queries before the use case', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?pageSize=51')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(422)
    expect(response.body).not.toHaveProperty('items')
  })

  it('returns a rounded accompaniment price for the quantity consumed by one portion', async () => {
    const product = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Portion with topping',
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
    const topping = await fixture.addProduct({
      establishmentId: product.establishmentId,
      name: 'Topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Accompaniment],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 0.03,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: product.establishmentId,
      name: 'Toppings',
    })
    const accompaniment = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: product.id,
      accompanimentProductId: topping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 2.5,
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?page=1&pageSize=20')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: product.id,
          sizes: [
            expect.objectContaining({
              sizeId: size.id,
              basePrice: 10,
              accompaniments: [
                expect.objectContaining({
                  accompanimentId: accompaniment.id,
                  quantityPerPortion: 2.5,
                  basePrice: 0.08,
                  isActive: true,
                }),
              ],
            }),
          ],
        }),
      ]),
    )
  })
})
