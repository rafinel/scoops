import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
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
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Link Product Accompaniment Controller [POST /products/:productId/accompaniments]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('persists one tenant-qualified link without changing stock', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Link Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Link Target',
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 4,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Syrup',
    })
    await fixture.balances.initialize(target.id)
    await fixture.balances.add({ productId: target.id }, 7)
    const beforeBalance = await fixture.balances.findByProductId(target.id)
    const beforeTransactions = await fixture.transactions.findPage(
      target.establishmentId,
      target.id,
      { page: 1, limit: 20 },
    )

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.25,
        accompanimentPrice: 7.5,
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'Syrup',
      quantityPerPortion: 1.25,
      unitCost: 4,
      estimatedCost: 5,
      salePrice: 7.5,
    })
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 7.5, currentUnitCost: 4 })
    await expect(
      fixture.productAccompaniments.findByProductAndAccompaniment(
        owner.establishmentId,
        owner.id,
        target.id,
      ),
    ).resolves.toMatchObject({ quantityPerPortion: 1.25 })
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

  it('returns safe validation, eligibility, duplicate, and tenant conflicts', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Conflict Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Conflict Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const inactiveTarget = await fixture.addProduct(
      createProduct({
        name: 'Inactive Target',
        categories: [ProductCategory.Accompaniment],
        status: 'inactive',
      }),
    )
    const foreignTarget = await fixture.addProduct(
      createProduct({
        name: 'Foreign Target',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Sauce',
    })
    const body = {
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 4.25,
    }
    await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)

    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    const malformed = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, quantityPerPortion: 0 })
    const inactive = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })
    const foreignTargetResponse = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: foreignTarget.id })
    const operator = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })
    const foreignOwner = await fixture.addProduct(
      createProduct({
        name: 'Foreign Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )
    const foreign = await request(fixture.app.getHttpServer())
      .post(`/products/${foreignOwner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })

    expect(duplicate.status).toBe(409)
    expect(malformed.status).toBe(422)
    expect(inactive.status).toBe(400)
    expect(foreignTargetResponse.status).toBe(404)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toHaveLength(1)
  })

  it('rejects a foreign type and malformed path without partial writes', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Foreign Type Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Foreign Type Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      name: 'Foreign Type',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
        accompanimentPrice: 3,
      })
    const malformedPath = await request(fixture.app.getHttpServer())
      .post('/products/not-a-uuid/accompaniments')
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
        accompanimentPrice: 3,
      })

    expect(response.status).toBe(404)
    expect(malformedPath.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])
  })

  it('requires a primary brand for a By-brand accompaniment', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Brand Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Brand Target',
        categories: [ProductCategory.Accompaniment],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Crunch',
    })
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 5,
      })

    expect(response.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])
  })

  it('requires a valid price for the first link and accepts zero as a saved price', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Price Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Free Topping',
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 1.25,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Free Toppings',
    })
    const body = {
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 2,
    }

    const missingPrice = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    expect(missingPrice.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])

    const excessivePrecision = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: 1.001 })
    const exceedsNumericPrecision = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: 10_000_000_000_000_000 })
    const nullPrice = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: null })
    const negative = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: -1 })
    const free = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: 0 })

    expect(excessivePrecision.status).toBe(422)
    expect(exceedsNumericPrecision.status).toBe(422)
    expect(nullPrice.status).toBe(422)
    expect(negative.status).toBe(422)
    expect(free.status).toBe(201)
    expect(free.body.salePrice).toBe(0)
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 0 })
  })

  it('allows an older client to omit price when the target already has one', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Existing Price Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Previously Configured Topping',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 9.25,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Toppings',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

    expect(response.status).toBe(201)
    expect(response.body.salePrice).toBe(9.25)
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 9.25 })
  })

  describe('global accompaniments', () => {
    async function addPortion(name: string, overrides = {}) {
      return fixture.addProduct(
        createProduct({ name, categories: [ProductCategory.Portion], ...overrides }),
      )
    }

    async function addTarget(name: string, overrides = {}) {
      return fixture.addProduct(
        createProduct({
          name,
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 4,
          ...overrides,
        }),
      )
    }

    async function addType(name: string) {
      return fixture.addAccompanimentType({
        establishmentId: MrpModuleFixture.accounts.establishmentId,
        name,
      })
    }

    it('creates one global and a row on every Portion regardless of status', async () => {
      const portionA = await addPortion('Global A')
      const portionB = await addPortion('Global B')
      const inactivePortion = await addPortion('Global C', { status: 'inactive' })
      const ingredient = await fixture.addProduct(createProduct({ name: 'Ingredient' }))
      const foreignPortion = await addPortion('Foreign Global Portion', {
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      })
      const target = await addTarget('Global Granola')
      const type = await addType('Granolas')

      const response = await request(fixture.app.getHttpServer())
        .post(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.05,
          isGlobal: true,
        })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.05,
        salePrice: 4,
        isGlobal: true,
        hasOtherPortionLinks: false,
      })
      const global = await fixture.globalAccompaniments.findByAccompanimentProductId(
        portionA.establishmentId,
        target.id,
      )
      expect(global).toMatchObject({
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.05,
      })
      for (const portion of [portionA, portionB, inactivePortion]) {
        const rows = await fixture.productAccompaniments.findManyByProductId(
          portion.establishmentId,
          portion.id,
        )
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.05,
          globalAccompanimentId: global?.id,
        })
      }
      expect(response.body.id).toBe(
        (
          await fixture.productAccompaniments.findByProductAndAccompaniment(
            portionA.establishmentId,
            portionA.id,
            target.id,
          )
        )?.id,
      )
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          ingredient.establishmentId,
          ingredient.id,
        ),
      ).resolves.toEqual([])
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          foreignPortion.establishmentId,
          foreignPortion.id,
        ),
      ).resolves.toEqual([])
      await expect(
        fixture.globalAccompaniments.findManyByEstablishmentId(
          foreignPortion.establishmentId,
        ),
      ).resolves.toEqual([])
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, inactivePortion.id].sort(),
      )
      const table = await request(fixture.app.getHttpServer())
        .get(`/products/${portionB.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
      expect(table.body.accompaniments[0]).toMatchObject({
        accompanimentProductId: target.id,
        isGlobal: true,
      })
    })

    it('converts individual links in place keeping row ids and adds the missing Portions', async () => {
      const portionA = await addPortion('Convert A')
      const portionB = await addPortion('Convert B')
      const portionC = await addPortion('Convert C')
      const portionD = await addPortion('Convert D')
      const target = await addTarget('Convert Target')
      const oldTypeB = await addType('Old B')
      const oldTypeC = await addType('Old C')
      const sharedType = await addType('Shared')
      const rowB = await fixture.addProductAccompaniment({
        establishmentId: portionB.establishmentId,
        productId: portionB.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: oldTypeB.id,
        quantityPerPortion: 1,
      })
      const rowC = await fixture.addProductAccompaniment({
        establishmentId: portionC.establishmentId,
        productId: portionC.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: oldTypeC.id,
        quantityPerPortion: 2,
      })

      const response = await request(fixture.app.getHttpServer())
        .post(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentProductId: target.id,
          accompanimentTypeId: sharedType.id,
          quantityPerPortion: 0.75,
          isGlobal: true,
        })

      expect(response.status).toBe(201)
      const global = await fixture.globalAccompaniments.findByAccompanimentProductId(
        portionA.establishmentId,
        target.id,
      )
      for (const [portion, existingRow] of [
        [portionA, undefined],
        [portionB, rowB],
        [portionC, rowC],
        [portionD, undefined],
      ] as const) {
        const rows = await fixture.productAccompaniments.findManyByProductId(
          portion.establishmentId,
          portion.id,
        )
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          accompanimentTypeId: sharedType.id,
          quantityPerPortion: 0.75,
          globalAccompanimentId: global?.id,
        })
        if (existingRow) expect(rows[0].id).toBe(existingRow.id)
      }
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, portionC.id, portionD.id].sort(),
      )
    })

    it('restores exactly one row when linking a removed global again and applies shared edits everywhere', async () => {
      const portionA = await addPortion('Again A')
      const portionB = await addPortion('Again B')
      const target = await addTarget('Again Target')
      const type = await addType('Again Type')
      const replacementType = await addType('Again Replacement')
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA, portionB],
        quantityPerPortion: 1,
      })
      await fixture.productAccompaniments.remove(
        portionA.establishmentId,
        portionA.id,
        rows[0].id,
      )

      const withoutGlobalFlag = await request(fixture.app.getHttpServer())
        .post(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
        })
      const explicitlyIndividual = await request(fixture.app.getHttpServer())
        .post(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
          isGlobal: false,
        })

      expect(withoutGlobalFlag.status).toBe(409)
      expect(withoutGlobalFlag.body.message).toBe(
        'Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo a esta porção.',
      )
      expect(explicitlyIndividual.status).toBe(409)
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          portionA.establishmentId,
          portionA.id,
        ),
      ).resolves.toEqual([])

      const restored = await request(fixture.app.getHttpServer())
        .post(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentProductId: target.id,
          accompanimentTypeId: replacementType.id,
          quantityPerPortion: 2.5,
          isGlobal: true,
        })

      expect(restored.status).toBe(201)
      expect(restored.body).toMatchObject({ isGlobal: true, quantityPerPortion: 2.5 })
      for (const portion of [portionA, portionB]) {
        const portionRows = await fixture.productAccompaniments.findManyByProductId(
          portion.establishmentId,
          portion.id,
        )
        expect(portionRows).toHaveLength(1)
        expect(portionRows[0]).toMatchObject({
          accompanimentTypeId: replacementType.id,
          quantityPerPortion: 2.5,
          globalAccompanimentId: global.id,
        })
      }
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({
        accompanimentTypeId: replacementType.id,
        quantityPerPortion: 2.5,
      })
      const duplicate = await request(fixture.app.getHttpServer())
        .post(`/products/${portionA.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentProductId: target.id,
          accompanimentTypeId: replacementType.id,
          quantityPerPortion: 2.5,
          isGlobal: true,
        })
      expect(duplicate.status).toBe(409)
      expect(duplicate.body.message).toBe(
        'O acompanhamento já está vinculado a esta porção.',
      )
    })

    it('rejects global linking for Operators, foreign targets and malformed flags without changes', async () => {
      const portion = await addPortion('Rejected Global Portion')
      const target = await addTarget('Rejected Global Target')
      const foreignTarget = await addTarget('Foreign Global Target', {
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      })
      const type = await addType('Rejected Type')
      const body = {
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        isGlobal: true,
      }

      const operator = await request(fixture.app.getHttpServer())
        .post(`/products/${portion.id}/accompaniments`)
        .set('Cookie', operatorRequestAuthorization())
        .send(body)
      const foreignTargetResponse = await request(fixture.app.getHttpServer())
        .post(`/products/${portion.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({ ...body, accompanimentProductId: foreignTarget.id })
      const malformed = await request(fixture.app.getHttpServer())
        .post(`/products/${portion.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
        .send({ ...body, isGlobal: 'yes' })

      expect(operator.status).toBe(403)
      expect(foreignTargetResponse.status).toBe(404)
      expect(malformed.status).toBe(422)
      await expect(
        fixture.globalAccompaniments.findManyByEstablishmentId(portion.establishmentId),
      ).resolves.toEqual([])
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          portion.establishmentId,
          portion.id,
        ),
      ).resolves.toEqual([])
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })

    it('rolls back the global, rows and events together when a step fails mid-transaction', async () => {
      const portions = [
        await addPortion('Atomic A'),
        await addPortion('Atomic B'),
        await addPortion('Atomic C'),
      ]
      const target = await addTarget('Atomic Target')
      const type = await addType('Atomic Type')
      const removeFailure = await failSecondSalesConfigurationEvent(fixture)

      let response: request.Response
      try {
        response = await request(fixture.app.getHttpServer())
          .post(`/products/${portions[0].id}/accompaniments`)
          .set('Cookie', managerRequestAuthorization())
          .send({
            accompanimentProductId: target.id,
            accompanimentTypeId: type.id,
            quantityPerPortion: 1,
            isGlobal: true,
          })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expect(
        fixture.globalAccompaniments.findManyByEstablishmentId(target.establishmentId),
      ).resolves.toEqual([])
      for (const portion of portions) {
        await expect(
          fixture.productAccompaniments.findManyByProductId(
            portion.establishmentId,
            portion.id,
          ),
        ).resolves.toEqual([])
      }
      await expect(
        findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME),
      ).resolves.toEqual([])
    })
  })
})
