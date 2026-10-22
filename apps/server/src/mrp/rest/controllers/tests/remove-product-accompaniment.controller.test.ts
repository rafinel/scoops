import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  findSalesConfigurationPayloads,
  findSalesConfigurationProductIds,
  foreignManagerRequestAuthorization,
  latestIso,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  registerPortionThroughRest,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Remove Product Accompaniment Controller [DELETE /products/:productId/accompaniments/:linkId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('removes only the link and preserves stock and history snapshots', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Remove Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Remove Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Topping',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await fixture.balances.initialize(target.id)
    await fixture.balances.add({ productId: target.id }, 4)
    await fixture.transactions.add({
      establishmentId: target.establishmentId,
      productId: target.id,
      productName: target.name,
      unit: target.unit,
      type: 'entry',
      quantity: 4,
      balanceAfter: 4,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    })
    const beforeBalance = await fixture.balances.findByProductId(target.id)
    const beforeTransactions = await fixture.transactions.findPage(
      target.establishmentId,
      target.id,
      { page: 1, limit: 20 },
    )

    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(204)
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toBeUndefined()
    await expect(fixture.balances.findByProductId(target.id)).resolves.toEqual(
      beforeBalance,
    )
    await expect(
      fixture.transactions.findPage(target.establishmentId, target.id, {
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual(beforeTransactions)
  })

  it('returns uniform not-found and authorization responses', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Delete Error Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Delete Error Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Topping',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const foreignOwner = await fixture.addProduct(
      createProduct({
        name: 'Foreign Delete Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const anonymous = await request(fixture.app.getHttpServer()).delete(
      `/products/${owner.id}/accompaniments/${link.id}`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .delete(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .delete(`/products/${foreignOwner.id}/accompaniments/${link.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .delete(
        '/products/00000000-0000-4000-8000-000000000099/accompaniments/00000000-0000-4000-8000-000000000099',
      )
      .set('Cookie', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body.title).toBe(missing.body.title)
  })

  it('rejects malformed identifiers before executing the use case', async () => {
    const response = await request(fixture.app.getHttpServer())
      .delete('/products/not-a-uuid/accompaniments/not-a-uuid')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(400)
  })

  describe('global accompaniments', () => {
    async function setUpGlobal(portionCount = 2) {
      const target = await fixture.addProduct(
        createProduct({
          name: 'Remove Global Target',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 3,
        }),
      )
      const type = await fixture.addAccompanimentType({
        establishmentId: target.establishmentId,
        name: 'Remove Global Type',
      })
      const portions: Product[] = []
      for (let index = 0; index < portionCount; index++) {
        portions.push(
          await fixture.addProduct(
            createProduct({
              name: `Remove Global Portion ${index}`,
              categories: [ProductCategory.Portion],
            }),
          ),
        )
      }
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions,
      })
      return { target, type, portions, global, rows }
    }

    it('removes only this Portion row by default and keeps the global for new Portions', async () => {
      const { target, portions, global, rows } = await setUpGlobal(2)

      const response = await request(fixture.app.getHttpServer())
        .delete(`/products/${portions[0].id}/accompaniments/${rows[0].id}`)
        .set('Cookie', managerRequestAuthorization())

      expect(response.status).toBe(204)
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          portions[0].establishmentId,
          portions[0].id,
        ),
      ).resolves.toEqual([])
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          portions[1].establishmentId,
          portions[1].id,
        ),
      ).resolves.toHaveLength(1)
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ id: global.id })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual([
        portions[0].id,
      ])

      const registered = await registerPortionThroughRest(fixture, 'Portion After Scope')
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          registered.establishmentId,
          registered.id,
        ),
      ).resolves.toEqual([
        expect.objectContaining({
          accompanimentProductId: target.id,
          globalAccompanimentId: global.id,
        }),
      ])
    })

    it('treats scope=portion like the default and keeps a global whose last row was removed', async () => {
      const { portions, global, rows } = await setUpGlobal(1)

      const response = await request(fixture.app.getHttpServer())
        .delete(`/products/${portions[0].id}/accompaniments/${rows[0].id}?scope=portion`)
        .set('Cookie', managerRequestAuthorization())

      expect(response.status).toBe(204)
      await expect(
        fixture.productAccompaniments.findManyByAccompanimentProductId(
          global.establishmentId,
          global.accompanimentProductId,
        ),
      ).resolves.toEqual([])
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ id: global.id })
      const registered = await registerPortionThroughRest(fixture, 'Portion After Last')
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          registered.establishmentId,
          registered.id,
        ),
      ).resolves.toHaveLength(1)
    })

    it('removes every row and the global with scope=all while preserving stock', async () => {
      const { target, portions, global, rows } = await setUpGlobal(2)
      await fixture.balances.initialize(target.id)
      await fixture.balances.add({ productId: target.id }, 6)
      const beforeBalance = await fixture.balances.findByProductId(target.id)

      const response = await request(fixture.app.getHttpServer())
        .delete(`/products/${portions[1].id}/accompaniments/${rows[1].id}?scope=all`)
        .set('Cookie', managerRequestAuthorization())

      expect(response.status).toBe(204)
      await expect(
        fixture.productAccompaniments.findManyByAccompanimentProductId(
          global.establishmentId,
          target.id,
        ),
      ).resolves.toEqual([])
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toBeUndefined()
      await expect(fixture.balances.findByProductId(target.id)).resolves.toEqual(
        beforeBalance,
      )
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        portions.map(({ id }) => id).sort(),
      )

      const registered = await registerPortionThroughRest(fixture, 'Portion After All')
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          registered.establishmentId,
          registered.id,
        ),
      ).resolves.toEqual([])
    })

    it('publishes the remaining configuration of the Portions captured before an all-scope removal', async () => {
      const { portions, rows } = await setUpGlobal(2)
      const [first, second] = portions
      const size = await fixture.addProductSize({
        establishmentId: first.establishmentId,
        productId: first.id,
        name: 'Único',
        quantity: 1,
        price: 7,
        isActive: true,
      })

      const response = await request(fixture.app.getHttpServer())
        .delete(`/products/${second.id}/accompaniments/${rows[1].id}?scope=all`)
        .set('Cookie', managerRequestAuthorization())

      expect(response.status).toBe(204)
      const expected = [
        {
          establishmentId: first.establishmentId,
          productId: first.id,
          state: 'available',
          configuration: {
            establishmentId: first.establishmentId,
            productId: first.id,
            name: first.name,
            categories: [ProductCategory.Portion],
            status: 'active',
            stockControl: 'single',
            sizes: [
              {
                sizeId: size.id,
                name: 'Único',
                price: 7,
                isActive: true,
                accompaniments: [],
              },
            ],
            resaleConfigurations: [],
            updatedAt: latestIso(first.updatedAt, size.updatedAt),
          },
        },
        {
          establishmentId: second.establishmentId,
          productId: second.id,
          state: 'available',
          configuration: {
            establishmentId: second.establishmentId,
            productId: second.id,
            name: second.name,
            categories: [ProductCategory.Portion],
            status: 'active',
            stockControl: 'single',
            sizes: [],
            resaleConfigurations: [],
            updatedAt: second.updatedAt.toISOString(),
          },
        },
      ].sort((left, right) => left.productId.localeCompare(right.productId))
      await expect(findSalesConfigurationPayloads(fixture)).resolves.toEqual(expected)
    })

    it('rejects scope=all for an individual row and an unknown scope without changes', async () => {
      const portion = await fixture.addProduct(
        createProduct({ name: 'Scope Portion', categories: [ProductCategory.Portion] }),
      )
      const target = await fixture.addProduct(
        createProduct({
          name: 'Scope Target',
          categories: [ProductCategory.Accompaniment],
        }),
      )
      const type = await fixture.addAccompanimentType({
        establishmentId: portion.establishmentId,
        name: 'Scope Type',
      })
      const link = await fixture.addProductAccompaniment({
        establishmentId: portion.establishmentId,
        productId: portion.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

      const all = await request(fixture.app.getHttpServer())
        .delete(`/products/${portion.id}/accompaniments/${link.id}?scope=all`)
        .set('Cookie', managerRequestAuthorization())
      const unknown = await request(fixture.app.getHttpServer())
        .delete(`/products/${portion.id}/accompaniments/${link.id}?scope=everything`)
        .set('Cookie', managerRequestAuthorization())

      expect(all.status).toBe(400)
      expect(all.body.message).toBe(
        'Somente acompanhamentos globais podem ser removidos de todas as porções.',
      )
      expect(unknown.status).toBe(422)
      await expect(
        fixture.productAccompaniments.findById(
          portion.establishmentId,
          portion.id,
          link.id,
        ),
      ).resolves.toMatchObject({ id: link.id })

      const individualPortionScope = await request(fixture.app.getHttpServer())
        .delete(`/products/${portion.id}/accompaniments/${link.id}?scope=portion`)
        .set('Cookie', managerRequestAuthorization())
      expect(individualPortionScope.status).toBe(204)
      await expect(
        fixture.productAccompaniments.findById(
          portion.establishmentId,
          portion.id,
          link.id,
        ),
      ).resolves.toBeUndefined()
    })

    it('does not let Operators or foreign managers remove a global row', async () => {
      const { portions, global, rows } = await setUpGlobal(1)

      const operator = await request(fixture.app.getHttpServer())
        .delete(`/products/${portions[0].id}/accompaniments/${rows[0].id}?scope=all`)
        .set('Cookie', operatorRequestAuthorization())
      const foreign = await request(fixture.app.getHttpServer())
        .delete(`/products/${portions[0].id}/accompaniments/${rows[0].id}?scope=all`)
        .set('Cookie', foreignManagerRequestAuthorization())

      expect(operator.status).toBe(403)
      expect(foreign.status).toBe(404)
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ id: global.id })
      await expect(
        fixture.productAccompaniments.findById(
          portions[0].establishmentId,
          portions[0].id,
          rows[0].id,
        ),
      ).resolves.toMatchObject({ id: rows[0].id })
    })
  })
})
