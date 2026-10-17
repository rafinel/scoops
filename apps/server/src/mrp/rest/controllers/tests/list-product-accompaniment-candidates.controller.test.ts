import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('List Product Accompaniment Candidates Controller [GET /products/:productId/accompaniments/candidates]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  function addAccompaniment(name: string, overrides = {}) {
    return fixture.addProduct(
      createProduct({
        name,
        categories: [ProductCategory.Accompaniment],
        ...overrides,
      }),
    )
  }

  it('returns only eligible products absent from the Portion, ordered by name, with candidate facts', async () => {
    const portion = await fixture.addProduct(
      createProduct({ name: 'Candidate Portion', categories: [ProductCategory.Portion] }),
    )
    const otherPortion = await fixture.addProduct(
      createProduct({ name: 'Other Portion', categories: [ProductCategory.Portion] }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: portion.establishmentId,
      name: 'Toppings',
    })
    const eligibleUnpriced = await addAccompaniment('Zebra Sprinkles', {
      unit: ProductUnit.Unit,
      stockControl: ProductStockControl.Single,
    })
    const eligiblePriced = await addAccompaniment('Almond', {
      accompanimentPrice: 3.5,
    })
    const linkedElsewhere = await addAccompaniment('Linked Elsewhere', {
      accompanimentPrice: 0,
    })
    const individualHere = await addAccompaniment('Individual Here', {
      accompanimentPrice: 2,
    })
    const globalPresent = await addAccompaniment('Global Present', {
      accompanimentPrice: 2,
    })
    const globalRemoved = await addAccompaniment('Global Removed', {
      accompanimentPrice: 4.25,
    })
    const inactive = await addAccompaniment('Inactive', {
      status: ProductStatus.Inactive,
      accompanimentPrice: 1,
    })
    const portionOnly = await fixture.addProduct(
      createProduct({ name: 'Portion Product', categories: [ProductCategory.Portion] }),
    )
    const foreign = await addAccompaniment('Foreign Accompaniment', {
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      accompanimentPrice: 1,
    })
    await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: otherPortion.id,
      accompanimentProductId: linkedElsewhere.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: individualHere.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await addGlobalAccompanimentWithRows(fixture, {
      target: globalPresent,
      type,
      portions: [portion, otherPortion],
    })
    const removed = await addGlobalAccompanimentWithRows(fixture, {
      target: globalRemoved,
      type,
      portions: [portion, otherPortion],
      quantityPerPortion: 0.25,
    })
    await fixture.productAccompaniments.remove(
      portion.establishmentId,
      portion.id,
      removed.rows[0].id,
    )

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments/candidates`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body.map((candidate: { name: string }) => candidate.name)).toEqual([
      'Almond',
      'Global Removed',
      'Linked Elsewhere',
      'Zebra Sprinkles',
    ])
    expect(response.body[0]).toEqual({
      productId: eligiblePriced.id,
      name: 'Almond',
      unit: ProductUnit.Kilogram,
      stockControl: ProductStockControl.Single,
      accompanimentPrice: 3.5,
      isGlobal: false,
      hasPortionLinks: false,
    })
    expect(response.body[1]).toEqual({
      productId: globalRemoved.id,
      name: 'Global Removed',
      unit: ProductUnit.Kilogram,
      stockControl: ProductStockControl.Single,
      accompanimentPrice: 4.25,
      isGlobal: true,
      hasPortionLinks: false,
      global: { accompanimentTypeId: type.id, quantityPerPortion: 0.25 },
    })
    expect(response.body[2]).toMatchObject({
      productId: linkedElsewhere.id,
      accompanimentPrice: 0,
      isGlobal: false,
      hasPortionLinks: true,
    })
    expect(response.body[2]).not.toHaveProperty('global')
    expect(response.body[3]).toMatchObject({
      productId: eligibleUnpriced.id,
      unit: ProductUnit.Unit,
      accompanimentPrice: null,
    })
    const returnedIds = response.body.map(
      (candidate: { productId: string }) => candidate.productId,
    )
    for (const excludedId of [
      individualHere.id,
      globalPresent.id,
      inactive.id,
      portionOnly.id,
      portion.id,
      foreign.id,
    ]) {
      expect(returnedIds).not.toContain(excludedId)
    }
  })

  it('returns an empty list for a Portion without candidates', async () => {
    const portion = await fixture.addProduct(
      createProduct({ name: 'Lonely Portion', categories: [ProductCategory.Portion] }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments/candidates`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('rejects Operators, anonymous callers, invalid owners and foreign Portions', async () => {
    const portion = await fixture.addProduct(
      createProduct({ name: 'Guarded Portion', categories: [ProductCategory.Portion] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Plain Ingredient' }),
    )
    const foreignPortion = await fixture.addProduct(
      createProduct({
        name: 'Foreign Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${portion.id}/accompaniments/candidates`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments/candidates`)
      .set('Cookie', operatorRequestAuthorization())
    const notPortion = await request(fixture.app.getHttpServer())
      .get(`/products/${ingredient.id}/accompaniments/candidates`)
      .set('Cookie', managerRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${foreignPortion.id}/accompaniments/candidates`)
      .set('Cookie', managerRequestAuthorization())
    const foreignManagerOnOwnPortion = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments/candidates`)
      .set('Cookie', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/accompaniments/candidates')
      .set('Cookie', managerRequestAuthorization())
    const malformed = await request(fixture.app.getHttpServer())
      .get('/products/not-a-uuid/accompaniments/candidates')
      .set('Cookie', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(notPortion.status).toBe(400)
    expect(foreign.status).toBe(404)
    expect(foreignManagerOnOwnPortion.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(malformed.status).toBe(400)
  })
})
