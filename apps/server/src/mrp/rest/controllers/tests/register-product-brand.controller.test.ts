import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  managerRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Register Product Brand Controller [POST /products/:productId/brands]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('makes the first brand primary and atomically records positive initial stock', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/brands`)
      .set('Authorization', managerRequestAuthorization())
      .send({
        name: '  Callebaut  ',
        packageQuantity: 2,
        packageValue: 30,
        initialQuantity: 5,
      })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      brand: { name: 'Callebaut', isPrimary: true },
      stockQuantity: 5,
      unitPrice: 15,
    })
    const page = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toMatchObject({
      type: 'entry',
      quantity: 5,
      balanceAfter: 5,
      productName: 'Chocolate',
      brandName: 'Callebaut',
      performedByName: 'Maria Manager',
    })
  })

  it('creates no ledger row for zero stock and rolls back duplicate registration', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const body = {
      name: 'Sicao',
      packageQuantity: 2,
      packageValue: 10,
      initialQuantity: 0,
    }
    expect(
      (
        await request(fixture.app.getHttpServer())
          .post(`/products/${product.id}/brands`)
          .set('Authorization', managerRequestAuthorization())
          .send(body)
      ).status,
    ).toBe(201)
    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/brands`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ...body, name: ' Sicao ' })
    expect(duplicate.status).toBe(409)
    expect(await fixture.brands.findManyByProductId(product.id)).toHaveLength(1)
    expect(
      (
        await fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        })
      ).items,
    ).toHaveLength(0)
  })

  it('rejects malformed values before persistence', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/brands`)
      .set('Authorization', managerRequestAuthorization())
      .send({ name: '', packageQuantity: 0, packageValue: -1, initialQuantity: -1 })
    expect(response.status).toBe(422)
    expect(await fixture.brands.findManyByProductId(product.id)).toHaveLength(0)
  })
})
