import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import {
  PdvModuleFixture,
  operatorRequestAuthorization,
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import {
  CATALOG_SEARCH,
  addAvailableCatalogResale,
  missingProductFields,
  namesOf,
  seedSalesCatalog,
  undocumentedProductFields,
} from './sales-catalog-controller-test-helpers'

describe('List Combo Products Controller [GET /discounts/catalog]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  function getCatalog(query: string, cookie = managerRequestAuthorization()) {
    return request(fixture.app.getHttpServer())
      .get(`/discounts/catalog${query}`)
      .set('Cookie', cookie)
  }

  function summarize(item: {
    productId: string
    name: string
    availability: string
    isAvailable: boolean
  }) {
    const { productId, name, availability, isAvailable } = item
    return { productId, name, availability, isAvailable }
  }

  it('returns only available products of the current establishment by default', async () => {
    const seeded = await seedSalesCatalog(fixture)

    const response = await getCatalog('?pageSize=50')
    const whitespace = await getCatalog('?pageSize=50&search=%20%20%20')

    const available = seeded.filter(({ availability }) => availability === 'available')
    expect(available).toHaveLength(6)
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 50,
      total: 6,
      totalPages: 1,
    })
    expect(namesOf(response.body.items)).toEqual(namesOf(available))
    expect(response.body.items).toEqual(
      expect.arrayContaining(
        available.map(({ id }) =>
          expect.objectContaining({
            productId: id,
            availability: 'available',
            isAvailable: true,
          }),
        ),
      ),
    )
    expect(whitespace.status).toBe(200)
    expect(whitespace.body).toEqual(response.body)
  })

  it('reveals every matching availability in name order when searching', async () => {
    const seeded = await seedSalesCatalog(fixture)

    const response = await getCatalog(`?pageSize=50&search=${CATALOG_SEARCH}`)
    const trimmed = await getCatalog(`?pageSize=50&search=%20${CATALOG_SEARCH}%20`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ total: 18, totalPages: 1 })
    expect(response.body.items.map(summarize)).toEqual(
      seeded.map(({ id, name, availability }) => ({
        productId: id,
        name,
        availability,
        isAvailable: availability === 'available',
      })),
    )
    expect(trimmed.body).toEqual(response.body)
  })

  it('classifies Portion, single-stock Resale and by-brand Resale by their own prices and stock', async () => {
    const seeded = await seedSalesCatalog(fixture)

    const response = await getCatalog(`?pageSize=50&search=${CATALOG_SEARCH}`)

    for (const product of seeded) {
      const item = response.body.items.find(
        ({ productId }: { productId: string }) => productId === product.id,
      )
      expect(item, product.name).toMatchObject({
        kind: product.kind,
        stockControl: product.variant === 'brand-resale' ? 'by-brand' : 'single',
        availability: product.availability,
        isAvailable: product.availability === 'available',
      })
    }
    expect(seeded.map(({ availability }) => availability)).toEqual(
      expect.arrayContaining(['available', 'out_of_stock', 'missing_price']),
    )
  })

  it('adds only availability to the existing product fields', async () => {
    await seedSalesCatalog(fixture)

    const response = await getCatalog(`?pageSize=50&search=${CATALOG_SEARCH}`)

    expect(response.body.items).toHaveLength(18)
    for (const item of response.body.items) {
      expect(undocumentedProductFields(item)).toEqual([])
      expect(missingProductFields(item)).toEqual([])
    }
  })

  it('serializes the existing resale fields next to the availability', async () => {
    const seeded = await seedSalesCatalog(fixture)
    const single = seeded.find(({ name }) => name.endsWith('single-resale available'))

    const response = await getCatalog(`?pageSize=50&kind=resale&search=${CATALOG_SEARCH}`)

    expect(response.body.items).toContainEqual(
      expect.objectContaining({
        productId: single?.id,
        name: single?.name,
        kind: 'resale',
        stockControl: 'single',
        isActive: true,
        isAvailable: true,
        availability: 'available',
        resalePrice: 10,
        resaleBrands: [],
      }),
    )
  })

  it('narrows by kind without revealing unavailable products unless searching', async () => {
    const seeded = await seedSalesCatalog(fixture)
    const ofKind = (kind: string) => seeded.filter((product) => product.kind === kind)

    const portions = await getCatalog('?pageSize=50&kind=portion')
    const resales = await getCatalog('?pageSize=50&kind=resale')
    const searchedPortions = await getCatalog(
      `?pageSize=50&kind=portion&search=${CATALOG_SEARCH}`,
    )
    const searchedResales = await getCatalog(
      `?pageSize=50&kind=resale&search=${CATALOG_SEARCH}`,
    )

    const availableOf = (kind: string) =>
      ofKind(kind).filter(({ availability }) => availability === 'available')
    expect(namesOf(portions.body.items)).toEqual(namesOf(availableOf('portion')))
    expect(namesOf(resales.body.items)).toEqual(namesOf(availableOf('resale')))
    expect(resales.body.total).toBe(4)
    expect(namesOf(searchedPortions.body.items)).toEqual(namesOf(ofKind('portion')))
    expect(namesOf(searchedResales.body.items)).toEqual(namesOf(ofKind('resale')))
    expect(searchedResales.body.total).toBe(12)
  })

  it('counts and paginates only the returned set', async () => {
    const seeded = await seedSalesCatalog(fixture)
    const available = seeded.filter(({ availability }) => availability === 'available')

    const defaultFirst = await getCatalog('?pageSize=1&page=1')
    const defaultSecond = await getCatalog('?pageSize=1&page=2')
    const searchedFirst = await getCatalog(`?pageSize=1&page=1&search=${CATALOG_SEARCH}`)
    const searchedSecond = await getCatalog(`?pageSize=1&page=2&search=${CATALOG_SEARCH}`)
    const beyond = await getCatalog('?pageSize=1&page=7')

    expect(defaultFirst.body).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 6,
      totalPages: 6,
    })
    expect(namesOf(defaultFirst.body.items)).toEqual([available[0]?.name])
    expect(namesOf(defaultSecond.body.items)).toEqual([available[1]?.name])
    expect(searchedFirst.body).toMatchObject({ pageSize: 1, total: 18, totalPages: 18 })
    expect(namesOf(searchedFirst.body.items)).toEqual([seeded[0]?.name])
    expect(namesOf(searchedSecond.body.items)).toEqual([seeded[1]?.name])
    expect(beyond.status).toBe(200)
    expect(beyond.body).toMatchObject({ items: [], total: 6, totalPages: 6 })
  })

  it('never returns a same-named product from another establishment', async () => {
    const [seeded] = await seedSalesCatalog(fixture)
    await addAvailableCatalogResale(
      fixture,
      seeded?.name ?? '',
      PdvModuleFixture.accounts.foreignEstablishmentId,
    )

    const searched = await getCatalog(
      `?pageSize=50&search=${encodeURIComponent(seeded?.name ?? '')}`,
    )
    const defaultList = await getCatalog('?pageSize=50')

    expect(searched.status).toBe(200)
    expect(
      searched.body.items.map(({ productId }: { productId: string }) => productId),
    ).toEqual([seeded?.id])
    expect(defaultList.body.total).toBe(6)
  })

  it('rejects malformed catalog pagination at the HTTP boundary', async () => {
    const response = await getCatalog('?pageSize=51')

    expect(response.status).toBe(422)
  })

  it('denies Operator access to this Manager-only route before controller execution', async () => {
    const operator = await getCatalog('', operatorRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).get('/discounts/catalog')

    expect(operator.status).toBe(403)
    expect(anonymous.status).toBe(401)
  })
})
