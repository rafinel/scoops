import {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  managerRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Update Recipe Ingredient Controller [PATCH /products/:productId/recipe/ingredients/:lineId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates only the recipe line quantity and recalculates its projection', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 2 }),
    )
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 10)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Cookie', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })
    const added = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 0.5 })
    const lineId = added.body.recipe.ingredients[0].id

    const updated = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/recipe/ingredients/${lineId}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ quantity: 1.25 })

    expect(updated.status).toBe(200)
    expect(updated.body.recipe.ingredients).toMatchObject([
      { id: lineId, ingredientProductId: ingredient.id, quantity: 1.25, lineCost: 2.5 },
    ])
  })

  it('updates the selected brand for a By-brand ingredient', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({
        name: 'Chocolate ingredient',
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const primary = await fixture.addBrand({
      productId: ingredient.id,
      name: 'Marca principal',
      unit: ProductUnit.Kilogram,
      packageQuantity: 1,
      packagePrice: 4,
      isPrimary: true,
    })
    const alternate = await fixture.addBrand({
      productId: ingredient.id,
      name: 'Marca alternativa',
      unit: ProductUnit.Kilogram,
      packageQuantity: 1,
      packagePrice: 5,
      isPrimary: false,
    })
    await fixture.balances.initialize(ingredient.id, primary.id)
    await fixture.balances.add({ productId: ingredient.id, brandId: primary.id }, 10)
    await fixture.balances.initialize(ingredient.id, alternate.id)
    await fixture.balances.add({ productId: ingredient.id, brandId: alternate.id }, 6)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Cookie', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })
    const added = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 1 })
    const lineId = added.body.recipe.ingredients[0].id

    const updated = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/recipe/ingredients/${lineId}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ingredientBrandId: alternate.id, quantity: 1 })

    expect(updated.status).toBe(200)
    expect(updated.body.recipe.ingredients).toMatchObject([
      {
        id: lineId,
        ingredientBrandId: alternate.id,
        ingredientBrandName: 'Marca alternativa',
        unitCost: 5,
        currentBalance: 6,
      },
    ])
    await expect(
      fixture.recipeIngredients.findById(
        product.establishmentId,
        added.body.recipe.id,
        lineId,
      ),
    ).resolves.toMatchObject({ ingredientBrandId: alternate.id })
    expect(primary.id).not.toBe(alternate.id)
  })
})
