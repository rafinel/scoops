import { ProductCategory, ProductStatus } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('List Accompaniment Portion Candidates Controller [GET /products/:productId/portions/candidates]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  function addAccompaniment(name = 'Granola', overrides = {}) {
    return fixture.addProduct(
      createProduct({
        name,
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 3.5,
        ...overrides,
      }),
    )
  }

  function addPortion(name: string, overrides = {}) {
    return fixture.addProduct(
      createProduct({ name, categories: [ProductCategory.Portion], ...overrides }),
    )
  }

  function get(path: string, cookie = managerRequestAuthorization()) {
    return request(fixture.app.getHttpServer()).get(path).set('Cookie', cookie)
  }

  it('lists every Portion of any status without a row, ordered by name, unpaginated', async () => {
    const accompaniment = await addAccompaniment()
    const type = await fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.establishmentId,
      name: 'Toppings',
    })
    const linked = await addPortion('Linked portion')
    const zebra = await addPortion('zebra cup')
    const inactive = await addPortion('Bravo bowl', { status: ProductStatus.Inactive })
    const alpha = await addPortion('alpha cup')
    await addPortion('Ingredient only', { categories: [ProductCategory.Ingredient] })
    await addPortion('Legacy both', {
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    })
    await addPortion('Foreign portion', {
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
    })
    await fixture.addProductAccompaniment({
      establishmentId: linked.establishmentId,
      productId: linked.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const extra = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        addPortion(`extra ${String(index).padStart(2, '0')}`),
      ),
    )

    const response = await get(`/products/${accompaniment.id}/portions/candidates`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(16)
    expect(response.body.slice(0, 3)).toEqual([
      { productId: alpha.id, name: 'alpha cup', status: 'active' },
      { productId: inactive.id, name: 'Bravo bowl', status: 'inactive' },
      { productId: extra[0].id, name: 'extra 00', status: 'active' },
    ])
    expect(response.body.at(-2)).toMatchObject({ name: 'Legacy both' })
    expect(response.body.at(-1)).toEqual({
      productId: zebra.id,
      name: 'zebra cup',
      status: 'active',
    })
    const names = response.body.map((candidate: { name: string }) => candidate.name)
    expect(names).not.toContain('Linked portion')
    expect(names).not.toContain('Ingredient only')
    expect(names).not.toContain('Foreign portion')
  })

  it('includes the Portions excluded from a global once their rows are gone', async () => {
    const accompaniment = await addAccompaniment()
    const type = await fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.establishmentId,
      name: 'Toppings',
    })
    const present = await addPortion('Present')
    const excluded = await addPortion('Excluded')
    const global = await fixture.addGlobalAccompaniment({
      establishmentId: accompaniment.establishmentId,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await fixture.addProductAccompaniment({
      establishmentId: present.establishmentId,
      productId: present.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      globalAccompanimentId: global.id,
    })

    const response = await get(`/products/${accompaniment.id}/portions/candidates`)

    expect(response.body).toEqual([
      { productId: excluded.id, name: 'Excluded', status: 'active' },
    ])
  })

  it('returns an empty list when every Portion already has the Accompaniment or none exists', async () => {
    const accompaniment = await addAccompaniment()

    const response = await get(`/products/${accompaniment.id}/portions/candidates`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('is not shadowed by another portions route', async () => {
    const accompaniment = await addAccompaniment()
    const list = await get(`/products/${accompaniment.id}/portions`)
    const candidates = await get(`/products/${accompaniment.id}/portions/candidates`)

    expect(list.body).toHaveProperty('items')
    expect(Array.isArray(candidates.body)).toBe(true)
  })

  it('rejects Operators at the guard', async () => {
    const accompaniment = await addAccompaniment()
    await addPortion('Alpha')

    const response = await get(
      `/products/${accompaniment.id}/portions/candidates`,
      operatorRequestAuthorization(),
    )

    expect(response.status).toBe(403)
  })

  it('rejects unauthenticated, malformed, unknown, foreign and ineligible products', async () => {
    const accompaniment = await addAccompaniment()
    const portion = await addPortion('Plain portion')
    const legacy = await addPortion('Legacy', {
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    })
    const foreignAccompaniment = await addAccompaniment('Foreign Granola', {
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
    })

    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${accompaniment.id}/portions/candidates`,
    )
    const malformed = await get('/products/not-a-uuid/portions/candidates')
    const unknown = await get(
      '/products/00000000-0000-4000-8000-000000000099/portions/candidates',
    )
    const foreign = await get(`/products/${foreignAccompaniment.id}/portions/candidates`)
    const foreignManager = await get(
      `/products/${accompaniment.id}/portions/candidates`,
      foreignManagerRequestAuthorization(),
    )
    const notAccompaniment = await get(`/products/${portion.id}/portions/candidates`)
    const legacyResponse = await get(`/products/${legacy.id}/portions/candidates`)

    expect(anonymous.status).toBe(401)
    expect(malformed.status).toBe(400)
    expect(unknown.status).toBe(404)
    expect(foreign.status).toBe(404)
    expect(foreignManager.status).toBe(404)
    expect(notAccompaniment.status).toBe(400)
    expect(legacyResponse.status).toBe(400)
  })
})
