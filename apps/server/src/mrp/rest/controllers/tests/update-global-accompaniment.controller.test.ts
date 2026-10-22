import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import type { Product } from '@scoops/core/mrp/domain/entities'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  failSecondSalesConfigurationEvent,
  findEvents,
  findSalesConfigurationPayloads,
  findSalesConfigurationProductIds,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

const establishmentId = MrpModuleFixture.accounts.establishmentId
const foreignEstablishmentId = MrpModuleFixture.accounts.foreignEstablishmentId

describe('Update Global Accompaniment Controller [PATCH /products/:productId/global-accompaniment]', () => {
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
        currentUnitCost: 4,
        accompanimentPrice: 3.5,
        ...overrides,
      }),
    )
  }

  function addPortion(name: string) {
    return fixture.addProduct(
      createProduct({ name, categories: [ProductCategory.Portion] }),
    )
  }

  function addType(name = 'Toppings', targetEstablishmentId: string = establishmentId) {
    return fixture.addAccompanimentType({ establishmentId: targetEstablishmentId, name })
  }

  function patch(
    productId: string,
    body: Record<string, unknown>,
    cookie = managerRequestAuthorization(),
  ) {
    return request(fixture.app.getHttpServer())
      .patch(`/products/${productId}/global-accompaniment`)
      .set('Cookie', cookie)
      .send(body)
  }

  async function seedGlobal(overrides = {}, globalPrice?: number) {
    const target = await addAccompaniment('Granola', overrides)
    const type = await addType()
    const portionA = await addPortion('Alpha')
    const portionB = await addPortion('Bravo')
    const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
      target,
      type,
      portions: [portionA, portionB],
      quantityPerPortion: 1,
      ...(globalPrice === undefined ? {} : { accompanimentPrice: globalPrice }),
    })
    return { target, type, portionA, portionB, global, rows }
  }

  async function snapshot(target: Product) {
    return {
      global: await fixture.globalAccompaniments.findByAccompanimentProductId(
        establishmentId,
        target.id,
      ),
      rows: await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      ),
      price: (await fixture.products.findById(establishmentId, target.id))
        ?.accompanimentPrice,
      events: await findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
    }
  }

  it('updates the global, every row and the price, and republishes each Portion with a row', async () => {
    const { target, portionA, portionB, global, rows } = await seedGlobal()
    const sauces = await addType('Sauces')
    const size = await fixture.addProductSize({
      establishmentId,
      productId: portionA.id,
      name: 'Grande',
      quantity: 1,
      price: 15,
      isActive: true,
    })

    const response = await patch(target.id, {
      accompanimentTypeId: sauces.id,
      quantityPerPortion: 2.5,
      accompanimentPrice: 6,
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      accompanimentProductId: target.id,
      accompanimentProductName: 'Granola',
      isGlobal: true,
      unit: 'kg',
      salePrice: 6,
      globalAccompanimentId: global.id,
      accompanimentTypeId: sauces.id,
      accompanimentTypeName: 'Sauces',
      quantityPerPortion: 2.5,
      unitCost: 4,
      estimatedCost: 10,
    })
    await expect(
      fixture.globalAccompaniments.findById(establishmentId, global.id),
    ).resolves.toMatchObject({
      accompanimentTypeId: sauces.id,
      quantityPerPortion: 2.5,
      accompanimentPrice: 6,
    })
    const savedRows =
      await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
    expect(savedRows.map((row) => row.id).sort()).toEqual(
      rows.map((row) => row.id).sort(),
    )
    for (const row of savedRows) {
      expect(row).toMatchObject({
        accompanimentTypeId: sauces.id,
        quantityPerPortion: 2.5,
        globalAccompanimentId: global.id,
      })
      expect(row.accompanimentPrice).toBeUndefined()
    }
    // The Accompaniment product's price is only a default and never changes.
    await expect(
      fixture.products.findById(establishmentId, target.id),
    ).resolves.toMatchObject({
      accompanimentPrice: 3.5,
    })
    await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
      [portionA.id, portionB.id].sort(),
    )
    const payload = (await findSalesConfigurationPayloads(fixture)).find(
      (item) => item.productId === portionA.id,
    )
    expect(payload?.configuration?.sizes).toEqual([
      {
        sizeId: size.id,
        name: 'Grande',
        price: 15,
        isActive: true,
        accompaniments: [
          {
            accompanimentId: rows.find((row) => row.productId === portionA.id)?.id,
            productId: target.id,
            name: 'Granola',
            type: 'Sauces',
            basePrice: 6,
            isActive: true,
          },
        ],
      },
    ])
    const portionTable = await request(fixture.app.getHttpServer())
      .get(`/products/${portionB.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
    expect(portionTable.body.accompaniments[0]).toMatchObject({
      accompanimentTypeId: sauces.id,
      quantityPerPortion: 2.5,
      salePrice: 6,
      isGlobal: true,
    })
  })

  it('saves a zero price as free and republishes', async () => {
    const { target, portionA, portionB } = await seedGlobal()

    const response = await patch(target.id, {
      accompanimentTypeId: (await snapshot(target)).global?.accompanimentTypeId,
      quantityPerPortion: 1,
      accompanimentPrice: 0,
    })

    expect(response.status).toBe(200)
    expect(response.body.salePrice).toBe(0)
    await expect(
      fixture.globalAccompaniments.findByAccompanimentProductId(
        establishmentId,
        target.id,
      ),
    ).resolves.toMatchObject({ accompanimentPrice: 0 })
    await expect(
      fixture.products.findById(establishmentId, target.id),
    ).resolves.toMatchObject({
      accompanimentPrice: 3.5,
    })
    await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
      [portionA.id, portionB.id].sort(),
    )
  })

  it('keeps the global price when the request omits it and never replaces it with the default', async () => {
    const { target, type, portionA, portionB, global, rows } = await seedGlobal({}, 7)
    const size = await fixture.addProductSize({
      establishmentId,
      productId: portionA.id,
      name: 'Grande',
      quantity: 1,
      price: 15,
      isActive: true,
    })

    const response = await patch(target.id, {
      accompanimentTypeId: type.id,
      quantityPerPortion: 3,
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ quantityPerPortion: 3, salePrice: 7 })
    await expect(
      fixture.globalAccompaniments.findById(establishmentId, global.id),
    ).resolves.toMatchObject({ quantityPerPortion: 3, accompanimentPrice: 7 })
    const savedRows =
      await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
    expect(savedRows.map((row) => row.id).sort()).toEqual(
      rows.map((row) => row.id).sort(),
    )
    for (const row of savedRows) {
      expect(row.quantityPerPortion).toBe(3)
      expect(row.accompanimentPrice).toBeUndefined()
    }
    await expect(
      fixture.products.findById(establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 3.5 })
    await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
      [portionA.id, portionB.id].sort(),
    )
    const payload = (await findSalesConfigurationPayloads(fixture)).find(
      (item) => item.productId === portionA.id,
    )
    expect(payload?.configuration?.sizes).toEqual([
      expect.objectContaining({
        sizeId: size.id,
        accompaniments: [
          expect.objectContaining({
            accompanimentId: rows.find((row) => row.productId === portionA.id)?.id,
            basePrice: 7,
            isActive: true,
          }),
        ],
      }),
    ])
  })

  it('changes only the shared price, republishing every Portion with it and leaving the rows untouched', async () => {
    const { target, type, portionA, portionB, rows } = await seedGlobal({}, 7)
    for (const portion of [portionA, portionB]) {
      await fixture.addProductSize({
        establishmentId,
        productId: portion.id,
        name: 'Grande',
        quantity: 1,
        price: 15,
        isActive: true,
      })
    }
    const before = await snapshot(target)

    const response = await patch(target.id, {
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 9.5,
    })

    expect(response.status).toBe(200)
    expect(response.body.salePrice).toBe(9.5)
    const after = await snapshot(target)
    expect(after.global).toMatchObject({ accompanimentPrice: 9.5 })
    expect(after.rows).toEqual(before.rows)
    expect(after.rows.map((row) => row.id).sort()).toEqual(
      rows.map((row) => row.id).sort(),
    )
    for (const row of after.rows) expect(row.accompanimentPrice).toBeUndefined()
    expect(after.price).toBe(before.price)
    await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
      [portionA.id, portionB.id].sort(),
    )
    const payloads = await findSalesConfigurationPayloads(fixture)
    expect(payloads).toHaveLength(2)
    for (const payload of payloads) {
      expect(payload.state).toBe('available')
      expect(payload.configuration?.sizes[0].accompaniments).toEqual([
        expect.objectContaining({
          productId: target.id,
          basePrice: 9.5,
          isActive: true,
        }),
      ])
    }
  })

  it('is a no-op without events or row changes when nothing differs', async () => {
    const { target, type } = await seedGlobal()
    const before = await snapshot(target)

    const response = await patch(target.id, {
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 3.5,
    })
    const withoutPrice = await patch(target.id, {
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    expect(response.status).toBe(200)
    expect(withoutPrice.status).toBe(200)
    expect(response.body).toMatchObject({ quantityPerPortion: 1, salePrice: 3.5 })
    const after = await snapshot(target)
    expect(after.rows).toEqual(before.rows)
    expect(after.global).toEqual(before.global)
    expect(after.price).toBe(before.price)
    expect(after.events).toHaveLength(0)
  })

  it('works with zero rows, updating the global without publishing', async () => {
    const target = await addAccompaniment()
    const type = await addType()
    const sauces = await addType('Sauces')
    const { global } = await addGlobalAccompanimentWithRows(fixture, {
      target,
      type,
      portions: [],
    })

    const response = await patch(target.id, {
      accompanimentTypeId: sauces.id,
      quantityPerPortion: 4,
      accompanimentPrice: 8,
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      globalAccompanimentId: global.id,
      accompanimentTypeName: 'Sauces',
      quantityPerPortion: 4,
      salePrice: 8,
    })
    await expect(
      fixture.globalAccompaniments.findById(establishmentId, global.id),
    ).resolves.toMatchObject({ accompanimentTypeId: sauces.id, quantityPerPortion: 4 })
    await expect(
      findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
    ).resolves.toEqual([])
  })

  it('requires a price when none is saved and rejects invalid prices and bodies', async () => {
    const { target, type } = await seedGlobal({ accompanimentPrice: undefined })
    const before = await snapshot(target)
    const body = { accompanimentTypeId: type.id, quantityPerPortion: 2 }

    const missing = await patch(target.id, body)
    const negative = await patch(target.id, { ...body, accompanimentPrice: -1 })
    const decimals = await patch(target.id, { ...body, accompanimentPrice: 1.234 })
    const quantity = await patch(target.id, { ...body, quantityPerPortion: 0 })
    const extra = await patch(target.id, {
      ...body,
      accompanimentPrice: 1,
      isGlobal: true,
    })
    const badType = await patch(target.id, { ...body, accompanimentTypeId: 'not-a-uuid' })

    expect(missing.status).toBe(400)
    expect(missing.body.message).toBe('Informe o preço de venda do acompanhamento.')
    for (const response of [negative, decimals, quantity, extra, badType]) {
      expect(response.status).toBe(422)
    }
    const after = await snapshot(target)
    expect(after.rows).toEqual(before.rows)
    expect(after.global).toEqual(before.global)
    expect(after.price).toBeUndefined()
    expect(after.events).toHaveLength(0)
  })

  it('rejects an inactive Accompaniment, a non-global one and ineligible products', async () => {
    const { target, type } = await seedGlobal()
    const plain = await addAccompaniment('Plain')
    const portion = await addPortion('Plain portion')
    const legacy = await fixture.addProduct(
      createProduct({
        name: 'Legacy',
        categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
      }),
    )
    const body = {
      accompanimentTypeId: type.id,
      quantityPerPortion: 5,
      accompanimentPrice: 9,
    }
    await fixture.products.replace(establishmentId, target.id, {
      status: ProductStatus.Inactive,
    })
    const before = await snapshot(target)

    const inactive = await patch(target.id, body)
    const nonGlobal = await patch(plain.id, body)
    const notAccompaniment = await patch(portion.id, body)
    const legacyResponse = await patch(legacy.id, body)

    expect(inactive.status).toBe(400)
    expect(inactive.body.message).toBe('Ative o produto para vincular ou editar porções.')
    expect(nonGlobal.status).toBe(404)
    expect(nonGlobal.body.message).toBe('Acompanhamento global não encontrado.')
    expect(notAccompaniment.status).toBe(400)
    expect(legacyResponse.status).toBe(400)
    const after = await snapshot(target)
    expect(after.rows).toEqual(before.rows)
    expect(after.global).toEqual(before.global)
    expect(after.price).toBe(before.price)
    expect(after.events).toHaveLength(0)
  })

  it('requires a main brand for a By-brand Accompaniment and a type of the establishment', async () => {
    const { target, type } = await seedGlobal({
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
    const foreignType = await addType('Foreign', foreignEstablishmentId)
    const body = { accompanimentTypeId: type.id, quantityPerPortion: 2 }
    const before = await snapshot(target)

    const withoutBrand = await patch(target.id, body)
    const foreignTypeResponse = await patch(target.id, {
      ...body,
      accompanimentTypeId: foreignType.id,
    })
    expect((await snapshot(target)).rows).toEqual(before.rows)
    await fixture.addBrand({
      productId: target.id,
      name: 'House brand',
      packageQuantity: 4,
      packagePrice: 12,
      isPrimary: true,
    })
    const withBrand = await patch(target.id, body)

    expect(withoutBrand.status).toBe(400)
    expect(foreignTypeResponse.status).toBe(404)
    expect(before.rows.map((row) => row.quantityPerPortion)).toEqual([1, 1])
    expect(withBrand.status).toBe(200)
    expect((await snapshot(target)).rows.map((row) => row.quantityPerPortion)).toEqual([
      2, 2,
    ])
    expect(withBrand.body).toMatchObject({
      brandName: 'House brand',
      unitCost: 3,
      estimatedCost: 6,
    })
  })

  it('rolls everything back when a failure happens after the rows were written', async () => {
    const { target, type } = await seedGlobal()
    const sauces = await addType('Sauces')
    const before = await snapshot(target)
    const removeFailure = await failSecondSalesConfigurationEvent(fixture)

    let response: request.Response
    try {
      response = await patch(target.id, {
        accompanimentTypeId: sauces.id,
        quantityPerPortion: 7,
        accompanimentPrice: 9,
      })
    } finally {
      await removeFailure()
    }

    expect(response.status).toBe(500)
    const after = await snapshot(target)
    expect(after.global).toEqual(before.global)
    expect(after.rows).toEqual(before.rows)
    expect(after.price).toBe(3.5)
    expect(after.events).toHaveLength(0)
    expect(after.rows[0].accompanimentTypeId).toBe(type.id)
  })

  it('rejects Operators at the guard and unauthenticated, malformed, unknown and foreign access', async () => {
    const { target, type } = await seedGlobal()
    const body = { accompanimentTypeId: type.id, quantityPerPortion: 5 }
    const before = await snapshot(target)

    const operator = await patch(target.id, body, operatorRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer())
      .patch(`/products/${target.id}/global-accompaniment`)
      .send(body)
    const malformed = await patch('not-a-uuid', body)
    const unknown = await patch('00000000-0000-4000-8000-000000000099', body)
    const foreignManager = await patch(
      target.id,
      body,
      foreignManagerRequestAuthorization(),
    )

    expect(operator.status).toBe(403)
    expect(anonymous.status).toBe(401)
    expect(malformed.status).toBe(400)
    expect(unknown.status).toBe(404)
    expect(foreignManager.status).toBe(404)
    const after = await snapshot(target)
    expect(after.rows).toEqual(before.rows)
    expect(after.global).toEqual(before.global)
    expect(after.events).toHaveLength(0)
  })
})
