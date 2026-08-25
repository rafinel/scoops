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

describe('Get Product Settings Controller [GET /products/:productId/settings]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns complete settings with ISO dates and explicit nulls', async () => {
    const product = await fixture.addProduct(
      createProduct({
        idealStock: null,
        currentUnitCost: undefined,
        internalNotes: undefined,
      }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/settings`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      product: {
        id: product.id,
        establishmentId: product.establishmentId,
        name: product.name,
        allowNegativeStock: false,
        idealStock: null,
        currentUnitCost: null,
        internalNotes: null,
      },
    })
    expect(response.body.product.createdAt).toBe(product.createdAt.toISOString())
    expect(response.body.product.updatedAt).toBe(product.updatedAt.toISOString())
  })

  it('enforces manager authorization and tenant-safe not-found', async () => {
    const product = await fixture.addProduct(createProduct())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/settings`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/settings`)
      .set('Authorization', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/settings`)
      .set('Authorization', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/settings')
      .set('Authorization', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
  })
})
