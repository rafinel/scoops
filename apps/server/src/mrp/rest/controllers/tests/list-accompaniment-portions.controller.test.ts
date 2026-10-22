import { ProductCategory } from '@scoops/core/mrp/domain/structures'
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

describe('List Accompaniment Portions Controller [GET /products/:productId/portions]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  async function addAccompaniment(name = 'Granola', overrides = {}) {
    return fixture.addProduct(
      createProduct({
        name,
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 4,
        accompanimentPrice: 3.5,
        ...overrides,
      }),
    )
  }

  async function addPortion(name: string, overrides = {}) {
    return fixture.addProduct(
      createProduct({ name, categories: [ProductCategory.Portion], ...overrides }),
    )
  }

  async function addType(name = 'Toppings') {
    return fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.establishmentId,
      name,
    })
  }

  function get(path: string, cookie = managerRequestAuthorization()) {
    return request(fixture.app.getHttpServer()).get(path).set('Cookie', cookie)
  }

  it('lists the linked Portions by case-insensitive name, ten per page, and the last page for a page beyond it', async () => {
    const accompaniment = await addAccompaniment()
    const otherAccompaniment = await addAccompaniment('Other Accompaniment')
    const type = await addType()
    const names = [
      'bravo 02',
      'Alpha 01',
      'charlie 03',
      'Delta 04',
      'echo 05',
      'Foxtrot 06',
      'golf 07',
      'Hotel 08',
      'india 09',
      'Juliet 10',
      'kilo 11',
      'Lima 12',
    ]
    const portions = await Promise.all(names.map((name) => addPortion(name)))
    await addPortion('Unlinked Portion')
    const rows = await fixture.productAccompaniments.addMany(
      portions.map((portion, index) => ({
        establishmentId: portion.establishmentId,
        productId: portion.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: index + 1,
        // Each link carries its own price; the last Portion has none.
        accompanimentPrice: index === names.length - 1 ? undefined : 3.5 + index,
      })),
    )
    await fixture.addProductAccompaniment({
      establishmentId: portions[0].establishmentId,
      productId: portions[0].id,
      accompanimentProductId: otherAccompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const foreignPortion = await addPortion('Aardvark foreign', {
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
    })
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      name: 'Foreign type',
    })
    await fixture.addProductAccompaniment({
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      productId: foreignPortion.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: foreignType.id,
      quantityPerPortion: 1,
    })

    const first = await get(`/products/${accompaniment.id}/portions`)
    const second = await get(`/products/${accompaniment.id}/portions?page=2&pageSize=10`)
    const beyond = await get(`/products/${accompaniment.id}/portions?page=9`)

    expect(first.status).toBe(200)
    expect(first.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 12,
      totalPages: 2,
      hasPortionProducts: true,
    })
    expect(
      first.body.items.map(
        (item: { portionProductName: string }) => item.portionProductName,
      ),
    ).toEqual([
      'Alpha 01',
      'bravo 02',
      'charlie 03',
      'Delta 04',
      'echo 05',
      'Foxtrot 06',
      'golf 07',
      'Hotel 08',
      'india 09',
      'Juliet 10',
    ])
    const bravoRow = rows.find((row) => row.productId === portions[0].id)
    expect(first.body.items[1]).toEqual({
      id: bravoRow?.id,
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Granola',
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'Toppings',
      unit: 'kg',
      quantityPerPortion: 1,
      salePrice: 3.5,
      isGlobal: false,
      hasOtherPortionLinks: true,
      unitCost: 4,
      estimatedCost: 4,
      portionProductId: portions[0].id,
      portionProductName: 'bravo 02',
    })
    expect(
      second.body.items.map(
        (item: { portionProductName: string }) => item.portionProductName,
      ),
    ).toEqual(['kilo 11', 'Lima 12'])
    expect(second.body).toMatchObject({ page: 2, total: 12, totalPages: 2 })
    expect(first.body.items[0]).toMatchObject({
      portionProductName: 'Alpha 01',
      salePrice: 4.5,
    })
    expect(
      second.body.items.map((item: { salePrice: number | null }) => item.salePrice),
    ).toEqual([13.5, null])
    expect(beyond.status).toBe(200)
    expect(beyond.body).toMatchObject({ page: 2, totalPages: 2, total: 12 })
    expect(beyond.body.items).toHaveLength(2)
    expect(JSON.stringify([first.body, second.body])).not.toContain('Aardvark foreign')
  })

  it('honours pageSize and filters by a case-insensitive trimmed partial Portion name', async () => {
    const accompaniment = await addAccompaniment()
    const type = await addType()
    const portions = await Promise.all(
      ['Banana split', 'Açaí bowl', 'banana cup', 'Cacau'].map((name) =>
        addPortion(name),
      ),
    )
    await fixture.productAccompaniments.addMany(
      portions.map((portion) => ({
        establishmentId: portion.establishmentId,
        productId: portion.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })),
    )

    const sized = await get(`/products/${accompaniment.id}/portions?pageSize=3`)
    const searched = await get(
      `/products/${accompaniment.id}/portions?search=${encodeURIComponent('  BANANA ')}`,
    )
    const accented = await get(
      `/products/${accompaniment.id}/portions?search=${encodeURIComponent('açaí')}`,
    )
    const blank = await get(`/products/${accompaniment.id}/portions?search=%20%20`)

    expect(sized.body).toMatchObject({ pageSize: 3, total: 4, totalPages: 2 })
    expect(sized.body.items).toHaveLength(3)
    expect(
      searched.body.items.map(
        (item: { portionProductName: string }) => item.portionProductName,
      ),
    ).toEqual(['banana cup', 'Banana split'])
    expect(searched.body.total).toBe(2)
    expect(
      accented.body.items.map(
        (item: { portionProductName: string }) => item.portionProductName,
      ),
    ).toEqual(['Açaí bowl'])
    expect(blank.body.total).toBe(4)
  })

  it('treats percent and underscore in the search as literal characters', async () => {
    const accompaniment = await addAccompaniment()
    const type = await addType()
    const portions = await Promise.all(
      ['100% Fruit', '100X Fruit', 'a_b', 'axb'].map((name) => addPortion(name)),
    )
    await fixture.productAccompaniments.addMany(
      portions.map((portion) => ({
        establishmentId: portion.establishmentId,
        productId: portion.id,
        accompanimentProductId: accompaniment.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })),
    )

    const percent = await get(`/products/${accompaniment.id}/portions?search=%25`)
    const underscore = await get(`/products/${accompaniment.id}/portions?search=_`)

    expect(
      percent.body.items.map(
        (item: { portionProductName: string }) => item.portionProductName,
      ),
    ).toEqual(['100% Fruit'])
    expect(
      underscore.body.items.map(
        (item: { portionProductName: string }) => item.portionProductName,
      ),
    ).toEqual(['a_b'])
  })

  it('returns an empty page with zero pages, telling whether Portions exist', async () => {
    const accompaniment = await addAccompaniment()
    const empty = await get(`/products/${accompaniment.id}/portions`)
    await addPortion('Unlinked')
    const withPortions = await get(`/products/${accompaniment.id}/portions`)
    const noMatch = await get(`/products/${accompaniment.id}/portions?search=zzz&page=3`)

    expect(empty.status).toBe(200)
    expect(empty.body).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      hasPortionProducts: false,
    })
    expect(withPortions.body).toMatchObject({
      items: [],
      total: 0,
      hasPortionProducts: true,
    })
    expect(noMatch.body).toMatchObject({ items: [], page: 3, totalPages: 0 })
  })

  it('marks global rows and keeps the global listable', async () => {
    const accompaniment = await addAccompaniment()
    const type = await addType()
    const portions = await Promise.all([addPortion('Alpha'), addPortion('Bravo')])
    await addGlobalAccompanimentWithRows(fixture, {
      target: accompaniment,
      type,
      portions,
      quantityPerPortion: 2,
      accompanimentPrice: 7,
    })

    const response = await get(`/products/${accompaniment.id}/portions`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(2)
    for (const item of response.body.items) {
      expect(item).toMatchObject({
        isGlobal: true,
        hasOtherPortionLinks: false,
        quantityPerPortion: 2,
        salePrice: 7,
      })
    }
  })

  it('shows the global price on every global row and null when the global has none', async () => {
    const priced = await addAccompaniment('Priced Global')
    const unpriced = await addAccompaniment('Unpriced Global')
    const type = await addType()
    const portions = await Promise.all([addPortion('Alpha'), addPortion('Bravo')])
    await addGlobalAccompanimentWithRows(fixture, {
      target: priced,
      type,
      portions,
      accompanimentPrice: 0,
    })
    await addGlobalAccompanimentWithRows(fixture, {
      target: unpriced,
      type,
      portions,
      accompanimentPrice: undefined,
    })

    const pricedResponse = await get(`/products/${priced.id}/portions`)
    const unpricedResponse = await get(`/products/${unpriced.id}/portions`)

    expect(
      pricedResponse.body.items.map(
        (item: { salePrice: number | null }) => item.salePrice,
      ),
    ).toEqual([0, 0])
    expect(
      unpricedResponse.body.items.map(
        (item: { salePrice: number | null }) => item.salePrice,
      ),
    ).toEqual([null, null])
  })

  it('lets Operators read the same page', async () => {
    const accompaniment = await addAccompaniment()
    const type = await addType()
    const portion = await addPortion('Alpha')
    await fixture.addProductAccompaniment({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const manager = await get(`/products/${accompaniment.id}/portions`)
    const operator = await get(
      `/products/${accompaniment.id}/portions`,
      operatorRequestAuthorization(),
    )

    expect(operator.status).toBe(200)
    expect(operator.body).toEqual(manager.body)
  })

  it('rejects malformed queries and identifiers', async () => {
    const accompaniment = await addAccompaniment()

    for (const query of [
      'page=0',
      'page=abc',
      'page=1.5',
      'pageSize=0',
      'pageSize=101',
      'pageSize=abc',
      'unknown=1',
      `search=${'a'.repeat(121)}`,
    ]) {
      const response = await get(`/products/${accompaniment.id}/portions?${query}`)
      expect(response.status, query).toBe(422)
    }
    const malformedId = await get('/products/not-a-uuid/portions')
    expect(malformedId.status).toBe(400)
  })

  it('accepts the page size boundaries', async () => {
    const accompaniment = await addAccompaniment()

    const smallest = await get(`/products/${accompaniment.id}/portions?pageSize=1`)
    const largest = await get(`/products/${accompaniment.id}/portions?pageSize=100`)

    expect(smallest.body.pageSize).toBe(1)
    expect(largest.body.pageSize).toBe(100)
  })

  it('rejects unauthenticated, unknown, foreign and ineligible products', async () => {
    const accompaniment = await addAccompaniment()
    const portion = await addPortion('Plain portion')
    const legacy = await fixture.addProduct(
      createProduct({
        name: 'Legacy',
        categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
      }),
    )
    const foreignAccompaniment = await addAccompaniment('Foreign Granola', {
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
    })

    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${accompaniment.id}/portions`,
    )
    const unknown = await get('/products/00000000-0000-4000-8000-000000000099/portions')
    const foreignFromManager = await get(`/products/${foreignAccompaniment.id}/portions`)
    const foreignManagerOnOwn = await get(
      `/products/${accompaniment.id}/portions`,
      foreignManagerRequestAuthorization(),
    )
    const notAccompaniment = await get(`/products/${portion.id}/portions`)
    const legacyResponse = await get(`/products/${legacy.id}/portions`)

    expect(anonymous.status).toBe(401)
    expect(unknown.status).toBe(404)
    expect(foreignFromManager.status).toBe(404)
    expect(foreignManagerOnOwn.status).toBe(404)
    expect(notAccompaniment.status).toBe(400)
    expect(legacyResponse.status).toBe(400)
  })
})
