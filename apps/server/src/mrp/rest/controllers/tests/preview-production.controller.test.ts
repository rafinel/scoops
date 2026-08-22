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

describe('Preview Production Controller [POST /products/:productId/production-preview]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns current consumption and shortage projections without changing balances', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 2 }),
    )
    await fixture.balances.initialize(product.id)
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 1)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Authorization', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })
    await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 1 })

    const preview = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/production-preview`)
      .set('Authorization', managerRequestAuthorization())
      .send({ quantity: 4 })

    expect(preview.status).toBe(200)
    expect(preview.body).toMatchObject({
      quantity: 4,
      canProduce: false,
      consumptions: [
        { ingredientProductId: ingredient.id, quantity: 2, missingQuantity: 1 },
      ],
    })
    await expect(fixture.balances.findByProductId(ingredient.id)).resolves.toMatchObject({
      quantity: 1,
    })
  })
})
