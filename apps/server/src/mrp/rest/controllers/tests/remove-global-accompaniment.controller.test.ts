import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductCategory, ProductStatus } from '@scoops/core/mrp/domain/structures'
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
  registerPortionThroughRest,
  resetMrpFixture,
  setUpdatedAt,
} from './mrp-controller-test-helpers'

const establishmentId = MrpModuleFixture.accounts.establishmentId

describe('Remove Global Accompaniment Controller [DELETE /products/:productId/global-accompaniment]', () => {
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

  function remove(productId: string, query = '', cookie = managerRequestAuthorization()) {
    return request(fixture.app.getHttpServer())
      .delete(`/products/${productId}/global-accompaniment${query}`)
      .set('Cookie', cookie)
  }

  async function seedGlobal(
    portionNames: readonly string[] = ['Alpha', 'Bravo'],
    accompanimentPrice: number | null = 6,
  ) {
    const target = await addAccompaniment()
    const type = await fixture.addAccompanimentType({ establishmentId, name: 'Toppings' })
    const portions = await Promise.all(portionNames.map((name) => addPortion(name)))
    const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
      target,
      type,
      portions,
      quantityPerPortion: 1.5,
      accompanimentPrice: accompanimentPrice ?? undefined,
    })
    return { target, type, portions, global, rows }
  }

  async function findRows(target: Product) {
    return fixture.productAccompaniments.findManyByAccompanimentProductId(
      establishmentId,
      target.id,
    )
  }

  async function findGlobal(target: Product) {
    return fixture.globalAccompaniments.findByAccompanimentProductId(
      establishmentId,
      target.id,
    )
  }

  describe('default mode', () => {
    it('removes every row and the global, republishes each Portion and keeps stock and price', async () => {
      const { target, portions } = await seedGlobal()
      const untouched = await addPortion('Untouched')
      const size = await fixture.addProductSize({
        establishmentId,
        productId: portions[0].id,
        name: 'Grande',
        quantity: 1,
        price: 15,
        isActive: true,
      })
      await fixture.balances.initialize(target.id)
      await fixture.balances.add({ productId: target.id }, 7)
      const balanceBefore = await fixture.balances.findByProductId(target.id)

      const response = await remove(target.id)

      expect(response.status).toBe(204)
      await expect(findRows(target)).resolves.toEqual([])
      await expect(findGlobal(target)).resolves.toBeUndefined()
      await expect(fixture.balances.findByProductId(target.id)).resolves.toEqual(
        balanceBefore,
      )
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 3.5 })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        portions.map((portion) => portion.id).sort(),
      )
      const payload = (await findSalesConfigurationPayloads(fixture)).find(
        (item) => item.productId === portions[0].id,
      )
      expect(payload).toMatchObject({
        establishmentId,
        state: 'available',
        configuration: {
          sizes: [{ sizeId: size.id, price: 15, accompaniments: [] }],
        },
      })
      expect(
        (await findSalesConfigurationPayloads(fixture)).some(
          (item) => item.productId === untouched.id,
        ),
      ).toBe(false)
    })

    it('does not give a Portion registered afterwards the removed global', async () => {
      const { target } = await seedGlobal()

      const response = await remove(target.id)
      const registered = await registerPortionThroughRest(fixture, 'Registered later')

      expect(response.status).toBe(204)
      await expect(
        fixture.productAccompaniments.findManyByProductId(establishmentId, registered.id),
      ).resolves.toEqual([])
    })

    it('treats keepPortionLinks=false like the default', async () => {
      const { target } = await seedGlobal()

      const response = await remove(target.id, '?keepPortionLinks=false')

      expect(response.status).toBe(204)
      await expect(findRows(target)).resolves.toEqual([])
      await expect(findGlobal(target)).resolves.toBeUndefined()
    })

    it('removes a global without rows and an inactive global, publishing nothing', async () => {
      const { target } = await seedGlobal([])
      await fixture.products.replace(establishmentId, target.id, {
        status: ProductStatus.Inactive,
      })

      const response = await remove(target.id)

      expect(response.status).toBe(204)
      await expect(findGlobal(target)).resolves.toBeUndefined()
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('rolls everything back when a failure happens after the rows were removed', async () => {
      const { target, rows, global } = await seedGlobal()
      const removeFailure = await failSecondSalesConfigurationEvent(fixture)

      let response: request.Response
      try {
        response = await remove(target.id)
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      const savedRows = await findRows(target)
      expect(savedRows.map((row) => row.id).sort()).toEqual(
        rows.map((row) => row.id).sort(),
      )
      await expect(findGlobal(target)).resolves.toMatchObject({ id: global.id })
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })
  })

  describe('keep mode (?keepPortionLinks=true)', () => {
    it('keeps every row as an individual link with the same id, type, quantity and updated_at', async () => {
      const { target, type, rows, global } = await seedGlobal()
      const pinned = new Date('2026-03-04T05:06:07.000Z')
      await Promise.all(
        rows.map((row) =>
          setUpdatedAt(fixture, 'product_accompaniments', row.id, pinned),
        ),
      )
      const before = await findRows(target)
      await fixture.balances.initialize(target.id)
      await fixture.balances.add({ productId: target.id }, 7)
      const balanceBefore = await fixture.balances.findByProductId(target.id)

      const response = await remove(target.id, '?keepPortionLinks=true')

      expect(response.status).toBe(204)
      const after = await findRows(target)
      expect(after).toHaveLength(2)
      for (const row of after) {
        const previous = before.find((candidate) => candidate.id === row.id)
        expect(previous).toBeDefined()
        expect(row.globalAccompanimentId).toBeUndefined()
        expect(row).toMatchObject({
          productId: previous?.productId,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.5,
        })
        expect(row.updatedAt.toISOString()).toBe(pinned.toISOString())
        // The global's shared price becomes each row's own price in the same step.
        expect(row.accompanimentPrice).toBe(6)
      }
      await expect(findGlobal(target)).resolves.toBeUndefined()
      await expect(
        fixture.globalAccompaniments.findById(establishmentId, global.id),
      ).resolves.toBeUndefined()
      await expect(fixture.balances.findByProductId(target.id)).resolves.toEqual(
        balanceBefore,
      )
      await expect(
        fixture.products.findById(establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 3.5 })
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
      const table = await request(fixture.app.getHttpServer())
        .get(`/products/${after[0].productId}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
      expect(table.body.accompaniments[0]).toMatchObject({
        isGlobal: false,
        salePrice: 6,
      })
    })

    it('leaves the rows unpriced when the ended global had no price', async () => {
      const { target } = await seedGlobal(['Alpha', 'Bravo'], null)

      const response = await remove(target.id, '?keepPortionLinks=true')

      expect(response.status).toBe(204)
      const rows = await findRows(target)
      expect(rows).toHaveLength(2)
      for (const row of rows) {
        expect(row.globalAccompanimentId).toBeUndefined()
        expect(row.accompanimentPrice).toBeUndefined()
      }
      await expect(findGlobal(target)).resolves.toBeUndefined()
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('does not give a Portion registered afterwards the ended global', async () => {
      const { target } = await seedGlobal()

      await remove(target.id, '?keepPortionLinks=true')
      const registered = await registerPortionThroughRest(fixture, 'Registered later')

      await expect(
        fixture.productAccompaniments.findManyByProductId(establishmentId, registered.id),
      ).resolves.toEqual([])
      await expect(findRows(target)).resolves.toHaveLength(2)
    })

    it('ends a global without rows and ends an inactive product global', async () => {
      const empty = await seedGlobal([])
      const second = await addAccompaniment('Second')
      const type = await fixture.addAccompanimentType({ establishmentId, name: 'Sauces' })
      const portion = await addPortion('Charlie')
      await addGlobalAccompanimentWithRows(fixture, {
        target: second,
        type,
        portions: [portion],
      })
      await fixture.products.replace(establishmentId, second.id, {
        status: ProductStatus.Inactive,
      })

      const emptyResponse = await remove(empty.target.id, '?keepPortionLinks=true')
      const inactiveResponse = await remove(second.id, '?keepPortionLinks=true')

      expect(emptyResponse.status).toBe(204)
      expect(inactiveResponse.status).toBe(204)
      await expect(findGlobal(empty.target)).resolves.toBeUndefined()
      await expect(findGlobal(second)).resolves.toBeUndefined()
      await expect(findRows(second)).resolves.toHaveLength(1)
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('leaves the Portions able to be linked again individually', async () => {
      const { target, type, portions } = await seedGlobal()
      const extra = await addPortion('Charlie')
      await remove(target.id, '?keepPortionLinks=true')

      const linkAgain = await request(fixture.app.getHttpServer())
        .post(`/products/${target.id}/portions`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          portionProductIds: [extra.id],
          accompanimentTypeId: type.id,
          quantityPerPortion: 2,
        })
      const duplicate = await request(fixture.app.getHttpServer())
        .post(`/products/${target.id}/portions`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          portionProductIds: [portions[0].id],
          accompanimentTypeId: type.id,
          quantityPerPortion: 2,
        })

      expect(linkAgain.status).toBe(201)
      expect(linkAgain.body[0]).toMatchObject({
        isGlobal: false,
        hasOtherPortionLinks: true,
      })
      expect(duplicate.status).toBe(409)
    })
  })

  describe.each([
    { name: 'default', query: '' },
    { name: 'keep', query: '?keepPortionLinks=true' },
  ])('$name mode rejections', ({ query }) => {
    it('rejects Operators at the guard without changing anything', async () => {
      const { target } = await seedGlobal()

      const response = await remove(target.id, query, operatorRequestAuthorization())

      expect(response.status).toBe(403)
      await expect(findRows(target)).resolves.toHaveLength(2)
      await expect(findGlobal(target)).resolves.toBeDefined()
    })

    it('rejects a non-global Accompaniment as not found', async () => {
      const plain = await addAccompaniment('Plain')
      const portion = await addPortion('Alpha')
      const type = await fixture.addAccompanimentType({
        establishmentId,
        name: 'Toppings',
      })
      await fixture.addProductAccompaniment({
        establishmentId,
        productId: portion.id,
        accompanimentProductId: plain.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

      const response = await remove(plain.id, query)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Acompanhamento global não encontrado.')
      await expect(findRows(plain)).resolves.toHaveLength(1)
    })

    it('rejects unauthenticated, malformed, unknown, foreign and ineligible products', async () => {
      const { target } = await seedGlobal()
      const portion = await addPortion('Plain portion')
      const legacy = await fixture.addProduct(
        createProduct({
          name: 'Legacy',
          categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
        }),
      )

      const anonymous = await request(fixture.app.getHttpServer()).delete(
        `/products/${target.id}/global-accompaniment${query}`,
      )
      const malformed = await remove('not-a-uuid', query)
      const unknown = await remove('00000000-0000-4000-8000-000000000099', query)
      const foreignManager = await remove(
        target.id,
        query,
        foreignManagerRequestAuthorization(),
      )
      const notAccompaniment = await remove(portion.id, query)
      const legacyResponse = await remove(legacy.id, query)

      expect(anonymous.status).toBe(401)
      expect(malformed.status).toBe(400)
      expect(unknown.status).toBe(404)
      expect(foreignManager.status).toBe(404)
      expect(notAccompaniment.status).toBe(400)
      expect(legacyResponse.status).toBe(400)
      await expect(findRows(target)).resolves.toHaveLength(2)
      await expect(findGlobal(target)).resolves.toBeDefined()
    })
  })

  it('rejects an invalid keepPortionLinks query without changing anything', async () => {
    const { target } = await seedGlobal()

    for (const query of ['?keepPortionLinks=yes', '?keepPortionLinks=1', '?other=true']) {
      const response = await remove(target.id, query)
      expect(response.status, query).toBe(422)
    }
    await expect(findRows(target)).resolves.toHaveLength(2)
    await expect(findGlobal(target)).resolves.toBeDefined()
  })
})
