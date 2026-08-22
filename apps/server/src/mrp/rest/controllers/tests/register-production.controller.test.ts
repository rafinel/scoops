import { ProductCategory } from '@scoops/core/mrp/domain/structures'
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

describe('Register Production Controller [POST /products/:productId/productions]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('atomically creates production, balances, and correlated stock movements', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 2 }),
    )
    await fixture.balances.initialize(product.id)
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 5)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Authorization', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })
    await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 1 })

    const registered = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/productions`)
      .set('Authorization', managerRequestAuthorization())
      .send({ quantity: 4 })

    expect(registered.status).toBe(201)
    expect(registered.body).toMatchObject({
      productId: product.id,
      quantity: 4,
      totalCost: 4,
      performedByName: 'Maria Manager',
    })
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 4,
    })
    await expect(fixture.balances.findByProductId(ingredient.id)).resolves.toMatchObject({
      quantity: 3,
    })
    const movements = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(movements.items).toMatchObject([
      {
        type: 'production-output',
        productionId: registered.body.id,
        quantity: 4,
        balanceAfter: 4,
      },
    ])
  })
})
