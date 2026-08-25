import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Product Category Removal Impact Controller [GET /products/:productId/category-removal-impact]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns semantic portion dependencies from the owning establishment', async () => {
    const product = await fixture.addProduct(
      createProduct({
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      }),
    )
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Small',
      quantity: 0.25,
      price: 10,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/category-removal-impact?category=portion`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      category: 'portion',
      canRemove: false,
      dependencies: [
        {
          kind: 'portion-size',
          productId: product.id,
          productName: product.name,
          sizeCount: 1,
        },
      ],
    })
  })

  it('does not expose another establishment product or dependencies', async () => {
    const product = await fixture.addProduct(createProduct())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/category-removal-impact?category=ingredient`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/category-removal-impact?category=ingredient`)
      .set('Authorization', operatorRequestAuthorization())
    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/category-removal-impact?category=ingredient`)
      .set('Authorization', foreignManagerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(response.status).toBe(404)
  })
})
