import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import type { MrpModuleFixture as MrpFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Product Removal Impact Controller [GET /products/:productId/removal-impact]', () => {
  let fixture: MrpFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('reports removable current rows and retained stock history', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Historical brand',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.transactions.add({
      establishmentId: product.establishmentId,
      productId: product.id,
      brandId: brand.id,
      productName: product.name,
      brandName: brand.name,
      unit: product.unit,
      type: 'entry',
      quantity: 2,
      balanceAfter: 2,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-08-01T10:00:00.000Z'),
    })
    const recipe = await fixture.addRecipe({
      establishmentId: product.establishmentId,
      productId: product.id,
      yieldQuantity: 1,
    })
    const production = await fixture.addProduction({
      establishmentId: product.establishmentId,
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      recipeId: recipe.id,
      recipeYield: 1,
      quantity: 1,
      totalCost: 4,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-08-02T10:00:00.000Z'),
    })
    await fixture.addProductionIngredients([
      {
        establishmentId: product.establishmentId,
        productionId: production.id,
        ingredientProductId: product.id,
        ingredientProductName: product.name,
        ingredientBrandId: brand.id,
        ingredientBrandName: brand.name,
        unit: product.unit,
        quantity: 1,
        unitCost: 4,
        lineCost: 4,
        balanceAfter: 1,
      },
    ])
    await fixture.transactions.add({
      establishmentId: product.establishmentId,
      productId: product.id,
      brandId: brand.id,
      productionId: production.id,
      productName: product.name,
      brandName: brand.name,
      unit: product.unit,
      type: 'production-output',
      quantity: 1,
      balanceAfter: 3,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-08-02T10:00:00.000Z'),
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/removal-impact`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      productName: product.name,
      removable: {
        brands: 1,
        balances: 1,
        ownedRecipe: 1,
        sizes: 0,
        resaleConfigurations: 0,
        ownedAccompanimentLinks: 0,
        consumingRecipeLinks: 0,
        inverseAccompanimentLinks: 0,
      },
      retainedHistory: { stockTransactions: 2, productions: 1, orders: 0 },
    })
  })

  it('enforces anonymous, operator, and tenant-safe not-found behavior', async () => {
    const product = await fixture.addProduct(createProduct())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/removal-impact`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/removal-impact`)
      .set('Authorization', operatorRequestAuthorization())
    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/removal-impact`)
      .set('Authorization', foreignManagerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(response.status).toBe(404)
  })
})
