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
  findSalesConfigurationPayloads,
  findSalesConfigurationProductIds,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  latestIso,
  prepareMrpFixture,
  resetMrpFixture,
  setUpdatedAt,
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
        accompanimentPrice: 1.5,
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
      accompanimentPrice: 5.5,
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
      accompanimentPrice: 5.5,
    })
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 1.5 })
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

  it('updates only this link price, preserving zero, the other links and the product default', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Price Edit Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const otherOwner = await fixture.addProduct(
      createProduct({
        name: 'Other Price Edit Portion',
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
      accompanimentPrice: 4,
    })
    const otherLink = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: otherOwner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 4,
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
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({
      accompanimentProductId: target.id,
      quantityPerPortion: 2.5,
      accompanimentPrice: 0,
    })
    await expect(
      fixture.productAccompaniments.findById(
        otherOwner.establishmentId,
        otherOwner.id,
        otherLink.id,
      ),
    ).resolves.toEqual(otherLink)
    const savedTarget = await fixture.products.findById(target.establishmentId, target.id)
    expect(savedTarget).toMatchObject({ accompanimentPrice: 8.25 })
    expect(savedTarget?.updatedAt).toEqual(target.updatedAt)
  })

  it('keeps the link price when the request omits it and rejects an omitted price on an unpriced link', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Omitted Price Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Omitted Price Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 9,
      }),
    )
    const unpricedTarget = await fixture.addProduct(
      createProduct({
        name: 'Unpriced Link Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 9,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Toppings',
    })
    const priced = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 3.25,
    })
    const unpriced = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: unpricedTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const kept = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${priced.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })
    const missing = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${unpriced.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })

    expect(kept.status).toBe(200)
    expect(kept.body).toMatchObject({ quantityPerPortion: 2, salePrice: 3.25 })
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, priced.id),
    ).resolves.toMatchObject({ quantityPerPortion: 2, accompanimentPrice: 3.25 })
    expect(missing.status).toBe(400)
    expect(missing.body.message).toBe('Informe o preço de venda do acompanhamento.')
    await expect(
      fixture.productAccompaniments.findById(
        owner.establishmentId,
        owner.id,
        unpriced.id,
      ),
    ).resolves.toEqual(unpriced)
    await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual([owner.id])
  })

  it('publishes the complete configuration of only the edited Portion with its new link price', async () => {
    const establishmentId = MrpModuleFixture.accounts.establishmentId
    const portionA = await fixture.addProduct(
      createProduct({ name: 'Price Portion A', categories: [ProductCategory.Portion] }),
    )
    const portionB = await fixture.addProduct(
      createProduct({ name: 'Price Portion B', categories: [ProductCategory.Portion] }),
    )
    const sizeA = await fixture.addProductSize({
      establishmentId,
      productId: portionA.id,
      name: 'Médio',
      quantity: 1,
      price: 12,
      isActive: true,
    })
    await fixture.addProductSize({
      establishmentId,
      productId: portionB.id,
      name: 'Único',
      quantity: 1,
      price: 9,
      isActive: false,
    })
    const target = await fixture.addProduct(
      createProduct({
        name: 'Shared Price Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 4,
      }),
    )
    const typeA = await fixture.addAccompanimentType({ establishmentId, name: 'Calda' })
    const typeB = await fixture.addAccompanimentType({ establishmentId, name: 'Fruta' })
    const replacementType = await fixture.addAccompanimentType({
      establishmentId,
      name: 'Cobertura',
    })
    const linkA = await fixture.addProductAccompaniment({
      establishmentId,
      productId: portionA.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: typeA.id,
      quantityPerPortion: 1,
      accompanimentPrice: 4,
    })
    const linkB = await fixture.addProductAccompaniment({
      establishmentId,
      productId: portionB.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: typeB.id,
      quantityPerPortion: 2,
      accompanimentPrice: 4,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${portionA.id}/accompaniments/${linkA.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentTypeId: replacementType.id,
        quantityPerPortion: 1.5,
        accompanimentPrice: 5.5,
      })

    expect(response.status).toBe(200)
    const savedTarget = await fixture.products.findById(establishmentId, target.id)
    const savedLinkA = await fixture.productAccompaniments.findById(
      establishmentId,
      portionA.id,
      linkA.id,
    )
    if (!savedTarget || !savedLinkA) throw new Error('The saved facts were not found.')
    const expectedPayload = (
      portion: typeof portionA,
      size: typeof sizeA,
      link: typeof linkA,
      type: typeof typeA,
      updatedAt: string,
      basePrice: number,
    ) => ({
      establishmentId,
      productId: portion.id,
      state: 'available',
      configuration: {
        establishmentId,
        productId: portion.id,
        name: portion.name,
        categories: [ProductCategory.Portion],
        status: 'active',
        stockControl: 'single',
        sizes: [
          {
            sizeId: size.id,
            name: size.name,
            price: size.price,
            isActive: size.isActive,
            accompaniments: [
              {
                accompanimentId: link.id,
                productId: target.id,
                name: 'Shared Price Target',
                type: type.name,
                basePrice,
                isActive: true,
              },
            ],
          },
        ],
        resaleConfigurations: [],
        updatedAt,
      },
    })
    await expect(findSalesConfigurationPayloads(fixture)).resolves.toEqual([
      expectedPayload(
        portionA,
        sizeA,
        linkA,
        replacementType,
        latestIso(
          portionA.updatedAt,
          sizeA.updatedAt,
          savedLinkA.updatedAt,
          savedTarget.updatedAt,
          replacementType.updatedAt,
        ),
        5.5,
      ),
    ])
    // Portion B is not republished and keeps its own link price; the product default is untouched.
    await expect(
      fixture.productAccompaniments.findById(establishmentId, portionB.id, linkB.id),
    ).resolves.toEqual(linkB)
    expect(savedLinkA.accompanimentPrice).toBe(5.5)
    expect(savedTarget.accompanimentPrice).toBe(4)
    expect(savedTarget.updatedAt).toEqual(target.updatedAt)
  })

  it('counts the accompaniment product update in the published configuration time', async () => {
    const establishmentId = MrpModuleFixture.accounts.establishmentId
    const portion = await fixture.addProduct(
      createProduct({ name: 'Time Portion', categories: [ProductCategory.Portion] }),
    )
    await fixture.addProductSize({
      establishmentId,
      productId: portion.id,
      name: 'Único',
      quantity: 1,
      price: 9,
      isActive: true,
    })
    const target = await fixture.addProduct(
      createProduct({
        name: 'Time Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 4,
      }),
    )
    const type = await fixture.addAccompanimentType({ establishmentId, name: 'Calda' })
    const link = await fixture.addProductAccompaniment({
      establishmentId,
      productId: portion.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 4,
    })
    const latestFact = new Date('2099-06-01T00:00:00.000Z')
    await setUpdatedAt(fixture, 'products', target.id, latestFact)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${portion.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })

    expect(response.status).toBe(200)
    const [payload] = await findSalesConfigurationPayloads(fixture)
    expect(payload?.configuration?.updatedAt).toBe(latestFact.toISOString())
    expect(payload?.configuration?.sizes[0]?.accompaniments).toEqual([
      {
        accompanimentId: link.id,
        productId: target.id,
        name: 'Time Target',
        type: 'Calda',
        basePrice: 4,
        isActive: true,
      },
    ])
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
        accompanimentPrice: 6.5,
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
        const savedRow = await fixture.productAccompaniments.findById(
          row.establishmentId,
          row.productId,
          row.id,
        )
        expect(savedRow?.accompanimentPrice).toBeUndefined()
      }
      await expect(
        fixture.products.findById(target.establishmentId, target.id),
      ).resolves.toMatchObject({ accompanimentPrice: 4 })
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

    it('keeps the global price when a global row edit omits it and rejects an omitted price on an unpriced global', async () => {
      const portionA = await addPortion('Omitted Global A')
      const portionB = await addPortion('Omitted Global B')
      const priced = await addTarget('Omitted Priced Target')
      const unpriced = await addTarget('Omitted Unpriced Target')
      const type = await addType('Omitted Global Type')
      const { global: pricedGlobal, rows: pricedRows } =
        await addGlobalAccompanimentWithRows(fixture, {
          target: priced,
          type,
          portions: [portionA, portionB],
          accompanimentPrice: 7.5,
        })
      const { global: unpricedGlobal, rows: unpricedRows } =
        await addGlobalAccompanimentWithRows(fixture, {
          target: unpriced,
          type,
          portions: [portionA, portionB],
          accompanimentPrice: undefined,
        })

      const kept = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${pricedRows[0].id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })
      const missing = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${unpricedRows[0].id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })

      expect(kept.status).toBe(200)
      expect(kept.body).toMatchObject({ quantityPerPortion: 2, salePrice: 7.5 })
      await expect(
        fixture.globalAccompaniments.findById(
          pricedGlobal.establishmentId,
          pricedGlobal.id,
        ),
      ).resolves.toMatchObject({ quantityPerPortion: 2, accompanimentPrice: 7.5 })
      expect(missing.status).toBe(400)
      expect(missing.body.message).toBe('Informe o preço de venda do acompanhamento.')
      await expect(
        fixture.globalAccompaniments.findById(
          unpricedGlobal.establishmentId,
          unpricedGlobal.id,
        ),
      ).resolves.toEqual(unpricedGlobal)
      for (const row of unpricedRows) {
        await expect(
          fixture.productAccompaniments.findById(
            row.establishmentId,
            row.productId,
            row.id,
          ),
        ).resolves.toEqual(row)
      }
    })

    it('republishes every Portion with the new shared price when only the global price changes', async () => {
      const portionA = await addPortion('Price Only A')
      const portionB = await addPortion('Price Only B')
      const target = await addTarget('Price Only Target')
      const type = await addType('Price Only Type')
      for (const portion of [portionA, portionB]) {
        await fixture.addProductSize({
          establishmentId: portion.establishmentId,
          productId: portion.id,
          name: 'Único',
          quantity: 1,
          price: 10,
          isActive: true,
        })
      }
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions: [portionA, portionB],
        accompanimentPrice: 3,
      })

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionB.id}/accompaniments/${rows[1].id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
          accompanimentPrice: 8,
        })

      expect(response.status).toBe(200)
      expect(response.body.salePrice).toBe(8)
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ accompanimentPrice: 8 })
      for (const row of rows) {
        await expect(
          fixture.productAccompaniments.findById(
            row.establishmentId,
            row.productId,
            row.id,
          ),
        ).resolves.toEqual(row)
      }
      const payloads = await findSalesConfigurationPayloads(fixture)
      expect(payloads.map((payload) => payload.productId)).toEqual(
        [portionA.id, portionB.id].sort(),
      )
      for (const payload of payloads) {
        expect(payload.configuration?.sizes[0].accompaniments).toEqual([
          expect.objectContaining({ productId: target.id, basePrice: 8 }),
        ])
      }
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
        accompanimentPrice: 5,
      })
      const rowB = await fixture.addProductAccompaniment({
        establishmentId: portionB.establishmentId,
        productId: portionB.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: typeB.id,
        quantityPerPortion: 3,
        accompanimentPrice: 6,
      })
      await fixture.addProductSize({
        establishmentId: portionC.establishmentId,
        productId: portionC.id,
        name: 'Único',
        quantity: 1,
        price: 10,
        isActive: true,
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
      // The omitted price becomes the edited link's own price on the new global.
      expect(global).toMatchObject({
        accompanimentTypeId: editedType.id,
        quantityPerPortion: 0.5,
        accompanimentPrice: 5,
      })
      expect(response.body.salePrice).toBe(5)
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
        // Rows that reference the global never keep a price of their own.
        expect(rows[0].accompanimentPrice).toBeUndefined()
      }
      await expect(findSalesConfigurationProductIds(fixture)).resolves.toEqual(
        [portionA.id, portionB.id, portionC.id].sort(),
      )
      const portionCPayload = (await findSalesConfigurationPayloads(fixture)).find(
        (payload) => payload.productId === portionC.id,
      )
      expect(portionCPayload?.configuration?.sizes[0].accompaniments).toEqual([
        expect.objectContaining({ productId: target.id, basePrice: 5, isActive: true }),
      ])
    })

    it('stores the entered price on the new global, else the default when the edited link has none', async () => {
      const portionA = await addPortion('Convert Price A')
      const portionB = await addPortion('Convert Price B')
      const portionC = await addPortion('Convert Price C')
      const entered = await addTarget('Convert Entered Target')
      const defaulted = await addTarget('Convert Default Target')
      const type = await addType('Convert Price Type')
      const enteredRow = await fixture.addProductAccompaniment({
        establishmentId: portionA.establishmentId,
        productId: portionA.id,
        accompanimentProductId: entered.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 5,
      })
      const otherEnteredRow = await fixture.addProductAccompaniment({
        establishmentId: portionB.establishmentId,
        productId: portionB.id,
        accompanimentProductId: entered.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 6,
      })
      const defaultedRow = await fixture.addProductAccompaniment({
        establishmentId: portionC.establishmentId,
        productId: portionC.id,
        accompanimentProductId: defaulted.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

      const withEnteredPrice = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionA.id}/accompaniments/${enteredRow.id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
          isGlobal: true,
          accompanimentPrice: 9.5,
        })
      const withDefault = await request(fixture.app.getHttpServer())
        .patch(`/products/${portionC.id}/accompaniments/${defaultedRow.id}`)
        .set('Cookie', managerRequestAuthorization())
        .send({ accompanimentTypeId: type.id, quantityPerPortion: 1, isGlobal: true })

      expect(withEnteredPrice.status).toBe(200)
      expect(withEnteredPrice.body.salePrice).toBe(9.5)
      expect(withDefault.status).toBe(200)
      expect(withDefault.body.salePrice).toBe(4)
      await expect(
        fixture.globalAccompaniments.findByAccompanimentProductId(
          entered.establishmentId,
          entered.id,
        ),
      ).resolves.toMatchObject({ accompanimentPrice: 9.5 })
      await expect(
        fixture.globalAccompaniments.findByAccompanimentProductId(
          defaulted.establishmentId,
          defaulted.id,
        ),
      ).resolves.toMatchObject({ accompanimentPrice: 4 })
      for (const target of [entered, defaulted]) {
        const rows = await fixture.productAccompaniments.findManyByAccompanimentProductId(
          target.establishmentId,
          target.id,
        )
        expect(rows).toHaveLength(3)
        for (const row of rows) expect(row.accompanimentPrice).toBeUndefined()
      }
      await expect(
        fixture.productAccompaniments.findById(
          portionB.establishmentId,
          portionB.id,
          otherEnteredRow.id,
        ),
      ).resolves.toMatchObject({
        id: otherEnteredRow.id,
        globalAccompanimentId: expect.any(String),
      })
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
      ).resolves.toMatchObject({
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 4,
      })
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
