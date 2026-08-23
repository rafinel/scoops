import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Product Accompaniments Controller [GET /products/:productId/accompaniments]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns current source projections in deterministic target order', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Pistachio Portion', categories: [ProductCategory.Portion] }),
    )
    const singleTarget = await fixture.addProduct(
      createProduct({
        name: 'Granola',
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 2.5,
      }),
    )
    const byBrandTarget = await fixture.addProduct(
      createProduct({
        name: 'Molho',
        categories: [ProductCategory.Accompaniment],
        stockControl: ProductStockControl.ByBrand,
        currentUnitCost: undefined,
      }),
    )
    const unavailableTarget = await fixture.addProduct(
      createProduct({
        name: 'Unavailable',
        categories: [ProductCategory.Accompaniment],
        status: ProductStatus.Inactive,
        currentUnitCost: undefined,
      }),
    )
    const brand = await fixture.addBrand({
      productId: byBrandTarget.id,
      name: 'Main Source',
      packageQuantity: 2,
      packagePrice: 10,
      isPrimary: true,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Toppings',
    })

    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: byBrandTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: unavailableTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 3,
    })
    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: singleTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1.25,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${owner.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body.product).toMatchObject({ id: owner.id, name: owner.name })
    expect(response.body.accompaniments).toHaveLength(3)
    expect(
      response.body.accompaniments.map(
        (item: { accompanimentProductName: string }) => item.accompanimentProductName,
      ),
    ).toEqual(['Granola', 'Molho', 'Unavailable'])
    expect(response.body.accompaniments[0]).toMatchObject({
      accompanimentProductId: singleTarget.id,
      accompanimentTypeName: 'Toppings',
      quantityPerPortion: 1.25,
      unitCost: 2.5,
      estimatedCost: 3.125,
    })
    expect(response.body.accompaniments[1]).toMatchObject({
      accompanimentProductId: byBrandTarget.id,
      brandId: brand.id,
      brandName: 'Main Source',
      unitCost: 5,
      estimatedCost: 5,
    })
    expect(response.body.accompaniments[2]).not.toHaveProperty('unitCost')
    expect(response.body.accompaniments[2]).not.toHaveProperty('brandId')
    expect(response.body.product.createdAt).toEqual(expect.any(String))
  })

  it('returns the empty projection for a valid Portion and rejects invalid owners safely', async () => {
    const portion = await fixture.addProduct(
      createProduct({ name: 'Empty Portion', categories: [ProductCategory.Portion] }),
    )
    const ingredient = await fixture.addProduct(createProduct({ name: 'Ingredient' }))

    const empty = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())
    const invalidOwner = await request(fixture.app.getHttpServer())
      .get(`/products/${ingredient.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/accompaniments')
      .set('Authorization', managerRequestAuthorization())

    expect(empty.status).toBe(200)
    expect(empty.body.accompaniments).toEqual([])
    expect(invalidOwner.status).toBe(400)
    expect(missing.status).toBe(404)
  })

  it('enforces authentication, Manager authorization, and tenant-safe not-found behavior', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Tenant Portion', categories: [ProductCategory.Portion] }),
    )
    const foreignProduct = await fixture.addProduct(
      createProduct({
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/accompaniments`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/accompaniments`)
      .set('Authorization', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${foreignProduct.id}/accompaniments`)
      .set('Authorization', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/accompaniments')
      .set('Authorization', foreignManagerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(200)
    expect(missing.status).toBe(404)
  })
})
