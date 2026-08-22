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

describe('Get Product Recipe Controller [GET /products/:productId/recipe]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns a nullable recipe without writing and preserves tenant/profile boundaries', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable] }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/recipe`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ product: { id: product.id }, recipe: null })
    expect(
      (
        await request(fixture.app.getHttpServer())
          .get(`/products/${product.id}/recipe`)
          .set('Authorization', operatorRequestAuthorization())
      ).status,
    ).toBe(403)
    expect(
      (
        await request(fixture.app.getHttpServer())
          .get(`/products/${product.id}/recipe`)
          .set('Authorization', foreignManagerRequestAuthorization())
      ).status,
    ).toBe(404)
  })
})
