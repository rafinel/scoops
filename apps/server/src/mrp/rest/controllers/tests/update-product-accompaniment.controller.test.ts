import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  failSecondSalesConfigurationEvent,
  findEvents,
  findSalesConfigurationProductIds,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Update Product Accompaniment Controller [PATCH /products/:productId/accompaniments/:linkId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates only the type and quantity and preserves the target', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Update Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Immutable Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 5.5,
      }),
    )
    const originalType = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Original',
    })
    const replacementType = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Replacement',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: originalType.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: replacementType.id, quantityPerPortion: 2.125 })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: link.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: replacementType.id,
      accompanimentTypeName: 'Replacement',
      quantityPerPortion: 2.125,
      salePrice: 5.5,
    })
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({
      accompanimentProductId: target.id,
      accompanimentTypeId: replacementType.id,
      quantityPerPortion: 2.125,
    })
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 5.5 })
  })

  it('returns safe validation, authorization, and ownership errors', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Error Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Error Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 4.5,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Type',
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
        name: 'Foreign Update Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const malformed = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 1.1234 })
    const exceedsNumericPrecision = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 10_000_000_000_000_000,
      })
    const immutableTarget = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentTypeId: type.id,
        quantityPerPortion: 2,
        accompanimentProductId: target.id,
      })
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${foreignOwner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })
    const missing = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/00000000-0000-4000-8000-000000000099`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })

    expect(malformed.status).toBe(422)
    expect(exceedsNumericPrecision.status).toBe(422)
    expect(immutableTarget.status).toBe(422)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({ quantityPerPortion: 1, accompanimentTypeId: type.id })
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 4.5 })
  })

  it('rejects a missing type without changing the existing link', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Missing Type Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Missing Type Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 6.5,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Existing',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentTypeId: '00000000-0000-4000-8000-000000000099',
        quantityPerPortion: 2,
      })

    expect(response.status).toBe(404)
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({ quantityPerPortion: 1, accompanimentTypeId: type.id })
  })

  it('updates the shared target price while preserving zero and the link target', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Price Edit Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Shared Price Topping',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 8.25,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Toppings',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentTypeId: type.id,
        quantityPerPortion: 2.5,
        accompanimentPrice: 0,
      })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: link.id,
      accompanimentProductId: target.id,
      quantityPerPortion: 2.5,
      salePrice: 0,
    })
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 0 })
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({
      accompanimentProductId: target.id,
      quantityPerPortion: 2.5,
    })
  })

  describe('global accompaniments', () => {
    async function addPortion(name: string) {
      return fixture.addProduct(
        createProduct({ name, categories: [ProductCategory.Portion] }),
      )
    }

    async function addTarget(name: string) {
      return fixture.addProduct(
        createProduct({
          name,
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 4,
        }),
      )
    }

    async function addType(name: string) {
      return fixture.addAccompanimentType({
        establishmentId: MrpModuleFixture.accounts.establishmentId,
        name,
      })
    }

    it('edits type, quantity and price for every Portion from any global row', async () => {
      const portionA = await addPortion('Shared Edit A')
      const portionB = await addPortion('Shared Edit B')
      const target = await addTarget('Shared Edit Target')
      const type = await addType('Shared Edit Type')
      const replacementType = await addType('Shared Edit Replacement')
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA, portionB],
      })

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${rows[0].id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentTypeId: replacementType.id,
          quantityPerPortion: 0.125,
          accompanimentPrice: 6.5,
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id: rows[0].id,
        accompanimentTypeId: replacementType.id,
        quantityPerPortion: 0.125,
        salePrice: 6.5,
        isGlobal: true,
        hasOtherPortionLinks: false,
      })
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({
        accompanimentTypeId: replacementType.id,
        quantityPerPortion: 0.125,
      })
      for (const row of rows) {
        await expect(
          fixture.productAccompaniments.findById(
            row.establishmentId,
            row.productId,
            row.id,
          ),
        ).resolves.toMatchObject({
          accompanimentTypeId: replacementType.id,
          quantityPerPortion: 0.125,
          globalAccompanimentId: global.id,
        })
      }
      await expect(
        fixture.products.findById(target.establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 6.5 })
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id].sort(),
      )

      const fromOtherPortion = await request(fixture.app.getHttpServer())
        .get(`/products/${portionB.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
      expect(fromOtherPortion.body.accompaniments[0]).toMatchObject({
        isGlobal: true,
        accompanimentTypeId: replacementType.id,
        quantityPerPortion: 0.125,
        salePrice: 6.5,
      })
    })

    it('rejects ending global status through an edit and keeps every row unchanged', async () => {
      const portionA = await addPortion('Locked A')
      const portionB = await addPortion('Locked B')
      const target = await addTarget('Locked Target')
      const type = await addType('Locked Type')
      const otherType = await addType('Locked Other')
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA, portionB],
      })

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${rows[0].id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentTypeId: otherType.id,
          quantityPerPortion: 9,
          isGlobal: false,
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe(
        'Um acompanhamento global só deixa de ser global pela remoção de todas as porções.',
      )
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ accompanimentTypeId: type.id, quantityPerPortion: 1 })
      await expect(
        fixture.productAccompaniments.findManyByAccompanimentProductId(
          target.establishmentId,
          target.id,
        ),
      ).resolves.toEqual(
        expect.arrayContaining(
          rows.map((row) =>
            expect.objectContaining({
              id: row.id,
              accompanimentTypeId: type.id,
              quantityPerPortion: 1,
            }),
          ),
        ),
      )
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('publishes nothing when a global edit changes nothing', async () => {
      const portionA = await addPortion('No-op A')
      const portionB = await addPortion('No-op B')
      const target = await addTarget('No-op Target')
      const type = await addType('No-op Type')
      const { rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA, portionB],
        quantityPerPortion: 1,
      })

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${rows[0].id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({ accompanimentTypeId: type.id, quantityPerPortion: 1 })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({ isGlobal: true, quantityPerPortion: 1 })
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('converts an individual row into a global keeping row ids and adding the other Portions', async () => {
      const portionA = await addPortion('Convert Edit A')
      const portionB = await addPortion('Convert Edit B')
      const portionC = await addPortion('Convert Edit C')
      const target = await addTarget('Convert Edit Target')
      const typeA = await addType('Convert Edit Type A')
      const typeB = await addType('Convert Edit Type B')
      const editedType = await addType('Convert Edit Final')
      const rowA = await fixture.addProductAccompaniment({
        establishmentId: portionA.establishmentId,
        productId: portionA.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: typeA.id,
        quantityPerPortion: 1,
      })
      const rowB = await fixture.addProductAccompaniment({
        establishmentId: portionB.establishmentId,
        productId: portionB.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: typeB.id,
        quantityPerPortion: 3,
      })

      const before = await request(fixture.app.getHttpServer())
        .get(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${rowA.id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentTypeId: editedType.id,
          quantityPerPortion: 0.5,
          isGlobal: true,
        })

      expect(before.body.accompaniments[0]).toMatchObject({
        isGlobal: false,
        hasOtherPortionLinks: true,
      })
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id: rowA.id,
        isGlobal: true,
        hasOtherPortionLinks: false,
        accompanimentTypeId: editedType.id,
        quantityPerPortion: 0.5,
      })
      const global = await fixture.globalAccompaniments.findByAccompanimentProductId(
        target.establishmentId,
        target.id,
      )
      expect(global).toMatchObject({
        accompanimentTypeId: editedType.id,
        quantityPerPortion: 0.5,
      })
      for (const [portion, existingRow] of [
        [portionA, rowA],
        [portionB, rowB],
        [portionC, undefined],
      ] as const) {
        const rows = await fixture.productAccompaniments.findManyByProductId(
          portion.establishmentId,
          portion.id,
        )
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          accompanimentTypeId: editedType.id,
          quantityPerPortion: 0.5,
          globalAccompanimentId: global?.id,
        })
        if (existingRow) expect(rows[0].id).toBe(existingRow.id)
      }
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, portionC.id].sort(),
      )
    })

    it('rolls back global, rows and events together when a step fails mid-transaction', async () => {
      const portionA = await addPortion('Atomic Edit A')
      const portionB = await addPortion('Atomic Edit B')
      const portionC = await addPortion('Atomic Edit C')
      const target = await addTarget('Atomic Edit Target')
      const type = await addType('Atomic Edit Type')
      const otherType = await addType('Atomic Edit Other')
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA, portionB, portionC],
      })
      const removeFailure = await failSecondSalesConfigurationEvent(fixture)

      let response: request.Response
      try {
        response = await request(fixture.app.getHttpServer())
          .patch(`/products/${portionA.id}/accompaniments/${rows[0].id}`)
          .set('Cookie', managerRequestAuthorization())
          .send({
            accompanimentTypeId: otherType.id,
            quantityPerPortion: 7,
            accompanimentPrice: 9,
          })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ accompanimentTypeId: type.id, quantityPerPortion: 1 })
      for (const row of rows) {
        await expect(
          fixture.productAccompaniments.findById(
            row.establishmentId,
            row.productId,
            row.id,
          ),
        ).resolves.toMatchObject({ accompanimentTypeId: type.id, quantityPerPortion: 1 })
      }
      await expect(
        fixture.products.findById(target.establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 4 })
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('does not let Operators or foreign managers edit a global row', async () => {
      const portion = await addPortion('Guarded Edit Portion')
      const target = await addTarget('Guarded Edit Target')
      const type = await addType('Guarded Edit Type')
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portion],
      })
      const body = { accompanimentTypeId: type.id, quantityPerPortion: 5 }

      const operator = await request(fixture.app.getHttpServer())
        .patch(`/products/${portion.id}/accompaniments/${rows[0].id}`)
        .set('Cookie', operatorRequestAuthorization())
        .send(body)
      const foreign = await request(fixture.app.getHttpServer())
        .patch(`/products/${portion.id}/accompaniments/${rows[0].id}`)
        .set('Cookie', foreignManagerRequestAuthorization())
        .send(body)

      expect(operator.status).toBe(403)
      expect(foreign.status).toBe(404)
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ quantityPerPortion: 1 })
    })
  })
})
