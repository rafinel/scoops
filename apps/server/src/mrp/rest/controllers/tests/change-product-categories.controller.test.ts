import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  expectedUpdatedAt,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Change Product Categories Controller [PATCH /products/:productId/categories]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('adds a valid category and returns the refreshed product settings', async () => {
    const product = await fixture.addProduct(createProduct())
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Authorization', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    expect(response.body.product.categories).toEqual([
      ProductCategory.Ingredient,
      ProductCategory.Accompaniment,
    ])
  })

  it('rechecks current dependencies and rolls back a blocked removal', async () => {
    const product = await fixture.addProduct(
      createProduct({
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      }),
    )
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Current size',
      quantity: 0.5,
      price: 20,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Authorization', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient],
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(409)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({
      categories: [ProductCategory.Ingredient, ProductCategory.Portion],
    })
  })

  it('rejects manufacturable for products controlled by brand', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Authorization', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient, ProductCategory.Manufacturable],
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Produtos fabricáveis devem usar estoque único.')
  })

  it('rejects anonymous, operator, and foreign-establishment changes', async () => {
    const product = await fixture.addProduct(createProduct())
    const foreignProduct = await fixture.addProduct(
      createProduct({
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        name: 'Foreign Categories',
      }),
    )
    const body = {
      categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
      expectedUpdatedAt: expectedUpdatedAt(product),
    }

    const anonymous = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .send(body)
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Authorization', operatorRequestAuthorization())
      .send(body)
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${foreignProduct.id}/categories`)
      .set('Authorization', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
        expectedUpdatedAt: expectedUpdatedAt(foreignProduct),
      })
    const foreignManager = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Authorization', foreignManagerRequestAuthorization())
      .send(body)

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(foreignManager.status).toBe(404)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({ categories: [ProductCategory.Ingredient] })
  })
})
