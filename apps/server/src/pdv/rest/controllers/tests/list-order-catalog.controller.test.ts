import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import {
  PdvModuleFixture,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import {
  CATALOG_SEARCH,
  addAvailableCatalogResale,
  addStock,
  missingProductFields,
  namesOf,
  seedSalesCatalog,
  undocumentedProductFields,
} from './sales-catalog-controller-test-helpers'

describe('List Order Catalog Controller [GET /orders/catalog]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  function getCatalog(query: string, cookie = managerRequestAuthorization()) {
    return request(fixture.app.getHttpServer())
      .get(`/orders/catalog${query}`)
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

  it('returns only available products by default, including a free product in stock', async () => {
    const seeded = await seedSalesCatalog(fixture)

    const response = await getCatalog('?pageSize=50')
    const whitespace = await getCatalog('?pageSize=50&search=%20%20%20')

    const available = seeded.filter(({ availability }) => availability === 'available')
    expect(available).toHaveLength(6)
    expect(response.status).toBe(200)
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

  it('adds only availability to the existing product fields', async () => {
    await seedSalesCatalog(fixture)

    const response = await getCatalog(`?pageSize=50&search=${CATALOG_SEARCH}`)

    expect(response.body.items).toHaveLength(18)
    for (const item of response.body.items) {
      expect(undocumentedProductFields(item)).toEqual([])
      expect(missingProductFields(item)).toEqual([])
    }
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

  it('returns the catalog to managers and operators but not to anonymous callers', async () => {
    await seedSalesCatalog(fixture)

    const manager = await getCatalog('?page=1&pageSize=20')
    const operator = await getCatalog(
      '?page=1&pageSize=20',
      operatorRequestAuthorization(),
    )
    const anonymous = await request(fixture.app.getHttpServer()).get(
      '/orders/catalog?page=1&pageSize=20',
    )

    expect(manager.status).toBe(200)
    expect(manager.body.total).toBe(6)
    expect(operator.status).toBe(200)
    expect(operator.body).toEqual(manager.body)
    expect(anonymous.status).toBe(401)
  })

  it('rejects malformed queries before the use case', async () => {
    const response = await getCatalog('?pageSize=51')

    expect(response.status).toBe(422)
    expect(response.body).not.toHaveProperty('items')
  })

  it('uses saved accompaniment price once and leaves unconfigured legacy links unavailable', async () => {
    const product = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Portion with topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    await addStock(fixture, product.id, true)
    const topping = await fixture.addProduct({
      establishmentId: product.establishmentId,
      name: 'Topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Accompaniment],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 0.03,
      accompanimentPrice: 3.25,
    })
    const legacyTopping = await fixture.addProduct({
      establishmentId: product.establishmentId,
      name: 'Legacy topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Accompaniment],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 5,
    })
    const freeTopping = await fixture.addProduct({
      establishmentId: product.establishmentId,
      name: 'Free topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Accompaniment],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 5,
      accompanimentPrice: 0,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: product.establishmentId,
      name: 'Toppings',
    })
    await Promise.all(
      [topping, legacyTopping, freeTopping].map(async (target) => {
        await fixture.stockBalances.initialize(target.id)
        await fixture.stockBalances.add({ productId: target.id }, 20)
      }),
    )
    const accompaniment = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: product.id,
      accompanimentProductId: topping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 2.5,
    })
    const legacyAccompaniment = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: product.id,
      accompanimentProductId: legacyTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 3,
    })
    const freeAccompaniment = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: product.id,
      accompanimentProductId: freeTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 4,
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?page=1&pageSize=20')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    const catalogProduct = response.body.items.find(
      (item: { productId: string }) => item.productId === product.id,
    )
    expect(catalogProduct).toBeDefined()
    expect(catalogProduct.sizes).toEqual([
      expect.objectContaining({
        sizeId: size.id,
        basePrice: 10,
      }),
    ])
    expect(catalogProduct.sizes[0].accompaniments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accompanimentId: accompaniment.id,
          quantityPerPortion: 2.5,
          basePrice: 3.25,
          isActive: true,
          isAvailable: true,
        }),
        expect.objectContaining({
          accompanimentId: legacyAccompaniment.id,
          quantityPerPortion: 3,
          basePrice: 0,
          isActive: false,
          isAvailable: false,
        }),
        expect.objectContaining({
          accompanimentId: freeAccompaniment.id,
          quantityPerPortion: 4,
          basePrice: 0,
          isActive: true,
          isAvailable: true,
        }),
      ]),
    )
  })
  it('offers a global accompaniment exactly like an individual one and shows an inactive global unavailable', async () => {
    const product = await fixture.addProduct({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Portion with global topping',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    await addStock(fixture, product.id, true)
    const createTopping = (name: string, accompanimentPrice: number) =>
      fixture.addProduct({
        establishmentId: product.establishmentId,
        name,
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Accompaniment],
        stockControl: ProductStockControl.Single,
        status: ProductStatus.Active,
        allowNegativeStock: false,
        idealStock: 0,
        currentUnitCost: 0.03,
        accompanimentPrice,
      })
    const individualTopping = await createTopping('Individual topping', 2)
    const globalTopping = await createTopping('Global topping', 3.5)
    const freeGlobalTopping = await createTopping('Free global topping', 0)
    const type = await fixture.addAccompanimentType({
      establishmentId: product.establishmentId,
      name: 'Toppings',
    })
    for (const target of [individualTopping, globalTopping, freeGlobalTopping]) {
      await fixture.stockBalances.initialize(target.id)
      await fixture.stockBalances.add({ productId: target.id }, 20)
    }
    const individual = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: product.id,
      accompanimentProductId: individualTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 2,
    })
    const global = await fixture.addGlobalAccompaniment({
      establishmentId: product.establishmentId,
      accompanimentProductId: globalTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1.5,
    })
    const freeGlobal = await fixture.addGlobalAccompaniment({
      establishmentId: product.establishmentId,
      accompanimentProductId: freeGlobalTopping.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 0.5,
    })
    const [globalRow, freeGlobalRow] = await fixture.productAccompaniments.addMany([
      {
        establishmentId: product.establishmentId,
        productId: product.id,
        accompanimentProductId: globalTopping.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.5,
        globalAccompanimentId: global.id,
      },
      {
        establishmentId: product.establishmentId,
        productId: product.id,
        accompanimentProductId: freeGlobalTopping.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.5,
        globalAccompanimentId: freeGlobal.id,
      },
    ])

    const available = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?page=1&pageSize=20')
      .set('Cookie', operatorRequestAuthorization())
    await fixture.products.replace(globalTopping.establishmentId, globalTopping.id, {
      status: ProductStatus.Inactive,
    })
    const afterInactivation = await request(fixture.app.getHttpServer())
      .get('/orders/catalog?page=1&pageSize=20')
      .set('Cookie', operatorRequestAuthorization())

    const accompanimentsOf = (response: request.Response) =>
      response.body.items.find(
        (item: { productId: string }) => item.productId === product.id,
      ).sizes[0].accompaniments
    expect(available.status).toBe(200)
    expect(
      available.body.items.find(
        (item: { productId: string }) => item.productId === product.id,
      ).sizes[0].sizeId,
    ).toBe(size.id)
    expect(accompanimentsOf(available)).toHaveLength(3)
    expect(accompanimentsOf(available)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accompanimentId: individual.id,
          quantityPerPortion: 2,
          basePrice: 2,
          isActive: true,
          isAvailable: true,
        }),
        expect.objectContaining({
          accompanimentId: globalRow.id,
          quantityPerPortion: 1.5,
          basePrice: 3.5,
          isActive: true,
          isAvailable: true,
        }),
        expect.objectContaining({
          accompanimentId: freeGlobalRow.id,
          quantityPerPortion: 0.5,
          basePrice: 0,
          isActive: true,
          isAvailable: true,
        }),
      ]),
    )
    expect(afterInactivation.status).toBe(200)
    expect(accompanimentsOf(afterInactivation)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accompanimentId: globalRow.id,
          isActive: false,
          isAvailable: false,
        }),
        expect.objectContaining({
          accompanimentId: individual.id,
          isActive: true,
          isAvailable: true,
        }),
      ]),
    )
  })
})
