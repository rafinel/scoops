import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('List Products Controller [GET /products]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('filters portions by the accompaniment product within the tenant', async () => {
    const accompaniment = await fixture.addProduct(createProduct({ name: 'Syrup' }))
    const used = await fixture.addProduct(createProduct({ name: 'Sundae' }))
    const unused = await fixture.addProduct(createProduct({ name: 'Other Sundae' }))
    const type = await fixture.addAccompanimentType({
      establishmentId: used.establishmentId,
      name: 'Topping',
    })
    await fixture.addProductAccompaniment({
      establishmentId: used.establishmentId,
      productId: used.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products?usedAsAccompanimentId=${accompaniment.id}&page=1&pageSize=20`)
      .set('Cookie', managerRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products?usedAsAccompanimentId=${accompaniment.id}&page=1&pageSize=20`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products?usedAsAccompanimentId=${accompaniment.id}&page=1&pageSize=20`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products?usedAsAccompanimentId=${accompaniment.id}&page=1&pageSize=20`)
      .set('Cookie', foreignManagerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(
      response.body.items.map((item: { product: { id: string } }) => item.product.id),
    ).toEqual([used.id])
    expect(
      response.body.items.map((item: { product: { id: string } }) => item.product.id),
    ).not.toContain(unused.id)
    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(200)
    expect(foreign.body.items).toEqual([])
  })
})
