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

describe('Remove Recipe Ingredient Controller [DELETE /products/:productId/recipe/ingredients/:lineId]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('removes only the line and retains the saved recipe yield', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 1 }),
    )
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 10)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Authorization', managerRequestAuthorization())
      .send({ yieldQuantity: 3 })
    const added = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 1 })
    const lineId = added.body.recipe.ingredients[0].id

    const removed = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/recipe/ingredients/${lineId}`)
      .set('Authorization', managerRequestAuthorization())

    expect(removed.status).toBe(204)
    const recipe = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/recipe`)
      .set('Authorization', managerRequestAuthorization())
    expect(recipe.body.recipe).toMatchObject({ yieldQuantity: 3, ingredients: [] })
  })
})
