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
  countRows,
  createProduct,
  failSecondSalesConfigurationEvent,
  findEvents,
  findSalesConfigurationPayloads,
  findSalesConfigurationProductIds,
  foreignManagerRequestAuthorization,
  latestIso,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

const establishmentId = MrpModuleFixture.accounts.establishmentId
const foreignEstablishmentId = MrpModuleFixture.accounts.foreignEstablishmentId
const unavailableMessage =
  'Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento.'

describe('Link Accompaniment Portions Controller [POST /products/:productId/portions]', () => {
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

  function addPortion(name: string, overrides = {}) {
    return fixture.addProduct(
      createProduct({ name, categories: [ProductCategory.Portion], ...overrides }),
    )
  }

  function addType(name = 'Toppings', targetEstablishmentId: string = establishmentId) {
    return fixture.addAccompanimentType({ establishmentId: targetEstablishmentId, name })
  }

  function addIndividualRow(
    portion: Product,
    target: Product,
    typeId: string,
    quantity = 9,
    accompanimentPrice?: number,
  ) {
    return fixture.addProductAccompaniment({
      establishmentId,
      productId: portion.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: typeId,
      quantityPerPortion: quantity,
      accompanimentPrice,
    })
  }

  function post(
    productId: string,
    body: Record<string, unknown>,
    cookie = managerRequestAuthorization(),
  ) {
    return request(fixture.app.getHttpServer())
      .post(`/products/${productId}/portions`)
      .set('Cookie', cookie)
      .send(body)
  }

  async function snapshot(target: Product) {
    return {
      rows: await countRows(fixture, 'product_accompaniments'),
      globals:
        await fixture.globalAccompaniments.findManyByEstablishmentId(establishmentId),
      price: (await fixture.products.findById(establishmentId, target.id))
        ?.accompanimentPrice,
      events: await findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
    }
  }

  async function expectUnchanged(
    target: Product,
    before: Awaited<ReturnType<typeof snapshot>>,
  ) {
    const after = await snapshot(target)
    expect(after.rows).toBe(before.rows)
    expect(after.globals).toEqual(before.globals)
    expect(after.price).toBe(before.price)
    expect(after.events).toHaveLength(before.events.length)
  }

  describe('individual links (mode a)', () => {
    it('links several Portions atomically with one price write, shared values and one event per Portion', async () => {
      const target = await addAccompaniment('Granola', { accompanimentPrice: undefined })
      const type = await addType()
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo', { status: ProductStatus.Inactive })
      const portionC = await addPortion('Charlie')
      const untouched = await addPortion('Untouched')
      const size = await fixture.addProductSize({
        establishmentId,
        productId: portionA.id,
        name: 'Grande',
        quantity: 1,
        price: 15,
        isActive: true,
      })
      await fixture.balances.initialize(target.id)
      await fixture.balances.add({ productId: target.id }, 7)
      const balanceBefore = await fixture.balances.findByProductId(target.id)

      const response = await post(target.id, {
        portionProductIds: [portionC.id, portionA.id, portionB.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.5,
        accompanimentPrice: 0,
      })

      expect(response.status).toBe(201)
      const rows = await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
      expect(rows).toHaveLength(3)
      expect(response.body).toHaveLength(3)
      expect(
        response.body.map(
          (item: { portionProductName: string }) => item.portionProductName,
        ),
      ).toEqual(['Alpha', 'Bravo', 'Charlie'])
      for (const item of response.body) {
        const row = rows.find((candidate) => candidate.id === item.id)
        expect(row).toMatchObject({
          productId: item.portionProductId,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
        })
        expect(row?.globalAccompanimentId).toBeUndefined()
        expect(row?.accompanimentPrice).toBe(0)
        expect(item).toMatchObject({
          accompanimentProductId: target.id,
          accompanimentTypeName: 'Toppings',
          unit: 'kg',
          quantityPerPortion: 1.5,
          salePrice: 0,
          isGlobal: false,
          hasOtherPortionLinks: true,
          unitCost: 4,
          estimatedCost: 6,
        })
      }
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({
        accompanimentPrice: 0,
      })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, portionC.id].sort(),
      )
      const savedTarget = await fixture.products.findById(establishmentId, target.id)
      const rowA = rows.find((row) => row.productId === portionA.id)
      const payloads = await findSalesConfigurationPayloads(fixture)
      expect(payloads.find((payload) => payload.productId === portionA.id)).toEqual({
        establishmentId,
        productId: portionA.id,
        state: 'available',
        configuration: {
          establishmentId,
          productId: portionA.id,
          name: 'Alpha',
          categories: [ProductCategory.Portion],
          status: 'active',
          stockControl: 'single',
          sizes: [
            {
              sizeId: size.id,
              name: 'Grande',
              price: 15,
              isActive: true,
              accompaniments: [
                {
                  accompanimentId: rowA?.id,
                  productId: target.id,
                  name: 'Granola',
                  type: 'Toppings',
                  basePrice: 0,
                  isActive: true,
                },
              ],
            },
          ],
          resaleConfigurations: [],
          updatedAt: latestIso(
            portionA.updatedAt,
            size.updatedAt,
            rowA?.updatedAt as Date,
            savedTarget?.updatedAt as Date,
            type.updatedAt,
          ),
        },
      })
      expect(payloads.map((payload) => payload.productId)).not.toContain(untouched.id)
      await expect(fixture.balances.findByProductId(target.id)).resolves.toEqual(
        balanceBefore,
      )

      const portionTable = await request(fixture.app.getHttpServer())
        .get(`/products/${portionB.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
      expect(portionTable.body.accompaniments).toHaveLength(1)
      expect(portionTable.body.accompaniments[0]).toMatchObject({
        accompanimentProductId: target.id,
        quantityPerPortion: 1.5,
        salePrice: 0,
      })
    })

    it('gives each new link its own price, keeps existing link prices and an already set default untouched', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const existing = await addPortion('Existing')
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo')
      const portionC = await addPortion('Charlie')
      const existingRow = await addIndividualRow(existing, target, type.id, 9, 2)
      const sizes = await Promise.all(
        [portionA, portionB, portionC].map((portion) =>
          fixture.addProductSize({
            establishmentId,
            productId: portion.id,
            name: 'Grande',
            quantity: 1,
            price: 15,
            isActive: true,
          }),
        ),
      )

      const defaultPrice = await post(target.id, {
        portionProductIds: [portionA.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })
      const sameSuppliedPrice = await post(target.id, {
        portionProductIds: [portionB.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 3.5,
      })
      const changed = await post(target.id, {
        portionProductIds: [portionC.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 6.25,
      })

      expect(defaultPrice.status).toBe(201)
      expect(defaultPrice.body[0].salePrice).toBe(3.5)
      expect(sameSuppliedPrice.status).toBe(201)
      expect(changed.status).toBe(201)
      expect(changed.body[0].salePrice).toBe(6.25)
      const rows = await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
      const priceOf = (portion: Product) =>
        rows.find((row) => row.productId === portion.id)?.accompanimentPrice
      expect([priceOf(portionA), priceOf(portionB), priceOf(portionC)]).toEqual([
        3.5, 3.5, 6.25,
      ])
      // The existing link keeps its own price and the default is not replaced by a later price.
      await expect(
        fixture.productAccompaniments.findById(
          establishmentId,
          existing.id,
          existingRow.id,
        ),
      ).resolves.toEqual(existingRow)
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 3.5 })
      // One event per linked Portion; the Portion that already had a link is not republished.
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, portionC.id].sort(),
      )
      const payloads = await findSalesConfigurationPayloads(fixture)
      const basePriceOf = (portion: Product, size: (typeof sizes)[number]) =>
        payloads
          .find((payload) => payload.productId === portion.id)
          ?.configuration?.sizes.find((candidate) => candidate.sizeId === size.id)
          ?.accompaniments[0].basePrice
      expect([
        basePriceOf(portionA, sizes[0]),
        basePriceOf(portionB, sizes[1]),
        basePriceOf(portionC, sizes[2]),
      ]).toEqual([3.5, 3.5, 6.25])
    })

    it('writes the default only when it was unset and never replaces it afterwards', async () => {
      const target = await addAccompaniment('Granola', { accompanimentPrice: undefined })
      const type = await addType()
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo')

      const first = await post(target.id, {
        portionProductIds: [portionA.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 4.5,
      })
      const second = await post(target.id, {
        portionProductIds: [portionB.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 7,
      })

      expect(first.status).toBe(201)
      expect(second.status).toBe(201)
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 4.5 })
      const rows = await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
      expect(rows.map((row) => [row.productId, row.accompanimentPrice]).sort()).toEqual(
        [
          [portionA.id, 4.5],
          [portionB.id, 7],
        ].sort(),
      )
    })

    it('requires a valid price when none is saved', async () => {
      const target = await addAccompaniment('Unpriced', { accompanimentPrice: undefined })
      const type = await addType()
      const portion = await addPortion('Alpha')
      const before = await snapshot(target)
      const body = {
        portionProductIds: [portion.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      }

      const missing = await post(target.id, body)
      const negative = await post(target.id, { ...body, accompanimentPrice: -1 })
      const tooManyDecimals = await post(target.id, {
        ...body,
        accompanimentPrice: 1.234,
      })

      expect(missing.status).toBe(400)
      expect(missing.body.message).toBe('Informe o preço de venda do acompanhamento.')
      expect(negative.status).toBe(422)
      expect(tooManyDecimals.status).toBe(422)
      await expectUnchanged(target, before)
    })

    it('uses the main brand cost of a By-brand Accompaniment and requires a main brand', async () => {
      const target = await addAccompaniment('Sauce', {
        stockControl: ProductStockControl.ByBrand,
        currentUnitCost: undefined,
      })
      const type = await addType()
      const portion = await addPortion('Alpha')
      const body = {
        portionProductIds: [portion.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 2,
      }
      const before = await snapshot(target)

      const withoutBrand = await post(target.id, body)
      await expectUnchanged(target, before)
      await fixture.addBrand({
        productId: target.id,
        name: 'House brand',
        packageQuantity: 4,
        packagePrice: 12,
        isPrimary: true,
      })
      const withBrand = await post(target.id, body)

      expect(withoutBrand.status).toBe(400)
      expect(withBrand.status).toBe(201)
      expect(withBrand.body[0]).toMatchObject({
        brandName: 'House brand',
        unitCost: 3,
        estimatedCost: 6,
      })
    })

    it('links up to 500 unique Portions in one request', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portions = await fixture.products.addMany(
        Array.from({ length: 500 }, (_, index) =>
          createProduct({
            name: `Bulk ${String(index).padStart(3, '0')}`,
            categories: [ProductCategory.Portion],
          }),
        ),
      )

      const response = await post(target.id, {
        portionProductIds: portions.map((portion) => portion.id),
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveLength(500)
      await expect(countRows(fixture, 'product_accompaniments')).resolves.toBe(500)
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toHaveLength(500)
    })
  })

  describe('rejections write nothing', () => {
    it('rejects a Portion linked concurrently, a lost Portion category, and unknown or foreign ids', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portionA = await addPortion('Alpha')
      const linked = await addPortion('Linked')
      const lost = await addPortion('Lost', { categories: [ProductCategory.Ingredient] })
      const foreign = await addPortion('Foreign', {
        establishmentId: foreignEstablishmentId,
      })
      await addIndividualRow(linked, target, type.id)
      const before = await snapshot(target)
      const body = {
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 9,
      }

      const conflict = await post(target.id, {
        ...body,
        portionProductIds: [portionA.id, linked.id],
      })
      const notPortion = await post(target.id, {
        ...body,
        portionProductIds: [portionA.id, lost.id],
      })
      const unknown = await post(target.id, {
        ...body,
        portionProductIds: [portionA.id, '00000000-0000-4000-8000-000000000099'],
      })
      const foreignId = await post(target.id, {
        ...body,
        portionProductIds: [portionA.id, foreign.id],
      })
      const unknownBeforeConflict = await post(target.id, {
        ...body,
        portionProductIds: [linked.id, '00000000-0000-4000-8000-000000000099'],
      })

      expect(conflict.status).toBe(409)
      expect(conflict.body.message).toBe(unavailableMessage)
      expect(notPortion.status).toBe(409)
      expect(unknown.status).toBe(404)
      expect(unknown.body.message).toBe('Porção não encontrada.')
      expect(foreignId.status).toBe(404)
      expect(unknownBeforeConflict.status).toBe(404)
      await expectUnchanged(target, before)
    })

    it('rejects an empty selection, repeated ids and more than 500 ids', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portion = await addPortion('Alpha')
      const before = await snapshot(target)
      const body = { accompanimentTypeId: type.id, quantityPerPortion: 1 }
      const tooMany = Array.from(
        { length: 501 },
        (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      )

      const empty = await post(target.id, { ...body, portionProductIds: [] })
      const absent = await post(target.id, body)
      const duplicate = await post(target.id, {
        ...body,
        portionProductIds: [portion.id, portion.id],
      })
      const excess = await post(target.id, { ...body, portionProductIds: tooMany })
      const extraField = await post(target.id, {
        ...body,
        portionProductIds: [portion.id],
        unknown: true,
      })
      const badQuantity = await post(target.id, {
        portionProductIds: [portion.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 0,
      })
      const badType = await post(target.id, {
        portionProductIds: [portion.id],
        accompanimentTypeId: 'not-a-uuid',
        quantityPerPortion: 1,
      })

      expect(empty.status).toBe(400)
      expect(empty.body.message).toBe('Selecione ao menos uma porção.')
      expect(absent.status).toBe(400)
      expect(duplicate.status).toBe(422)
      expect(excess.status).toBe(422)
      expect(extraField.status).toBe(422)
      expect(badQuantity.status).toBe(422)
      expect(badType.status).toBe(422)
      await expectUnchanged(target, before)
    })

    it('rolls everything back when a failure happens after the rows were written', async () => {
      const target = await addAccompaniment('Granola', { accompanimentPrice: undefined })
      const type = await addType()
      const portions = await Promise.all([
        addPortion('Alpha'),
        addPortion('Bravo'),
        addPortion('Charlie'),
      ])
      const existing = await addPortion('Existing')
      const existingRow = await addIndividualRow(existing, target, type.id, 9, 2)
      const before = await snapshot(target)
      const removeFailure = await failSecondSalesConfigurationEvent(fixture)

      let response: request.Response
      try {
        response = await post(target.id, {
          portionProductIds: portions.map((portion) => portion.id),
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
          accompanimentPrice: 4,
        })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expectUnchanged(target, before)
      // The default stays unset and the existing link keeps its price.
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: undefined })
      await expect(
        fixture.productAccompaniments.findManyByAccompanimentProductId(
          establishmentId,
          target.id,
        ),
      ).resolves.toEqual([existingRow])
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual([])
    })

    it('rejects an inactive Accompaniment, a missing type and a foreign type', async () => {
      const inactive = await addAccompaniment('Inactive', {
        status: ProductStatus.Inactive,
      })
      const target = await addAccompaniment()
      const type = await addType()
      const foreignType = await addType('Foreign', foreignEstablishmentId)
      const portion = await addPortion('Alpha')
      const before = await snapshot(target)

      const inactiveResponse = await post(inactive.id, {
        portionProductIds: [portion.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })
      const inactiveGlobal = await post(inactive.id, {
        isGlobal: true,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })
      const foreignTypeResponse = await post(target.id, {
        portionProductIds: [portion.id],
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
      })
      const missingType = await post(target.id, {
        portionProductIds: [portion.id],
        accompanimentTypeId: '00000000-0000-4000-8000-000000000099',
        quantityPerPortion: 1,
      })

      expect(inactiveResponse.status).toBe(400)
      expect(inactiveResponse.body.message).toBe(
        'Ative o produto para vincular ou editar porções.',
      )
      expect(inactiveGlobal.status).toBe(400)
      expect(foreignTypeResponse.status).toBe(404)
      expect(missingType.status).toBe(404)
      await expectUnchanged(target, before)
    })
  })

  describe('making the Accompaniment global (mode b)', () => {
    it('converts individual rows in place, adds rows for every other Portion and republishes every Portion', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const otherType = await addType('Sauces')
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo')
      const portionC = await addPortion('Charlie')
      const portionD = await addPortion('Delta', { status: ProductStatus.Inactive })
      const rowB = await addIndividualRow(portionB, target, otherType.id, 7, 5)
      const rowC = await addIndividualRow(portionC, target, otherType.id, 8, 6)
      const size = await fixture.addProductSize({
        establishmentId,
        productId: portionA.id,
        name: 'Grande',
        quantity: 1,
        price: 15,
        isActive: true,
      })

      const response = await post(target.id, {
        isGlobal: true,
        accompanimentTypeId: type.id,
        quantityPerPortion: 2,
      })

      expect(response.status).toBe(201)
      const global = await fixture.globalAccompaniments.findByAccompanimentProductId(
        establishmentId,
        target.id,
      )
      // The shared price is the default (no price entered); the converted rows lose their own.
      expect(global).toMatchObject({
        accompanimentTypeId: type.id,
        quantityPerPortion: 2,
        accompanimentPrice: 3.5,
      })
      const rows = await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
      expect(rows).toHaveLength(4)
      for (const row of rows) {
        expect(row).toMatchObject({
          accompanimentTypeId: type.id,
          quantityPerPortion: 2,
          globalAccompanimentId: global?.id,
        })
        expect(row.accompanimentPrice).toBeUndefined()
      }
      expect(rows.find((row) => row.productId === portionB.id)?.id).toBe(rowB.id)
      expect(rows.find((row) => row.productId === portionC.id)?.id).toBe(rowC.id)
      expect(rows.map((row) => row.productId).sort()).toEqual(
        [portionA.id, portionB.id, portionC.id, portionD.id].sort(),
      )
      expect(
        response.body.map(
          (item: { portionProductName: string }) => item.portionProductName,
        ),
      ).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
      expect(response.body.map((item: { id: string }) => item.id).sort()).toEqual(
        rows.map((row) => row.id).sort(),
      )
      for (const item of response.body) {
        expect(item).toMatchObject({
          isGlobal: true,
          hasOtherPortionLinks: false,
          salePrice: 3.5,
        })
      }
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, portionC.id, portionD.id].sort(),
      )
      const portionAPayload = (await findSalesConfigurationPayloads(fixture)).find(
        (payload) => payload.productId === portionA.id,
      )
      expect(
        portionAPayload?.configuration?.sizes.find(
          (candidate) => candidate.sizeId === size.id,
        )?.accompaniments,
      ).toEqual([expect.objectContaining({ productId: target.id, basePrice: 3.5 })])
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 3.5 })
      const status = await request(fixture.app.getHttpServer())
        .get(`/products/${target.id}/global-accompaniment`)
        .set('Cookie', managerRequestAuthorization())
      expect(status.body).toMatchObject({
        isGlobal: true,
        globalAccompanimentId: global?.id,
      })
    })

    it('makes the Accompaniment global without individual rows and saves the supplied price', async () => {
      const target = await addAccompaniment('Granola', { accompanimentPrice: undefined })
      const type = await addType()
      const portions = await Promise.all([addPortion('Alpha'), addPortion('Bravo')])

      const response = await post(target.id, {
        isGlobal: true,
        portionProductIds: [],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 2.5,
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveLength(2)
      expect(
        response.body.every((item: { salePrice: number }) => item.salePrice === 2.5),
      ).toBe(true)
      await expect(countRows(fixture, 'product_accompaniments')).resolves.toBe(2)
      // The price lives on the global; the rows carry none and the unset default is written.
      await expect(
        fixture.globalAccompaniments.findByAccompanimentProductId(
          establishmentId,
          target.id,
        ),
      ).resolves.toMatchObject({ accompanimentPrice: 2.5 })
      const savedRows =
        await fixture.productAccompaniments.findManyByAccompanimentProductId(
          establishmentId,
          target.id,
        )
      for (const row of savedRows) expect(row.accompanimentPrice).toBeUndefined()
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 2.5 })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        portions.map((portion) => portion.id).sort(),
      )
    })

    it('rejects Portion ids and an establishment without Portions, writing nothing', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portion = await addPortion('Alpha')
      await addPortion('Foreign only', { establishmentId: foreignEstablishmentId })
      const before = await snapshot(target)

      const withIds = await post(target.id, {
        isGlobal: true,
        portionProductIds: [portion.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })
      await fixture.products.remove(establishmentId, portion.id)
      const noPortion = await post(target.id, {
        isGlobal: true,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 9,
      })

      expect(withIds.status).toBe(400)
      expect(withIds.body.message).toBe(
        'Não informe porções ao disponibilizar o acompanhamento para todas as porções.',
      )
      expect(noPortion.status).toBe(400)
      expect(noPortion.body.message).toBe(
        'Cadastre uma porção antes de disponibilizar este acompanhamento para todas as porções.',
      )
      const after = await snapshot(target)
      expect(after.rows).toBe(0)
      expect(after.globals).toEqual(before.globals)
      expect(after.price).toBe(before.price)
      expect(after.events).toHaveLength(0)
    })

    it('rolls the conversion back when a failure happens after the rows were written', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const otherType = await addType('Sauces')
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo')
      const rowB = await addIndividualRow(portionB, target, otherType.id, 7, 5)
      const before = await snapshot(target)
      const removeFailure = await failSecondSalesConfigurationEvent(fixture)

      let response: request.Response
      try {
        response = await post(target.id, {
          isGlobal: true,
          accompanimentTypeId: type.id,
          quantityPerPortion: 2,
        })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expectUnchanged(target, before)
      await expect(
        fixture.productAccompaniments.findByProductAndAccompaniment(
          establishmentId,
          portionB.id,
          target.id,
        ),
      ).resolves.toMatchObject({
        id: rowB.id,
        accompanimentTypeId: otherType.id,
        quantityPerPortion: 7,
        accompanimentPrice: 5,
      })
      await expect(
        fixture.globalAccompaniments.findManyByEstablishmentId(establishmentId),
      ).resolves.toEqual([])
      await expect(
        fixture.productAccompaniments.findByProductAndAccompaniment(
          establishmentId,
          portionA.id,
          target.id,
        ),
      ).resolves.toBeUndefined()
    })
  })

  describe('restoring Portions of a global (mode c)', () => {
    async function seedGlobal() {
      const target = await addAccompaniment()
      const type = await addType()
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo')
      const portionC = await addPortion('Charlie', { status: ProductStatus.Inactive })
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA],
        quantityPerPortion: 1,
      })
      return { target, type, portionA, portionB, portionC, global, rowA: rows[0] }
    }

    it('restores a selected Portion as the same global item and republishes only it', async () => {
      const { target, type, portionB, global, rowA } = await seedGlobal()

      const response = await post(target.id, {
        isGlobal: true,
        portionProductIds: [portionB.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject({
        portionProductId: portionB.id,
        isGlobal: true,
        hasOtherPortionLinks: false,
      })
      const restored = await fixture.productAccompaniments.findByProductAndAccompaniment(
        establishmentId,
        portionB.id,
        target.id,
      )
      expect(restored).toMatchObject({ globalAccompanimentId: global.id })
      expect(restored?.accompanimentPrice).toBeUndefined()
      expect(response.body[0].salePrice).toBe(3.5)
      await expect(
        fixture.globalAccompaniments.findById(establishmentId, global.id),
      ).resolves.toEqual(global)
      await expect(
        fixture.globalAccompaniments.findManyByEstablishmentId(establishmentId),
      ).resolves.toHaveLength(1)
      await expect(
        fixture.productAccompaniments.findByProductAndAccompaniment(
          establishmentId,
          rowA.productId,
          target.id,
        ),
      ).resolves.toMatchObject({ id: rowA.id, quantityPerPortion: 1 })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual([
        portionB.id,
      ])

      const candidates = await request(fixture.app.getHttpServer())
        .get(`/products/${target.id}/portions/candidates`)
        .set('Cookie', managerRequestAuthorization())
      expect(
        candidates.body.map((candidate: { name: string }) => candidate.name),
      ).toEqual(['Charlie'])
    })

    it('applies a changed type, quantity and price to the global, every row and every Portion', async () => {
      const { target, portionB, portionC, global, rowA } = await seedGlobal()
      const newType = await addType('Sauces')

      const response = await post(target.id, {
        isGlobal: true,
        portionProductIds: [portionB.id, portionC.id],
        accompanimentTypeId: newType.id,
        quantityPerPortion: 3,
        accompanimentPrice: 5,
      })

      expect(response.status).toBe(201)
      expect(response.body).toHaveLength(2)
      await expect(
        fixture.globalAccompaniments.findById(establishmentId, global.id),
      ).resolves.toMatchObject({
        accompanimentTypeId: newType.id,
        quantityPerPortion: 3,
        accompanimentPrice: 5,
      })
      const rows = await fixture.productAccompaniments.findManyByAccompanimentProductId(
        establishmentId,
        target.id,
      )
      expect(rows).toHaveLength(3)
      for (const row of rows) {
        expect(row).toMatchObject({
          accompanimentTypeId: newType.id,
          quantityPerPortion: 3,
          globalAccompanimentId: global.id,
        })
        expect(row.accompanimentPrice).toBeUndefined()
      }
      expect(rows.some((row) => row.id === rowA.id)).toBe(true)
      // The default is only a default: the price entered here lands on the global alone.
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({
        accompanimentPrice: 3.5,
      })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toHaveLength(3)
    })

    it('keeps the global own price when the request omits it, even when it differs from the default', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portionA = await addPortion('Alpha')
      const portionB = await addPortion('Bravo')
      const { global } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA],
        accompanimentPrice: 8,
      })
      await fixture.addProductSize({
        establishmentId,
        productId: portionB.id,
        name: 'Grande',
        quantity: 1,
        price: 15,
        isActive: true,
      })

      const response = await post(target.id, {
        isGlobal: true,
        portionProductIds: [portionB.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

      expect(response.status).toBe(201)
      expect(response.body[0].salePrice).toBe(8)
      await expect(
        fixture.globalAccompaniments.findById(establishmentId, global.id),
      ).resolves.toEqual(global)
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 3.5 })
      const payloads = await findSalesConfigurationPayloads(fixture)
      expect(payloads.map((payload) => payload.productId)).toEqual([portionB.id])
      expect(payloads[0].configuration?.sizes[0].accompaniments).toEqual([
        expect.objectContaining({ productId: target.id, basePrice: 8, isActive: true }),
      ])
    })

    it('requires isGlobal: true and excluded Portions, writing nothing otherwise', async () => {
      const { target, type, portionA, portionB } = await seedGlobal()
      const before = await snapshot(target)
      const body = { accompanimentTypeId: type.id, quantityPerPortion: 1 }

      const withoutFlag = await post(target.id, {
        ...body,
        portionProductIds: [portionB.id],
      })
      const falseFlag = await post(target.id, {
        ...body,
        isGlobal: false,
        portionProductIds: [portionB.id],
      })
      const alreadyPresent = await post(target.id, {
        ...body,
        isGlobal: true,
        portionProductIds: [portionB.id, portionA.id],
      })
      const withoutIds = await post(target.id, { ...body, isGlobal: true })
      const unknown = await post(target.id, {
        ...body,
        isGlobal: true,
        portionProductIds: ['00000000-0000-4000-8000-000000000099'],
      })

      expect(withoutFlag.status).toBe(409)
      expect(withoutFlag.body.message).toContain('Este acompanhamento é global.')
      expect(falseFlag.status).toBe(409)
      expect(alreadyPresent.status).toBe(409)
      expect(alreadyPresent.body.message).toBe(unavailableMessage)
      expect(withoutIds.status).toBe(400)
      expect(unknown.status).toBe(404)
      await expectUnchanged(target, before)
    })
  })

  describe('authorization and tenancy', () => {
    it('rejects Operators at the guard without changing anything', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portion = await addPortion('Alpha')
      const before = await snapshot(target)

      const response = await post(
        target.id,
        {
          portionProductIds: [portion.id],
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
        },
        operatorRequestAuthorization(),
      )

      expect(response.status).toBe(403)
      await expectUnchanged(target, before)
    })

    it('rejects unauthenticated, malformed, unknown, foreign and ineligible products', async () => {
      const target = await addAccompaniment()
      const type = await addType()
      const portion = await addPortion('Alpha')
      const legacy = await addPortion('Legacy', {
        categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
      })
      const body = {
        portionProductIds: [portion.id],
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      }
      const before = await snapshot(target)

      const anonymous = await request(fixture.app.getHttpServer())
        .post(`/products/${target.id}/portions`)
        .send(body)
      const malformed = await post('not-a-uuid', body)
      const unknown = await post('00000000-0000-4000-8000-000000000099', body)
      const foreignManager = await post(
        target.id,
        body,
        foreignManagerRequestAuthorization(),
      )
      const notAccompaniment = await post(portion.id, body)
      const legacyResponse = await post(legacy.id, body)

      expect(anonymous.status).toBe(401)
      expect(malformed.status).toBe(400)
      expect(unknown.status).toBe(404)
      expect(foreignManager.status).toBe(404)
      expect(notAccompaniment.status).toBe(400)
      expect(notAccompaniment.body.message).toBe(
        'O produto não é um acompanhamento elegível para porções.',
      )
      expect(legacyResponse.status).toBe(400)
      await expectUnchanged(target, before)
    })
  })
})
