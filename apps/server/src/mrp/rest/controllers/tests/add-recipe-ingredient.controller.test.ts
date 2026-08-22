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

describe('Add Recipe Ingredient Controller [POST /products/:productId/recipe/ingredients]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('adds an eligible ingredient once and rejects a duplicate without another line', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 1.25 }),
    )
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 10)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Authorization', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })

    const added = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 0.5 })
    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 0.5 })

    expect(added.status).toBe(201)
    expect(added.body.recipe.ingredients).toMatchObject([
      { ingredientProductId: ingredient.id, quantity: 0.5, lineCost: 0.625 },
    ])
    expect(duplicate.status).toBe(409)
  })
})
